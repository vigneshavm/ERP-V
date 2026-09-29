import React, { useState } from 'react';
import { Printer, Search, Loader2 } from 'lucide-react';
import receiptDataService, { TodaysBillMatch } from '../../services/receiptDataService';
import { Sale } from '../../types/sales';

interface POSBillReprintProps {
    // From usePOSLogic: prints on this counter's receipt layout; false if shop/branch not loaded.
    printSale: (sale: Sale) => boolean;
}

type Msg = { kind: 'error' | 'ok'; text: string } | null;

const formatTime = (value: string) =>
    new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase();

/**
 * "Today's bill no." lookup under the Last Bill card: type a bill number (e.g. 123, 00123 or
 * INV-2026-00123), press Enter or the printer icon, and the saved bill is reprinted.
 * One match prints straight away; several matches are listed to pick from.
 */
export const POSBillReprint: React.FC<POSBillReprintProps> = ({ printSale }) => {
    const [query, setQuery] = useState('');
    const [busy, setBusy] = useState(false);
    const [matches, setMatches] = useState<TodaysBillMatch[]>([]);
    const [msg, setMsg] = useState<Msg>(null);

    const printMatch = async (match: TodaysBillMatch) => {
        setBusy(true);
        setMsg(null);
        try {
            const sale = await receiptDataService.fetchSale(match._id);
            if (printSale(sale)) {
                setMsg({ kind: 'ok', text: `Printing ${match.invoiceNo}` });
                setMatches([]);
                setQuery('');
            } else {
                setMsg({ kind: 'error', text: 'Shop details not loaded yet — try again.' });
            }
        } catch {
            setMsg({ kind: 'error', text: `Couldn't load ${match.invoiceNo}.` });
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
        try {
            const found = await receiptDataService.findTodaysBills(q);
            if (found.length === 0) {
                setMsg({ kind: 'error', text: `No bill #${q.replace(/^#/, '')} today.` });
            } else if (found.length === 1) {
                setBusy(false);
                await printMatch(found[0]);
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

    return (
        <div className="bg-card border border-default rounded-sm p-2 shadow-sm">
            <form
                className="flex items-center gap-1"
                onSubmit={(e) => { e.preventDefault(); find(); }}
            >
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
                    title="Find and print bill"
                    className="h-7 w-7 flex items-center justify-center rounded-sm text-slate-400 hover:text-primary disabled:opacity-40 transition-colors"
                >
                    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
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
                        <li key={m._id} className="flex items-center gap-1 py-1 text-[10px]">
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-slate-600 dark:text-slate-300 truncate">#{m.invoiceNo} · ₹{m.totalAmount.toFixed(2)}</div>
                                <div className="text-slate-400 truncate">{formatTime(m.createdAt)}{m.counterName ? ` · ${m.counterName}` : ''}{m.customerName ? ` · ${m.customerName}` : ''}</div>
                            </div>
                            <button
                                type="button"
                                onClick={() => printMatch(m)}
                                disabled={busy}
                                title={`Print ${m.invoiceNo}`}
                                className="p-0.5 text-slate-400 hover:text-primary disabled:opacity-40 transition-colors"
                            >
                                <Printer className="w-3.5 h-3.5" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default POSBillReprint;
