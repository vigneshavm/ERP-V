import React, { useCallback, useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, ChevronDown, Scale, Search, Wallet, X } from 'lucide-react';
import api from '@/services/api';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { ReportColumn, ReportKpiGrid, ReportPageShell, ReportTable, useDebounced, useReportData, useReportPeriod } from './components';
import type { ResolvedSource } from './components';
import { useDismiss } from './components/useDismiss';

interface PartyOption {
    key: string;
    type: 'Customer' | 'Supplier';
    name: string;
    code: string;
    city: string;
    phone: string;
    transactions: number;
}

interface Entry {
    date: string;
    doc: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
}

interface StatementData {
    asOf: string | null;
    source?: ResolvedSource;
    range: { from: string | null; to: string | null };
    party: { key: string; type: 'Customer' | 'Supplier'; name: string; code: string; city: string; phone: string } | null;
    balanceMeaning: 'receivable' | 'payable';
    opening: number;
    openingFromMaster: number | null;
    totals: { debit: number; credit: number; closing: number };
    entries: Entry[];
    truncated: boolean;
}

const rupees0 = (v: number) => formatCurrency(v, { fractionDigits: 0 });
const partyLine = (p: { code: string; city: string; phone: string }) => [p.code && `Card ${p.code}`, p.city, p.phone].filter(Boolean).join(' · ');

const COLUMNS: ReportColumn<Entry>[] = [
    { key: 'date', header: 'Date', type: 'date', value: e => e.date || null, sortable: false },
    { key: 'doc', header: 'Document', value: e => e.doc, sortable: false },
    { key: 'description', header: 'Description', value: e => e.description, sortable: false },
    { key: 'debit', header: 'Debit', type: 'currency', blankZero: true, value: e => e.debit, sortable: false },
    { key: 'credit', header: 'Credit', type: 'currency', blankZero: true, value: e => e.credit, sortable: false },
    { key: 'balance', header: 'Balance', type: 'currency', value: e => e.balance, sortable: false, hideable: false },
];

const fieldCls = 'px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.2)]';

/**
 * Dropdown of customers and suppliers (All Parties API). Opens with the most active parties; typing 2+ letters
 * searches by name, card no., phone or city. Arrow keys + Enter pick from the keyboard.
 */
const PartyPicker: React.FC<{ onPick: (p: PartyOption) => void }> = ({ onPick }) => {
    const [input, setInput] = useState('');
    const q = useDebounced(input.trim());
    const [type, setType] = useState('');
    const [open, setOpen] = useState(false);
    const [options, setOptions] = useState<PartyOption[]>([]);
    const [loadedFor, setLoadedFor] = useState<string | null>(null);
    const [active, setActive] = useState(0);
    const searching = q.length >= 2;
    const requestKey = `${type}|${searching ? q : ''}`;
    const close = useCallback(() => setOpen(false), []);
    const ref = useDismiss<HTMLDivElement>(open, close);

    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        api.get<{ items: PartyOption[] }>('/api/reports/party/all-parties', {
            params: { search: searching ? q : undefined, type: type || undefined, limit: searching ? '25' : '50', sort: 'transactions', dir: 'desc' },
        })
            .then(r => { if (!cancelled) setOptions(r.data.items || []); })
            .catch(() => { if (!cancelled) setOptions([]); })
            .finally(() => { if (!cancelled) { setLoadedFor(requestKey); setActive(0); } });
        return () => { cancelled = true; };
    }, [open, q, type, searching, requestKey]);

    const pick = (o: PartyOption) => { setOpen(false); setInput(''); onPick(o); };
    const ready = loadedFor === requestKey;
    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); if (!open) setOpen(true); else setActive(i => Math.min(i + 1, options.length - 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(i - 1, 0)); }
        else if (e.key === 'Enter' && open && ready && options[active]) { e.preventDefault(); pick(options[active]); }
    };

    return (
        <section className="bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm p-4 space-y-3">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Choose a customer or supplier</p>
            <div className="flex flex-wrap gap-3">
                <div ref={ref} className="relative flex-1 min-w-[16rem]">
                    <label>
                        <span className="sr-only">Select a party</span>
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden />
                        <input
                            autoFocus
                            role="combobox"
                            aria-expanded={open}
                            aria-controls="party-picker-list"
                            aria-autocomplete="list"
                            value={input}
                            onFocus={() => setOpen(true)}
                            onClick={() => setOpen(true)}
                            onChange={e => { setInput(e.target.value); setOpen(true); }}
                            onKeyDown={onKeyDown}
                            placeholder="Select a party, or type to search name, card no., phone, city…"
                            className={`w-full pl-8 pr-9 ${fieldCls}`}
                        />
                        <button
                            type="button"
                            tabIndex={-1}
                            aria-label={open ? 'Close list' : 'Open list'}
                            onClick={() => setOpen(o => !o)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        >
                            <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                        </button>
                    </label>
                    {open && (
                        <div id="party-picker-list" role="listbox" className="absolute z-30 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                            <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-700">
                                {searching ? `Matches for “${q}”` : 'Most active parties · type to search all'}
                            </p>
                            {!ready && <p className="px-3 py-2 text-xs text-slate-400">Loading…</p>}
                            {ready && options.length === 0 && <p className="px-3 py-2 text-xs text-slate-400">{searching ? `No party matches “${q}”.` : 'No parties found.'}</p>}
                            {ready && options.map((o, i) => (
                                <button
                                    key={o.key}
                                    type="button"
                                    role="option"
                                    aria-selected={i === active}
                                    onMouseEnter={() => setActive(i)}
                                    onClick={() => pick(o)}
                                    className={`w-full text-left px-3 py-2 flex items-center justify-between gap-3 ${i === active ? 'bg-slate-100 dark:bg-slate-700/60' : ''}`}
                                >
                                    <span>
                                        <span className="font-bold text-slate-900 dark:text-white">{o.name}</span>
                                        <span className="block text-[11px] text-slate-400">{partyLine(o)}</span>
                                    </span>
                                    <span className="text-[10px] font-bold uppercase text-slate-500 shrink-0">{o.type} · {formatNumber(o.transactions)} {o.type === 'Customer' ? 'bills' : 'GRNs'}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <select value={type} onChange={e => { setType(e.target.value); setOpen(true); }} className={fieldCls} aria-label="Party type">
                    <option value="">Customers & suppliers</option>
                    <option value="customer">Customers</option>
                    <option value="supplier">Suppliers</option>
                </select>
            </div>
        </section>
    );
};

/** Party Statement: dated ledger for one customer (receivable) or supplier (payable). */
const PartyStatementReport: React.FC = () => {
    const [picked, setPicked] = useState<PartyOption | null>(null);
    const period = useReportPeriod('all');
    const { period: range } = period;
    const { data, loading, error, reload } = useReportData<StatementData>('/api/reports/party/statement', { key: picked?.key, from: range.from, to: range.to });

    const selector = picked ? (
        <section className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm p-4">
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{picked.type}</p>
                <p className="text-lg font-black text-slate-900 dark:text-white">{picked.name}</p>
                <p className="text-xs text-slate-500">{partyLine(picked) || ' '}</p>
            </div>
            <button type="button" onClick={() => setPicked(null)} className="flex items-center gap-1 text-xs font-bold text-primary hover:underline">
                <X className="w-3.5 h-3.5" aria-hidden /> Change party
            </button>
        </section>
    ) : <PartyPicker onPick={setPicked} />;

    // Only show data that belongs to the picked party (the previous party's statement may still be in state).
    const party = picked && data?.party?.key === picked.key ? data : null;
    // Still waiting while this party's statement hasn't arrived (no data yet, or the previous party's). A loaded
    // "party not found" (party: null) is not waiting.
    const waiting = Boolean(picked) && (loading || (!error && data?.party !== null && data?.party?.key !== picked?.key));
    const isSupplier = party?.balanceMeaning === 'payable';
    const t = party?.totals;

    const openingRow: Entry | null = party ? { date: party.range.from ?? '', doc: '', description: 'Opening balance', debit: 0, credit: 0, balance: party.opening } : null;
    const closingRow: Entry | null = party && t ? { date: '', doc: '', description: 'Closing balance', debit: t.debit, credit: t.credit, balance: t.closing } : null;

    const note = party
        ? isSupplier
            ? `Credit = purchase (GRN net total) or cash refund, Debit = payment or purchase return. Every shop GRN is a cash purchase, so each is paid the same day. Opening balance ${rupees0(party.openingFromMaster ?? 0)} is from the supplier master. Balance = amount payable.`
            : 'Debit = bill amount, Credit = paid at billing and later credit payments (cash or cheque). Balance = amount receivable. Only payments recorded in the shop system are shown.'
        : undefined;

    return (
        <ReportPageShell<Entry>
            // A fresh shell per party, so a newly picked party shows the loading skeleton, not the last one's figures.
            key={picked?.key ?? 'none'}
            reportId="party-statement"
            period={period}
            primarySelector={selector}
            note={note}
            onRefresh={picked ? () => reload(true) : undefined}
            // Nothing is loaded until a party is picked; the picker is the whole page until then.
            loading={waiting}
            error={picked ? error : null}
            meta={party ? { resolvedSource: party.source, asOf: party.asOf, recordCount: party.entries.length } : undefined}
            export={party && openingRow && closingRow ? {
                columns: COLUMNS.map(c => c.key === 'balance' ? { ...c, header: `Balance (${party.balanceMeaning})` } : c),
                fetchRows: () => [openingRow, ...party.entries, closingRow],
                filterSummary: [`Party: ${party.party!.name} (${party.party!.type})`],
            } : undefined}
        >
            {party && t && openingRow && closingRow && (
                <>
                    <ReportKpiGrid items={[
                        { label: 'Opening balance', value: rupees0(party.opening), icon: <Scale className="w-4 h-4" /> },
                        { label: isSupplier ? 'Paid (debit)' : 'Billed (debit)', value: rupees0(t.debit), icon: <ArrowUpRight className="w-4 h-4" /> },
                        { label: isSupplier ? 'Purchased (credit)' : 'Received (credit)', value: rupees0(t.credit), icon: <ArrowDownLeft className="w-4 h-4" /> },
                        { label: `Closing ${party.balanceMeaning}`, value: rupees0(t.closing), tone: Math.abs(t.closing) > 0.5 ? 'warning' : 'default', icon: <Wallet className="w-4 h-4" /> },
                    ]} />
                    <ReportTable
                        title="Ledger"
                        subtitle={`${party.entries.length ? formatNumber(party.entries.length) : 'No'} entries, oldest first`}
                        columns={COLUMNS}
                        rows={party.entries}
                        rowKey={(e, i) => `${e.date}|${e.doc}|${i}`}
                        loading={loading}
                        pinnedTopRows={[openingRow]}
                        pinnedBottomRows={[closingRow]}
                        emptyMessage="No transactions in this period."
                    />
                    {party.truncated && (
                        <p className="text-xs font-bold text-warning">Showing the latest 5,000 entries. Narrow the period to see earlier ones.</p>
                    )}
                </>
            )}
        </ReportPageShell>
    );
};

export default PartyStatementReport;
