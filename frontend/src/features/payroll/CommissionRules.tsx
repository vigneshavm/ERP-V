import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { Percent, Plus, Trash2, Search, X } from 'lucide-react';
import Layout from "../../components/shared/Layout/Layout";
import PageHeader from "../../components/shared/Layout/PageHeader";
import api from "../../services/api";
import { RootState } from "../../redux/store";

// Textilesoft's commission subsystem (salesman commission, product/PCS/range-wise commission,
// floor/section commission reporting) had no counterpart anywhere in this codebase before this
// build -- only a flat commissionPercent on the Agent (supplier-side) master existed. This page
// manages the new CommissionRule table and shows the commission report computed from it (see
// backend's CommissionController.ts). Rule management is restricted to owner/co-owner/manager;
// the computed report is viewable by anyone who can reach this page.
const COMMISSION_ADMIN_ROLES = ['owner', 'co-owner', 'manager'];

interface TenantUser {
    _id: string;
    name: string;
    email: string;
    role: string;
}

interface ItemOption {
    _id: string;
    name: string;
    sku?: string;
}

type Scope = 'ITEM' | 'CATEGORY' | 'ALL';
type RateType = 'PERCENT' | 'FLAT';

interface CommissionRule {
    _id: string;
    name: string;
    employeeId?: { _id: string; name: string; role?: string } | string | null;
    scope: Scope;
    itemId?: { _id: string; name: string; sku?: string } | string | null;
    category?: string;
    rateType: RateType;
    rateValue: number;
    status: 'active' | 'inactive';
}

interface ReportRow {
    employeeId: string;
    employeeName: string;
    invoiceCount: number;
    totalSalesAttributed: number;
    totalCommission: number;
}

const emptyRuleForm = {
    name: '',
    employeeId: '',
    scope: 'ALL' as Scope,
    itemId: '',
    category: '',
    rateType: 'PERCENT' as RateType,
    rateValue: '',
};

const CommissionRules: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const canManage = !!(user?.role && COMMISSION_ADMIN_ROLES.includes(user.role));

    const [rules, setRules] = useState<CommissionRule[]>([]);
    const [users, setUsers] = useState<TenantUser[]>([]);
    const [items, setItems] = useState<ItemOption[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(emptyRuleForm);
    const [submitting, setSubmitting] = useState(false);

    // Commission report state
    const today = new Date().toISOString().slice(0, 10);
    const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
    const [reportFrom, setReportFrom] = useState(firstOfMonth);
    const [reportTo, setReportTo] = useState(today);
    const [reportEmployeeId, setReportEmployeeId] = useState('');
    const [reportRows, setReportRows] = useState<ReportRow[]>([]);
    const [reportNote, setReportNote] = useState('');
    const [reportLoading, setReportLoading] = useState(false);

    const fetchRules = async () => {
        setIsLoading(true);
        try {
            const { data } = await api.get('/api/commission-rules');
            setRules(Array.isArray(data) ? data : []);
        } catch {
            toast.error('Failed to load commission rules');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchLookups = async () => {
        try {
            const [usersRes, itemsRes, categoriesRes] = await Promise.all([
                api.get('/api/users'),
                api.get('/api/inventory?limit=1000'),
                api.get('/api/inventory/distinct-categories'),
            ]);
            const userList = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data?.data || []);
            setUsers(userList);
            const itemPayload = itemsRes.data;
            const itemList: ItemOption[] = Array.isArray(itemPayload) ? itemPayload : (itemPayload?.items || []);
            setItems(itemList);
            setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : (categoriesRes.data?.data || []));
        } catch {
            toast.error('Failed to load employees/items for rule builder');
        }
    };

    const fetchReport = async () => {
        setReportLoading(true);
        try {
            const params = new URLSearchParams();
            if (reportFrom) params.set('from', reportFrom);
            if (reportTo) params.set('to', reportTo);
            if (reportEmployeeId) params.set('employeeId', reportEmployeeId);
            const { data } = await api.get(`/api/commission-rules/report?${params.toString()}`);
            setReportRows(data?.employees || []);
            setReportNote(data?.note || '');
        } catch {
            toast.error('Failed to load commission report');
        } finally {
            setReportLoading(false);
        }
    };

    useEffect(() => {
        fetchRules();
        fetchLookups();
    }, []);

    // Deliberately mount-only: fetchReport reads the report-filter state via closure and is
    // re-triggered by the "Run Report" button, not by every filter keystroke.
    useEffect(() => {
        fetchReport();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const openCreateModal = () => {
        setForm(emptyRuleForm);
        setShowModal(true);
    };

    const displayName = (ref: CommissionRule['employeeId'] | CommissionRule['itemId'], field: 'name') => {
        if (!ref) return null;
        if (typeof ref === 'string') return null;
        return (ref as any)[field];
    };

    const handleSubmit = async () => {
        if (!form.name.trim()) {
            toast.warning('Rule name is required');
            return;
        }
        if (form.scope === 'ITEM' && !form.itemId) {
            toast.warning('Select an item for an item-scoped rule');
            return;
        }
        if (form.scope === 'CATEGORY' && !form.category) {
            toast.warning('Select a category for a category-scoped rule');
            return;
        }
        const rateValue = parseFloat(form.rateValue);
        if (Number.isNaN(rateValue) || rateValue < 0 || (form.rateType === 'PERCENT' && rateValue > 100)) {
            toast.warning(form.rateType === 'PERCENT' ? 'Enter a percent between 0 and 100' : 'Enter a valid flat amount');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/api/commission-rules', {
                name: form.name.trim(),
                employeeId: form.employeeId || undefined,
                scope: form.scope,
                itemId: form.scope === 'ITEM' ? form.itemId : undefined,
                category: form.scope === 'CATEGORY' ? form.category : undefined,
                rateType: form.rateType,
                rateValue,
            });
            toast.success('Commission rule created');
            setShowModal(false);
            fetchRules();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to create commission rule');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleStatus = async (rule: CommissionRule) => {
        try {
            await api.patch(`/api/commission-rules/${rule._id}`, {
                status: rule.status === 'active' ? 'inactive' : 'active',
            });
            setRules(prev => prev.map(r => r._id === rule._id ? { ...r, status: rule.status === 'active' ? 'inactive' : 'active' } : r));
        } catch {
            toast.error('Failed to update rule status');
        }
    };

    const handleDelete = async (rule: CommissionRule) => {
        if (!window.confirm(`Delete commission rule "${rule.name}"?`)) return;
        try {
            await api.delete(`/api/commission-rules/${rule._id}`);
            toast.success('Commission rule deleted');
            setRules(prev => prev.filter(r => r._id !== rule._id));
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to delete commission rule');
        }
    };

    const filteredRules = useMemo(() => rules.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase())
    ), [rules, search]);

    const scopeLabel = (rule: CommissionRule) => {
        if (rule.scope === 'ITEM') return `Item: ${displayName(rule.itemId, 'name') || 'Unknown item'}`;
        if (rule.scope === 'CATEGORY') return `Category: ${rule.category}`;
        return 'All items';
    };

    return (
        <Layout>
            <PageHeader
                title="Commission Management"
                description="Define salesman/product commission rules and review commission earned per employee."
            />

            {canManage && (
                <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden mb-6">
                    <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 flex flex-wrap justify-between items-center gap-3">
                        <h2 className="text-sm font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">Commission Rules</h2>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search rules..."
                                    className="pl-9 pr-4 py-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm outline-none"
                                />
                            </div>
                            <button
                                onClick={openCreateModal}
                                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:opacity-90"
                            >
                                <Plus className="w-4 h-4" /> New Rule
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-neutral-50 dark:bg-neutral-900 text-xs font-bold text-neutral-500 uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-700">
                                <tr>
                                    <th className="px-6 py-3">Name</th>
                                    <th className="px-6 py-3">Employee</th>
                                    <th className="px-6 py-3">Applies To</th>
                                    <th className="px-6 py-3">Rate</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {filteredRules.map((rule) => (
                                    <tr key={rule._id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/40">
                                        <td className="px-6 py-4 font-medium">{rule.name}</td>
                                        <td className="px-6 py-4 text-neutral-500">{displayName(rule.employeeId, 'name') || 'All employees'}</td>
                                        <td className="px-6 py-4 text-neutral-500">{scopeLabel(rule)}</td>
                                        <td className="px-6 py-4 font-bold">
                                            {rule.rateType === 'PERCENT' ? `${rule.rateValue}%` : `₹${rule.rateValue}`}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => toggleStatus(rule)}
                                                className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase ${rule.status === 'active' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-neutral-100 border-neutral-200 text-neutral-500'}`}
                                            >
                                                {rule.status}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDelete(rule)}
                                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {!isLoading && filteredRules.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center text-neutral-400">
                                            <Percent className="w-10 h-10 mx-auto mb-3 opacity-40" />
                                            No commission rules yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Commission Report */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
                    <h2 className="text-sm font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">Commission Report</h2>
                </div>
                <div className="p-6 flex flex-wrap items-end gap-4">
                    <div>
                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 block">From</label>
                        <input type="date" value={reportFrom} onChange={(e) => setReportFrom(e.target.value)} className="border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm bg-transparent" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 block">To</label>
                        <input type="date" value={reportTo} onChange={(e) => setReportTo(e.target.value)} className="border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm bg-transparent" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 block">Employee</label>
                        <select value={reportEmployeeId} onChange={(e) => setReportEmployeeId(e.target.value)} className="border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm bg-transparent min-w-[180px]">
                            <option value="">All employees</option>
                            {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                        </select>
                    </div>
                    <button
                        onClick={fetchReport}
                        disabled={reportLoading}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:opacity-90 disabled:opacity-60"
                    >
                        {reportLoading ? 'Loading...' : 'Run Report'}
                    </button>
                </div>
                {reportNote && (
                    <div className="mx-6 mb-4 px-4 py-2 bg-amber-50 border border-amber-100 text-amber-800 text-xs rounded-lg">{reportNote}</div>
                )}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-neutral-50 dark:bg-neutral-900 text-xs font-bold text-neutral-500 uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-700">
                            <tr>
                                <th className="px-6 py-3">Employee</th>
                                <th className="px-6 py-3 text-right">Invoices</th>
                                <th className="px-6 py-3 text-right">Sales Attributed</th>
                                <th className="px-6 py-3 text-right">Commission Earned</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {reportRows.map((row) => (
                                <tr key={row.employeeId} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/40">
                                    <td className="px-6 py-4 font-medium">{row.employeeName}</td>
                                    <td className="px-6 py-4 text-right">{row.invoiceCount}</td>
                                    <td className="px-6 py-4 text-right">₹{row.totalSalesAttributed.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right font-bold text-emerald-600">₹{row.totalCommission.toFixed(2)}</td>
                                </tr>
                            ))}
                            {!reportLoading && reportRows.length === 0 && !reportNote && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-16 text-center text-neutral-400">
                                        No commission earned in this date range.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* New Rule Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center sticky top-0 bg-white dark:bg-neutral-800">
                            <h2 className="text-lg font-bold">New Commission Rule</h2>
                            <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-neutral-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 block">Rule Name</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="e.g. Silk sarees - floor staff"
                                    className="w-full border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm bg-transparent"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 block">Employee (optional)</label>
                                <select
                                    value={form.employeeId}
                                    onChange={(e) => setForm(f => ({ ...f, employeeId: e.target.value }))}
                                    className="w-full border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm bg-transparent"
                                >
                                    <option value="">All employees (tenant-wide default)</option>
                                    {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 block">Applies To</label>
                                <select
                                    value={form.scope}
                                    onChange={(e) => setForm(f => ({ ...f, scope: e.target.value as Scope }))}
                                    className="w-full border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm bg-transparent"
                                >
                                    <option value="ALL">All items</option>
                                    <option value="CATEGORY">A specific category</option>
                                    <option value="ITEM">A specific item</option>
                                </select>
                            </div>
                            {form.scope === 'CATEGORY' && (
                                <div>
                                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 block">Category</label>
                                    <select
                                        value={form.category}
                                        onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                                        className="w-full border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm bg-transparent"
                                    >
                                        <option value="">Select category...</option>
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            )}
                            {form.scope === 'ITEM' && (
                                <div>
                                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 block">Item</label>
                                    <select
                                        value={form.itemId}
                                        onChange={(e) => setForm(f => ({ ...f, itemId: e.target.value }))}
                                        className="w-full border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm bg-transparent"
                                    >
                                        <option value="">Select item...</option>
                                        {items.map(it => <option key={it._id} value={it._id}>{it.name}{it.sku ? ` (${it.sku})` : ''}</option>)}
                                    </select>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 block">Rate Type</label>
                                    <select
                                        value={form.rateType}
                                        onChange={(e) => setForm(f => ({ ...f, rateType: e.target.value as RateType }))}
                                        className="w-full border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm bg-transparent"
                                    >
                                        <option value="PERCENT">Percent of sale</option>
                                        <option value="FLAT">Flat amount per line</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 block">
                                        {form.rateType === 'PERCENT' ? 'Percent (%)' : 'Amount (₹)'}
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={form.rateType === 'PERCENT' ? 100 : undefined}
                                        step="0.01"
                                        value={form.rateValue}
                                        onChange={(e) => setForm(f => ({ ...f, rateValue: e.target.value }))}
                                        className="w-full border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm bg-transparent"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-700 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-neutral-800">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg font-medium">
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="px-4 py-2 bg-primary text-white rounded-lg font-bold hover:opacity-90 disabled:opacity-60"
                            >
                                {submitting ? 'Saving...' : 'Create Rule'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default CommissionRules;
