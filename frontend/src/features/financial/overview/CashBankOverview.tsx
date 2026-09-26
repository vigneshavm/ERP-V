import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, Banknote, Landmark, ReceiptText, Wallet } from 'lucide-react';
import { formatNumber } from '@/utils/formatters';
import {
    BAR_RADIUS, CHART_SERIES, LegendItem, ReportAnalysisCard, ReportAnalysisGrid, ReportChartTooltip, ReportKpiGrid, ReportTable,
    axisProps, compactRupees, cursorFill, gridProps, useReportData,
} from '../../reports/components';
import type { ReportColumn } from '../../reports/components';
import { FinancePage } from './FinancePage';
import { ALERT_STYLE, LOAN_HEALTH_LABEL, LOAN_HEALTH_TONE, dateText, rupees0 } from './cashBankFormat';
import type { BankRow, CashBankOverviewData, ChequeRow, LoanRow, OverdueBill } from './cashBankTypes';

const BANK_COLUMNS: ReportColumn<BankRow>[] = [
    { key: 'name', header: 'Account', value: r => r.name, subtext: r => [r.type, r.branch].filter(Boolean).join(' · ') || null,
        render: r => <Link to={`/cashbank/ledger/${r.id}`} className="font-bold text-primary hover:underline">{r.name}</Link> },
    { key: 'balance', header: 'Balance (ERP)', type: 'currency', value: r => r.balance, cellClassName: r => (r.balance < 0 ? 'text-rose-600 font-bold' : 'font-bold') },
    { key: 'unreconciled', header: 'Not matched to statement', type: 'number', value: r => r.unreconciled || null, subtext: r => (r.unreconciled ? rupees0(r.unreconciledAmount) : null) },
    { key: 'unreconciledOld', header: 'Older than 30 days', type: 'number', value: r => r.unreconciledOld || null, cellClassName: r => (r.unreconciledOld ? 'text-amber-600 font-bold' : undefined) },
    { key: 'status', header: 'Status', type: 'status', value: r => (r.status === 'inactive' ? 'Inactive' : 'Active'), statusTones: { Active: 'success', Inactive: 'neutral' } },
];

const LOAN_COLUMNS: ReportColumn<LoanRow>[] = [
    { key: 'name', header: 'Loan', value: r => r.name, subtext: r => `${r.interestRate}% · ${r.termMonths} months` },
    { key: 'emi', header: 'EMI', type: 'currency', fractionDigits: 0, value: r => r.emi },
    { key: 'pending', header: 'Pending', type: 'currency', fractionDigits: 0, value: r => r.pending, subtext: r => `${r.paidPct}% repaid` },
    { key: 'nextDue', header: 'Next EMI', type: 'date', value: r => r.nextDue, subtext: r => `${r.payments} of ${r.termMonths} paid` },
    { key: 'health', header: 'Status', type: 'status', value: r => LOAN_HEALTH_LABEL[r.health], statusTones: LOAN_HEALTH_TONE },
];

const CHEQUE_COLUMNS: ReportColumn<ChequeRow>[] = [
    { key: 'date', header: 'Cheque date', type: 'date', value: r => r.date },
    { key: 'number', header: 'Cheque', value: r => r.number, subtext: r => r.bank },
    { key: 'payee', header: 'Party', value: r => r.payee },
    { key: 'type', header: 'Type', type: 'status', value: r => (r.type === 'RECEIVED' ? 'To collect' : 'To pay'), statusTones: { 'To collect': 'info', 'To pay': 'warning' } },
    { key: 'amount', header: 'Amount', type: 'currency', value: r => r.amount },
];

const BILL_COLUMNS: ReportColumn<OverdueBill>[] = [
    { key: 'billNo', header: 'Bill', value: r => r.billNo, subtext: r => r.supplier },
    { key: 'due', header: 'Due', type: 'date', value: r => r.due, subtext: r => `${formatNumber(r.daysOverdue)} days overdue` },
    { key: 'outstanding', header: 'To pay', type: 'currency', value: r => r.outstanding },
];

/**
 * Finance › Overview: cash in hand (last count + movement since), bank balances, loans, pending cheques and
 * overdue supplier bills, with alerts that come only from recorded data. Replaced the Finance Agent dashboard and
 * the Cash / Bank "intelligence" screens, which were hardcoded.
 */
const CashBankOverview: React.FC = () => {
    const { data, loading, error, reload } = useReportData<CashBankOverviewData>('/api/reports/finance/cash-bank-overview', {});
    const chart = useMemo(() => (data?.trend.byDay ?? []).map(d => ({ label: dateText(d.date).replace(/ \d{4}$/, ''), inflow: d.inflow, outflow: d.outflow })), [data]);

    const cash = data?.cash;
    const cashKpi = !cash ? null : cash.estimated === null
        ? { label: 'Cash in hand', value: 'Not counted', sub: 'Do a Petty Cash close to start', tone: 'warning' as const, icon: <Banknote className="w-4 h-4" /> }
        : {
            label: 'Cash in hand (estimated)', value: rupees0(cash.estimated),
            sub: `Counted ${rupees0(cash.count!.counted)} on ${dateText(cash.count!.date)}`,
            tone: cash.estimated < 0 ? 'negative' as const : 'default' as const, icon: <Banknote className="w-4 h-4" />,
        };

    return (
        <FinancePage
            title="Cash & Bank Overview"
            subtitle="Cash in hand, bank balances, loans and what is due, for the whole shop"
            basis={data ? `Cash = physical cash at the last Petty Cash close plus cash in and minus cash out since then (shop cash sales and ERP receipts, payments and expenses, as in the Cash Flow report), adjusted for cash moved to or from the bank. Bank balances are as kept in the ERP; match them to the bank statement under Reconciliation.${data.source === 'sql' && data.asOf ? ` Shop sales up to ${dateText(data.asOf)}.` : ''}` : undefined}
            loading={loading}
            error={error}
            hasData={Boolean(data)}
            onRefresh={() => reload(true)}
        >
            {data && cash && cashKpi && (
                <>
                    <ReportKpiGrid items={[
                        cashKpi,
                        { label: 'Bank balance', value: rupees0(data.bankTotal), sub: `${formatNumber(data.banks.filter(b => b.status !== 'inactive').length)} active accounts`, tone: data.bankTotal < 0 ? 'negative' : 'default', icon: <Landmark className="w-4 h-4" /> },
                        { label: 'Loans outstanding', value: rupees0(data.loanTotals.pending), sub: data.loanTotals.active ? `EMIs ${rupees0(data.loanTotals.monthlyEmi)}/month · next ${dateText(data.loanTotals.nextDue)}` : 'No active loans', icon: <Wallet className="w-4 h-4" /> },
                        { label: 'Supplier bills overdue', value: rupees0(data.overdueBills.amount), sub: `${formatNumber(data.overdueBills.count)} bills · cheques to pay ${rupees0(data.cheques.toPay)}`, tone: data.overdueBills.count ? 'warning' : 'default', icon: <ReceiptText className="w-4 h-4" /> },
                    ]} />

                    <section aria-label="Alerts" className="space-y-2">
                        {data.alerts.length === 0 ? (
                            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
                                Nothing needs attention: cash was counted recently, no EMIs or cheques are overdue, and bank entries are matched.
                            </p>
                        ) : data.alerts.map(a => (
                            <p key={`${a.code}-${a.text}`} className={`flex items-start gap-2 rounded-md border px-4 py-2.5 text-sm font-medium ${ALERT_STYLE[a.level]}`}>
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                <span>{a.text}</span>
                            </p>
                        ))}
                    </section>

                    <ReportAnalysisCard
                        title="Money in and out, last 30 days"
                        subtitle={`In ${rupees0(data.trend.totals.cashIn + data.trend.totals.bankIn)} · out ${rupees0(data.trend.totals.cashOut + data.trend.totals.bankOut)} · net ${rupees0(data.trend.totals.net)}`}
                        legend={<><LegendItem color={CHART_SERIES[0]} label="Money in" /><LegendItem color={CHART_SERIES[1]} label="Money out" /></>}
                        empty={chart.every(d => !d.inflow && !d.outflow)}
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chart} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                                <CartesianGrid {...gridProps} />
                                <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={20} />
                                <YAxis {...axisProps} width={56} tickFormatter={compactRupees} />
                                <Tooltip cursor={cursorFill} content={<ReportChartTooltip format={v => rupees0(v)} />} />
                                <Bar dataKey="inflow" name="Money in" fill={CHART_SERIES[0]} radius={BAR_RADIUS} />
                                <Bar dataKey="outflow" name="Money out" fill={CHART_SERIES[1]} radius={BAR_RADIUS} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ReportAnalysisCard>

                    <ReportAnalysisGrid>
                        <ReportAnalysisCard title="Cash since the last count" subtitle={cash.count ? `Counted ${dateText(cash.count.date)}${cash.count.counters > 1 ? ` across ${cash.count.counters} counters` : ''}` : 'No count yet'} autoHeight>
                            {cash.count ? (
                                <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm tabular-nums">
                                    <dt className="text-slate-500">Counted</dt><dd className="text-right font-bold">{rupees0(cash.count.counted)}</dd>
                                    <dt className="text-slate-500">Expected at that close</dt><dd className="text-right">{rupees0(cash.count.expected)}</dd>
                                    <dt className="text-slate-500">Difference</dt><dd className={`text-right font-bold ${cash.count.variance < 0 ? 'text-rose-600' : cash.count.variance > 0 ? 'text-amber-600' : ''}`}>{rupees0(cash.count.variance)}</dd>
                                    <dt className="text-slate-500">Cash in since</dt><dd className="text-right">{rupees0(cash.movement.cashIn)}</dd>
                                    <dt className="text-slate-500">Cash out since</dt><dd className="text-right">{rupees0(cash.movement.cashOut)}</dd>
                                    <dt className="text-slate-500">Withdrawn from bank</dt><dd className="text-right">{rupees0(cash.movement.fromBank)}</dd>
                                    <dt className="text-slate-500">Deposited to bank</dt><dd className="text-right">{rupees0(cash.movement.toBank)}</dd>
                                    <dt className="border-t border-slate-100 pt-2 font-bold dark:border-slate-700">Estimated now</dt><dd className="border-t border-slate-100 pt-2 text-right font-bold dark:border-slate-700">{rupees0(cash.estimated ?? 0)}</dd>
                                </dl>
                            ) : (
                                <p className="text-sm text-slate-500">No Petty Cash close has been saved, so there is no counted cash to start from. <Link to="/finance/petty-cash" className="font-bold text-primary hover:underline">Do a close</Link>.</p>
                            )}
                        </ReportAnalysisCard>
                        <ReportAnalysisCard title="Cheques pending" subtitle={`To collect ${rupees0(data.cheques.toReceive)} · to pay ${rupees0(data.cheques.toPay)}`} autoHeight empty={data.cheques.rows.length === 0}>
                            <ul className="divide-y divide-slate-100 text-sm dark:divide-slate-700">
                                {data.cheques.rows.slice(0, 6).map(c => (
                                    <li key={c.id} className="flex items-center justify-between gap-3 py-2">
                                        <span className="min-w-0 truncate">{c.type === 'RECEIVED' ? 'From' : 'To'} {c.payee} <span className="text-slate-400">· {dateText(c.date)}{c.date < data.today ? ' · past date' : ''}</span></span>
                                        <span className="font-bold tabular-nums text-main"><span className="text-secondary" aria-label={c.type === 'RECEIVED' ? 'In' : 'Out'}>{c.type === 'RECEIVED' ? '↓ ' : '↑ '}</span>{rupees0(c.amount)}</span>
                                    </li>
                                ))}
                            </ul>
                        </ReportAnalysisCard>
                    </ReportAnalysisGrid>

                    <ReportTable title="Bank accounts" subtitle="Balances as kept in the ERP. Click an account for its ledger." columns={BANK_COLUMNS} rows={data.banks} rowKey={r => r.id} emptyMessage="No bank accounts added yet." />
                    {data.loans.length > 0 && <ReportTable title="Loans" subtitle="EMI k falls k months after the loan start date" columns={LOAN_COLUMNS} rows={data.loans} rowKey={r => r.id} />}
                    {data.cheques.rows.length > 6 && <ReportTable title="All pending cheques" columns={CHEQUE_COLUMNS} rows={data.cheques.rows} rowKey={r => r.id} />}
                    {data.overdueBills.rows.length > 0 && <ReportTable title="Overdue supplier bills" subtitle={`Most overdue first${data.overdueBills.count > data.overdueBills.rows.length ? ` · showing ${data.overdueBills.rows.length} of ${data.overdueBills.count}` : ''}`} columns={BILL_COLUMNS} rows={data.overdueBills.rows} rowKey={r => r.id} />}
                </>
            )}
        </FinancePage>
    );
};

export default CashBankOverview;
