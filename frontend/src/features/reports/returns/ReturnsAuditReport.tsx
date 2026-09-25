import React, { useMemo, useState } from 'react';
import { Banknote, RotateCcw, ShieldAlert, Wallet } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import {
    FilterSelect, ReportAnalysisCard, ReportAnalysisGrid, ReportKpiGrid, ReportPageShell, ReportRankList, ReportTable,
    useClientReportTable, useReportData, useReportPeriod,
} from '../components';
import type { ReportColumn, ResolvedSource, StatusTone } from '../components';
import { filterSummary } from '../utils/reportExport';

type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
type RefundMode = 'cash' | 'bank' | 'credit_note';

export interface AuditRow {
    id: string;
    returnId: string;
    date: string;
    time: string | null;
    bill: string | null;
    customer: string;
    cashier: string;
    amount: number;
    refundMode: RefundMode;
    refundMethod: string;
    reasons: string;
    items: number;
    status: string;
    flags: string[];
    level: RiskLevel;
}

export interface ReturnsAuditData {
    range: { from: string; to: string };
    summary: {
        returns: number; value: number; cash: number; bank: number; creditNote: number;
        byLevel: Record<RiskLevel, number>;
        byFlag: { code: string; label: string; level: RiskLevel; returns: number; value: number }[];
        byReason: { reason: string; lines: number; value: number }[];
        byCashier: { cashier: string; returns: number; value: number; cash: number }[];
        erpBills: number;
        returnRatePct: number | null;
    };
    rows: AuditRow[];
    rules: { code: string; label: string; level: RiskLevel }[];
    limits: { cashRefund: number; cashierDaily: number; repeatCount: number; repeatDays: number };
    shopReturnRows: number;
    asOf: string | null;
    source?: ResolvedSource;
}

const rupees0 = (v: number) => formatCurrency(v, { fractionDigits: 0 });
const LEVEL_TONE: Record<RiskLevel, StatusTone> = { CRITICAL: 'danger', HIGH: 'warning', MEDIUM: 'info', LOW: 'neutral' };
const LEVEL_LABEL: Record<RiskLevel, string> = { CRITICAL: 'Critical', HIGH: 'High', MEDIUM: 'Medium', LOW: 'No flag' };
const MODE_LABEL: Record<RefundMode, string> = { cash: 'Cash', bank: 'Bank / UPI / card', credit_note: 'Credit note' };

const LEVELS = [
    { value: 'CRITICAL', label: 'Critical' }, { value: 'HIGH', label: 'High' }, { value: 'MEDIUM', label: 'Medium' },
    { value: 'FLAGGED', label: 'Any flag' }, { value: 'LOW', label: 'No flag' },
];
const MODES = [{ value: 'cash', label: 'Cash' }, { value: 'bank', label: 'Bank / UPI / card' }, { value: 'credit_note', label: 'Credit note' }];

/**
 * Returns & Refund Audit: every sales return in the period with risk flags computed on the server from what the ERP
 * records (bill total, refund method, cashier, customer). No manager-approval or receipt-scan check, because the ERP
 * doesn't record either.
 */
const ReturnsAuditReport: React.FC = () => {
    const period = useReportPeriod('this-month');
    const { from, to } = period.period;
    const { data, loading, error, reload } = useReportData<ReturnsAuditData>('/api/reports/returns-audit', { from, to });
    const [level, setLevel] = useState('');
    const [mode, setMode] = useState('');
    const [flag, setFlag] = useState('');
    const s = data?.summary;
    const flagLabel = useMemo(() => new Map((data?.rules ?? []).map(r => [r.code, r.label])), [data]);

    const rows = useMemo(() => (data?.rows ?? []).filter(r =>
        (!level || (level === 'FLAGGED' ? r.flags.length > 0 : r.level === level)) &&
        (!mode || r.refundMode === mode) &&
        (!flag || r.flags.includes(flag))), [data, level, mode, flag]);

    const columns = useMemo<ReportColumn<AuditRow>[]>(() => [
        { key: 'date', header: 'Date', type: 'date', value: r => r.date, subtext: r => r.time, sortable: true },
        { key: 'returnId', header: 'Return', value: r => r.returnId, subtext: r => (r.bill ? `Bill ${r.bill}` : 'Bill not linked') },
        { key: 'customer', header: 'Customer', value: r => r.customer },
        { key: 'cashier', header: 'Cashier', value: r => r.cashier },
        { key: 'amount', header: 'Refund', type: 'currency', value: r => r.amount, subtext: r => MODE_LABEL[r.refundMode], cellClassName: () => 'font-bold' },
        { key: 'reasons', header: 'Reason', value: r => r.reasons, defaultHidden: true },
        { key: 'items', header: 'Pcs', type: 'quantity', value: r => r.items, defaultHidden: true },
        { key: 'level', header: 'Risk', type: 'status', value: r => LEVEL_LABEL[r.level], statusTones: Object.fromEntries(Object.entries(LEVEL_TONE).map(([k, t]) => [LEVEL_LABEL[k as RiskLevel], t])) },
        { key: 'flags', header: 'Why flagged', value: r => r.flags.map(f => flagLabel.get(f) ?? f).join('; ') || null },
    ], [flagLabel]);
    const { tableProps, filteredRows } = useClientReportTable(rows, columns, { searchPlaceholder: 'Return, bill, customer or cashier…' });

    const flagged = s ? s.byLevel.CRITICAL + s.byLevel.HIGH + s.byLevel.MEDIUM : 0;
    const cashAbove = s?.byFlag.find(f => f.code === 'CASH_ABOVE_LIMIT')?.returns ?? 0;
    const active = [level, mode, flag].filter(Boolean).length;

    const notes = data ? [
        'Refund = the return value (GST included). Risk comes only from what the ERP records: ' +
            (data.rules.map(r => `${r.label} (${LEVEL_LABEL[r.level].toLowerCase()})`).join(', ')) + '. The highest matching rule sets the level.',
        'Manager approval and receipt scans are not recorded on returns, so they are not checked.',
        `Returns are recorded in the ERP only${data.shopReturnRows > 0 ? `; the shop database also has ${formatNumber(data.shopReturnRows)} sales-return rows, which are not included here` : ' (the shop database has no sales returns)'}. Return rate is against ERP bills.`,
    ].join(' ') : undefined;

    return (
        <ReportPageShell<AuditRow>
            reportId="returns-audit"
            period={period}
            filters={{
                activeCount: active,
                onClear: () => { setLevel(''); setMode(''); setFlag(''); },
                content: (
                    <>
                        <FilterSelect label="Risk" value={level} onChange={setLevel} options={LEVELS} allLabel="Any" />
                        <FilterSelect label="Refunded by" value={mode} onChange={setMode} options={MODES} allLabel="Any" />
                        <FilterSelect label="Rule" value={flag} onChange={setFlag} options={(data?.rules ?? []).map(r => ({ value: r.code, label: r.label }))} allLabel="Any" />
                    </>
                ),
            }}
            note={notes}
            onRefresh={() => reload(true)}
            loading={loading}
            error={error}
            isEmpty={Boolean(s && s.returns === 0)}
            meta={{ resolvedSource: data?.source ?? 'mongo', asOf: data?.asOf, recordCount: rows.length }}
            export={{
                columns: [
                    ...columns,
                    { key: 'time', header: 'Time', value: r => r.time },
                    { key: 'bill', header: 'Bill', value: r => r.bill },
                    { key: 'refundMethod', header: 'Refund method', value: r => r.refundMethod },
                ],
                fetchRows: () => filteredRows,
                filterSummary: filterSummary([
                    ['Risk', LEVELS.find(o => o.value === level)?.label],
                    ['Refunded by', MODES.find(o => o.value === mode)?.label],
                    ['Rule', flag ? flagLabel.get(flag) : undefined],
                ]),
            }}
        >
            {data && s && (
                <>
                    <ReportKpiGrid items={[
                        { label: 'Returns', value: formatNumber(s.returns), sub: s.returnRatePct !== null ? `${s.returnRatePct}% of ${formatNumber(s.erpBills)} ERP bills` : 'No ERP bills in the period', icon: <RotateCcw className="w-4 h-4" /> },
                        { label: 'Refunded', value: rupees0(s.value), sub: `Credit note ${rupees0(s.creditNote)} · bank ${rupees0(s.bank)}`, icon: <Wallet className="w-4 h-4" /> },
                        { label: 'Cash refunds', value: rupees0(s.cash), sub: `${formatNumber(cashAbove)} above ${rupees0(data.limits.cashRefund)}`, tone: cashAbove > 0 ? 'warning' : 'default', icon: <Banknote className="w-4 h-4" /> },
                        { label: 'Flagged returns', value: formatNumber(flagged), sub: `${formatNumber(s.byLevel.CRITICAL)} critical · ${formatNumber(s.byLevel.HIGH)} high · ${formatNumber(s.byLevel.MEDIUM)} medium`, tone: s.byLevel.CRITICAL > 0 ? 'negative' : flagged > 0 ? 'warning' : 'default', icon: <ShieldAlert className="w-4 h-4" /> },
                    ]} />
                    <ReportAnalysisGrid>
                        <ReportAnalysisCard title="Why returns were flagged" subtitle="Returns matching each rule (one return can match several)" autoHeight empty={s.byFlag.length === 0}>
                            <ReportRankList items={s.byFlag.map(f => ({ label: `${f.label} · ${LEVEL_LABEL[f.level]}`, value: f.returns, display: `${formatNumber(f.returns)} · ${rupees0(f.value)}` }))} />
                        </ReportAnalysisCard>
                        <ReportAnalysisCard title="Refunds by cashier" subtitle="Who processed the returns, by refund value" autoHeight empty={s.byCashier.length === 0}>
                            <ReportRankList items={s.byCashier.slice(0, 10).map(c => ({ label: `${c.cashier} · ${formatNumber(c.returns)} returns${c.cash ? ` · cash ${rupees0(c.cash)}` : ''}`, value: c.value, display: rupees0(c.value) }))} />
                        </ReportAnalysisCard>
                    </ReportAnalysisGrid>
                    <ReportAnalysisCard title="Return reasons" subtitle="Returned lines by the reason entered at the counter" autoHeight empty={s.byReason.length === 0}>
                        <ReportRankList items={s.byReason.slice(0, 10).map(r => ({ label: `${r.reason} · ${formatNumber(r.lines)} line${r.lines === 1 ? '' : 's'}`, value: r.value, display: rupees0(r.value) }))} />
                    </ReportAnalysisCard>
                    <ReportTable
                        title="Returns"
                        subtitle="One row per return; newest first"
                        columns={columns}
                        rowKey={r => r.id}
                        {...tableProps}
                        emptyMessage="No returns match the search or filters."
                    />
                </>
            )}
        </ReportPageShell>
    );
};

export default ReturnsAuditReport;
