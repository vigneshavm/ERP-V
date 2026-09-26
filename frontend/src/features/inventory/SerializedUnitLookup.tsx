import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import { getAllItems } from '../../redux/slices/inventorySlice';
import {
    getUnitsByItem,
    addSerializedUnits,
    lookupSerializedUnit,
    updateUnitStatus,
    deleteSerializedUnit,
    clearLookup,
    reset,
    SerializedUnitStatus,
} from '../../redux/slices/serializedUnitSlice';
import Layout from "../../components/shared/Layout/index";
import {
    Fingerprint,
    Search,
    Plus,
    Trash2,
    X,
    ShieldCheck,
    PackageCheck,
    PackageX,
    RotateCcw,
} from 'lucide-react';

const STATUS_STYLES: Record<SerializedUnitStatus, string> = {
    IN_STOCK: 'bg-success/10 text-success',
    SOLD: 'bg-primary/10 text-primary',
    RETURNED: 'bg-warning-soft text-warning',
    DAMAGED: 'bg-error/10 text-error',
};

interface DraftUnit {
    serialNumber: string;
    imei1: string;
    imei2: string;
}

const emptyUnit = (): DraftUnit => ({ serialNumber: '', imei1: '', imei2: '' });

const SerializedUnitLookup: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { items } = useSelector((state: RootState) => state.inventory);
    const { unitsByItem, lookupResult, isLoading, isError, message } = useSelector((state: RootState) => state.serializedUnit);

    const [selectedItemId, setSelectedItemId] = useState('');
    const [lookupValue, setLookupValue] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [draftUnits, setDraftUnits] = useState<DraftUnit[]>([emptyUnit()]);

    useEffect(() => {
        dispatch(getAllItems({ limit: 500 }));
    }, [dispatch]);

    useEffect(() => {
        if (selectedItemId) {
            dispatch(getUnitsByItem({ itemId: selectedItemId }));
        }
    }, [selectedItemId, dispatch]);

    useEffect(() => {
        if (isError && message) {
            // See ComboOfferManager: no toast wired for this feature yet, and silently dropping
            // the error would hide validation failures (e.g. "item is not marked as serialized")
            // from whoever is entering IMEIs.
            console.error('Serialized unit error:', message);
            dispatch(reset());
        }
    }, [isError, message, dispatch]);

    const selectedItem = useMemo(() => items.find(i => (i._id || i.id) === selectedItemId), [items, selectedItemId]);

    const handleLookup = (e: React.FormEvent) => {
        e.preventDefault();
        if (lookupValue.trim()) {
            dispatch(lookupSerializedUnit(lookupValue.trim()));
        }
    };

    const updateDraftLine = (index: number, patch: Partial<DraftUnit>) => {
        setDraftUnits(prev => prev.map((u, i) => (i === index ? { ...u, ...patch } : u)));
    };
    const addDraftLine = () => setDraftUnits(prev => [...prev, emptyUnit()]);
    const removeDraftLine = (index: number) => setDraftUnits(prev => prev.filter((_, i) => i !== index));

    const handleAddUnits = async (e: React.FormEvent) => {
        e.preventDefault();
        const valid = draftUnits.filter(u => u.serialNumber.trim());
        if (!selectedItemId || valid.length === 0) return;

        await dispatch(addSerializedUnits({
            itemId: selectedItemId,
            units: valid.map(u => ({
                serialNumber: u.serialNumber.trim(),
                imei1: u.imei1.trim() || undefined,
                imei2: u.imei2.trim() || undefined,
            })),
        }));
        setDraftUnits([emptyUnit()]);
        setIsAddOpen(false);
    };

    const handleStatusChange = (unitId: string, status: SerializedUnitStatus) => {
        dispatch(updateUnitStatus({ id: unitId, status }));
    };

    const handleDelete = (unitId: string) => {
        if (window.confirm('Remove this unit? Only do this for a data-entry mistake, not a sale.')) {
            dispatch(deleteSerializedUnit(unitId));
        }
    };

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in text-slate-900 dark:text-slate-100 pb-12">
                <div>
                    <h2 className="page-title flex items-center gap-2">
                        <Fingerprint className="w-6 h-6 text-primary" />
                        Serial / IMEI Tracking
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">Per-unit tracking for serialized stock like phones -- one row per physical device, not per SKU.</p>
                </div>

                {/* Quick lookup */}
                <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <form onSubmit={handleLookup} className="flex gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Scan or type a serial number / IMEI..."
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-none rounded-sm text-sm focus:ring-2 focus:ring-primary/20"
                                value={lookupValue}
                                onChange={e => { setLookupValue(e.target.value); if (!e.target.value) dispatch(clearLookup()); }}
                            />
                        </div>
                        <button type="submit" className="px-6 py-3 bg-primary text-white rounded-sm font-black text-sm hover:bg-primary/90 transition-all">
                            Find
                        </button>
                    </form>
                    {lookupResult && (
                        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-sm flex items-center justify-between">
                            <div>
                                <p className="font-black text-sm">{typeof lookupResult.itemId === 'object' ? lookupResult.itemId.name : 'Item'}</p>
                                <p className="text-xs text-slate-500 font-mono mt-0.5">S/N {lookupResult.serialNumber}{lookupResult.imei1 ? ` · IMEI ${lookupResult.imei1}` : ''}</p>
                            </div>
                            <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg uppercase tracking-widest ${STATUS_STYLES[lookupResult.status]}`}>
                                {lookupResult.status.replace('_', ' ')}
                            </span>
                        </div>
                    )}
                    {isLoading && !lookupResult && lookupValue && (
                        <p className="mt-4 text-xs text-slate-400">Searching...</p>
                    )}
                </div>

                {/* Per-item unit management */}
                <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <select
                            className="w-full md:w-96 px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-none rounded-sm text-sm font-bold focus:ring-2 focus:ring-primary/20"
                            value={selectedItemId}
                            onChange={e => setSelectedItemId(e.target.value)}
                        >
                            <option value="">Select an item to manage its units...</option>
                            {items.map(item => (
                                <option key={item._id || item.id} value={item._id || item.id}>
                                    {item.name}{item.isSerialized ? '' : ' (not yet marked serialized)'}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={() => setIsAddOpen(true)}
                            disabled={!selectedItemId}
                            className="px-6 py-3 bg-primary text-white rounded-sm font-black text-sm shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Add Units</span>
                        </button>
                    </div>

                    {selectedItem && !selectedItem.isSerialized && (
                        <div className="mx-6 mt-4 p-4 bg-warning-soft dark:bg-warning-soft text-warning dark:text-warning rounded-sm text-xs font-bold flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                            "{selectedItem.name}" isn't marked as serialized yet -- enable serial tracking on the item before adding units.
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                                <tr>
                                    <th className="p-6">Serial Number</th>
                                    <th className="p-6">IMEI 1 / IMEI 2</th>
                                    <th className="p-6">Status</th>
                                    <th className="p-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {!selectedItemId && (
                                    <tr><td colSpan={4} className="p-8 text-center text-sm text-slate-400">Select an item above to see its units.</td></tr>
                                )}
                                {selectedItemId && unitsByItem.length === 0 && (
                                    <tr><td colSpan={4} className="p-8 text-center text-sm text-slate-400">No units on file for this item yet.</td></tr>
                                )}
                                {unitsByItem.map(unit => (
                                    <tr key={unit._id} className="group hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                                        <td className="p-6"><p className="font-mono text-sm font-bold">{unit.serialNumber}</p></td>
                                        <td className="p-6">
                                            <p className="font-mono text-xs text-slate-500">{unit.imei1 || '—'}</p>
                                            <p className="font-mono text-xs text-slate-400">{unit.imei2 || ''}</p>
                                        </td>
                                        <td className="p-6">
                                            <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg uppercase tracking-widest ${STATUS_STYLES[unit.status]}`}>
                                                {unit.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {unit.status !== 'IN_STOCK' && (
                                                    <button onClick={() => handleStatusChange(unit._id, 'IN_STOCK')} title="Mark back in stock" className="p-2 text-slate-400 hover:text-success hover:bg-success/5 rounded-lg transition-all">
                                                        <PackageCheck className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {unit.status === 'IN_STOCK' && (
                                                    <button onClick={() => handleStatusChange(unit._id, 'DAMAGED')} title="Mark damaged" className="p-2 text-slate-400 hover:text-error hover:bg-error/5 rounded-lg transition-all">
                                                        <PackageX className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {unit.status === 'SOLD' && (
                                                    <button onClick={() => handleStatusChange(unit._id, 'RETURNED')} title="Mark returned" className="p-2 text-slate-400 hover:text-warning hover:bg-warning-soft rounded-lg transition-all">
                                                        <RotateCcw className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button onClick={() => handleDelete(unit._id)} title="Delete" className="p-2 text-slate-400 hover:text-error hover:bg-error/5 rounded-lg transition-all">
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

                {isAddOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
                            <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-black tracking-tight">Add Units</h3>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">{selectedItem?.name}</p>
                                </div>
                                <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <form onSubmit={handleAddUnits} className="p-8 space-y-4 overflow-y-auto">
                                {draftUnits.map((unit, index) => (
                                    <div key={index} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-sm space-y-2 relative">
                                        <button
                                            type="button"
                                            onClick={() => removeDraftLine(index)}
                                            disabled={draftUnits.length === 1}
                                            className="absolute top-3 right-3 text-slate-400 hover:text-error disabled:opacity-30"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        <input
                                            required
                                            placeholder="Serial number"
                                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm text-sm font-mono"
                                            value={unit.serialNumber}
                                            onChange={e => updateDraftLine(index, { serialNumber: e.target.value })}
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                placeholder="IMEI 1 (optional)"
                                                className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm text-sm font-mono"
                                                value={unit.imei1}
                                                onChange={e => updateDraftLine(index, { imei1: e.target.value })}
                                            />
                                            <input
                                                placeholder="IMEI 2 (optional)"
                                                className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm text-sm font-mono"
                                                value={unit.imei2}
                                                onChange={e => updateDraftLine(index, { imei2: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                ))}
                                <button type="button" onClick={addDraftLine} className="text-xs font-black text-primary flex items-center gap-1 hover:underline">
                                    <Plus className="w-3.5 h-3.5" /> Add another unit
                                </button>
                                <div className="pt-2 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddOpen(false)}
                                        className="flex-1 px-6 py-4 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-sm font-black text-sm hover:bg-slate-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-6 py-4 bg-primary text-white rounded-sm font-black text-sm shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
                                    >
                                        Save Units
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

export default SerializedUnitLookup;
