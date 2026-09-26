import React, { useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Ban, Calendar, IndianRupee, TrendingUp } from 'lucide-react';
import { formatCurrency, formatNumber, formatReportDate } from '@/utils/formatters';
import {
    BAR_RADIUS, CHART_PRIMARY, ReportAnalysisCard, ReportAnalysisGrid, ReportChartTooltip, ReportColumn, ReportKpiGrid, ReportPageShell,
    ReportRankList, ReportTable, axisProps, compactNumber, compactRupees, cursorFill, gridProps, useClientReportTable, useReportPeriod,
} from './components';
import { DayBillsDialog } from './analytics/DayBillsDialog';
import { useShopSales, withBasis } from './analytics/shopSales';

interface DayRow {
    date: string;
    revenue: number;
    transactions: number;
    cancelledCount: number;
    cancelledAmount: number;
    cash: number;
    card: number;
    credit: number;
    upi: number;
}

interface TableRow extends DayRow { avgBill: number | null }

type Metric = 'revenue' | 'transactions';

const rupees0 = (v: number) => formatCurrency(v, { fractionDigits: 0 });
const shortDate = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const COLUMNS: ReportColumn<TableRow>[] = [
    { key: 'date', header: 'Date', type: 'date', value: r => r.date, render: r => (r.date === 'Total' ? 'Total' : formatReportDate(r.date)), sortable: true },
    { key: 'transactions', header: 'Bills', type: 'number', value: r => r.transactions },
    { key: 'revenue', header: 'Sales', type: 'currency', fractionDigits: 0, value: r => r.revenue, cellClassName: () => 'font-bold' },
    { key: 'cash', header: 'Cash', type: 'currency', fractionDigits: 0, value: r => r.cash },
    { key: 'card', header: 'Card', type: 'currency', fractionDigits: 0, value: r => r.card },
    { key: 'credit', header: 'Credit', type: 'currency', fractionDigits: 0, value: r => r.credit },
    { key: 'upi', header: 'UPI', type: 'currency', fractionDigits: 0, value: r => r.upi },
    { key: 'cancelledCount', header: 'Cancelled', type: 'number', value: r => r.cancelledCount || null, cellClassName: r => (r.cancelledCount ? 'font-bold text-danger!' : undefined) },
    { key: 'cancelledAmount', header: 'Cancelled amt', type: 'currency', fractionDigits: 0, value: r => r.cancelledAmount || null, cellClassName: r => (r.cancelledAmount ? 'font-bold text-danger!' : undefined) },
    { key: 'avgBill', header: 'Avg / bill', type: 'currency', fractionDigits: 0, value: r => r.avgBill },
];

const EXPORT_COLUMNS: ReportColumn<TableRow>[] = COLUMNS.map(c => ({ ...c, value: c.key === 'cancelledCount' ? (r: TableRow) => r.cancelledCount : c.key === 'cancelledAmount' ? (r: TableRow) => r.cancelledAmount : c.value }));

/**
 * Daily Sales Report (the reference layout for every report): day-by-day sales with payment split, from the shop's
 * sales2 table grouped by date in SQL mode, else from the ERP POS invoices (both on the server). Clicking a day opens every bill of that day.
 */
const DailySalesReport: React.FC = () => {
    const period = useReportPeriod('this-month');
    const { from, to } = period.period;
    const shop = useShopSales<DayRow>('day', from, to);
    const [metric, setMetric] = useState<Metric>('revenue');
    const [openDay, setOpenDay] = useState<string | null>(null);

    const days = shop.rows;

    const rows: TableRow[] = useMemo(() => days.map(d => ({ ...d, avgBill: d.transactions ? d.revenue / d.transactions : null })), [days]);
    const totals = useMemo(() => days.reduce((a, d) => ({
        revenue: a.revenue + d.revenue, transactions: a.transactions + d.transactions,
        cancelledCount: a.cancelledCount + d.cancelledCount, cancelledAmount: a.cancelledAmount + d.cancelledAmount,
        cash: a.cash + d.cash, card: a.card + d.card, credit: a.credit + d.credit, upi: a.upi + d.upi,
    }), { revenue: 0, transactions: 0, cancelledCount: 0, cancelledAmount: 0, cash: 0, card: 0, credit: 0, upi: 0 }), [days]);
    const tradingDays = days.filter(d => d.transactions > 0).length;
    const bestDay = [...days].sort((a, b) => b.revenue - a.revenue)[0];
    const chartData = days.map(d => ({ ...d, label: shortDate(d.date) }));
    const payments = [
        { label: 'Cash', value: totals.cash }, { label: 'Card', value: totals.card },
        { label: 'UPI', value: totals.upi }, { label: 'Credit', value: totals.credit },
    ].sort((a, b) => b.value - a.value);
    const { tableProps, filteredRows } = useClientReportTable(rows, COLUMNS, { pageSize: 31 });

    const metricSwitch = (
        <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 text-xs font-bold" role="group" aria-label="Chart measure">
            {(['revenue', 'transactions'] as const).map(m => (
                <button
                    key={m}
                    type="button"
                    aria-pressed={metric === m}
                    onClick={() => setMetric(m)}
                    className={`px-2.5 py-1 rounded-md ${metric === m ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                >
                    {m === 'revenue' ? 'Sales' : 'Bills'}
                </button>
            ))}
        </div>
    );

    return (
        <ReportPageShell<TableRow>
            reportId="daily-sales"
            period={period}
            note={shop.loaded ? withBasis('One row per calendar day. Cancelled bills are excluded from sales and payment split, and counted separately. Click a day to see its bills.', shop.basis) : undefined}
            onRefresh={() => shop.reload(true)}
            loading={shop.loading}
            error={shop.error}
            isEmpty={shop.loaded && totals.transactions === 0 && totals.cancelledCount === 0}
            meta={{ resolvedSource: shop.source, asOf: shop.asOf, recordCount: rows.length }}
            export={{ columns: EXPORT_COLUMNS, fetchRows: () => filteredRows }}
        >
            {shop.loaded && (
                <>
                    <ReportKpiGrid items={[
                        { label: 'Total sales', value: rupees0(totals.revenue), sub: `${formatNumber(totals.transactions)} bills over ${formatNumber(tradingDays)} day${tradingDays === 1 ? '' : 's'}`, icon: <IndianRupee className="w-4 h-4" /> },
                        { label: 'Best day', value: bestDay ? rupees0(bestDay.revenue) : '—', sub: bestDay ? formatReportDate(bestDay.date) : undefined, icon: <TrendingUp className="w-4 h-4" /> },
                        { label: 'Average / day', value: tradingDays ? rupees0(totals.revenue / tradingDays) : '—', sub: 'Days with at least one bill', icon: <Calendar className="w-4 h-4" /> },
                        { label: 'Cancelled amount', value: rupees0(totals.cancelledAmount), sub: `${formatNumber(totals.cancelledCount)} bill${totals.cancelledCount === 1 ? '' : 's'} cancelled`, tone: totals.cancelledAmount > 0 ? 'negative' : 'default', icon: <Ban className="w-4 h-4" /> },
                    ]} />
                    <ReportAnalysisCard
                        title="Daily sales"
                        subtitle={metric === 'revenue' ? 'Sales value for each day in the period' : 'Number of bills for each day in the period'}
                        actions={metricSwitch}
                        height="lg"
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            {metric === 'revenue' ? (
                                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                                    <CartesianGrid {...gridProps} />
                                    <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={24} />
                                    <YAxis {...axisProps} width={56} tickFormatter={compactRupees} />
                                    <Tooltip cursor={{ stroke: 'var(--chart-axis)', strokeWidth: 1 }} content={<ReportChartTooltip format={v => rupees0(v)} />} />
                                    <Area type="monotone" dataKey="revenue" name="Sales" stroke={CHART_PRIMARY} strokeWidth={2} fill={CHART_PRIMARY} fillOpacity={0.12} activeDot={{ r: 4 }} />
                                </AreaChart>
                            ) : (
                                <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                                    <CartesianGrid {...gridProps} />
                                    <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={24} />
                                    <YAxis {...axisProps} width={40} tickFormatter={compactNumber} allowDecimals={false} />
                                    <Tooltip cursor={cursorFill} content={<ReportChartTooltip format={v => `${formatNumber(v)} bills`} />} />
                                    <Bar dataKey="transactions" name="Bills" fill={CHART_PRIMARY} radius={BAR_RADIUS} />
                                </BarChart>
                            )}
                        </ResponsiveContainer>
                    </ReportAnalysisCard>
                    <ReportAnalysisGrid>
                        <ReportAnalysisCard title="Payment mix" subtitle="Sales by payment method" autoHeight empty={totals.revenue === 0}>
                            <ReportRankList items={payments.map(p => ({
                                label: `${p.label} · ${totals.revenue ? Math.round((p.value / totals.revenue) * 1000) / 10 : 0}%`,
                                value: p.value,
                                display: rupees0(p.value),
                            }))} />
                        </ReportAnalysisCard>
                        <ReportAnalysisCard title="Best days" subtitle="Highest sales days in the period" autoHeight empty={days.length === 0}>
                            <ReportRankList items={[...days].sort((a, b) => b.revenue - a.revenue).slice(0, 7).map(d => ({
                                label: `${formatReportDate(d.date)} · ${formatNumber(d.transactions)} bills`,
                                value: d.revenue,
                                display: rupees0(d.revenue),
                            }))} />
                        </ReportAnalysisCard>
                    </ReportAnalysisGrid>
                    <ReportTable
                        title="Daily sales ledger"
                        subtitle="Click a day to see every bill billed that day"
                        columns={COLUMNS}
                        rowKey={r => r.date}
                        {...tableProps}
                        search={undefined}
                        onRowClick={r => setOpenDay(r.date)}
                        pinnedBottomRows={rows.length > 1 ? [{
                            date: 'Total', ...totals, avgBill: totals.transactions ? totals.revenue / totals.transactions : null,
                        }] : undefined}
                        emptyMessage="No sales in this period."
                    />
                    {openDay && <DayBillsDialog date={openDay} onClose={() => setOpenDay(null)} />}
                </>
            )}
        </ReportPageShell>
    );
};

export default DailySalesReport;
