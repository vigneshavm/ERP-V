import React, { useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Scale, Search, Wallet, X } from 'lucide-react';
import api from '@/services/api';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { ReportColumn, ReportKpiGrid, ReportPageShell, ReportTable, useDebounced, useReportData, useReportPeriod } from './components';
import type { ResolvedSource } from './components';

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

/** Search customers and suppliers (All Parties API) and pick one. */
const PartyPicker: React.FC<{ onPick: (p: PartyOption) => void }> = ({ onPick }) => {
    const [input, setInput] = useState('');
    const q = useDebounced(input);
    const [type, setType] = useState('');
    const [options, setOptions] = useState<PartyOption[]>([]);
    const [busy, setBusy] = useState(false);
    const [searched, setSearched] = useState('');
    useEffect(() => {
        if (q.length < 2) return;
        let cancelled = false;
        api.get<{ items: PartyOption[] }>('/api/reports/party/all-parties', { params: { search: q, type: type || undefined, limit: '15', sort: 'transactions', dir: 'desc' } })
            .then(r => { if (!cancelled) setOptions(r.data.items || []); })
            .catch(() => { if (!cancelled) setOptions([]); })
            .finally(() => { if (!cancelled) { setBusy(false); setSearched(q); } });
        return () => { cancelled = true; };
    }, [q, type]);
    const shown = q.length >= 2 ? options : [];
    return (
        <section className="bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm p-4 space-y-3">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Choose a customer or supplier</p>
            <div className="flex flex-wrap gap-3">
                <label className="relative flex-1 min-w-[16rem]">
                    <span className="sr-only">Search parties</span>
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden />
                    <input
                        autoFocus
                        value={input}
                        onChange={e => { setInput(e.target.value); if (e.target.value.trim().length >= 2) setBusy(true); }}
                        placeholder="Type at least 2 letters: name, card no., phone, city…"
                        className={`w-full pl-8 pr-3 ${fieldCls}`}
                    />
                </label>
                <select value={type} onChange={e => setType(e.target.value)} className={fieldCls} aria-label="Party type">
                    <option value="">Customers & suppliers</option>
                    <option value="customer">Customers</option>
                    <option value="supplier">Suppliers</option>
                </select>
            </div>
            {busy && input.trim().length >= 2 && <p className="text-xs text-slate-400">Searching…</p>}
            {!busy && q.length >= 2 && searched === q && shown.length === 0 && <p className="text-xs text-slate-400">No party matches “{q}”.</p>}
            {shown.length > 0 && (
                <ul className="divide-y divide-slate-100 dark:divide-slate-700 border border-slate-100 dark:border-slate-700 rounded-lg max-h-80 overflow-y-auto">
                    {shown.map(o => (
                        <li key={o.key}>
                            <button type="button" onClick={() => onPick(o)} className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/40 flex items-center justify-between gap-3">
                                <span>
                                    <span className="font-bold text-slate-900 dark:text-white">{o.name}</span>
                                    <span className="block text-[11px] text-slate-400">{partyLine(o)}</span>
                                </span>
                                <span className="text-[10px] font-bold uppercase text-slate-500 shrink-0">{o.type} · {formatNumber(o.transactions)} {o.type === 'Customer' ? 'bills' : 'GRNs'}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
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
                        <p className="text-xs font-bold text-amber-600">Showing the latest 5,000 entries. Narrow the period to see earlier ones.</p>
                    )}
                </>
            )}
        </ReportPageShell>
    );
};

export default PartyStatementReport;
