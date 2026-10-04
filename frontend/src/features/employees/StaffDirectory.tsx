import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Pencil, Plus, Trash2, Users } from 'lucide-react';
import api from '../../services/api.js';
import PageHeader from '../../components/shared/Layout/PageHeader';

/** Staff: Textilesoft's own employee master (dbo.newemployee). Attendance and payroll are not part of this screen. */
interface Employee {
    code: string; name: string; nameTamil: string; gender: string; bloodGroup: string; mobile: string; phone: string;
    address: string; city: string; pinCode: string; category: string; group: string; section: string;
    salary: string; totalSalary: string; batta: string; pf: string; pfNo: string; esi: string; advance: string;
    commissionPercent: string; commissionFromAmount: string; targetAmount1: string; targetAmount2: string;
    attendanceCardNo: string; idNo: string; bankAccountName: string; bankAccountNo: string; bankName: string; bankIfsc: string;
}
type Lookups = { categories: string[]; groups: string[]; sections: string[] };
const EMPTY: Omit<Employee, 'code'> = {
    name: '', nameTamil: '', gender: '', bloodGroup: '', mobile: '', phone: '', address: '', city: '', pinCode: '',
    category: '', group: '', section: '', salary: '', totalSalary: '', batta: '', pf: '', pfNo: '', esi: '', advance: '',
    commissionPercent: '', commissionFromAmount: '', targetAmount1: '', targetAmount2: '',
    attendanceCardNo: '', idNo: '', bankAccountName: '', bankAccountNo: '', bankName: '', bankIfsc: '',
};
const input = 'w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm';
const label = 'block text-xs font-bold text-slate-500 uppercase mb-1';

const errorText = (e: any): string => e?.response?.data?.error?.message || e?.response?.data?.message || e?.message || 'Something went wrong';

const StaffDirectory: React.FC = () => {
    const [rows, setRows] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [lookups, setLookups] = useState<Lookups>({ categories: [], groups: [], sections: [] });
    const [form, setForm] = useState<Omit<Employee, 'code'>>(EMPTY);
    const [editing, setEditing] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [list, look] = await Promise.all([api.get('/api/hr/employees'), api.get('/api/hr/employees/lookups')]);
            setRows(list.data?.data ?? []);
            setLookups(look.data?.data ?? { categories: [], groups: [], sections: [] });
        } catch (e) {
            setError(errorText(e));
        } finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => { void load(); }, [load]);

    const shown = useMemo(() => {
        const q = search.trim().toLowerCase();
        return q ? rows.filter(r => `${r.code} ${r.name} ${r.mobile} ${r.category}`.toLowerCase().includes(q)) : rows;
    }, [rows, search]);

    const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }));
    const reset = () => { setForm(EMPTY); setEditing(null); };

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            if (editing) await api.put(`/api/hr/employees/${encodeURIComponent(editing)}`, form);
            else await api.post('/api/hr/employees', form);
            reset();
            await load();
        } catch (err) {
            setError(errorText(err));
        } finally {
            setSaving(false);
        }
    };
    const startEdit = (r: Employee) => {
        const { code, ...rest } = r;
        setForm(rest);
        setEditing(code);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const remove = async (r: Employee) => {
        if (!window.confirm(`Delete ${r.name}?`)) return;
        setError(null);
        try {
            await api.delete(`/api/hr/employees/${encodeURIComponent(r.code)}`);
            if (editing === r.code) reset();
            await load();
        } catch (err) {
            setError(errorText(err));
        }
    };
    const pick = (k: 'category' | 'group' | 'section', title: string, options: string[]) => (
        <div>
            <label className={label}>{title}</label>
            <select className={input} value={form[k]} onChange={set(k)}>
                <option value="">—</option>
                {form[k] && !options.includes(form[k]) && <option value={form[k]}>{form[k]}</option>}
                {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
    );
    const field = (k: keyof typeof EMPTY, title: string, type = 'text') => (
        <div>
            <label className={label}>{title}</label>
            <input className={input} type={type} inputMode={type === 'number' ? 'decimal' : undefined} value={form[k]} onChange={set(k)} />
        </div>
    );

    return (
        <div className="space-y-6">
            <PageHeader
                title="Staff"
                description="Employees as recorded in the shop database (Textilesoft employee master)."
                actions={<div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary/30">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-primary">{rows.length} employees</span>
                </div>}
            />

            {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{error}</p>}

            <div className="grid lg:grid-cols-3 gap-6">
                <form onSubmit={save} className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3 self-start">
                    <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        {editing ? <Pencil className="w-4 h-4 text-primary" /> : <Plus className="w-4 h-4 text-primary" />}
                        {editing ? `Edit employee ${editing}` : 'Add employee'}
                    </div>
                    {field('name', 'Name')}
                    {field('nameTamil', 'Name (Tamil)')}
                    <div className="grid grid-cols-2 gap-3">{field('mobile', 'Mobile')}{field('phone', 'Phone')}</div>
                    <div className="grid grid-cols-2 gap-3">{field('gender', 'Gender')}{field('bloodGroup', 'Blood group')}</div>
                    {field('address', 'Address')}
                    <div className="grid grid-cols-2 gap-3">{field('city', 'City')}{field('pinCode', 'Pin code')}</div>
                    {pick('category', 'Category', lookups.categories)}
                    {pick('group', 'Group', lookups.groups)}
                    {pick('section', 'Section', lookups.sections)}
                    <div className="grid grid-cols-2 gap-3">{field('salary', 'Salary', 'number')}{field('totalSalary', 'Total salary', 'number')}</div>
                    <div className="grid grid-cols-2 gap-3">{field('batta', 'Batta', 'number')}{field('advance', 'Advance', 'number')}</div>
                    <div className="grid grid-cols-2 gap-3">{field('pf', 'PF', 'number')}{field('pfNo', 'PF no.')}</div>
                    {field('esi', 'ESI', 'number')}
                    <div className="grid grid-cols-2 gap-3">{field('commissionPercent', 'Commission %', 'number')}{field('commissionFromAmount', 'Commission from amount', 'number')}</div>
                    <div className="grid grid-cols-2 gap-3">{field('targetAmount1', 'Target 1', 'number')}{field('targetAmount2', 'Target 2', 'number')}</div>
                    <div className="grid grid-cols-2 gap-3">{field('attendanceCardNo', 'Attendance card no.')}{field('idNo', 'ID no.')}</div>
                    {field('bankAccountName', 'Bank account name')}
                    <div className="grid grid-cols-2 gap-3">{field('bankAccountNo', 'Account no.')}{field('bankIfsc', 'IFSC')}</div>
                    {field('bankName', 'Bank name')}
                    <div className="flex gap-2 pt-1">
                        <button type="submit" disabled={saving || !form.name.trim()} className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
                            {saving ? 'Saving…' : editing ? 'Save changes' : 'Add employee'}
                        </button>
                        {editing && <button type="button" onClick={reset} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-bold">Cancel</button>}
                    </div>
                </form>

                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                    <input
                        className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                        placeholder="Search by name, code, mobile or category"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                {loading ? (
                    <div className="p-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
                ) : shown.length === 0 ? (
                    <p className="p-10 text-center text-sm text-slate-500">{rows.length ? 'No employee matches the search.' : 'No employees yet. Add the first one on the left.'}</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 text-left text-xs uppercase text-slate-500">
                                <tr><th className="px-4 py-2">Code</th><th className="px-4 py-2">Name</th><th className="px-4 py-2">Mobile</th><th className="px-4 py-2">Category</th><th className="px-4 py-2 text-right">Salary</th><th className="px-4 py-2" /></tr>
                            </thead>
                            <tbody>
                                {shown.map(r => (
                                    <tr key={r.code} className="border-t border-slate-100 dark:border-slate-700">
                                        <td className="px-4 py-2 font-mono">{r.code}</td>
                                        <td className="px-4 py-2 font-medium">{r.name}</td>
                                        <td className="px-4 py-2">{r.mobile || '—'}</td>
                                        <td className="px-4 py-2">{[r.category, r.section].filter(Boolean).join(' · ') || '—'}</td>
                                        <td className="px-4 py-2 text-right">{r.salary || '—'}</td>
                                        <td className="px-4 py-2 text-right whitespace-nowrap">
                                            <button type="button" aria-label={`Edit ${r.name}`} onClick={() => startEdit(r)} className="p-1.5 text-slate-500 hover:text-primary"><Pencil className="w-4 h-4" /></button>
                                            <button type="button" aria-label={`Delete ${r.name}`} onClick={() => void remove(r)} className="p-1.5 text-slate-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                </div>
            </div>
        </div>
    );
};

export default StaffDirectory;
