import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, RotateCcw, Trash2, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { OfflineSale } from '../../services/db';
import { SyncManager } from '../../services/SyncManager';
import { FAILED_SALES_EVENT, dismissFailedSale, listFailedSales, requeueFailedSale } from '../../services/failedSales';

const time = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString([], { day: '2-digit', month: 'short' })} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase()}`;
};

/**
 * "Failed bills": bills this device printed but the server rejected (e.g. insufficient stock, unknown
 * item). They are no longer retried automatically; each can be retried after fixing the cause, or
 * dismissed. Shows nothing while there are none.
 */
export const POSFailedBills: React.FC = () => {
    const [bills, setBills] = useState<OfflineSale[]>([]);
    const [open, setOpen] = useState(false);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [confirmId, setConfirmId] = useState<number | null>(null);

    const load = useCallback(() => {
        listFailedSales().then(setBills).catch(() => setBills([]));
    }, []);

    useEffect(() => {
        load();
        window.addEventListener(FAILED_SALES_EVENT, load);
        const timer = setInterval(load, 30000);
        return () => { window.removeEventListener(FAILED_SALES_EVENT, load); clearInterval(timer); };
    }, [load]);

    useEffect(() => { if (open && bills.length === 0) setOpen(false); }, [open, bills.length]);

    const retry = async (bill: OfflineSale) => {
        if (bill.localId == null) return;
        setBusyId(bill.localId);
        try {
            await requeueFailedSale(bill.localId);
            await SyncManager.syncOfflineSales();
            const still = (await listFailedSales()).find(b => b.localId === bill.localId);
            if (still) toast.error(`Bill #${bill.id} was rejected again: ${still.error}`);
            else toast.success(`Bill #${bill.id} sent to the server.`);
        } finally {
            setBusyId(null);
            load();
        }
    };

    const dismiss = async (bill: OfflineSale) => {
        if (bill.localId == null) return;
        await dismissFailedSale(bill.localId);
        setConfirmId(null);
        toast.info(`Bill #${bill.id} removed from this device. It was never saved on the server.`);
    };

    if (bills.length === 0) return null;

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="mt-1 w-full flex items-center gap-2 bg-danger/10 border border-danger/30 text-danger rounded-sm px-2 py-1.5 text-[11px] font-bold hover:bg-danger/15 transition-colors"
                title="Bills that printed but the server rejected"
            >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{bills.length} failed bill{bills.length === 1 ? '' : 's'} — not saved</span>
            </button>

            {open && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
                    <div
                        role="dialog"
                        aria-label="Failed bills"
                        className="bg-card border border-default rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-default">
                            <div>
                                <h2 className="text-sm font-bold text-main">Failed bills</h2>
                                <p className="text-[11px] text-slate-500">Printed on this device but rejected by the server, so they are not in the sales records. Fix the reason, then Retry — or Dismiss.</p>
                            </div>
                            <button type="button" onClick={() => setOpen(false)} className="p-1 text-slate-400 hover:text-main" aria-label="Close">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <ul className="overflow-y-auto divide-y divide-default">
                            {bills.map(b => (
                                <li key={b.localId} className="px-4 py-3 flex items-start gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
                                            <span className="font-bold text-main">#{b.id}</span>
                                            <span className="font-bold text-primary">₹{Number(b.total || 0).toFixed(2)}</span>
                                            <span className="text-[11px] text-slate-500">
                                                {time(b.date)} · {b.items?.length ?? 0} item{b.items?.length === 1 ? '' : 's'}{b.counterName ? ` · ${b.counterName}` : ''}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-danger mt-0.5 break-words">{b.error || 'Rejected by the server'}</p>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        <button
                                            type="button"
                                            disabled={busyId !== null}
                                            onClick={() => retry(b)}
                                            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold border border-default text-slate-600 dark:text-slate-300 hover:text-primary hover:border-primary disabled:opacity-40"
                                        >
                                            <RotateCcw className={`w-3 h-3 ${busyId === b.localId ? 'animate-spin' : ''}`} /> Retry
                                        </button>
                                        {confirmId === b.localId ? (
                                            <button
                                                type="button"
                                                onClick={() => dismiss(b)}
                                                className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold bg-danger text-white"
                                            >
                                                <Trash2 className="w-3 h-3" /> Confirm
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                disabled={busyId !== null}
                                                onClick={() => setConfirmId(b.localId ?? null)}
                                                className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold border border-default text-slate-500 hover:text-danger hover:border-danger disabled:opacity-40"
                                            >
                                                <Trash2 className="w-3 h-3" /> Dismiss
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </>
    );
};

export default POSFailedBills;
