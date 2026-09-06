import React, { useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/redux/store';
import {
    fetchMasterEntries,
    createMasterEntry,
    updateMasterEntry,
    deleteMasterEntry,
    MasterEntry,
    MasterType,
} from '@/redux/slices/masterDataSlice';
import { Database, Plus, Edit, Trash2, X, Loader2, Search } from 'lucide-react';

interface MetaFieldConfig {
    key: string;
    label: string;
    type?: 'text' | 'number';
}

interface TypeConfig {
    type: MasterType;
    label: string;
    section: string;
    parentType?: MasterType; // set for two-tier child types -- entries need a parentId
    metaFields?: MetaFieldConfig[]; // extra form fields beyond name/description, stored under meta.<key>
}

// One config-driven page covers every remaining "thin or missing" taxonomy list flagged against
// Textilesoft, instead of ~15 near-identical hand-built screens. Customer Groups gets its own
// richer page (features/customers/CustomerGroups.tsx) since it has group-specific fields
// (discount/credit/terms); everything here shares the same generic name+description(+parent/metaFields)
// shape.
const TYPE_CONFIGS: TypeConfig[] = [
    { type: 'WAREHOUSE', label: 'Warehouse', section: 'Locations', metaFields: [
        { key: 'code', label: 'Code' },
        { key: 'address', label: 'Address' },
        { key: 'city', label: 'City' },
        { key: 'contactPerson', label: 'Contact Person' },
        { key: 'phone', label: 'Phone' },
    ] },
    { type: 'CUSTOMER_RELATIONSHIP_TYPE', label: 'Customer Relationship Type', section: 'Customers' },
    { type: 'EMPLOYEE_CATEGORY', label: 'Employee Category', section: 'Employees' },
    { type: 'EMPLOYEE_GROUP', label: 'Employee Group', section: 'Employees' },
    { type: 'EMPLOYEE_SECTION', label: 'Employee Section', section: 'Employees' },
    { type: 'TRANSACTION_GROUP', label: 'Transaction Group', section: 'Transactions' },
    { type: 'TRANSACTION_NAME', label: 'Transaction Name', section: 'Transactions', parentType: 'TRANSACTION_GROUP' },
    { type: 'CASH_GROUP', label: 'Cash Group', section: 'Transactions' },
    { type: 'CASH_NAME', label: 'Cash Name', section: 'Transactions', parentType: 'CASH_GROUP' },
    { type: 'PAYMENT_TYPE', label: 'Payment Type', section: 'Transactions' },
    { type: 'BOOKING_GROUP', label: 'Booking Group', section: 'Transactions' },
    { type: 'EXPENSE_GROUP', label: 'Expense Group', section: 'Expenses' },
    { type: 'GST_TYPE', label: 'GST Type', section: 'GST' },
    { type: 'GST_GROUP', label: 'GST Group', section: 'GST', metaFields: [{ key: 'percentage', label: 'Percentage', type: 'number' }] },
    { type: 'PRODUCT_DESIGN', label: 'Design', section: 'Product Descriptors' },
    { type: 'PRODUCT_PATTERN', label: 'Pattern', section: 'Product Descriptors' },
    { type: 'PRODUCT_FASHION_NAME', label: 'Fashion Name', section: 'Product Descriptors' },
    { type: 'PRODUCT_MODEL_NO', label: 'Model No', section: 'Product Descriptors' },
    { type: 'PRODUCT_BRAND', label: 'Brand', section: 'Product Descriptors' },
    { type: 'PRODUCT_COLOR', label: 'Color', section: 'Product Descriptors' },
    { type: 'PRODUCT_SIZE', label: 'Size', section: 'Product Descriptors' },
    { type: 'PRODUCT_RACK', label: 'Rack No', section: 'Product Descriptors' },
    { type: 'PRODUCT_GROUP', label: 'Product Group', section: 'Product Descriptors' },
    { type: 'PRODUCT_SUBGROUP', label: 'Product Subgroup', section: 'Product Descriptors', parentType: 'PRODUCT_GROUP' },
    { type: 'UNIT', label: 'Unit', section: 'Product Descriptors' },
];

const SECTIONS = Array.from(new Set(TYPE_CONFIGS.map((c) => c.section)));

interface FormState {
    name: string;
    description: string;
    parentId: string;
    metaValues: Record<string, string>;
}
const EMPTY_FORM: FormState = { name: '', description: '', parentId: '', metaValues: {} };

const MasterDataManager: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { entriesByType, isLoading } = useSelector((state: RootState) => state.masterData);

    const [activeType, setActiveType] = useState<TypeConfig>(TYPE_CONFIGS[0]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingEntry, setEditingEntry] = useState<MasterEntry | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const entries = useMemo(() => entriesByType[activeType.type] || [], [entriesByType, activeType.type]);
    const parentEntries = useMemo(
        () => (activeType.parentType ? entriesByType[activeType.parentType] || [] : []),
        [entriesByType, activeType.parentType]
    );

    useEffect(() => {
        dispatch(fetchMasterEntries({ type: activeType.type }));
        if (activeType.parentType) {
            dispatch(fetchMasterEntries({ type: activeType.parentType }));
        }
    }, [dispatch, activeType]);

    const filteredEntries = useMemo(
        () => entries.filter((e) => e.name.toLowerCase().includes(searchTerm.toLowerCase())),
        [entries, searchTerm]
    );

    const parentName = (parentId?: string) => parentEntries.find((p) => p._id === parentId)?.name || '—';

    const openCreateModal = () => {
        setEditingEntry(null);
        setForm(EMPTY_FORM);
        setShowModal(true);
    };

    const openEditModal = (entry: MasterEntry) => {
        setEditingEntry(entry);
        const metaValues: Record<string, string> = {};
        (activeType.metaFields || []).forEach((f) => {
            metaValues[f.key] = String(entry.meta?.[f.key] ?? '');
        });
        setForm({
            name: entry.name,
            description: entry.description || '',
            parentId: entry.parentId || '',
            metaValues,
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) return;
        if (activeType.parentType && !form.parentId) return;
        setSaving(true);
        let meta: Record<string, any> | undefined;
        if (activeType.metaFields && activeType.metaFields.length > 0) {
            meta = {};
            activeType.metaFields.forEach((f) => {
                const raw = form.metaValues[f.key] ?? '';
                meta![f.key] = f.type === 'number' ? (parseFloat(raw) || 0) : raw;
            });
        }
        try {
            if (editingEntry) {
                await dispatch(updateMasterEntry({ id: editingEntry._id, data: { name: form.name, description: form.description, meta } })).unwrap();
            } else {
                await dispatch(createMasterEntry({
                    type: activeType.type,
                    data: { name: form.name, description: form.description, parentId: form.parentId || undefined, meta },
                })).unwrap();
            }
            setShowModal(false);
        } catch {
            // masterData.message carries the error (e.g. duplicate name); form stays open to retry.
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (entry: MasterEntry) => {
        if (!window.confirm(`Delete "${entry.name}"?`)) return;
        await dispatch(deleteMasterEntry({ id: entry._id, type: entry.type }));
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
                    <Database className="w-6 h-6 text-primary" /> Master Data
                </h1>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1 font-medium text-sm">
                    Manage the classification lists used across customers, employees, transactions, GST and products.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Type list */}
                <div className="lg:col-span-1 space-y-4">
                    {SECTIONS.map((section) => (
                        <div key={section} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                            <div className="px-4 py-2 bg-neutral-50 dark:bg-neutral-800/50 text-[10px] font-black uppercase tracking-widest text-neutral-400">{section}</div>
                            {TYPE_CONFIGS.filter((c) => c.section === section).map((cfg) => (
                                <button
                                    key={cfg.type}
                                    onClick={() => setActiveType(cfg)}
                                    className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-colors ${activeType.type === cfg.type ? 'bg-primary/10 text-primary' : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'}`}
                                >
                                    {cfg.label}
                                </button>
                            ))}
                        </div>
                    ))}
                </div>

                {/* Entries table */}
                <div className="lg:col-span-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                    <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="relative max-w-xs w-full">
                            <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                            <input
                                type="text"
                                placeholder={`Search ${activeType.label}...`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm"
                            />
                        </div>
                        <button
                            onClick={openCreateModal}
                            className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 shrink-0"
                        >
                            <Plus className="w-4 h-4" /> Add {activeType.label}
                        </button>
                    </div>

                    {isLoading && entries.length === 0 ? (
                        <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></div>
                    ) : filteredEntries.length === 0 ? (
                        <div className="py-16 text-center text-neutral-400 text-sm font-bold">No {activeType.label.toLowerCase()} entries yet</div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-neutral-500 uppercase text-[10px] font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-3">Name</th>
                                    <th className="px-6 py-3">Description</th>
                                    {activeType.parentType && <th className="px-6 py-3">{TYPE_CONFIGS.find((c) => c.type === activeType.parentType)?.label}</th>}
                                    {(activeType.metaFields || []).map((f) => (
                                        <th key={f.key} className={`px-6 py-3 ${f.type === 'number' ? 'text-right' : ''}`}>{f.label}</th>
                                    ))}
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {filteredEntries.map((entry) => (
                                    <tr key={entry._id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                                        <td className="px-6 py-3 font-bold text-neutral-900 dark:text-white">{entry.name}</td>
                                        <td className="px-6 py-3 text-neutral-500">{entry.description || '—'}</td>
                                        {activeType.parentType && <td className="px-6 py-3 text-neutral-500">{parentName(entry.parentId)}</td>}
                                        {(activeType.metaFields || []).map((f) => (
                                            <td key={f.key} className={`px-6 py-3 ${f.type === 'number' ? 'text-right font-mono' : 'text-neutral-500'}`}>
                                                {entry.meta?.[f.key] || (f.type === 'number' ? 0 : '—')}{f.type === 'number' && f.key === 'percentage' ? '%' : ''}
                                            </td>
                                        ))}
                                        <td className="px-6 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => openEditModal(entry)} className="p-1.5 text-neutral-400 hover:text-primary"><Edit className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(entry)} className="p-1.5 text-neutral-400 hover:text-error"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-md w-full border border-neutral-200 dark:border-neutral-800">
                        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">{editingEntry ? 'Edit' : 'Add'} {activeType.label}</h3>
                            <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase">Name</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full mt-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase">Description</label>
                                <input
                                    type="text"
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    className="w-full mt-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm"
                                />
                            </div>
                            {activeType.parentType && !editingEntry && (
                                <div>
                                    <label className="text-xs font-bold text-neutral-500 uppercase">{TYPE_CONFIGS.find((c) => c.type === activeType.parentType)?.label}</label>
                                    <select
                                        value={form.parentId}
                                        onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                                        className="w-full mt-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm"
                                    >
                                        <option value="">Select…</option>
                                        {parentEntries.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                                    </select>
                                    {parentEntries.length === 0 && (
                                        <p className="text-[10px] text-warning mt-1">No {TYPE_CONFIGS.find((c) => c.type === activeType.parentType)?.label} entries yet — add one first.</p>
                                    )}
                                </div>
                            )}
                            {(activeType.metaFields || []).map((f) => (
                                <div key={f.key}>
                                    <label className="text-xs font-bold text-neutral-500 uppercase">{f.label}</label>
                                    <input
                                        type={f.type === 'number' ? 'number' : 'text'}
                                        value={form.metaValues[f.key] ?? ''}
                                        onChange={(e) => setForm({ ...form, metaValues: { ...form.metaValues, [f.key]: e.target.value } })}
                                        className="w-full mt-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-3">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-neutral-600 dark:text-neutral-400 font-bold text-sm">Cancel</button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !form.name.trim() || (!!activeType.parentType && !editingEntry && !form.parentId)}
                                className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold disabled:opacity-50"
                            >
                                {saving ? 'Saving…' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MasterDataManager;
