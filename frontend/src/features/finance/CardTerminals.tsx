import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { CreditCard, Plus, X, Trash2, Pencil } from 'lucide-react';
import Layout from "../../components/shared/Layout/Layout";
import PageHeader from "../../components/shared/Layout/PageHeader";
import { AppDispatch, RootState } from "../../redux/store";
import {
    getCardTerminals, createCardTerminal, updateCardTerminal, deleteCardTerminal, CardTerminal
} from "../../redux/slices/cardTerminalSlice";
import { fetchMasterEntries } from "../../redux/slices/masterDataSlice";

// Textilesoft's "CardMachineMaster" -- a registry of physical card/EMI terminals so a till close
// or a sale's payment method can be tied to a specific machine/provider, not just a generic
// "Card" bucket. See backend/src/modules/finance/models/CardTerminal.ts.
const CardTerminals: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { terminals, isLoading } = useSelector((state: RootState) => state.cardTerminals);
    const { entriesByType } = useSelector((state: RootState) => state.masterData);
    const warehouseEntries = entriesByType.WAREHOUSE || [];

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [terminalId, setTerminalId] = useState('');
    const [provider, setProvider] = useState('');
    const [storeId, setStoreId] = useState('');
    const [notes, setNotes] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        dispatch(getCardTerminals());
        dispatch(fetchMasterEntries({ type: 'WAREHOUSE' }) as any);
    }, [dispatch]);

    const resetForm = () => {
        setEditingId(null); setTerminalId(''); setProvider('');
        setStoreId(''); setNotes(''); setIsActive(true);
    };

    const openEdit = (t: CardTerminal) => {
        setEditingId(t._id);
        setTerminalId(t.terminalId);
        setProvider(t.provider || '');
        setStoreId(typeof t.storeId === 'object' ? t.storeId?._id || '' : t.storeId || '');
        setNotes(t.notes || '');
        setIsActive(t.isActive);
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!terminalId.trim()) { toast.warning('Enter a terminal ID'); return; }
        setIsSaving(true);
        try {
            const payload = { terminalId: terminalId.trim(), provider: provider.trim() || undefined, storeId: storeId || undefined, notes: notes.trim() || undefined, isActive };
            if (editingId) {
                await dispatch(updateCardTerminal({ id: editingId, data: payload })).unwrap();
                toast.success('Terminal updated');
            } else {
                await dispatch(createCardTerminal(payload)).unwrap();
                toast.success('Terminal added');
            }
            setIsModalOpen(false);
            resetForm();
        } catch (err: any) {
            toast.error(typeof err === 'string' ? err : 'Failed to save terminal');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Remove this terminal from the registry?')) return;
        try {
            await dispatch(deleteCardTerminal(id)).unwrap();
            toast.success('Terminal removed');
        } catch (err: any) {
            toast.error(typeof err === 'string' ? err : 'Failed to remove terminal');
        }
    };

    const storeName = (id: any) => {
        const sid = typeof id === 'object' ? id?._id : id;
        return (warehouseEntries || []).find((w: any) => w._id === sid)?.name || (typeof id === 'object' ? id?.name : '') || '—';
    };

    return (
        <Layout>
            <PageHeader
                title="Card / EMI Terminals"
                description="Registry of physical card and EMI machines used at checkout, so payments can be tied to a specific terminal."
                actions={
                    <button
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        className="px-4 py-2 bg-success text-white rounded-lg text-sm font-bold hover:bg-success/90 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Add Terminal
                    </button>
                }
            />

            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-neutral-50 dark:bg-neutral-900 text-xs font-bold text-neutral-500 uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-700">
                            <tr>
                                <th className="px-6 py-3">Terminal ID</th>
                                <th className="px-6 py-3">Provider</th>
                                <th className="px-6 py-3">Store / Warehouse</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Notes</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {terminals.map(t => (
                                <tr key={t._id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/40">
                                    <td className="px-6 py-4 text-sm font-bold text-neutral-900 dark:text-white">{t.terminalId}</td>
                                    <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-300">{t.provider || '—'}</td>
                                    <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-300">{storeName(t.storeId)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase ${t.isActive ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-neutral-100 border-neutral-200 text-neutral-500'}`}>
                                            {t.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-neutral-500 max-w-xs truncate">{t.notes || '—'}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => openEdit(t)} className="p-1.5 text-neutral-400 hover:text-primary" title="Edit">
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(t._id)} className="p-1.5 text-neutral-400 hover:text-rose-600" title="Remove">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!isLoading && terminals.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center text-neutral-400">
                                        <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-40" />
                                        No terminals registered yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
                            <h3 className="text-lg font-bold">{editingId ? 'Edit Terminal' : 'Add Terminal'}</h3>
                            <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-neutral-400 hover:text-neutral-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">Terminal ID</label>
                                <input value={terminalId} onChange={(e) => setTerminalId(e.target.value)} placeholder="e.g. HDFC-POS-01" className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">Provider</label>
                                <input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="e.g. HDFC Bank, Pine Labs" className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">Store / Warehouse</label>
                                <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none">
                                    <option value="">Unassigned</option>
                                    {(warehouseEntries || []).map((w: any) => <option key={w._id} value={w._id}>{w.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">Notes</label>
                                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none resize-none" />
                            </div>
                            <label className="flex items-center gap-2 text-sm font-medium text-neutral-600 dark:text-neutral-300">
                                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded" />
                                Active
                            </label>
                        </div>
                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200 dark:border-neutral-700">
                            <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="px-4 py-2 text-sm font-bold text-neutral-500 hover:text-neutral-800">Cancel</button>
                            <button onClick={handleSubmit} disabled={isSaving} className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 disabled:opacity-60">
                                {isSaving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Terminal'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default CardTerminals;
