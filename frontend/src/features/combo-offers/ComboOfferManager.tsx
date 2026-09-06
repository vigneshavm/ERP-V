import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import { getAllItems } from '../../redux/slices/inventorySlice';
import {
    getAllComboOffers,
    createComboOffer,
    updateComboOffer,
    deleteComboOffer,
    reset,
    ComboOffer,
    ComboOfferInput,
} from '../../redux/slices/comboOfferSlice';
import Layout from "../../components/shared/Layout/index";
import {
    Package2,
    Plus,
    Search,
    Edit3,
    Trash2,
    Tag,
    Percent,
    X,
    Barcode as BarcodeIcon,
} from 'lucide-react';

interface DraftLine {
    itemId: string;
    quantity: number;
}

const emptyDraft = (): { name: string; comboCode: string; description: string; offerPrice: string; isActive: boolean; lines: DraftLine[] } => ({
    name: '',
    comboCode: '',
    description: '',
    offerPrice: '',
    isActive: true,
    lines: [{ itemId: '', quantity: 1 }],
});

const ComboOfferManager: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { combos, isLoading, isError, message } = useSelector((state: RootState) => state.comboOffer);
    const { items } = useSelector((state: RootState) => state.inventory);

    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [draft, setDraft] = useState(emptyDraft());

    useEffect(() => {
        dispatch(getAllComboOffers());
        // Combo items are picked from live inventory, so the picker needs the same item list
        // the rest of the app uses -- fetch a generous page rather than duplicating item search.
        dispatch(getAllItems({ limit: 500 }));
    }, [dispatch]);

    useEffect(() => {
        if (isError && message) {
            // Surfaced via toast in most pages; combo offers doesn't have a toast wired yet, and
            // silently swallowing the error would hide real problems (e.g. offer price above
            // regular price) from the person filling the form.
            console.error('Combo offer error:', message);
            dispatch(reset());
        }
    }, [isError, message, dispatch]);

    const itemPriceById = useMemo(() => new Map(items.map(i => [i._id || i.id, i.sellingPrice])), [items]);

    const previewRegularPrice = useMemo(() => {
        return draft.lines.reduce((sum, line) => {
            const price = itemPriceById.get(line.itemId) || 0;
            return sum + price * (line.quantity || 0);
        }, 0);
    }, [draft.lines, itemPriceById]);

    const previewDiscount = previewRegularPrice > 0 && draft.offerPrice
        ? Math.max(0, Math.round(((previewRegularPrice - Number(draft.offerPrice)) / previewRegularPrice) * 10000) / 100)
        : 0;

    const filteredCombos = useMemo(() => {
        if (!searchTerm) return combos;
        const q = searchTerm.toLowerCase();
        return combos.filter((c: ComboOffer) => c.name.toLowerCase().includes(q) || c.comboCode.toLowerCase().includes(q));
    }, [combos, searchTerm]);

    const startNew = () => {
        setEditingId(null);
        setDraft(emptyDraft());
        setIsModalOpen(true);
    };

    const startEdit = (combo: ComboOffer) => {
        setEditingId(combo._id);
        setDraft({
            name: combo.name,
            comboCode: combo.comboCode,
            description: combo.description || '',
            offerPrice: String(combo.offerPrice),
            isActive: combo.isActive,
            lines: combo.items.map(line => ({ itemId: line.itemId._id, quantity: line.quantity })),
        });
        setIsModalOpen(true);
    };

    const updateLine = (index: number, patch: Partial<DraftLine>) => {
        setDraft(prev => ({
            ...prev,
            lines: prev.lines.map((line, i) => (i === index ? { ...line, ...patch } : line)),
        }));
    };

    const addLine = () => setDraft(prev => ({ ...prev, lines: [...prev.lines, { itemId: '', quantity: 1 }] }));
    const removeLine = (index: number) => setDraft(prev => ({ ...prev, lines: prev.lines.filter((_, i) => i !== index) }));

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const validLines = draft.lines.filter(l => l.itemId && l.quantity > 0);
        if (validLines.length === 0 || !draft.name || !draft.offerPrice) return;

        const payload: ComboOfferInput = {
            name: draft.name,
            comboCode: draft.comboCode || undefined,
            description: draft.description || undefined,
            items: validLines,
            offerPrice: Number(draft.offerPrice),
            isActive: draft.isActive,
        };

        if (editingId) {
            await dispatch(updateComboOffer({ id: editingId, comboData: payload }));
        } else {
            await dispatch(createComboOffer(payload));
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Delete this combo offer? This does not affect items already sold under it.')) {
            dispatch(deleteComboOffer(id));
        }
    };

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in text-neutral-900 dark:text-neutral-100 pb-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black flex items-center gap-2 tracking-tight">
                            <Package2 className="w-6 h-6 text-primary" />
                            Combo Offers
                        </h2>
                        <p className="text-sm text-neutral-500 mt-0.5">Bundle pricing across multiple items, with an auto-generated combo barcode.</p>
                    </div>
                    <button
                        onClick={startNew}
                        className="px-6 py-3 bg-primary text-white rounded-sm font-black text-sm shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-primary/90 transition-all active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        <span>New Combo</span>
                    </button>
                </div>

                <div className="bg-white dark:bg-neutral-800 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-neutral-50 dark:border-neutral-800 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Search combo name or code..."
                                className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-900/50 border-none rounded-sm text-sm focus:ring-2 focus:ring-primary/20"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-[10px] font-black text-neutral-400 uppercase tracking-widest border-b border-neutral-100 dark:border-neutral-800">
                                <tr>
                                    <th className="p-6">Combo</th>
                                    <th className="p-6">Items</th>
                                    <th className="p-6">Regular Price</th>
                                    <th className="p-6">Offer Price</th>
                                    <th className="p-6">Discount</th>
                                    <th className="p-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {isLoading && combos.length === 0 && (
                                    <tr><td colSpan={6} className="p-8 text-center text-sm text-neutral-400">Loading combo offers...</td></tr>
                                )}
                                {!isLoading && filteredCombos.length === 0 && (
                                    <tr><td colSpan={6} className="p-8 text-center text-sm text-neutral-400">No combo offers yet.</td></tr>
                                )}
                                {filteredCombos.map((combo: ComboOffer) => (
                                    <tr key={combo._id} className="group hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition-colors">
                                        <td className="p-6">
                                            <p className="font-black text-sm tracking-tight">{combo.name}</p>
                                            <div className="flex items-center gap-1.5 mt-1 text-neutral-400">
                                                <Tag className="w-3 h-3" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">{combo.comboCode}</span>
                                            </div>
                                            {combo.barcode && (
                                                <div className="flex items-center gap-1.5 mt-1 text-neutral-400">
                                                    <BarcodeIcon className="w-3 h-3" />
                                                    <span className="text-[10px] font-mono">{combo.barcode}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-6">
                                            <div className="space-y-0.5">
                                                {combo.items.map((line, i) => (
                                                    <p key={i} className="text-xs text-neutral-500">
                                                        {line.quantity}&times; {line.itemId?.name || 'Unknown item'}
                                                    </p>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-6"><p className="text-sm font-bold text-neutral-400 line-through">₹{combo.regularPrice.toLocaleString()}</p></td>
                                        <td className="p-6"><p className="text-sm font-black text-primary">₹{combo.offerPrice.toLocaleString()}</p></td>
                                        <td className="p-6">
                                            <span className="px-2.5 py-1 bg-success/10 text-success text-[10px] font-black rounded-lg uppercase tracking-widest flex items-center gap-1 w-fit">
                                                <Percent className="w-3 h-3" />{combo.discountPercent}%
                                            </span>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => startEdit(combo)} className="p-2 text-neutral-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all">
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(combo._id)} className="p-2 text-neutral-400 hover:text-error hover:bg-error/5 rounded-lg transition-all">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                        <div className="bg-white dark:bg-neutral-800 rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-neutral-200 dark:border-neutral-700 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                            <div className="p-8 border-b border-neutral-100 dark:border-neutral-700 flex justify-between items-center">
                                <h3 className="text-xl font-black tracking-tight">{editingId ? 'Edit Combo Offer' : 'New Combo Offer'}</h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-600 transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <form onSubmit={handleSave} className="p-8 space-y-5 overflow-y-auto">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1 mb-2 block">Combo Name</label>
                                        <input
                                            required
                                            className="w-full px-5 py-4 bg-neutral-50 dark:bg-neutral-900 border-none rounded-sm text-sm font-bold focus:ring-2 focus:ring-primary/20"
                                            placeholder="e.g. Festive Shirt Duo"
                                            value={draft.name}
                                            onChange={e => setDraft(p => ({ ...p, name: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1 mb-2 block">Combo Code (optional)</label>
                                        <input
                                            className="w-full px-5 py-4 bg-neutral-50 dark:bg-neutral-900 border-none rounded-sm text-sm font-bold focus:ring-2 focus:ring-primary/20"
                                            placeholder="Auto-generated from name if left blank"
                                            value={draft.comboCode}
                                            onChange={e => setDraft(p => ({ ...p, comboCode: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1 mb-2 block">Bundle Items</label>
                                    <div className="space-y-2">
                                        {draft.lines.map((line, index) => (
                                            <div key={index} className="flex gap-2">
                                                <select
                                                    required
                                                    className="flex-1 px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border-none rounded-sm text-sm font-bold focus:ring-2 focus:ring-primary/20"
                                                    value={line.itemId}
                                                    onChange={e => updateLine(index, { itemId: e.target.value })}
                                                >
                                                    <option value="">Select item...</option>
                                                    {items.map(item => (
                                                        <option key={item._id || item.id} value={item._id || item.id}>
                                                            {item.name} (₹{item.sellingPrice})
                                                        </option>
                                                    ))}
                                                </select>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    required
                                                    className="w-20 px-3 py-3 bg-neutral-50 dark:bg-neutral-900 border-none rounded-sm text-sm font-bold text-center focus:ring-2 focus:ring-primary/20 tabular-nums"
                                                    value={line.quantity}
                                                    onChange={e => updateLine(index, { quantity: Number(e.target.value) })}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeLine(index)}
                                                    disabled={draft.lines.length === 1}
                                                    className="px-3 text-neutral-400 hover:text-error disabled:opacity-30 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <button type="button" onClick={addLine} className="mt-2 text-xs font-black text-primary flex items-center gap-1 hover:underline">
                                        <Plus className="w-3.5 h-3.5" /> Add another item
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4 items-end">
                                    <div>
                                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1 mb-2 block">Offer (Bundle) Price ₹</label>
                                        <input
                                            type="number"
                                            required
                                            min={0}
                                            className="w-full px-5 py-4 bg-neutral-50 dark:bg-neutral-900 border-none rounded-sm text-sm font-bold focus:ring-2 focus:ring-primary/20 tabular-nums"
                                            value={draft.offerPrice}
                                            onChange={e => setDraft(p => ({ ...p, offerPrice: e.target.value }))}
                                        />
                                    </div>
                                    <div className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-sm">
                                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Regular Price</p>
                                        <p className="text-lg font-black tabular-nums">₹{previewRegularPrice.toLocaleString()}</p>
                                        <p className="text-[10px] font-bold text-success mt-1">{previewDiscount}% off</p>
                                    </div>
                                </div>

                                <div className="pt-2 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 px-6 py-4 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-sm font-black text-sm hover:bg-neutral-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-6 py-4 bg-primary text-white rounded-sm font-black text-sm shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
                                    >
                                        {editingId ? 'Save Changes' : 'Create Combo'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default ComboOfferManager;
