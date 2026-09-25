import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { Plus, Edit, Trash2, X, Loader2, Search, ChevronDown, Check } from 'lucide-react';
import api from '../../services/api';
import PageHeader from '../../components/shared/Layout/PageHeader';

interface MetaFieldConfig {
    key: string;
    label: string;
    type?: 'text' | 'number' | 'multiselect';
    // 'productCategories' loads its options from GET /api/product-categories?sectorName=<tenant's
    // business sector>, the same list Settings > General's "Mapped Product Categories" uses -- so
    // the picker offers exactly the category names the shop already recognizes (e.g. Shirt, Pant,
    // Lungi, Dhothie), matching what a Product-Wise report groups by. Only meaningful when
    // type === 'multiselect'. The selected set is still stored as a single comma-separated string
    // under meta.<key>, so no backend change is needed -- loadCounterCategoryMap() already parses it.
    optionsSource?: 'productCategories';
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
    { type: 'PRODUCT_HSN', label: 'HSN Code', section: 'Product Descriptors', metaFields: [
        { key: 'gstRate', label: 'GST Rate', type: 'number' },
    ] },
    // Maps a named sales-floor counter (e.g. "Counter 1") to the product types sold there (e.g.
    // Shirt, Pant), for shops that organize the floor by product line rather than by billing till.
    // Read by the Sales Counter-Wise Sales report (GET /api/reports/shop-sales?dim=salesCounter):
    // when at least one entry exists it buckets revenue by this mapping instead of the raw
    // salesman/counter code recorded per bill line; with no entries it falls back to that code.
    { type: 'SALES_COUNTER', label: 'Sales Counter', section: 'Sales Floor', metaFields: [
        { key: 'categories', label: 'Product Categories', type: 'multiselect', optionsSource: 'productCategories' },
    ] },
];

const SECTIONS = Array.from(new Set(TYPE_CONFIGS.map((c) => c.section)));

interface FormState {
    name: string;
    description: string;
    parentId: string;
    metaValues: Record<string, string>;
}
const EMPTY_FORM: FormState = { name: '', description: '', parentId: '', metaValues: {} };

interface MultiSelectFieldProps {
    options: string[];
    value: string; // comma-separated, e.g. "Shirt, Pant"
    onChange: (value: string) => void;
    loading?: boolean;
    placeholder?: string;
}

// Search-and-check dropdown for a metaField of type 'multiselect'. Kept generic (options/value/
// onChange as plain strings) so it can back any future comma-separated multi-value metaField, not
// just Sales Counter's Product Categories. Mirrors the picker pattern already used in
// ProductWiseSalesReport.tsx (search box, Select All / Clear, scrollable checkbox list, Done footer).
const MultiSelectField: React.FC<MultiSelectFieldProps> = ({ options, value, onChange, loading, placeholder }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const selected = useMemo(() => value.split(',').map((s) => s.trim()).filter(Boolean), [value]);
    const visible = useMemo(
        () => options.filter((o) => o.toLowerCase().includes(search.toLowerCase())),
        [options, search]
    );

    useEffect(() => {
        if (!open) return;
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    const toggle = (name: string) => {
        const set = new Set(selected);
        if (set.has(name)) set.delete(name); else set.add(name);
        onChange(Array.from(set).join(', '));
    };

    const label = selected.length === 0
        ? (placeholder || 'Select…')
        : selected.length <= 2
            ? selected.join(', ')
            : `${selected.length} selected`;

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="w-full mt-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm flex items-center justify-between gap-2"
            >
                <span className={`truncate text-left ${selected.length === 0 ? 'text-neutral-400' : ''}`}>{loading ? 'Loading…' : label}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-2xl p-3 space-y-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search categories..."
                            autoFocus
                            className="w-full pl-8 pr-2 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        <span>{selected.length} selected</span>
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={() => onChange(visible.join(', '))} className="text-primary hover:underline">Select All</button>
                            <button type="button" onClick={() => onChange('')} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:underline">Clear</button>
                        </div>
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-0.5 -mx-1 px-1">
                        {options.length === 0 && !loading && (
                            <p className="text-xs text-neutral-400 text-center py-3">No categories found for this business sector</p>
                        )}
                        {options.length > 0 && visible.length === 0 && (
                            <p className="text-xs text-neutral-400 text-center py-3">No categories match &ldquo;{search}&rdquo;</p>
                        )}
                        {visible.map((name) => {
                            const checked = selected.includes(name);
                            return (
                                <label
                                    key={name}
                                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer"
                                >
                                    <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${checked ? 'bg-primary border-primary' : 'border-neutral-300 dark:border-neutral-600'}`}>
                                        {checked && <Check className="w-3 h-3 text-white" />}
                                    </span>
                                    <input type="checkbox" checked={checked} onChange={() => toggle(name)} className="sr-only" />
                                    <span className="text-xs font-medium text-neutral-700 dark:text-neutral-200 truncate">{name}</span>
                                </label>
                            );
                        })}
                    </div>

                    <div className="flex justify-end pt-1 border-t border-neutral-100 dark:border-neutral-700">
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest bg-primary text-white hover:bg-primary/90 transition-all"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const MasterDataManager: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { entriesByType, isLoading } = useSelector((state: RootState) => state.masterData);
    const { tenants } = useSelector((state: RootState) => state.tenant);
    const { user } = useSelector((state: RootState) => state.auth);
    const businessType = tenants.find((t) => t.id === user?.tenantId)?.businessType;

    const [activeType, setActiveType] = useState<TypeConfig>(TYPE_CONFIGS[0]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingEntry, setEditingEntry] = useState<MasterEntry | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    // Options for any 'productCategories'-sourced multiselect metaField (currently just Sales
    // Counter's "Product Categories"), fetched lazily the first time such a field is on screen --
    // same GET /api/product-categories?sectorName=<sector> that Settings > General's "Mapped
    // Product Categories" list uses, so the picker offers exactly this shop's category names.
    const [productCategoryOptions, setProductCategoryOptions] = useState<string[]>([]);
    const [loadingCategoryOptions, setLoadingCategoryOptions] = useState(false);
    const [categoryOptionsFetched, setCategoryOptionsFetched] = useState(false);
    const needsProductCategories = (activeType.metaFields || []).some(
        (f) => f.type === 'multiselect' && f.optionsSource === 'productCategories'
    );

    useEffect(() => {
        if (!needsProductCategories || !businessType || categoryOptionsFetched) return;
        let cancelled = false;
        setLoadingCategoryOptions(true);
        api.get('/api/product-categories', { params: { sectorName: businessType } })
            .then((res) => {
                if (cancelled) return;
                const rows: Array<{ name: string }> = res.data?.data || [];
                setProductCategoryOptions(rows.map((r) => r.name).filter(Boolean));
            })
            .catch(() => {
                if (!cancelled) setProductCategoryOptions([]);
            })
            .finally(() => {
                if (!cancelled) {
                    setLoadingCategoryOptions(false);
                    setCategoryOptionsFetched(true);
                }
            });
        return () => { cancelled = true; };
    }, [needsProductCategories, businessType, categoryOptionsFetched]);

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
            <PageHeader
                title="Master Data"
                description="Manage the classification lists used across customers, employees, transactions, GST and products."
            />

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
                                                {entry.meta?.[f.key] || (f.type === 'number' ? 0 : '—')}{f.type === 'number' && (f.key === 'percentage' || f.key === 'gstRate') ? '%' : ''}
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
                                    {f.type === 'multiselect' ? (
                                        <MultiSelectField
                                            options={f.optionsSource === 'productCategories' ? productCategoryOptions : []}
                                            value={form.metaValues[f.key] ?? ''}
                                            onChange={(v) => setForm({ ...form, metaValues: { ...form.metaValues, [f.key]: v } })}
                                            loading={f.optionsSource === 'productCategories' && loadingCategoryOptions}
                                            placeholder="Select product categories…"
                                        />
                                    ) : (
                                        <input
                                            type={f.type === 'number' ? 'number' : 'text'}
                                            value={form.metaValues[f.key] ?? ''}
                                            onChange={(e) => setForm({ ...form, metaValues: { ...form.metaValues, [f.key]: e.target.value } })}
                                            className="w-full mt-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm"
                                        />
                                    )}
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
