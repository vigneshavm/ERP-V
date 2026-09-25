import React, { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CalendarDays, FileWarning, IndianRupee, Receipt } from 'lucide-react';
import { formatCurrency, formatNumber, formatReportDate } from '@/utils/formatters';
import {
    BAR_RADIUS, CHART_PRIMARY, FilterSelect, ReportAnalysisCard, ReportAnalysisGrid, ReportChartTooltip, ReportKpiGrid, ReportPageShell,
    ReportRankList, ReportTable, axisProps, compactRupees, cursorFill, gridProps, useClientReportTable, useReportData, useReportPeriod,
} from '../components';
import type { ReportColumn, ResolvedSource } from '../components';
import { filterSummary } from '../utils/reportExport';

type Flag = 'NO_RECEIPT' | 'POSSIBLE_DUPLICATE' | 'UNUSUALLY_LARGE' | 'CASH_ABOVE_LIMIT' | 'CASH_NOT_ALLOWED';

export interface ExpenseRow {
    id: string; expenseNo: string; date: string; category: string; amount: number; paymentMethod: string;
    hasReceipt: boolean; description: string; recordedBy: string; flags: Flag[];
}

export interface ExpenseAnalysisData {
    range: { from: string; to: string };
    summary: {
        total: number; count: number; days: number; avgPerDay: number; withReceipt: number; cash: number; flagged: number;
        byCategory: { category: string; count: number; amount: number; sharePct: number; budget: number | null; overBudget: boolean }[];
        byMethod: { method: string; count: number; amount: number }[];
        byRecorder: { name: string; count: number; amount: number }[];
        byDay: { date: string; amount: number }[];
        byMonth: { month: string; amount: number }[];
        flagCounts: { flag: Flag; label: string; count: number; amount: number }[];
    };
    rows: ExpenseRow[];
    rules: { receiptFrom: number; duplicateDays: number; largeMultiple: number; largeFrom: number; cashLimit: number; historyDays: number; labels: Record<Flag, string> };
    asOf: string | null;
    source?: ResolvedSource;
}

const rupees0 = (v: number) => formatCurrency(v, { fractionDigits: 0 });
const METHOD_LABEL: Record<string, string> = { cash: 'Cash', upi: 'UPI', card: 'Card', cheque: 'Cheque', bank_transfer: 'Bank transfer' };
const methodLabel = (m: string) => METHOD_LABEL[m] ?? m;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Expense Analysis (Expenses › Tracker, and Reports › Transaction Reports): every ERP expense in the period for the
 * whole shop, by category against budget, payment method and who recorded it, with rule-based flags. Replaced the
 * "Expense Intelligence" screen, whose claimants, claims and GST figures were hardcoded.
 */
const ExpenseAnalysisReport: React.FC = () => {
    const period = useReportPeriod('this-month');
    const { from, to } = period.period;
    const { data, loading, error, reload } = useReportData<ExpenseAnalysisData>('/api/reports/finance/expenses', { from, to }, { enabled: Boolean(from && to) });
    const [category, setCategory] = useState('');
    const [method, setMethod] = useState('');
    const [flag, setFlag] = useState('');
    const s = data?.summary;
    const labels = data?.rules.labels;

    const rows = useMemo(() => (data?.rows ?? []).filter(r =>
        (!category || r.category === category) && (!method || r.paymentMethod === method) &&
        (!flag || (flag === 'ANY' ? r.flags.length > 0 : r.flags.includes(flag as Flag)))), [data, category, method, flag]);

    const columns = useMemo<ReportColumn<ExpenseRow>[]>(() => [
        { key: 'date', header: 'Date', type: 'date', value: r => r.date, sortable: true },
        { key: 'expenseNo', header: 'Expense', value: r => r.expenseNo, subtext: r => r.description || null },
        { key: 'category', header: 'Category', value: r => r.category },
        { key: 'amount', header: 'Amount', type: 'currency', value: r => r.amount, subtext: r => methodLabel(r.paymentMethod), cellClassName: () => 'font-bold' },
        { key: 'hasReceipt', header: 'Receipt', type: 'status', value: r => (r.hasReceipt ? 'Attached' : 'None'), statusTones: { Attached: 'success', None: 'neutral' } },
        { key: 'recordedBy', header: 'Recorded by', value: r => r.recordedBy },
        { key: 'flags', header: 'Check', value: r => r.flags.map(f => labels?.[f] ?? f).join('; ') || null, cellClassName: r => (r.flags.length ? 'text-amber-700 dark:text-amber-300' : undefined) },
    ], [labels]);
    const { tableProps, filteredRows } = useClientReportTable(rows, columns, { searchPlaceholder: 'Expense no., description or category…' });

    const monthly = (s?.days ?? 0) > 62;
    const chart = useMemo(() => (monthly
        ? (s?.byMonth ?? []).map(m => ({ label: `${MONTHS[Number(m.month.slice(5, 7)) - 1]} ${m.month.slice(2, 4)}`, amount: m.amount }))
        : (s?.byDay ?? []).map(d => ({ label: formatReportDate(d.date).replace(/ \d{4}$/, ''), amount: d.amount }))), [s, monthly]);

    const categories = (s?.byCategory ?? []).map(c => ({ value: c.category, label: c.category }));
    const methods = (s?.byMethod ?? []).map(m => ({ value: m.method, label: methodLabel(m.method) }));
    const flags = [{ value: 'ANY', label: 'Any check' }, ...(s?.flagCounts ?? []).filter(f => f.count).map(f => ({ value: f.flag, label: f.label }))];
    const active = [category, method, flag].filter(Boolean).length;
    const overBudget = s?.byCategory.filter(c => c.overBudget) ?? [];

    return (
        <ReportPageShell<ExpenseRow>
            reportId="expense-analysis"
            period={period}
            filters={{
                activeCount: active,
                onClear: () => { setCategory(''); setMethod(''); setFlag(''); },
                content: (
                    <>
                        <FilterSelect label="Category" value={category} onChange={setCategory} options={categories} allLabel="All categories" />
                        <FilterSelect label="Paid by" value={method} onChange={setMethod} options={methods} allLabel="Any" />
                        <FilterSelect label="Check" value={flag} onChange={setFlag} options={flags} allLabel="All expenses" />
                    </>
                ),
            }}
            note={data ? `Expenses recorded in the ERP by everyone in the shop. Budgets are each category's monthly budget pro-rated to the period. Checks: ${Object.values(data.rules.labels).join('; ')}. "Usual" is the category's median over the last ${data.rules.historyDays} days. Expenses have no approval step, so there are no pending or rejected claims.` : undefined}
            onRefresh={() => reload(true)}
            loading={loading}
            error={error}
            isEmpty={Boolean(s && s.count === 0)}
            meta={{ resolvedSource: data?.source ?? 'mongo', asOf: data?.asOf, recordCount: rows.length }}
            export={{
                columns: [...columns, { key: 'paymentMethod', header: 'Paid by', value: r => methodLabel(r.paymentMethod) }, { key: 'description', header: 'Description', value: r => r.description }],
                fetchRows: () => filteredRows,
                filterSummary: filterSummary([
                    ['Category', category || undefined],
                    ['Paid by', method ? methodLabel(method) : undefined],
                    ['Check', flags.find(f => f.value === flag)?.label],
                ]),
            }}
        >
            {data && s && (
                <>
                    <ReportKpiGrid items={[
                        { label: 'Total expenses', value: rupees0(s.total), sub: `${formatNumber(s.count)} entries`, icon: <IndianRupee className="w-4 h-4" /> },
                        { label: 'Average / day', value: rupees0(s.avgPerDay), sub: `Over ${formatNumber(s.days)} days`, icon: <CalendarDays className="w-4 h-4" /> },
                        { label: 'Paid in cash', value: rupees0(s.cash), sub: s.total ? `${Math.round((s.cash / s.total) * 100)}% of expenses` : undefined, icon: <Receipt className="w-4 h-4" /> },
                        { label: 'Need a check', value: formatNumber(s.flagged), sub: `${formatNumber(s.count - s.withReceipt)} without a receipt${overBudget.length ? ` · ${overBudget.length} over budget` : ''}`, tone: s.flagged ? 'warning' : 'default', icon: <FileWarning className="w-4 h-4" /> },
                    ]} />
                    <ReportAnalysisCard title={monthly ? 'Expenses by month' : 'Expenses by day'} subtitle="Total recorded" empty={chart.length === 0}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chart} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                                <CartesianGrid {...gridProps} />
                                <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={16} />
                                <YAxis {...axisProps} width={56} tickFormatter={compactRupees} />
                                <Tooltip cursor={cursorFill} content={<ReportChartTooltip format={v => rupees0(v)} />} />
                                <Bar dataKey="amount" name="Expenses" fill={CHART_PRIMARY} radius={BAR_RADIUS} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ReportAnalysisCard>
                    <ReportAnalysisGrid>
                        <ReportAnalysisCard title="By category" subtitle="Against the pro-rated monthly budget, where one is set" autoHeight empty={s.byCategory.length === 0}>
                            <ReportRankList items={s.byCategory.slice(0, 10).map(c => ({
                                label: `${c.category} · ${c.sharePct}%${c.budget ? ` · budget ${rupees0(c.budget)}${c.overBudget ? ' · over' : ''}` : ''}`,
                                value: c.amount, display: rupees0(c.amount),
                            }))} />
                        </ReportAnalysisCard>
                        <ReportAnalysisCard title="Checks" subtitle="Expenses matching each rule (one can match several)" autoHeight>
                            <ReportRankList items={s.flagCounts.map(f => ({ label: `${f.label} · ${formatNumber(f.count)}`, value: f.amount, display: rupees0(f.amount) }))} />
                        </ReportAnalysisCard>
                    </ReportAnalysisGrid>
                    <ReportAnalysisGrid>
                        <ReportAnalysisCard title="By payment method" autoHeight empty={s.byMethod.length === 0}>
                            <ReportRankList items={s.byMethod.map(m => ({ label: `${methodLabel(m.method)} · ${formatNumber(m.count)}`, value: m.amount, display: rupees0(m.amount) }))} />
                        </ReportAnalysisCard>
                        <ReportAnalysisCard title="Recorded by" subtitle="Who entered the expenses" autoHeight empty={s.byRecorder.length === 0}>
                            <ReportRankList items={s.byRecorder.map(p => ({ label: `${p.name} · ${formatNumber(p.count)}`, value: p.amount, display: rupees0(p.amount) }))} />
                        </ReportAnalysisCard>
                    </ReportAnalysisGrid>
                    <ReportTable title="Expenses" subtitle="Newest first" columns={columns} rowKey={r => r.id} {...tableProps} emptyMessage="No expenses match the search or filters." />
                </>
            )}
        </ReportPageShell>
    );
};

export default ExpenseAnalysisReport;
