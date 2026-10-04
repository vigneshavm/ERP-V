import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Printer, Search, Loader2, XCircle, X, Pencil, Plus, Minus, Trash2, RotateCcw } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import receiptDataService, { TodaysBillMatch } from '../../services/receiptDataService';
import api from '../../services/api';
import type { RootState } from '../../redux/store';
import { Sale, CartItem } from '../../types/sales';
import { posBillEdit, POS_BILL_EDIT_SAVE_EVENT } from './posBillEditStore';

interface POSBillReprintProps {
    // From usePOSLogic: prints on this counter's receipt layout; false if shop/branch not loaded.
    printSale: (sale: Sale) => boolean;
    /** The POS cart: while a bill is being edited it holds the items to add to that bill. */
    cart: CartItem[];
    /** Adds a stock item to the cart by barcode (same path as scanning). */
    onBarcodeLookup: (barcode: string) => void | Promise<void>;
    onClearCart: () => void;
    /** Cart line controls, used by the New rows of the one-grid edit view. */
    onUpdateCartQty: (id: string, qty: number) => void;
    onRemoveFromCart: (id: string) => void;
    /** Same product-type list and product codes the new-bill entry row uses. */
    allProductTypes?: string[];
    quickProducts?: { code?: string; name: string; price?: number }[];
}

type Msg = { kind: 'error' | 'ok'; text: string } | null;

const CANCEL_ROLES = ['owner', 'co-owner', 'manager'];

const formatTime = (value: string) =>
    new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase();

const money = (n: unknown) => `₹${(Number(n) || 0).toFixed(2)}`;

/**
 * "Today's bill no." lookup under the Last Bill card: type a bill number (e.g. 96 or A96) and press Enter.
 * The saved bill opens with every line (item, qty, price, discount, tax, amount), the totals and the payment,
 * and from there it can be reprinted or (owner / co-owner / manager) cancelled. Several matches are listed to pick from.
 */
export const POSBillReprint: React.FC<POSBillReprintProps> = ({ printSale, cart, onBarcodeLookup, onClearCart, onUpdateCartQty, onRemoveFromCart, allProductTypes = [], quickProducts = [] }) => {
    const [query, setQuery] = useState('');
    const [busy, setBusy] = useState(false);
    const [matches, setMatches] = useState<TodaysBillMatch[]>([]);
    const [bill, setBill] = useState<any | null>(null);
    const [msg, setMsg] = useState<Msg>(null);
    const role = useSelector((state: RootState) => state.auth?.user?.role);
    const canCancel = !!role && CANCEL_ROLES.includes(role);

    // --- Edit mode: the POS works on this bill. Remove lines here; items added in the POS (scan, search, grid) go
    //     to the cart and are added to the bill. Finalize (or Save here) checks the total and saves it. ---
    type Pay = { cash: string; card: string; upi: string; credit: string };
    const [editing, setEditing] = useState(false);
    const [removed, setRemoved] = useState<number[]>([]);
    const [addCode, setAddCode] = useState('');   // Barcode / SKU field
    const [codeText, setCodeText] = useState('');   // Product code field (entry row)
    const [nameText, setNameText] = useState('');   // Product / Type field (entry row)
    const [activeField, setActiveField] = useState<'barcode' | 'code' | 'name'>('barcode');
    const searchText = (activeField === 'barcode' ? addCode : activeField === 'code' ? codeText : nameText);
    const [addQty, setAddQty] = useState('1');
    const [addPrice, setAddPrice] = useState('');  // typed name / code: the price is used to find the matching stock item
    const [selectedType, setSelectedType] = useState('');
    const [typeIdx, setTypeIdx] = useState(-1);
    const [stockMatch, setStockMatch] = useState<{ items: any[]; error?: boolean } | null>(null);
    const [matchBusy, setMatchBusy] = useState(false);
    const priceRef = useRef<HTMLInputElement>(null);
    const barcodeRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<any | null>(null);
    const [pay, setPay] = useState<Pay>({ cash: '', card: '', upi: '', credit: '' });
    const [editErr, setEditErr] = useState('');

    // Cart lines -> items to add to the bill (by barcode). Quick-entry lines have no barcode: refused.
    const cartAdds = useMemo(() => {
        const m = new Map<string, number>();
        let bad = '';
        for (const it of cart || []) {
            const b = String((it as any).barcode || '').trim();
            const q = Number(it.qty) || 0;
            if ((it as any).isQuickEntry || !b) { bad = `"${it.name}" has no barcode. Pick the stock item instead (scan it, or use the quick-entry stock match).`; continue; }
            if (q <= 0) { bad = 'Returned items can\'t be part of a bill edit.'; continue; }
            if (!Number.isInteger(q)) { bad = `Quantity of "${it.name}" must be a whole number.`; continue; }
            m.set(b, (m.get(b) || 0) + q);
        }
        return { adds: [...m].map(([barcode, qty]) => ({ barcode, qty })), bad };
    }, [cart]);

    const clearEditState = () => { setEditing(false); setRemoved([]); setPreview(null); setEditErr(''); setAddCode(''); setCodeText(''); setNameText(''); setAddQty('1'); setAddPrice(''); setSelectedType(''); setTypeIdx(-1); setStockMatch(null); setSuggest([]); };

    const reset = () => {
        setBill(null); setMatches([]); setQuery('');
        if (editing) onClearCart();
        clearEditState();
    };

    const startEdit = () => {
        if ((cart || []).length > 0) {
            setMsg({ kind: 'error', text: 'Clear or hold the current cart first, then edit the bill — items in the cart would be added to it.' });
            return;
        }
        setMsg(null);
        setEditing(true);
    };

    const discardEdit = () => { onClearCart(); clearEditState(); };

    // Asks the server for the new total of the pending changes (nothing is saved).
    const runPreview = async (rem: number[], adds: { barcode: string; qty: number }[]) => {
        setEditErr('');
        if (!bill || (!rem.length && !adds.length)) { setPreview(null); return; }
        setBusy(true);
        try {
            const res = await api.post(`/api/sales-invoice/invoice/${encodeURIComponent(String(bill._id))}/edit`, {
                removeLineNos: rem, add: adds, dryRun: true,
            });
            const d = res.data?.data;
            setPreview(d);
            // Keep card / UPI / credit as they were; cash takes the rest (the cashier can change it).
            const keep = { card: d.payment.card, upi: d.payment.upi, credit: d.payment.credit };
            const cash = Math.round((d.total - keep.card - keep.upi - keep.credit) * 100) / 100;
            setPay({ cash: String(cash), card: String(keep.card), upi: String(keep.upi), credit: String(keep.credit) });
        } catch (e: any) {
            setPreview(null);
            setEditErr(e?.response?.data?.message || 'Could not calculate the new total.');
        } finally {
            setBusy(false);
        }
    };

    // Re-check the total whenever the removed lines or the cart change.
    useEffect(() => {
        if (!editing || !bill) return;
        if (cartAdds.bad) { setPreview(null); setEditErr(cartAdds.bad); return; }
        if (!removed.length && !cartAdds.adds.length) { setPreview(null); setEditErr(''); return; }
        const t = setTimeout(() => { void runPreview(removed, cartAdds.adds); }, 400);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editing, bill, removed, cartAdds]);

    const toggleRemove = (no: number) =>
        setRemoved(prev => prev.includes(no) ? prev.filter(n => n !== no) : [...prev, no]);

    // Stock items matching what was typed or scanned: barcode, code / SN or product name (server search).
    const [suggest, setSuggest] = useState<any[]>([]);
    const [suggestBusy, setSuggestBusy] = useState(false);

    const searchStock = async (text: string): Promise<any[]> => {
        const res = await api.get('/api/inventory', { params: { search: text, limit: 12 } });
        const list: any[] = Array.isArray(res?.data?.items) ? res.data.items : [];
        return list.filter(it => String(it.barcode || '').trim());
    };

    useEffect(() => {
        const text = searchText.trim();
        if (!editing || activeField !== 'barcode' || text.length < 2) { setSuggest([]); return; }
        let cancelled = false;
        const t = setTimeout(async () => {
            setSuggestBusy(true);
            try {
                const found = await searchStock(text);
                if (!cancelled) setSuggest(found);
            } catch {
                if (!cancelled) setSuggest([]);
            } finally {
                if (!cancelled) setSuggestBusy(false);
            }
        }, 300);
        return () => { cancelled = true; clearTimeout(t); };
    }, [searchText, editing, activeField]);

    // Puts the item in the POS cart (same path as scanning); the cart is what gets added to the bill.
    const stageBarcode = async (barcode: string) => {
        const qty = parseInt(addQty, 10);
        if (!(qty > 0)) { setEditErr('Enter a quantity.'); return; }
        setAddCode(''); setCodeText(''); setNameText(''); setAddQty('1'); setAddPrice(''); setSelectedType(''); setStockMatch(null); setSuggest([]);
        for (let i = 0; i < Math.min(qty, 50); i++) await onBarcodeLookup(barcode);
        setTimeout(() => barcodeRef.current?.focus(), 50); // ready for the next scan
    };

    // --- Same flow as a new bill: product / type list -> price -> stock items to pick (price matches first). ---
    const typeSuggestions = useMemo(() => {
        const q = nameText.trim().toLowerCase();
        if (!q || selectedType) return [] as string[];
        return allProductTypes
            .map((t) => { const l = t.toLowerCase(); const score = l === q ? 100 : l.startsWith(q) ? 80 - (l.length - q.length) : l.split(' ').some((w) => w.startsWith(q)) ? 60 : l.includes(q) ? 40 - l.indexOf(q) : 0; return { t, score }; })
            .filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 10).map((x) => x.t);
    }, [allProductTypes, nameText, selectedType]);

    const selectType = (t: string) => {
        setSelectedType(t); setNameText(t); setTypeIdx(-1); setStockMatch(null); setEditErr('');
        setTimeout(() => priceRef.current?.focus(), 50);
    };

    const lookupCode = () => {
        const c = codeText.trim().toLowerCase();
        if (!c) return;
        const hit = quickProducts.find((p) => p.code && p.code.toLowerCase() === c);
        if (!hit) { setEditErr(`No product with code "${codeText.trim()}".`); return; }
        selectType(hit.name);
        if (hit.price) setAddPrice(String(hit.price));
    };

    const typedAdd = async () => {
        if (matchBusy) return;
        let type = selectedType;
        if (!type) {
            const exact = allProductTypes.find((t) => t.toLowerCase() === nameText.trim().toLowerCase());
            if (!exact) { setEditErr('Pick the product / type from the list first.'); return; }
            type = exact; setSelectedType(exact);
        }
        const price = parseFloat(addPrice);
        if (!(price > 0)) { setEditErr('Enter the price to see the matching stock items.'); priceRef.current?.focus(); return; }
        setEditErr(''); setMatchBusy(true);
        try {
            const list: any[] = (await searchStockType(type)).filter((it) => String(it.barcode || '').trim());
            const priceOf = (it: any) => Number(it.sellingPrice ?? it.price ?? 0) || 0;
            if (!list.length) { setStockMatch(null); setEditErr(`No stock item with a barcode for "${type}". A bill edit can only add stock items.`); return; }
            // Only stock items at exactly this price are offered.
            const exact = list.filter((it) => Math.abs(priceOf(it) - price) < 0.01);
            if (!exact.length) { setStockMatch(null); setEditErr(`No stock item of "${type}" at ₹${price}. Check the price.`); return; }
            // Exactly one in-stock match: add it straight away. Several: wait for the cashier to pick.
            if (exact.length === 1 && (Number(exact[0].stockQty ?? 0) || 0) > 0) {
                setMatchBusy(false);
                await stageBarcode(String(exact[0].barcode));
                return;
            }
            setStockMatch({ items: exact.slice(0, 30) });
        } catch {
            setStockMatch({ items: [], error: true });
        } finally {
            setMatchBusy(false);
        }
    };

    const searchStockType = async (text: string): Promise<any[]> => {
        const res = await api.get('/api/inventory', { params: { search: text, limit: 100 } });
        return Array.isArray(res?.data?.items) ? res.data.items : [];
    };

    const enterPressed = () => { if (activeField === 'barcode') void submitAdd(); else void typedAdd(); };

    // Enter (a scanner sends Enter after the barcode): exact barcode / code match, else the only match; with
    // several matches the cashier picks one from the list.
    const submitAdd = async () => {
        const text = searchText.trim();
        if (!text) { setEditErr('Scan a barcode or type a code or product name.'); return; }
        setEditErr('');
        setSuggestBusy(true);
        try {
            const found = await searchStock(text);
            setSuggest(found);
            const low = text.toLowerCase();
            const exact = found.find(it => [it.barcode, it.sku].some(v => String(v ?? '').trim().toLowerCase() === low));
            if (exact) stageBarcode(String(exact.barcode));
            else if (found.length === 1) stageBarcode(String(found[0].barcode));
            else if (found.length === 0) setEditErr(`Nothing in stock matches "${text}".`);
            else setEditErr('Several items match — click the one to add.');
        } catch {
            setEditErr("Couldn't search stock. Check the connection.");
        } finally {
            setSuggestBusy(false);
        }
    };

    const payTotal = ['cash', 'card', 'upi', 'credit'].reduce((sum, k) => sum + (parseFloat((pay as any)[k]) || 0), 0);
    const payOk = !!preview && Math.abs(payTotal - preview.total) < 0.01 && (parseFloat(pay.cash) || 0) >= 0;

    const saveEdit = async () => {
        if (!bill || !preview || !payOk || busy || cartAdds.bad) return;
        if (!window.confirm(`Save changes to bill ${bill.invoiceNo}? New total ${money(preview.total)} (was ${money(preview.previousTotal)}).`)) return;
        setBusy(true);
        setEditErr('');
        try {
            const res = await api.post(`/api/sales-invoice/invoice/${encodeURIComponent(String(bill._id))}/edit`, {
                removeLineNos: removed, add: cartAdds.adds, expectedTotal: preview.total,
                payment: { cash: parseFloat(pay.cash) || 0, card: parseFloat(pay.card) || 0, upi: parseFloat(pay.upi) || 0, credit: parseFloat(pay.credit) || 0 },
            });
            const keepId = String(bill._id);
            onClearCart();
            clearEditState();
            setMsg({ kind: 'ok', text: res.data?.message || 'Bill updated.' });
            const fresh = await api.get(`/api/sales-invoice/invoice/${encodeURIComponent(keepId)}`);
            const doc = fresh.data?.data ?? fresh.data;
            setBill({ ...doc, _id: doc?._id || keepId });
        } catch (e: any) {
            setEditErr(e?.response?.data?.message || 'Could not save the changes. Nothing was changed.');
        } finally {
            setBusy(false);
        }
    };

    const openBill = async (match: TodaysBillMatch) => {
        setBusy(true);
        setMsg(null);
        try {
            const res = await api.get(`/api/sales-invoice/invoice/${encodeURIComponent(match._id)}`);
            const doc = res.data?.data ?? res.data;
            setBill({ ...doc, _id: doc?._id || match._id, invoiceNo: doc?.invoiceNo || match.invoiceNo });
            setMatches([]);
        } catch (e: any) {
            setMsg({ kind: 'error', text: e?.response?.data?.message || `Couldn't load ${match.invoiceNo}.` });
        } finally {
            setBusy(false);
        }
    };

    const find = async () => {
        const q = query.trim();
        if (!q || busy) return;
        setBusy(true);
        setMsg(null);
        setMatches([]);
        setBill(null);
        try {
            const found = await receiptDataService.findTodaysBills(q);
            if (found.length === 0) {
                setMsg({ kind: 'error', text: `No bill #${q.replace(/^#/, '')} today.` });
            } else if (found.length === 1) {
                setBusy(false);
                await openBill(found[0]);
                return;
            } else {
                setMatches(found);
            }
        } catch {
            setMsg({ kind: 'error', text: "Couldn't search bills. Check the connection." });
        } finally {
            setBusy(false);
        }
    };

    const printBill = async () => {
        if (!bill) return;
        setBusy(true);
        setMsg(null);
        try {
            const sale = await receiptDataService.fetchSale(String(bill._id));
            if (printSale(sale)) {
                const no = bill.invoiceNo;
                // Printed: clear the page for the next bill (not while an edit is in progress).
                if (!editing) reset();
                setMsg({ kind: 'ok', text: `Printing ${no}` });
            } else {
                setMsg({ kind: 'error', text: 'Shop details not loaded yet — try again.' });
            }
        } catch {
            setMsg({ kind: 'error', text: `Couldn't load ${bill.invoiceNo}.` });
        } finally {
            setBusy(false);
        }
    };

    // Server rule: live bill, cash not yet collected. Points and payments are not changed.
    const cancelBill = async () => {
        if (!bill || bill.cancelled) return;
        if (!window.confirm(`Cancel bill ${bill.invoiceNo} (${money(bill.totalAmount)})? This cannot be undone here.`)) return;
        setBusy(true);
        setMsg(null);
        try {
            const res = await api.post(`/api/sales-invoice/invoice/${encodeURIComponent(String(bill._id))}/cancel`);
            const text = res.data?.message || `Bill ${bill.invoiceNo} cancelled.`;
            reset();
            setMsg({ kind: 'ok', text });
        } catch (e: any) {
            setMsg({ kind: 'error', text: e?.response?.data?.message || `Could not cancel ${bill.invoiceNo}. Nothing was changed.` });
        } finally {
            setBusy(false);
        }
    };

    // Let the rest of the POS (settlement panel, Finalize button) know a bill is being edited.
    useEffect(() => {
        posBillEdit.set({
            active: editing,
            invoiceNo: editing ? String(bill?.invoiceNo ?? '') : '',
            selectedBill: bill ? String(bill.invoiceNo ?? '') : '',
            hasChanges: editing && (removed.length > 0 || cartAdds.adds.length > 0),
            newTotal: editing && preview ? Number(preview.total) : null,
            previousTotal: editing && preview ? Number(preview.previousTotal) : null,
            canSave: editing && !!preview && payOk && !cartAdds.bad,
            saving: busy,
        });
    }, [editing, bill, removed, cartAdds, preview, payOk, busy]);
    useEffect(() => () => posBillEdit.reset(), []);

    // Finalize Bill (button or Ctrl+Space) saves the edit while a bill is open for editing.
    const saveRef = useRef(saveEdit);
    saveRef.current = saveEdit;
    useEffect(() => {
        const h = () => { void saveRef.current(); };
        window.addEventListener(POS_BILL_EDIT_SAVE_EVENT, h);
        return () => window.removeEventListener(POS_BILL_EDIT_SAVE_EVENT, h);
    }, []);

    const items: any[] = Array.isArray(bill?.items) ? bill.items : [];

    const slot = bill && typeof document !== 'undefined' ? document.getElementById('pos-bill-edit-slot') : null;
    const wide = !!slot;
    // Option B: while editing, the main area is one grid -- saved lines plus the cart's New lines -- with a footer strip.
    const oneGrid = wide && editing;
    const cartQty = (cart || []).reduce((n, c) => n + (Number(c.qty) || 0), 0);
    const liveItems = items.filter((it) => !removed.includes(Number(it.lineNo)));
    const gridItemCount = liveItems.length + (cart || []).length;
    const gridQty = liveItems.reduce((s2, it) => s2 + (Number(it.quantity) || 0), 0) + cartQty;
    const newRowPricing = (c: CartItem) => {
        const a = addedRows.find((r) => String(r.barcode) === String((c as any).barcode || '').trim());
        const q = Number(c.qty) || 0;
        if (!a || !Number(a.qty)) return { price: Number(c.price) || 0, amount: null as number | null, gst: null as number | null };
        return { price: Number(a.unitPrice) || 0, amount: (Number(a.amount) || 0) * (q / Number(a.qty)), gst: Number(a.gstRate) };
    };
    const addedRows: any[] = editing && Array.isArray(preview?.added) ? preview.added : [];
    const delta = editing && preview ? Number(preview.total) - Number(preview.previousTotal) : 0;
    const chip = 'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide';
    const btn = 'inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md border text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
    const billView = bill ? (
        <div className={wide ? 'p-3 text-main text-xs' : 'mt-2 border-t border-default pt-1.5 text-[11px] text-main'}>
            {/* Header: bill identity on the left, actions on the right */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold leading-tight">Bill #{bill.invoiceNo}</h3>
                        {bill.cancelled
                            ? <span className={`${chip} bg-danger/10 text-danger`}>Cancelled</span>
                            : editing
                                ? <span className={`${chip} bg-warning/20 text-warning`}>Editing</span>
                                : <span className={`${chip} bg-success/10 text-success`}>Live</span>}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-slate-500">
                        {bill.createdAt && <span>{new Date(bill.createdAt).toLocaleDateString()} · {formatTime(bill.createdAt)}</span>}
                        {bill.counterName && <span>Counter: <b className="font-semibold text-main">{bill.counterName}</b></span>}
                        <span>Customer: <b className="font-semibold text-main">{bill.customer?.name || 'Walk-in Customer'}</b>{bill.customer?.phone ? ` · ${bill.customer.phone}` : ''}</span>
                        {bill.createdBy?.name && <span>Login: <b className="font-semibold text-main">{bill.createdBy.name}</b></span>}
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                    <button type="button" onClick={printBill} disabled={busy} className={`${btn} border-default hover:text-primary`}>
                        <Printer className="w-3.5 h-3.5" /> Print
                    </button>
                    {canCancel && !bill.cancelled && !editing && (
                        <button type="button" onClick={startEdit} disabled={busy} className={`${btn} border-primary/40 text-primary hover:bg-primary/10`}>
                            <Pencil className="w-3.5 h-3.5" /> Edit bill
                        </button>
                    )}
                    {canCancel && !bill.cancelled && (
                        <button type="button" onClick={cancelBill} disabled={busy} className={`${btn} border-danger/40 text-danger hover:bg-danger/10`}>
                            <XCircle className="w-3.5 h-3.5" /> Cancel bill
                        </button>
                    )}
                    <button type="button" onClick={reset} title="Close" className={`${btn} border-default text-slate-500 hover:text-main px-2`}>
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            <div className={oneGrid ? 'mt-2 space-y-2' : wide ? 'mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_300px]' : 'mt-2 space-y-2'}>
                {/* Left: add box + items */}
                <div className="min-w-0 space-y-2">
                    {editing && !oneGrid && (
                        <div className="rounded-md border border-primary/30 bg-primary/5 p-2.5 space-y-1.5">
                            <form className="relative flex gap-2" onSubmit={(e) => { e.preventDefault(); void submitAdd(); }}>
                                <div className="relative flex-1 min-w-0">
                                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <input
                                        value={addCode}
                                        onChange={(e) => setAddCode(e.target.value)}
                                        onKeyDown={(e) => e.stopPropagation()}
                                        placeholder="Scan barcode, or type code / SN / product name — Enter to add"
                                        autoComplete="off"
                                        className="w-full h-9 pl-7 pr-2 text-xs bg-card border border-default rounded-md focus:outline-none focus:border-primary"
                                    />
                                    {(suggestBusy || suggest.length > 0) && (
                                        <div className="absolute left-0 right-0 top-full mt-1 z-30 max-h-60 overflow-y-auto rounded-md border border-default bg-card shadow-xl">
                                            {suggestBusy && suggest.length === 0 && <p className="px-3 py-2 text-slate-400">Searching stock…</p>}
                                            {suggest.map((it, i) => {
                                                const stock = Number(it.stockQty ?? 0) || 0;
                                                return (
                                                    <button
                                                        key={`${it.barcode}-${i}`}
                                                        type="button"
                                                        onClick={() => stock > 0 && void stageBarcode(String(it.barcode))}
                                                        disabled={stock <= 0}
                                                        title={stock > 0 ? 'Add to this bill' : 'Out of stock'}
                                                        className="w-full text-left px-3 py-1.5 flex items-center justify-between gap-3 border-b border-default last:border-0 hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <span className="min-w-0">
                                                            <span className="block truncate font-medium">{it.name}</span>
                                                            <span className="block truncate text-[11px] text-slate-400">{it.barcode}{it.sku && it.sku !== it.barcode ? ` · ${it.sku}` : ''}{[it.size, it.color].filter(Boolean).length ? ` · ${[it.size, it.color].filter(Boolean).join(' / ')}` : ''}</span>
                                                        </span>
                                                        <span className="text-right shrink-0">
                                                            <span className="block font-semibold">{money(it.sellingPrice ?? it.price)}</span>
                                                            <span className={`block text-[11px] ${stock > 0 ? 'text-slate-400' : 'text-danger font-bold'}`}>{stock > 0 ? `${stock} in stock` : 'Out of stock'}</span>
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                                <input
                                    value={addQty}
                                    onChange={(e) => setAddQty(e.target.value)}
                                    onKeyDown={(e) => e.stopPropagation()}
                                    inputMode="numeric"
                                    aria-label="Quantity"
                                    title="Quantity"
                                    className="w-14 h-9 px-1 text-xs text-center bg-card border border-default rounded-md focus:outline-none focus:border-primary"
                                />
                                <button type="submit" disabled={busy || suggestBusy} className={`${btn} h-9 bg-primary border-primary text-white hover:bg-primary/90`}>
                                    <Plus className="w-3.5 h-3.5" /> Add
                                </button>
                            </form>
                            <p className="text-[11px] text-slate-500">
                                Remove a saved line with <b>Remove</b>. Items you scan or add here or in the barcode row above appear as <b>New</b> rows and are added to this bill.
                                {cartAdds.adds.length > 0 && <> In cart to add: <b>{cartAdds.adds.reduce((n, a) => n + a.qty, 0)}</b>.</>}
                            </p>
                            {editErr && <p className="rounded-md border border-danger/30 bg-danger/10 px-2 py-1 text-danger">{editErr}</p>}
                        </div>
                    )}

                    {oneGrid && editErr && <p className="rounded-md border border-danger/30 bg-danger/10 px-2 py-1 text-danger">{editErr}</p>}
                    <div className={oneGrid ? 'rounded-md border border-default' : 'overflow-hidden rounded-md border border-default'}>
                        <div className={oneGrid ? '' : wide ? 'max-h-[34vh] overflow-y-auto' : 'max-h-48 overflow-y-auto'}>
                            <table className="w-full text-xs">
                                <thead className="sticky top-0 z-10 bg-surface text-[11px] uppercase tracking-wide text-slate-500">
                                    <tr>
                                        <th className="w-10 px-2 py-1.5 text-left font-semibold">#</th>
                                        {oneGrid ? (
                                            <>
                                                <th className="w-44 px-2 py-1.5 text-left font-semibold">Barcode</th>
                                                <th className="w-32 px-2 py-1.5 text-left font-semibold">Product code</th>
                                                <th className="px-2 py-1.5 text-left font-semibold">Product / Type</th>
                                            </>
                                        ) : (
                                            <th className="px-2 py-1.5 text-left font-semibold">Item</th>
                                        )}
                                        <th className={`${oneGrid ? 'w-24' : 'w-14'} px-2 py-1.5 text-right font-semibold`}>Qty</th>
                                        <th className="w-24 px-2 py-1.5 text-right font-semibold">Price</th>
                                        <th className="w-20 px-2 py-1.5 text-right font-semibold">Disc</th>
                                        <th className="w-28 px-2 py-1.5 text-right font-semibold">Amount</th>
                                        {editing && <th className="w-24 px-2 py-1.5" />}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-default">
                                    {oneGrid && (
                                        <tr className="bg-primary/5">
                                            <td className="px-2 py-1.5"><span className={`${chip} bg-primary/15 text-primary`}>Add</span></td>
                                            {(['barcode', 'code', 'name'] as const).map((f) => (
                                                <td key={f} className="px-2 py-1.5 align-top">
                                                    <div className="relative">
                                                        <input
                                                            ref={f === 'barcode' ? barcodeRef : undefined}
                                                            value={f === 'barcode' ? addCode : f === 'code' ? codeText : nameText}
                                                            onChange={(e) => { const v = e.target.value; setActiveField(f); setEditErr(''); setStockMatch(null); if (f === 'barcode') setAddCode(v); else if (f === 'code') setCodeText(v); else { setNameText(v); if (selectedType && v !== selectedType) setSelectedType(''); } }}
                                                            onFocus={() => setActiveField(f)}
                                                            onKeyDown={(e) => {
                                                                e.stopPropagation();
                                                                if (f === 'name' && typeSuggestions.length) {
                                                                    if (e.key === 'ArrowDown') { e.preventDefault(); setTypeIdx((i) => Math.min(i + 1, typeSuggestions.length - 1)); return; }
                                                                    if (e.key === 'ArrowUp') { e.preventDefault(); setTypeIdx((i) => Math.max(i - 1, -1)); return; }
                                                                    if (e.key === 'Enter') { e.preventDefault(); selectType(typeSuggestions[typeIdx >= 0 ? typeIdx : 0]); return; }
                                                                }
                                                                if (e.key === 'Enter') { e.preventDefault(); setActiveField(f); if (f === 'code') lookupCode(); else if (f === 'name') void typedAdd(); else void submitAdd(); }
                                                            }}
                                                            onBlur={f === 'code' ? lookupCode : undefined}
                                                            placeholder={f === 'barcode' ? 'Scan barcode / SKU' : f === 'code' ? 'Code…' : 'Search product / type…'}
                                                            aria-label={f === 'barcode' ? 'Barcode' : f === 'code' ? 'Product code' : 'Product or type'}
                                                            autoComplete="off"
                                                            autoFocus={f === 'barcode'}
                                                            className="w-full h-8 px-2 text-xs bg-card border border-default rounded-md focus:outline-none focus:border-primary"
                                                        />
                                                        {f === 'name' && typeSuggestions.length > 0 && (
                                                            <div className="absolute left-0 top-full mt-1 z-30 min-w-[260px] max-h-60 overflow-y-auto rounded-md border border-default bg-card shadow-xl">
                                                                {typeSuggestions.map((t, i) => (
                                                                    <button key={t} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => selectType(t)} className={`w-full text-left px-3 py-1.5 hover:bg-primary/5 ${i === typeIdx ? 'bg-primary/10 text-primary font-bold' : ''}`}>{t}</button>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {f === 'barcode' && activeField === 'barcode' && (suggestBusy || suggest.length > 0) && (
                                                            <div className="absolute left-0 top-full mt-1 z-30 min-w-[420px] max-h-60 overflow-y-auto rounded-md border border-default bg-card shadow-xl">
                                                                {suggestBusy && suggest.length === 0 && <p className="px-3 py-2 text-slate-400">Searching stock…</p>}
                                                                {suggest.map((it, i) => {
                                                                    const stock = Number(it.stockQty ?? 0) || 0;
                                                                    return (
                                                                        <button
                                                                            key={`${it.barcode}-${i}`}
                                                                            type="button"
                                                                            onClick={() => stock > 0 && void stageBarcode(String(it.barcode))}
                                                                            disabled={stock <= 0}
                                                                            title={stock > 0 ? 'Add to this bill' : 'Out of stock'}
                                                                            className="w-full text-left px-3 py-1.5 flex items-center justify-between gap-3 border-b border-default last:border-0 hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                        >
                                                                            <span className="min-w-0">
                                                                                <span className="block truncate font-medium">{it.name}</span>
                                                                                <span className="block truncate text-[11px] text-slate-400">{it.barcode}{it.sku && it.sku !== it.barcode ? ` · ${it.sku}` : ''}{[it.size, it.color].filter(Boolean).length ? ` · ${[it.size, it.color].filter(Boolean).join(' / ')}` : ''}</span>
                                                                            </span>
                                                                            <span className="text-right shrink-0">
                                                                                <span className="block font-semibold">{money(it.sellingPrice ?? it.price)}</span>
                                                                                <span className={`block text-[11px] ${stock > 0 ? 'text-slate-400' : 'text-danger font-bold'}`}>{stock > 0 ? `${stock} in stock` : 'Out of stock'}</span>
                                                                            </span>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            ))}
                                            <td className="px-2 py-1.5 align-top">
                                                <input value={addQty} onChange={(e) => setAddQty(e.target.value)} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); enterPressed(); } }} inputMode="numeric" aria-label="Quantity" title="Quantity" className="w-full h-8 px-1 text-xs text-right bg-card border border-default rounded-md focus:outline-none focus:border-primary" />
                                            </td>
                                            <td className="px-2 py-1.5 text-right align-top">
                                                {activeField === 'barcode' ? (
                                                    <span className="inline-block pt-2 text-[11px] text-slate-400" title="Price comes from the stock record">auto</span>
                                                ) : (
                                                    <input ref={priceRef} value={addPrice} onChange={(e) => { setAddPrice(e.target.value); setStockMatch(null); }} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); void typedAdd(); } }} inputMode="decimal" placeholder="Price" aria-label="Price" title="Enter the price, then Enter: matching stock items are listed" className="w-full h-8 px-1 text-xs text-right bg-card border border-default rounded-md focus:outline-none focus:border-primary" />
                                                )}
                                            </td>
                                            <td className="px-2 py-1.5 text-right text-[11px] text-slate-400 align-middle">auto</td>
                                            <td className="px-2 py-1.5 text-right text-[11px] text-slate-400 align-middle">auto</td>
                                            <td className="px-2 py-1.5 text-right align-top">
                                                <button type="button" onClick={enterPressed} disabled={busy || suggestBusy || matchBusy} className={`${btn} bg-primary border-primary text-white hover:bg-primary/90`}><Plus className="w-3.5 h-3.5" /> Add</button>
                                            </td>
                                        </tr>
                                    )}
                                    {oneGrid && stockMatch && (
                                        <tr className="bg-warning/5">
                                            <td colSpan={9} className="px-3 py-2">
                                                <div className="mb-1 flex items-center justify-between gap-2">
                                                    <span className="font-bold">{stockMatch.error ? "Couldn't check stock for this product." : `Pick the stock item for "${selectedType}" — it is billed by its barcode at its own price.`}</span>
                                                    <button type="button" onClick={() => setStockMatch(null)} className="text-slate-500 hover:text-main">✕ Close</button>
                                                </div>
                                                {stockMatch.items.length > 0 && (
                                                    <div className="max-h-56 overflow-y-auto rounded-md border border-default bg-card">
                                                        <table className="w-full text-xs">
                                                            <thead className="sticky top-0 bg-surface text-slate-500"><tr><th className="px-2 py-1 text-left">Barcode</th><th className="px-2 py-1 text-left">Item</th><th className="px-2 py-1 text-left">Size / Colour</th><th className="px-2 py-1 text-right">Price</th><th className="px-2 py-1 text-right">Stock</th></tr></thead>
                                                            <tbody className="divide-y divide-default">
                                                                {stockMatch.items.map((it, i) => {
                                                                    const ip = Number(it.sellingPrice ?? it.price ?? 0) || 0;
                                                                    const stock = Number(it.stockQty ?? 0) || 0;
                                                                    const same = Math.abs(ip - parseFloat(addPrice)) < 0.5;
                                                                    return (
                                                                        <tr key={`${it.barcode}-${i}`} onClick={() => stock > 0 && void stageBarcode(String(it.barcode))} title={stock > 0 ? 'Add to this bill' : 'Out of stock'} className={`${stock > 0 ? 'cursor-pointer hover:bg-primary/5' : 'opacity-50 cursor-not-allowed'} ${same ? 'bg-success/5' : ''}`}>
                                                                            <td className="px-2 py-1 font-mono">{it.barcode}</td>
                                                                            <td className="px-2 py-1">{it.name}</td>
                                                                            <td className="px-2 py-1 text-slate-500">{[it.size, it.color].filter(Boolean).join(' / ') || '—'}</td>
                                                                            <td className="px-2 py-1 text-right font-bold">₹{ip.toFixed(2)}{same ? ' ✓' : ''}</td>
                                                                            <td className={`px-2 py-1 text-right ${stock > 0 ? '' : 'text-danger font-bold'}`}>{stock > 0 ? stock : 'Out'}</td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                    {items.length === 0 && !(oneGrid && (cart || []).length > 0) && (
                                        <tr><td colSpan={oneGrid ? 9 : editing ? 7 : 6} className="px-2 py-3 text-center text-slate-400">No line items found.</td></tr>
                                    )}
                                    {items.map((it, i) => {
                                        const gone = removed.includes(Number(it.lineNo));
                                        return (
                                            <tr key={`${it.sku || it._id || i}-${i}`} className={gone ? 'bg-danger/5 text-slate-400' : ''}>
                                                <td className="px-2 py-1.5 text-slate-400">{i + 1}</td>
                                                {oneGrid && (
                                                    <>
                                                        <td className={`px-2 py-1.5 font-mono text-[11px] ${gone ? 'line-through' : ''}`}>{it.sku || '—'}</td>
                                                        <td className="px-2 py-1.5 text-slate-400">—</td>
                                                    </>
                                                )}
                                                <td className="px-2 py-1.5">
                                                    <div className={`font-medium ${gone ? 'line-through' : ''}`}>{it.name}</div>
                                                    {(oneGrid ? (it.hsnCode || it.gstRate) : (it.sku || it.hsnCode)) && (
                                                        <div className="text-[11px] text-slate-400">{oneGrid ? '' : it.sku}{!oneGrid && it.hsnCode ? ' · ' : ''}{it.hsnCode ? `HSN ${it.hsnCode}` : ''}{it.gstRate ? `${it.hsnCode ? ' · ' : ''}GST ${it.gstRate}%` : ''}</div>
                                                    )}
                                                </td>
                                                <td className={`px-2 py-1.5 text-right ${gone ? 'line-through' : ''}`}>{Number(it.quantity) || 0}</td>
                                                <td className={`px-2 py-1.5 text-right tabular-nums ${gone ? 'line-through' : ''}`}>{(Number(it.price) || 0).toFixed(2)}</td>
                                                <td className={`px-2 py-1.5 text-right tabular-nums ${gone ? 'line-through' : ''}`}>{(Number(it.discount) || 0).toFixed(2)}</td>
                                                <td className={`px-2 py-1.5 text-right font-semibold tabular-nums ${gone ? 'line-through' : ''}`}>{(Number(it.total) || 0).toFixed(2)}</td>
                                                {editing && (
                                                    <td className="px-2 py-1.5 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleRemove(Number(it.lineNo))}
                                                            disabled={busy || !it.lineNo}
                                                            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold disabled:opacity-40 ${gone ? 'text-primary hover:bg-primary/10' : 'text-danger hover:bg-danger/10'}`}
                                                        >
                                                            {gone ? <><RotateCcw className="w-3 h-3" /> Undo</> : <><X className="w-3 h-3" /> Remove</>}
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                    {!oneGrid && addedRows.map((a) => (
                                        <tr key={`new-${a.barcode}`} className="bg-success/5">
                                            <td className="px-2 py-1.5"><span className={`${chip} bg-success/15 text-success`}>New</span></td>
                                            <td className="px-2 py-1.5">
                                                <div className="font-medium">{a.name}</div>
                                                <div className="text-[11px] text-slate-400">{a.barcode} · GST {a.gstRate}%</div>
                                            </td>
                                            <td className="px-2 py-1.5 text-right">{a.qty}</td>
                                            <td className="px-2 py-1.5 text-right tabular-nums">{Number(a.unitPrice).toFixed(2)}</td>
                                            <td className="px-2 py-1.5 text-right tabular-nums">0.00</td>
                                            <td className="px-2 py-1.5 text-right font-semibold tabular-nums">{Number(a.amount).toFixed(2)}</td>
                                            <td className="px-2 py-1.5 text-right text-[11px] text-slate-400">in cart</td>
                                        </tr>
                                    ))}
                                    {oneGrid && (cart || []).map((c, ci) => {
                                        const pr = newRowPricing(c);
                                        const q = Number(c.qty) || 0;
                                        return (
                                            <tr key={`cart-${c.id}`} className="bg-success/5">
                                                <td className="px-2 py-1.5"><span className={`${chip} bg-success/15 text-success`}>New</span></td>
                                                <td className="px-2 py-1.5 font-mono text-[11px]">{(c as any).barcode || 'no barcode'}</td>
                                                <td className="px-2 py-1.5 font-mono text-[11px]">{(c as any).productCode || ((c as any).sku && (c as any).sku !== (c as any).barcode ? (c as any).sku : '—')}</td>
                                                <td className="px-2 py-1.5">
                                                    <div className="font-medium">{c.name}</div>
                                                    {pr.gst != null && <div className="text-[11px] text-slate-400">GST {pr.gst}%</div>}
                                                </td>
                                                <td className="px-2 py-1.5">
                                                    <div className="inline-flex items-center justify-end gap-1 w-full">
                                                        <button type="button" onClick={() => onUpdateCartQty(String(c.id), Math.max(1, q - 1))} disabled={q <= 1} aria-label="Decrease quantity" className="h-5 w-5 inline-flex items-center justify-center rounded border border-default hover:text-primary disabled:opacity-40"><Minus className="w-3 h-3" /></button>
                                                        <span className="w-5 text-center font-semibold">{q}</span>
                                                        <button type="button" onClick={() => onUpdateCartQty(String(c.id), q + 1)} aria-label="Increase quantity" className="h-5 w-5 inline-flex items-center justify-center rounded border border-default hover:text-primary"><Plus className="w-3 h-3" /></button>
                                                    </div>
                                                </td>
                                                <td className="px-2 py-1.5 text-right tabular-nums">{pr.price.toFixed(2)}</td>
                                                <td className="px-2 py-1.5 text-right tabular-nums">0.00</td>
                                                <td className="px-2 py-1.5 text-right font-semibold tabular-nums">{pr.amount != null ? pr.amount.toFixed(2) : '…'}</td>
                                                <td className="px-2 py-1.5 text-right">
                                                    <button type="button" onClick={() => onRemoveFromCart(String(c.id))} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-danger hover:bg-danger/10"><Trash2 className="w-3 h-3" /> Delete</button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right: summary / payment */}
                <aside className={oneGrid ? 'grid gap-3 md:grid-cols-2 sticky bottom-0 bg-card pt-2 border-t border-default' : 'space-y-2'}>
                    <div className="rounded-md border border-default p-3 space-y-1">
                        <div className="flex justify-between text-slate-500"><span>Items / Qty</span><span className="text-main">{oneGrid ? gridItemCount : items.length} / {oneGrid ? gridQty : items.reduce((s, it) => s + (Number(it.quantity) || 0), 0)}</span></div>
                        <div className="flex justify-between text-slate-500"><span>Subtotal</span><span className="text-main tabular-nums">{money(bill.subtotal)}</span></div>
                        {(oneGrid && preview ? Number(preview.tax) > 0 : Number(bill.tax) > 0) && <div className="flex justify-between text-slate-500"><span>Tax</span><span className="text-main tabular-nums">{money(oneGrid && preview ? preview.tax : bill.tax)}</span></div>}
                        {Number(bill.discount) > 0 && <div className="flex justify-between text-slate-500"><span>Bill discount</span><span className="text-main tabular-nums">-{money(bill.discount)}</span></div>}
                        <div className="flex items-baseline justify-between border-t border-default pt-1.5">
                            <span className="font-semibold">{editing && preview ? 'Current total' : 'Total'}</span>
                            <span className={`tabular-nums ${editing && preview ? 'text-slate-400 line-through' : 'text-lg font-bold'}`}>{money(bill.totalAmount)}</span>
                        </div>
                        {editing && preview && (
                            <div className="flex items-baseline justify-between">
                                <span className="font-semibold">New total</span>
                                <span className="text-lg font-bold tabular-nums">
                                    {money(preview.total)}
                                    <span className={`ml-2 text-[11px] font-semibold ${delta > 0 ? 'text-danger' : delta < 0 ? 'text-success' : 'text-slate-400'}`}>
                                        {delta > 0 ? '+' : delta < 0 ? '−' : ''}{money(Math.abs(delta))}
                                    </span>
                                </span>
                            </div>
                        )}
                        {!editing && (
                            <>
                                <div className="flex justify-between text-slate-500"><span>Paid ({bill.paymentMethod || '—'})</span><span className="text-main tabular-nums">{money(bill.paidAmount)}</span></div>
                                {Number(bill.totalAmount) - Number(bill.paidAmount) > 0.005 && (
                                    <div className="flex justify-between text-danger"><span>Balance (credit)</span><span className="tabular-nums">{money(Number(bill.totalAmount) - Number(bill.paidAmount))}</span></div>
                                )}
                            </>
                        )}
                    </div>

                    {editing && (
                        <div className="rounded-md border border-default p-3 space-y-2">
                            <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Payment for the new total</div>
                            {preview ? (
                                <>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(['cash', 'card', 'upi', 'credit'] as const).map((k) => (
                                            <label key={k} className="text-[11px] font-semibold uppercase text-slate-500">
                                                {k}
                                                <input
                                                    value={pay[k]}
                                                    onChange={(e) => setPay({ ...pay, [k]: e.target.value })}
                                                    onKeyDown={(e) => e.stopPropagation()}
                                                    inputMode="decimal"
                                                    disabled={k === 'credit'}
                                                    title={k === 'credit' ? 'The credit amount of a bill cannot be changed here' : undefined}
                                                    className="mt-0.5 w-full h-8 px-2 text-xs text-right normal-case font-normal text-main bg-card border border-default rounded-md focus:outline-none focus:border-primary disabled:bg-surface disabled:opacity-60"
                                                />
                                            </label>
                                        ))}
                                    </div>
                                    <div className={`flex justify-between text-[11px] ${payOk ? 'text-success' : 'text-danger'}`}>
                                        <span>{payOk ? 'Split matches the new total' : `Must equal ${money(preview.total)}`}</span>
                                        <span className="tabular-nums">{money(payTotal)}</span>
                                    </div>
                                </>
                            ) : (
                                <p className="text-slate-400">Remove a line or add an item to see the new total.</p>
                            )}
                            <div className="flex gap-2 pt-1">
                                <button type="button" onClick={() => void saveEdit()} disabled={busy || !preview || !payOk || !!cartAdds.bad} className={`${btn} flex-1 bg-primary border-primary text-white hover:bg-primary/90`}>
                                    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Save changes
                                </button>
                                <button type="button" onClick={discardEdit} disabled={busy} className={`${btn} border-default`}>Discard</button>
                            </div>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    ) : null;

    return (
        <div className="bg-card border border-default rounded-sm p-2 shadow-sm">
            <form className="flex items-center gap-1" onSubmit={(e) => { e.preventDefault(); find(); }}>
                <div className="relative flex-1 min-w-0">
                    <Search className="w-3 h-3 text-slate-400 absolute left-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setMsg(null); setMatches([]); }}
                        // Keep POS keyboard shortcuts / barcode scanner from reacting to typing here.
                        onKeyDown={(e) => e.stopPropagation()}
                        placeholder="Today's bill no. (e.g. 96 or A96)"
                        aria-label="Today's bill number"
                        inputMode="text"
                        className="w-full h-7 pl-5 pr-1 text-[11px] bg-surface border border-default rounded-sm text-main placeholder:text-slate-400 focus:outline-none focus:border-primary"
                    />
                </div>
                <button
                    type="submit"
                    disabled={busy || !query.trim()}
                    title="Find bill"
                    className="h-7 w-7 flex items-center justify-center rounded-sm text-slate-400 hover:text-primary disabled:opacity-40 transition-colors"
                >
                    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                </button>
            </form>

            {msg && (
                <p className={`mt-1 text-[10px] leading-tight ${msg.kind === 'error' ? 'text-danger' : 'text-success'}`}>
                    {msg.text}
                </p>
            )}

            {matches.length > 1 && (
                <ul className="mt-1 max-h-32 overflow-y-auto divide-y divide-default">
                    {matches.map((m) => (
                        <li key={m._id}>
                            <button
                                type="button"
                                onClick={() => openBill(m)}
                                disabled={busy}
                                title={`Open ${m.invoiceNo}`}
                                className="w-full text-left py-1 text-[10px] hover:bg-surface disabled:opacity-40"
                            >
                                <div className="font-medium text-slate-600 dark:text-slate-300 truncate">#{m.invoiceNo} · {money(m.totalAmount)}</div>
                                <div className="text-slate-400 truncate">{formatTime(m.createdAt)}{m.counterName ? ` · ${m.counterName}` : ''}{m.customerName ? ` · ${m.customerName}` : ''}</div>
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {bill && slot && (
                <div className="mt-1 flex items-center justify-between gap-1 text-[10px]">
                    <span className="truncate text-slate-500">Bill #{bill.invoiceNo} is open in the main area.</span>
                    <button type="button" onClick={reset} title="Close" className="p-0.5 text-slate-400 hover:text-main"><X className="w-3.5 h-3.5" /></button>
                </div>
            )}
            {bill && !slot && billView}
            {bill && slot && createPortal(
                <div className={oneGrid ? 'h-full overflow-y-auto bg-card' : 'm-2 rounded-md border border-default bg-card shadow-sm max-h-[75vh] overflow-y-auto'}>{billView}</div>,
                slot,
            )}
        </div>
    );
};

export default POSBillReprint;
