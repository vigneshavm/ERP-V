import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { CreditCard, Plus, X, Trash2, Pencil } from 'lucide-react';
import Layout from "../../components/shared/Layout/Layout";
import PageHeader from "../../components/shared/Layout/PageHeader";
import { Button, Input, Textarea, Checkbox, Select } from "../../components/shared";
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
                    <Button
                        variant="success"
                        size="md"
                        icon={<Plus className="w-4 h-4" />}
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                    >
                        Add Terminal
                    </Button>
                }
            />

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-3">Terminal ID</th>
                                <th className="px-6 py-3">Provider</th>
                                <th className="px-6 py-3">Store / Warehouse</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Notes</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {terminals.map(t => (
                                <tr key={t._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                                    <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">{t.terminalId}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{t.provider || '—'}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{storeName(t.storeId)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase ${t.isActive ? 'bg-success-soft border-success-line text-success' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                                            {t.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">{t.notes || '—'}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => openEdit(t)} className="p-1.5 text-slate-400 hover:text-primary" title="Edit">
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(t._id)} className="p-1.5 text-slate-400 hover:text-danger" title="Remove">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!isLoading && terminals.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center text-slate-400">
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
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-bold">{editingId ? 'Edit Terminal' : 'Add Terminal'}</h3>
                            <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-slate-400 hover:text-slate-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <Input
                                type="text"
                                label="Terminal ID"
                                placeholder="e.g. HDFC-POS-01"
                                value={terminalId}
                                onChange={(e) => setTerminalId(e.target.value)}
                                required
                            />
                            <Input
                                type="text"
                                label="Provider"
                                placeholder="e.g. HDFC Bank, Pine Labs"
                                value={provider}
                                onChange={(e) => setProvider(e.target.value)}
                            />
                            <Select
                                label="Store / Warehouse"
                                placeholder="Unassigned"
                                options={(warehouseEntries || []).map((w: any) => ({
                                    value: w._id,
                                    label: w.name
                                }))}
                                value={storeId}
                                onChange={(val) => setStoreId(typeof val === 'string' ? val : val[0])}
                            />
                            <Textarea
                                label="Notes"
                                placeholder="Additional notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={2}
                            />
                            <Checkbox
                                label="Active"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                            />
                        </div>
                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
                            <Button
                                variant="secondary"
                                size="md"
                                onClick={() => { setIsModalOpen(false); resetForm(); }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                size="md"
                                onClick={handleSubmit}
                                disabled={isSaving}
                            >
                                {isSaving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Terminal'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default CardTerminals;
