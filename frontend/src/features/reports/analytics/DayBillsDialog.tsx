import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import api from '@/services/api';
import { formatCurrency, formatReportDate } from '@/utils/formatters';

interface BillRow {
    id: string;
    invoiceNo: string;
    time: string;
    customerName: string;
    phone: string;
    paymentMethod: string;
    totalAmount: number;
    cancelled: boolean;
}

interface BillItemRow {
    name: string;
    sku: string;
    quantity: number;
    price: number;
    discount: number;
    tax: number;
    total: number;
}

interface BillDetail {
    invoiceNo: string;
    customerName: string;
    phone: string;
    paymentMethod: string;
    subtotal: number;
    tax: number;
    discount: number;
    totalAmount: number;
    items: BillItemRow[];
}

const rupees = (v: number) => formatCurrency(v);
const timeOf = (iso: string): string => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

/** Modal frame shared by both dialogs: Escape and backdrop click close it. */
const Dialog: React.FC<{ title: string; subtitle: React.ReactNode; onClose: () => void; z: string; children: React.ReactNode; header?: React.ReactNode; footer?: React.ReactNode }> = ({ title, subtitle, onClose, z, children, header, footer }) => {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);
    return (
        <div className={`fixed inset-0 ${z} flex items-center justify-center p-4 bg-black/40`} onClick={onClose}>
            <div role="dialog" aria-modal="true" aria-label={title} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-slate-100 dark:border-slate-700">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
                            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
                        </div>
                        <button type="button" onClick={onClose} aria-label="Close" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                            <X className="w-4 h-4 text-slate-400" />
                        </button>
                    </div>
                    {header}
                </div>
                <div className="overflow-y-auto flex-1">{children}</div>
                {footer}
            </div>
        </div>
    );
};

const Message: React.FC<{ tone?: 'muted' | 'error'; children: React.ReactNode }> = ({ tone = 'muted', children }) => (
    <div className={`p-10 text-center text-sm font-bold ${tone === 'error' ? 'text-danger' : 'text-slate-400'}`}>{children}</div>
);

const th = 'px-5 py-2.5';

/** Line items of one bill (ERP sales-invoice API). */
const BillDetailDialog: React.FC<{ billId: string; onClose: () => void }> = ({ billId, onClose }) => {
    const [state, setState] = useState<{ detail: BillDetail | null; error: string; done: boolean }>({ detail: null, error: '', done: false });
    useEffect(() => {
        let cancelled = false;
        api.get(`/api/sales-invoice/invoice/${billId}`)
            .then(res => {
                if (cancelled) return;
                const inv = res.data || {};
                setState({
                    done: true, error: '',
                    detail: {
                        invoiceNo: inv.invoiceNo || '',
                        customerName: inv.customer?.name || 'Walk-in Customer',
                        phone: inv.customer?.phone || '',
                        paymentMethod: inv.paymentMethod || 'cash',
                        subtotal: inv.subtotal || 0,
                        tax: inv.tax || 0,
                        discount: inv.discount || 0,
                        totalAmount: inv.totalAmount || 0,
                        items: Array.isArray(inv.items) ? inv.items.map((it: Record<string, unknown>): BillItemRow => ({
                            name: String(it.name || 'Item'),
                            sku: String(it.sku || ''),
                            quantity: Number(it.quantity) || 0,
                            price: Number(it.price) || 0,
                            discount: Number(it.discount) || 0,
                            tax: Number(it.tax) || 0,
                            total: Number(it.total) || 0,
                        })) : [],
                    },
                });
            })
            .catch(() => { if (!cancelled) setState({ detail: null, error: 'Failed to load this bill', done: true }); });
        return () => { cancelled = true; };
    }, [billId]);
    const { detail, error, done } = state;

    return (
        <Dialog
            z="z-[60]"
            title={`Bill ${detail?.invoiceNo ?? ''}`}
            subtitle={detail ? `${detail.customerName}${detail.phone ? ` · ${detail.phone}` : ''}` : 'Loading…'}
            onClose={onClose}
            footer={detail && (
                <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 flex flex-wrap items-center justify-end gap-x-6 gap-y-1 text-xs tabular-nums">
                    <span className="text-slate-500">Subtotal <b className="text-slate-900 dark:text-white">{rupees(detail.subtotal)}</b></span>
                    <span className="text-slate-500">Tax <b className="text-slate-900 dark:text-white">{rupees(detail.tax)}</b></span>
                    <span className="text-slate-500">Discount <b className="text-slate-900 dark:text-white">{rupees(detail.discount)}</b></span>
                    <span className="font-black text-slate-900 dark:text-white">Total {rupees(detail.totalAmount)}</span>
                </div>
            )}
        >
            {!done && <Message>Loading bill…</Message>}
            {error && <Message tone="error">{error}</Message>}
            {detail && detail.items.length === 0 && <Message>No line items found for this bill</Message>}
            {detail && detail.items.length > 0 && (
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase text-[10px] font-bold tracking-wider sticky top-0">
                        <tr>
                            <th className={th}>Item</th><th className={th}>SKU</th><th className={`${th} text-right`}>Qty</th>
                            <th className={`${th} text-right`}>Rate</th><th className={`${th} text-right`}>Discount</th>
                            <th className={`${th} text-right`}>Tax</th><th className={`${th} text-right`}>Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 tabular-nums">
                        {detail.items.map((it, i) => (
                            <tr key={`${it.sku || it.name}-${i}`}>
                                <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{it.name}</td>
                                <td className="px-5 py-3 text-xs text-slate-400">{it.sku}</td>
                                <td className="px-5 py-3 text-right text-slate-500">{it.quantity}</td>
                                <td className="px-5 py-3 text-right text-slate-500">{rupees(it.price)}</td>
                                <td className="px-5 py-3 text-right text-slate-500">{rupees(it.discount)}</td>
                                <td className="px-5 py-3 text-right text-slate-500">{rupees(it.tax)}</td>
                                <td className="px-5 py-3 text-right font-bold text-slate-900 dark:text-white">{rupees(it.total)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </Dialog>
    );
};

/**
 * Every bill on one day (shop database in SQL mode, else the ERP POS invoices; both from the server), with a
 * "Cancelled" quick filter and totals. Clicking a bill opens its line items.
 */
export const DayBillsDialog: React.FC<{ date: string; onClose: () => void }> = ({ date, onClose }) => {
    const [remote, setRemote] = useState<{ bills: BillRow[] | null; error: string; done: boolean }>({ bills: null, error: '', done: false });
    useEffect(() => {
        let cancelled = false;
        api.get('/api/reports/shop-sales/day-bills', { params: { date } })
            .then(res => {
                if (cancelled) return;
                const rows: Record<string, any>[] = Array.isArray(res.data?.rows) ? res.data.rows : [];
                setRemote({
                    done: true, error: '',
                    bills: rows.map(r => ({
                        id: r._id,
                        invoiceNo: r.invoiceNo,
                        time: timeOf(r.createdAt),
                        customerName: r.customer?.name || 'Walk-in Customer',
                        phone: r.customer?.phone || '',
                        paymentMethod: r.paymentMethod || 'cash',
                        totalAmount: r.totalAmount || 0,
                        cancelled: !!r.cancelled,
                    })),
                });
            })
            .catch(err => {
                if (!cancelled) setRemote({ bills: null, error: err?.response?.data?.message || 'Failed to load bills for this day', done: true });
            });
        return () => { cancelled = true; };
    }, [date]);

    const bills = remote.bills;
    const loading = !remote.done;
    const error = remote.error;
    const [onlyCancelled, setOnlyCancelled] = useState(false);
    const [billId, setBillId] = useState<string | null>(null);

    const cancelledCount = bills?.filter(b => b.cancelled).length ?? 0;
    const visible = bills && onlyCancelled ? bills.filter(b => b.cancelled) : bills;
    const totals = bills && {
        total: bills.reduce((a, b) => a + b.totalAmount, 0),
        cancelled: bills.filter(b => b.cancelled).reduce((a, b) => a + b.totalAmount, 0),
    };
    const chip = (active: boolean, danger = false) => `px-3 py-1.5 rounded-lg text-xs font-bold ${active
        ? danger ? 'bg-danger text-white' : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
        : danger ? 'bg-danger-soft dark:bg-danger-soft text-danger dark:text-danger' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`;

    return (
        <>
            <Dialog
                z="z-50"
                title={`Bills on ${formatReportDate(date)}`}
                subtitle={bills ? `${bills.length} bill${bills.length === 1 ? '' : 's'}` : 'Loading…'}
                onClose={onClose}
                header={bills && bills.length > 0 && totals && (
                    <>
                        <div className="flex gap-2 mt-3">
                            <button type="button" onClick={() => setOnlyCancelled(false)} className={chip(!onlyCancelled)}>All ({bills.length})</button>
                            {cancelledCount > 0 && (
                                <button type="button" onClick={() => setOnlyCancelled(true)} className={chip(onlyCancelled, true)}>Cancelled ({cancelledCount})</button>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 text-xs tabular-nums">
                            <span className="text-slate-500">Total bill amount <b className="text-slate-900 dark:text-white">{rupees(totals.total)}</b></span>
                            <span className="text-slate-500">Cancelled <b className="text-danger dark:text-danger">{rupees(totals.cancelled)}</b></span>
                            <span className="text-slate-500">Final <b className="text-success dark:text-success">{rupees(totals.total - totals.cancelled)}</b></span>
                        </div>
                    </>
                )}
            >
                {loading && <Message>Loading bills…</Message>}
                {error && <Message tone="error">{error}</Message>}
                {!loading && !error && bills?.length === 0 && <Message>No bills found for this day</Message>}
                {!loading && !error && bills && bills.length > 0 && visible?.length === 0 && <Message>No cancelled bills on this day</Message>}
                {!loading && !error && visible && visible.length > 0 && (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase text-[10px] font-bold tracking-wider sticky top-0">
                            <tr><th className={th}>Bill no</th><th className={th}>Time</th><th className={th}>Customer</th><th className={th}>Payment</th><th className={`${th} text-right`}>Amount</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {visible.map(b => (
                                <tr key={b.id} onClick={() => setBillId(b.id)} className={`cursor-pointer ${b.cancelled ? 'bg-danger/70 dark:bg-danger-soft hover:bg-danger-soft' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'}`}>
                                    <td className={`px-5 py-3 font-bold underline decoration-dotted underline-offset-4 ${b.cancelled ? 'text-danger dark:text-danger' : 'text-primary'}`}>
                                        {b.invoiceNo}
                                        {b.cancelled && <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-danger-soft text-danger dark:bg-danger-soft dark:text-danger no-underline">Cancelled</span>}
                                    </td>
                                    <td className="px-5 py-3 text-slate-500">{b.time}</td>
                                    <td className="px-5 py-3">
                                        <div className={b.cancelled ? 'text-danger dark:text-danger font-medium' : 'text-slate-900 dark:text-white font-medium'}>{b.customerName}</div>
                                        {b.phone && <div className="text-xs text-slate-400">{b.phone}</div>}
                                    </td>
                                    <td className="px-5 py-3 capitalize text-slate-500">{b.paymentMethod}</td>
                                    <td className={`px-5 py-3 text-right font-bold tabular-nums ${b.cancelled ? 'text-danger dark:text-danger line-through decoration-2' : 'text-slate-900 dark:text-white'}`}>{rupees(b.totalAmount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </Dialog>
            {billId && <BillDetailDialog billId={billId} onClose={() => setBillId(null)} />}
        </>
    );
};
