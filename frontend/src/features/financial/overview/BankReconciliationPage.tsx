import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftRight, CheckCircle2, FileSpreadsheet, Landmark } from 'lucide-react';
import api from '@/services/api';
import { formatNumber } from '@/utils/formatters';
import { ReportKpiGrid, ReportPeriodPicker, ReportTable, useReportData, useReportPeriod } from '../../reports/components';
import type { ReportColumn } from '../../reports/components';
import { FinancePage } from './FinancePage';
import { dateText, rupees0 } from './cashBankFormat';
import type { LedgerEntry, LoansData, MatchSuggestion, ReconciliationData, StatementLine } from './cashBankTypes';

interface MatchRow extends MatchSuggestion { line: StatementLine; entry: LedgerEntry }

const signed = (dir: 'credit' | 'debit', v: number) => (dir === 'credit' ? v : -v);
const dirLabel = (dir: 'credit' | 'debit') => (dir === 'credit' ? 'Into bank' : 'Out of bank');

const LINE_COLUMNS: ReportColumn<StatementLine>[] = [
    { key: 'date', header: 'Date', type: 'date', value: r => r.date },
    { key: 'description', header: 'Statement narration', value: r => r.description, subtext: r => r.reference || null },
    { key: 'amount', header: 'Amount', type: 'currency', value: r => signed(r.type, r.amount), cellClassName: r => (r.type === 'debit' ? 'text-rose-600' : 'text-emerald-600') },
];
const ENTRY_COLUMNS: ReportColumn<LedgerEntry>[] = [
    { key: 'date', header: 'Date', type: 'date', value: r => r.date },
    { key: 'description', header: 'ERP entry', value: r => r.description || '—', subtext: r => r.reference || null },
    { key: 'amount', header: 'Amount', type: 'currency', value: r => signed(r.direction, r.amount), cellClassName: r => (r.direction === 'debit' ? 'text-rose-600' : 'text-emerald-600') },
];

/**
 * Finance › Reconciliation: lines from the uploaded bank statement against the ERP's entries for one bank account.
 * Suggested matches (same amount and direction, dates within 3 days) are confirmed by the user; nothing is marked
 * reconciled automatically. Replaced a screen that showed hardcoded bank and ERP entries.
 */
const BankReconciliationPage: React.FC = () => {
    const period = useReportPeriod('this-month');
    const { from, to } = period.period;
    const banks = useReportData<LoansData>('/api/reports/finance/loans', {});
    const accounts = useMemo(() => (banks.data?.banks ?? []).filter(b => b.type !== 'Cash' && b.type !== 'Loan'), [banks.data]);
    const [accountId, setAccountId] = useState('');
    useEffect(() => { if (!accountId && accounts.length) setAccountId(accounts[0].id); }, [accounts, accountId]);

    const ready = Boolean(accountId && from && to);
    const rec = useReportData<ReconciliationData>('/api/reports/finance/bank-reconciliation', { accountId, from, to }, { enabled: ready });
    const data = ready ? rec.data : null;
    // Every suggestion starts ticked; the user unticks the ones that aren't the same transaction.
    const [unticked, setUnticked] = useState<Set<string>>(new Set());
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [savedCount, setSavedCount] = useState<number | null>(null);

    const matchRows: MatchRow[] = useMemo(() => {
        if (!data) return [];
        const L = new Map(data.lines.map(l => [l.id, l]));
        const E = new Map(data.entries.map(e => [e.id, e]));
        return data.matches.flatMap(m => (L.get(m.statementId) && E.get(m.entryId) ? [{ ...m, line: L.get(m.statementId)!, entry: E.get(m.entryId)! }] : []));
    }, [data]);
    const selected = useMemo(() => new Set(matchRows.map(m => m.statementId).filter(id => !unticked.has(id))), [matchRows, unticked]);
    useEffect(() => { setSavedCount(null); setSaveError(''); setUnticked(new Set()); }, [accountId, from, to]);

    const matchedL = new Set(data?.matches.map(m => m.statementId));
    const matchedE = new Set(data?.matches.map(m => m.entryId));
    const onlyStatement = (data?.lines ?? []).filter(l => !l.reconciled && !matchedL.has(l.id));
    const onlyErp = (data?.entries ?? []).filter(e => !e.reconciled && !matchedE.has(e.id));

    const confirm = async () => {
        const pairs = matchRows.filter(m => selected.has(m.statementId)).map(m => ({ statementId: m.statementId, entryId: m.entryId }));
        if (!pairs.length) return;
        setSaving(true); setSaveError('');
        try {
            const res = await api.post<{ matched: number }>('/api/reports/finance/bank-reconciliation/match', { pairs });
            setSavedCount(res.data.matched);
            await rec.reload(true);
        } catch (err) {
            setSaveError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Could not save the matches.');
        } finally {
            setSaving(false);
        }
    };

    const MATCH_COLUMNS: ReportColumn<MatchRow>[] = [
        { key: 'pick', header: '', value: r => r.statementId, render: r => (
            <input type="checkbox" aria-label={`Confirm match of ${rupees0(r.amount)} on ${dateText(r.line.date)}`} checked={selected.has(r.statementId)}
                onChange={e => setUnticked(prev => { const s = new Set(prev); if (e.target.checked) s.delete(r.statementId); else s.add(r.statementId); return s; })} />
        ), sortable: false, hideable: false, exportable: false },
        { key: 'amount', header: 'Amount', type: 'currency', value: r => signed(r.direction, r.amount), subtext: r => dirLabel(r.direction) },
        { key: 'statement', header: 'Bank statement', value: r => r.line.description, subtext: r => `${dateText(r.line.date)}${r.line.reference ? ` · ${r.line.reference}` : ''}` },
        { key: 'erp', header: 'ERP entry', value: r => r.entry.description || '—', subtext: r => `${dateText(r.entry.date)}${r.entry.reference ? ` · ${r.entry.reference}` : ''}` },
        { key: 'dayGap', header: 'Date gap', type: 'number', value: r => r.dayGap, render: r => (r.dayGap ? `${r.dayGap} day${r.dayGap === 1 ? '' : 's'}` : 'Same day') },
    ];

    const noAccounts = banks.data && accounts.length === 0;
    const s = data?.summary;

    return (
        <FinancePage
            title="Bank Reconciliation"
            subtitle="Match the bank statement to the ERP's entries, one account at a time"
            basis="Statement lines come from Finance › Statements (uploaded bank statements). Suggestions pair a statement line with an ERP entry of the same amount and direction within 3 days; confirm them to mark both reconciled. Uploaded statements aren't tied to an account, so pick the account the statement belongs to."
            actions={(
                <>
                    <select aria-label="Bank account" value={accountId} onChange={e => setAccountId(e.target.value)}
                        className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                    <ReportPeriodPicker value={period} />
                </>
            )}
            loading={banks.loading || rec.loading}
            error={banks.error || (accountId ? rec.error : '')}
            hasData={Boolean(noAccounts || data)}
            onRefresh={() => { banks.reload(true); rec.reload(true); }}
        >
            {noAccounts && (
                <p className="rounded-md border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
                    No bank accounts yet. <Link to="/cashbank/accounts" className="font-bold text-primary hover:underline">Add one</Link> to reconcile it.
                </p>
            )}
            {data && s && (
                <>
                    <ReportKpiGrid items={[
                        { label: 'Statement net', value: rupees0(s.statementNet), sub: s.statementClosing !== null ? `Closing balance ${rupees0(s.statementClosing)}` : `${formatNumber(data.lines.length)} lines`, icon: <FileSpreadsheet className="w-4 h-4" /> },
                        { label: 'ERP net', value: rupees0(s.erpNet), sub: `Account balance ${rupees0(data.account.erpBalance)}`, icon: <Landmark className="w-4 h-4" /> },
                        { label: 'Suggested matches', value: formatNumber(s.suggested), sub: `${formatNumber(s.reconciledLines)} lines already reconciled`, icon: <ArrowLeftRight className="w-4 h-4" /> },
                        { label: 'Still unmatched', value: formatNumber(s.onlyInStatement.count + s.onlyInErp.count), sub: `${formatNumber(s.onlyInStatement.count)} in statement · ${formatNumber(s.onlyInErp.count)} in ERP`, tone: s.onlyInStatement.count + s.onlyInErp.count ? 'warning' : 'positive', icon: <CheckCircle2 className="w-4 h-4" /> },
                    ]} />
                    {data.lines.length === 0 && (
                        <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                            No bank statement lines in this period. <Link to="/finance/bank-statement" className="font-bold underline">Upload a statement</Link> to reconcile against it.
                        </p>
                    )}
                    {savedCount !== null && <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Marked {formatNumber(savedCount)} pair{savedCount === 1 ? '' : 's'} as reconciled.</p>}
                    {saveError && <p className="text-sm font-medium text-rose-600">{saveError}</p>}
                    {matchRows.length > 0 && (
                        <ReportTable
                            title="Suggested matches"
                            subtitle="Tick the pairs that are the same transaction, then confirm"
                            columns={MATCH_COLUMNS}
                            rows={matchRows}
                            rowKey={r => r.statementId}
                            actions={(
                                <button type="button" onClick={confirm} disabled={saving || selected.size === 0}
                                    className="rounded-md bg-primary px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
                                    {saving ? 'Saving…' : `Confirm ${formatNumber(selected.size)} match${selected.size === 1 ? '' : 'es'}`}
                                </button>
                            )}
                        />
                    )}
                    <ReportTable title="Only in the bank statement" subtitle={`Net ${rupees0(s.onlyInStatement.net)}: bank charges, interest, or entries not yet made in the ERP`} columns={LINE_COLUMNS} rows={onlyStatement} rowKey={r => r.id} emptyMessage="Every statement line is matched." />
                    <ReportTable title="Only in the ERP" subtitle={`Net ${rupees0(s.onlyInErp.net)}: cheques not yet cleared, or entries with a wrong amount or date`} columns={ENTRY_COLUMNS} rows={onlyErp} rowKey={r => r.id} emptyMessage="Every ERP entry is matched." />
                </>
            )}
        </FinancePage>
    );
};

export default BankReconciliationPage;
