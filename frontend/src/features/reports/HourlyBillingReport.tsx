import React, { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Clock, IndianRupee, Receipt, TrendingUp } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import {
    BAR_RADIUS, CHART_PRIMARY, ReportAnalysisCard, ReportAnalysisGrid, ReportChartTooltip, ReportColumn, ReportKpiGrid, ReportPageShell,
    ReportTable, axisProps, compactNumber, compactRupees, cursorFill, gridProps, useClientReportTable, useReportPeriod,
} from './components';
import { useShopSales, withBasis } from './analytics/shopSales';

interface HourRow {
    hour: number;
    label: string;
    revenue: number;
    transactions: number;
}

const rupees0 = (v: number) => formatCurrency(v, { fractionDigits: 0 });
const hourLabel = (h: number) => (h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`);

interface TableRow extends HourRow { avgBill: number | null }

const COLUMNS: ReportColumn<TableRow>[] = [
    { key: 'hour', header: 'Time slot', value: r => r.hour, render: r => `${r.label} – ${hourLabel((r.hour + 1) % 24)}`, sortable: true },
    { key: 'transactions', header: 'Bills', type: 'number', value: r => r.transactions },
    { key: 'revenue', header: 'Sales', type: 'currency', fractionDigits: 0, value: r => r.revenue, cellClassName: () => 'font-bold' },
    { key: 'avgBill', header: 'Avg / bill', type: 'currency', fractionDigits: 0, value: r => r.avgBill },
];

const EXPORT_COLUMNS: ReportColumn<TableRow>[] = [
    { key: 'label', header: 'Hour', value: r => r.label },
    { key: 'transactions', header: 'Bills', value: r => r.transactions },
    { key: 'revenue', header: 'Sales', value: r => r.revenue },
    { key: 'avgBill', header: 'Average bill', value: r => r.avgBill },
];

/** Hourly Billing Analysis: bills and sales by hour of day across the selected period (peak-hour planning). */
const HourlyBillingReport: React.FC = () => {
    const period = useReportPeriod('this-month');
    const { from, to } = period.period;
    const shop = useShopSales<HourRow>('hour', from, to);
    const hours = shop.rows;

    const rows: TableRow[] = useMemo(() => hours.map(h => ({ ...h, avgBill: h.transactions ? h.revenue / h.transactions : null })), [hours]);
    const open = rows.filter(r => r.transactions > 0);
    const totalBills = rows.reduce((a, r) => a + r.transactions, 0);
    const totalRevenue = rows.reduce((a, r) => a + r.revenue, 0);
    const peakBills = [...rows].sort((a, b) => b.transactions - a.transactions)[0];
    const peakSales = [...rows].sort((a, b) => b.revenue - a.revenue)[0];
    // Charts show only the trading day (first to last hour with a bill), not 24 empty slots.
    const first = open.length ? Math.min(...open.map(r => r.hour)) : 0;
    const last = open.length ? Math.max(...open.map(r => r.hour)) : 23;
    const chartRows = rows.filter(r => r.hour >= first && r.hour <= last);
    const { tableProps, filteredRows } = useClientReportTable(open, COLUMNS, { pageSize: 24 });

    return (
        <ReportPageShell<TableRow>
            reportId="hourly-billing"
            period={period}
            note={shop.loaded ? withBasis('Bills and sales by the hour the bill was made, added up over every day in the period. Cancelled bills excluded.', shop.basis) : undefined}
            onRefresh={() => shop.reload(true)}
            loading={shop.loading}
            error={shop.error}
            isEmpty={shop.loaded && totalBills === 0}
            meta={{ resolvedSource: shop.source, asOf: shop.asOf, recordCount: open.length }}
            export={{ columns: EXPORT_COLUMNS, fetchRows: () => filteredRows }}
        >
            {shop.loaded && peakBills && peakSales && (
                <>
                    <ReportKpiGrid items={[
                        { label: 'Busiest hour', value: peakBills.label, sub: `${formatNumber(peakBills.transactions)} bills`, icon: <Clock className="w-4 h-4" /> },
                        { label: 'Top sales hour', value: peakSales.label, sub: rupees0(peakSales.revenue), icon: <TrendingUp className="w-4 h-4" /> },
                        { label: 'Bills', value: formatNumber(totalBills), sub: open.length ? `${formatNumber(Math.round(totalBills / open.length))} per trading hour` : undefined, icon: <Receipt className="w-4 h-4" /> },
                        { label: 'Total sales', value: rupees0(totalRevenue), icon: <IndianRupee className="w-4 h-4" /> },
                    ]} />
                    <ReportAnalysisGrid>
                        <ReportAnalysisCard title="Bills by hour" subtitle="Number of bills made in each hour">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartRows} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                                    <CartesianGrid {...gridProps} />
                                    <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" />
                                    <YAxis {...axisProps} width={40} tickFormatter={compactNumber} allowDecimals={false} />
                                    <Tooltip cursor={cursorFill} content={<ReportChartTooltip format={v => `${formatNumber(v)} bills`} />} />
                                    <Bar dataKey="transactions" name="Bills" fill={CHART_PRIMARY} radius={BAR_RADIUS} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ReportAnalysisCard>
                        <ReportAnalysisCard title="Sales by hour" subtitle="Sales value in each hour">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartRows} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                                    <CartesianGrid {...gridProps} />
                                    <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" />
                                    <YAxis {...axisProps} width={52} tickFormatter={compactRupees} />
                                    <Tooltip cursor={cursorFill} content={<ReportChartTooltip format={v => rupees0(v)} />} />
                                    <Bar dataKey="revenue" name="Sales" fill={CHART_PRIMARY} radius={BAR_RADIUS} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ReportAnalysisCard>
                    </ReportAnalysisGrid>
                    <ReportTable
                        title="Hourly ledger"
                        subtitle="Hours with at least one bill"
                        columns={COLUMNS}
                        rowKey={r => String(r.hour)}
                        {...tableProps}
                        search={undefined}
                    />
                </>
            )}
        </ReportPageShell>
    );
};

export default HourlyBillingReport;
