import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Save, Box, Shirt } from 'lucide-react';
import { Product } from '../../types/product';
import { AppDispatch, RootState } from '../../redux/store';
import { fetchMasterEntries } from '../../redux/slices/masterDataSlice';

interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (productData: Partial<Product>) => Promise<void>;
    product?: Product | null;
    isLoading?: boolean;
    categories?: string[];
}

const EMPTY_PRODUCT: Partial<Product> = {
    name: '',
    nameTamil: '',
    sku: '',
    category: '',
    costPrice: 0,
    sellingPrice: 0,
    wholesaleRate: undefined,
    stockQty: 0,
    lowStockLimit: 10,
    unit: 'pcs',
    brand: '',
    location: '',
    warehouseId: '',
    barcode: '',
    design: '',
    pattern: '',
    modelNo: '',
    fashionName: '',
    subgroupId: '',
    hsnCode: '',
    gstRate: 0
};

const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, onSave, product, isLoading, categories }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { entriesByType } = useSelector((state: RootState) => state.masterData);
    const units = useMemo(() => entriesByType.UNIT || [], [entriesByType.UNIT]);
    const designOptions = useMemo(() => entriesByType.PRODUCT_DESIGN || [], [entriesByType.PRODUCT_DESIGN]);
    const patternOptions = useMemo(() => entriesByType.PRODUCT_PATTERN || [], [entriesByType.PRODUCT_PATTERN]);
    const modelNoOptions = useMemo(() => entriesByType.PRODUCT_MODEL_NO || [], [entriesByType.PRODUCT_MODEL_NO]);
    const fashionNameOptions = useMemo(() => entriesByType.PRODUCT_FASHION_NAME || [], [entriesByType.PRODUCT_FASHION_NAME]);
    const subgroups = useMemo(() => entriesByType.PRODUCT_SUBGROUP || [], [entriesByType.PRODUCT_SUBGROUP]);
    const warehouses = useMemo(() => entriesByType.WAREHOUSE || [], [entriesByType.WAREHOUSE]);
    const hsnCodes = useMemo(() => entriesByType.PRODUCT_HSN || [], [entriesByType.PRODUCT_HSN]);

    // A product whose category isn't in the known list (e.g. legacy data, or a category the
    // catalog no longer has) still needs to be editable as free text.
    const isUnlistedCategory = (p?: Product | null) => !!p?.category && !(categories || []).includes(p.category);
    const [isNewCategory, setIsNewCategory] = useState(() => isUnlistedCategory(product));
    const [formData, setFormData] = useState<Partial<Product>>(() => product ? { ...EMPTY_PRODUCT, ...product } : EMPTY_PRODUCT);
    // Re-initialize when opened or given a different product; adjusted during render (tracking the
    // previous props) instead of setState in an effect.
    const [prevProps, setPrevProps] = useState({ product, isOpen });
    if (prevProps.product !== product || prevProps.isOpen !== isOpen) {
        setPrevProps({ product, isOpen });
        setFormData(product ? { ...EMPTY_PRODUCT, ...product } : EMPTY_PRODUCT);
        setIsNewCategory(isUnlistedCategory(product));
    }

    useEffect(() => {
        if (!isOpen) return;
        // Pick-list data for the textile descriptor fields below -- seeded with sensible
        // defaults server-side (UNIT) or starts empty until the admin adds entries via
        // Settings -> Master Data (the design/pattern/model no/fashion name/subgroup lists).
        ['UNIT', 'PRODUCT_DESIGN', 'PRODUCT_PATTERN', 'PRODUCT_MODEL_NO', 'PRODUCT_FASHION_NAME', 'PRODUCT_SUBGROUP', 'WAREHOUSE', 'PRODUCT_HSN'].forEach((type) => {
            dispatch(fetchMasterEntries({ type: type as any }));
        });
    }, [isOpen, dispatch]);

    // Legacy items were created before the Warehouse master existed, so their warehouseId may
    // still be the literal default string ('MAIN_WAREHOUSE') rather than a real MasterEntry _id.
    // Derive (not store) the resolved id -- via meta.code -- so the picker shows it as selected
    // without a setState-in-effect render cascade; the resolved value is what actually gets saved.
    const resolvedWarehouseId = useMemo(() => {
        const current = formData.warehouseId;
        if (!current) return '';
        if (warehouses.some(w => w._id === current)) return current;
        return warehouses.find(w => w.meta?.code === current)?._id || current;
    }, [formData.warehouseId, warehouses]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave({ ...formData, warehouseId: resolvedWarehouseId });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        }));
    };

    // Selecting an HSN code auto-fills GST Rate from that code's meta.gstRate (Settings -> Master
    // Data -> HSN Code), same behavior the backend's masterTypes.ts seed comment describes. GST
    // Rate stays a normal field afterward -- picking a different HSN code re-fills it, but the
    // user can still override it by hand (e.g. a code with no gstRate set, or an exception item).
    const handleHsnChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const code = e.target.value;
        const entry = hsnCodes.find((h) => h.name === code);
        setFormData(prev => ({
            ...prev,
            hsnCode: code,
            gstRate: entry?.meta?.gstRate ?? prev.gstRate,
        }));
    };

    const handleGstRateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, gstRate: parseFloat(e.target.value) || 0 }));
    };

    const NEW_CATEGORY_SENTINEL = '__new_category__';

    const handleCategorySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (e.target.value === NEW_CATEGORY_SENTINEL) {
            setIsNewCategory(true);
            setFormData(prev => ({ ...prev, category: '' }));
            return;
        }
        setIsNewCategory(false);
        setFormData(prev => ({ ...prev, category: e.target.value }));
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-sm border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-700/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 text-primary rounded-xl">
                            <Box className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black italic text-slate-900 dark:text-slate-100">
                                {product ? 'Update SKU Authority' : 'Register New SKU'}
                            </h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                                Central Metadata Control
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-danger rounded-full transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1">Product Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-main outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    placeholder="Blue Sky Filter..."
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1">Product Name (Tamil)</label>
                                <input
                                    type="text"
                                    name="nameTamil"
                                    value={formData.nameTamil || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-main outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    placeholder="தமிழில் பெயர்..."
                                />
                                <p className="text-[10px] text-slate-400 mt-1 px-1">Shown under the product name and searchable in the POS product browser.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1">SKU Code</label>
                                    <input
                                        type="text"
                                        name="sku"
                                        value={formData.sku}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-main outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        placeholder="SKU-001"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1">Barcode</label>
                                    <input
                                        type="text"
                                        name="barcode"
                                        value={formData.barcode}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-main outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        placeholder="123456789"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1">Category</label>
                                {isNewCategory ? (
                                    <div className="space-y-1.5">
                                        <input
                                            type="text"
                                            name="category"
                                            value={formData.category}
                                            onChange={handleChange}
                                            required
                                            autoFocus
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-main outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                            placeholder="New category name"
                                        />
                                        {(categories || []).length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => { setIsNewCategory(false); setFormData(prev => ({ ...prev, category: '' })); }}
                                                className="text-[10px] font-black text-slate-400 hover:text-primary uppercase tracking-widest px-1"
                                            >
                                                ← Choose existing category instead
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <select
                                        name="category"
                                        value={formData.category || ''}
                                        onChange={handleCategorySelect}
                                        required
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-main outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                                    >
                                        <option value="" disabled>Select category...</option>
                                        {(categories || []).map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                        <option value={NEW_CATEGORY_SENTINEL}>+ Add new category</option>
                                    </select>
                                )}
                            </div>
                        </div>

                        {/* Pricing and Stock */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1">Cost Price (₹)</label>
                                    <input
                                        type="number"
                                        name="costPrice"
                                        value={formData.costPrice}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-main outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1">Selling Price (₹)</label>
                                    <input
                                        type="number"
                                        name="sellingPrice"
                                        value={formData.sellingPrice}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-main outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1">Wholesale Rate (₹) <span className="normal-case text-slate-400 font-medium">— optional</span></label>
                                    <input
                                        type="number"
                                        name="wholesaleRate"
                                        value={formData.wholesaleRate ?? ''}
                                        onChange={handleChange}
                                        placeholder="Same as selling price if blank"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-main outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1">Stock OBT</label>
                                    <input
                                        type="number"
                                        name="stockQty"
                                        value={formData.stockQty}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-main outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1">Low Stock Limit</label>
                                    <input
                                        type="number"
                                        name="lowStockLimit"
                                        value={formData.lowStockLimit}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-main outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1">Unit</label>
                                    <select
                                        name="unit"
                                        value={formData.unit}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-main outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                                    >
                                        {units.length > 0 ? (
                                            units.map((u) => <option key={u._id} value={u.name}>{u.name}</option>)
                                        ) : (
                                            <>
                                                <option value="pcs">Pieces (pcs)</option>
                                                <option value="kg">Kilograms (kg)</option>
                                                <option value="l">Liters (l)</option>
                                                <option value="box">Box</option>
                                                <option value="unit">Unit</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1">Brand</label>
                                    <input
                                        type="text"
                                        name="brand"
                                        value={formData.brand}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-main outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        placeholder="Zeiss"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1">HSN Code</label>
                                    <select
                                        name="hsnCode"
                                        value={formData.hsnCode || ''}
                                        onChange={handleHsnChange}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-main outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                                    >
                                        <option value="">None</option>
                                        {hsnCodes.map((h) => <option key={h._id} value={h.name}>{h.name}{h.description ? ` — ${h.description}` : ''}</option>)}
                                    </select>
                                    {hsnCodes.length === 0 && (
                                        <p className="text-[10px] text-slate-400 mt-1 px-1">No HSN codes yet — add one in Settings → Master Data.</p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1">GST Rate</label>
                                    <select
                                        name="gstRate"
                                        value={formData.gstRate ?? 0}
                                        onChange={handleGstRateChange}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-main outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                                    >
                                        {[0, 5, 12, 18, 28].map((rate) => <option key={rate} value={rate}>{rate}%</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1">Warehouse</label>
                                <select
                                    name="warehouseId"
                                    value={resolvedWarehouseId}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-main outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                                >
                                    <option value="">Default (Main Warehouse)</option>
                                    {warehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Textile Descriptors -- Design/Pattern/Model No/Fashion Name are free-text
                        with an admin-managed pick-list (Settings -> Master Data) offered via
                        datalist, so a shop can build up a controlled vocabulary without the
                        field being locked to a hard foreign key. */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <Shirt className="w-3.5 h-3.5" /> Textile Details (optional)
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1">Design</label>
                                <input
                                    type="text"
                                    name="design"
                                    list="design-options"
                                    value={formData.design || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-main outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                />
                                <datalist id="design-options">
                                    {designOptions.map((d) => <option key={d._id} value={d.name} />)}
                                </datalist>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1">Pattern</label>
                                <input
                                    type="text"
                                    name="pattern"
                                    list="pattern-options"
                                    value={formData.pattern || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-main outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                />
                                <datalist id="pattern-options">
                                    {patternOptions.map((p) => <option key={p._id} value={p.name} />)}
                                </datalist>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1">Model No</label>
                                <input
                                    type="text"
                                    name="modelNo"
                                    list="modelno-options"
                                    value={formData.modelNo || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-main outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                />
                                <datalist id="modelno-options">
                                    {modelNoOptions.map((m) => <option key={m._id} value={m.name} />)}
                                </datalist>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1">Fashion Name</label>
                                <input
                                    type="text"
                                    name="fashionName"
                                    list="fashionname-options"
                                    value={formData.fashionName || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-main outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                />
                                <datalist id="fashionname-options">
                                    {fashionNameOptions.map((f) => <option key={f._id} value={f.name} />)}
                                </datalist>
                            </div>
                            <div className="col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1">Product Subgroup</label>
                                <select
                                    name="subgroupId"
                                    value={formData.subgroupId || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-main outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                                >
                                    <option value="">None</option>
                                    {subgroups.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                                </select>
                                {subgroups.length === 0 && (
                                    <p className="text-[10px] text-slate-400 mt-1 px-1">No subgroups yet — add one in Settings → Master Data.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                    >
                        Discard
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="px-8 py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:scale-100"
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        {product ? 'Commit Changes' : 'Initialize SKU'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductModal;
