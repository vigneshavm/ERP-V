import React, { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Ban, CalendarDays, IndianRupee, Receipt } from 'lucide-react';
import { formatCurrency, formatNumber, formatQuantity, formatReportDate } from '@/utils/formatters';
import {
    BAR_RADIUS, CHART_PRIMARY, FilterSelect, ReportAnalysisCard, ReportAnalysisGrid, ReportChartTooltip, ReportKpiGrid, ReportPageShell,
    ReportRankList, ReportTable, axisProps, compactRupees, cursorFill, gridProps, useReportPeriod, useServerReport,
} from '../components';
import type { PageInfo, ReportColumn, ResolvedSource } from '../components';
import { filterSummary } from '../utils/reportExport';

interface SalesBillRow {
    source: 'shop' | 'erp';
    id: string;
    ref: string;
    date: string;
    time: string | null;
    customer: string;
    value: number;
    gst: number;
    netSales: number;
    cash: number;
    bank: number;
    credit: number;
}

interface SalesReportData {
    range: { from: string; to: string };
    summary: {
        bills: number; value: number; gst: number; netSales: number; cash: number; bank: number; credit: number;
        days: number; avgPerDay: number; avgBill: number; bestDay: { date: string; value: number; bills: number } | null;
    };
    cancelled: { bills: number; value: number };
    bySource: { shop: { bills: number; value: number }; erp: { bills: number; value: number } };
    byDay: { date: string; value: number; bills: number }[];
    topCustomers: { name: string; bills: number; value: number }[];
    walkIn: { bills: number; value: number };
    topItems: { name: string; qty: number; value: number }[];
    items: SalesBillRow[];
    pagination: PageInfo;
    checks: { overpaidShopBills: number };
    asOf: string | null;
    source?: ResolvedSource;
}

const rupees0 = (v: number) => formatCurrency(v, { fractionDigits: 0 });
const nz = (v: number): number | null => (Math.abs(v) < 0.005 ? null : v);

const SOURCES = [{ value: 'shop', label: 'Textilesoft (shop)' }, { value: 'erp', label: 'ERP POS' }];
const MODES = [{ value: 'cash', label: 'Cash' }, { value: 'bank', label: 'Bank / UPI / card' }, { value: 'credit', label: 'On credit' }];

const COLUMNS: ReportColumn<SalesBillRow>[] = [
    { key: 'date', header: 'Date', type: 'date', value: r => r.date, subtext: r => r.time, sortable: true },
    { key: 'ref', header: 'Bill No', value: r => r.ref, subtext: r => (r.source === 'shop' ? 'Shop' : 'ERP'), sortable: true },
    { key: 'customer', header: 'Customer', value: r => r.customer, sortable: true },
    { key: 'value', header: 'Amount', type: 'currency', value: r => r.value, sortable: true },
    { key: 'gst', header: 'GST', type: 'currency', value: r => r.gst, sortable: true, defaultHidden: true },
    { key: 'netSales', header: 'Net of GST', type: 'currency', value: r => r.netSales, sortable: true, defaultHidden: true },
    { key: 'cash', header: 'Cash', type: 'currency', value: r => nz(r.cash) },
    { key: 'bank', header: 'Bank / UPI', type: 'currency', value: r => nz(r.bank) },
    { key: 'credit', header: 'On credit', type: 'currency', value: r => nz(r.credit) },
];

const EXPORT_COLUMNS: ReportColumn<SalesBillRow>[] = [
    { key: 'date', header: 'Date', value: r => r.date },
    { key: 'time', header: 'Time', value: r => r.time },
    { key: 'source', header: 'Source', value: r => (r.source === 'shop' ? 'Textilesoft' : 'ERP') },
    { key: 'ref', header: 'Bill No', value: r => r.ref },
    { key: 'customer', header: 'Customer', value: r => r.customer },
    { key: 'value', header: 'Amount (incl. GST)', value: r => r.value },
    { key: 'gst', header: 'GST', value: r => r.gst },
    { key: 'netSales', header: 'Net of GST', value: r => r.netSales },
    { key: 'cash', header: 'Cash', value: r => r.cash },
    { key: 'bank', header: 'Bank / UPI / card', value: r => r.bank },
    { key: 'credit', header: 'On credit', value: r => r.credit },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Daily bars up to ~2 months; monthly beyond that so the chart stays readable. */
function chartRows(days: SalesReportData['byDay']) {
    if (days.length <= 62) return { monthly: false, rows: days.map(d => ({ label: formatReportDate(d.date).replace(/ \d{4}$/, ''), value: d.value, bills: d.bills })) };
    const m = new Map<string, { label: string; value: number; bills: number }>();
    for (const d of days) {
        const k = d.date.slice(0, 7);
        const cur = m.get(k) ?? { label: `${MONTHS[Number(k.slice(5, 7)) - 1]} ${k.slice(2, 4)}`, value: 0, bills: 0 };
        cur.value += d.value;
        cur.bills += d.bills;
        m.set(k, cur);
    }
    return { monthly: true, rows: [...m.values()] };
}

/**
 * Sales Report (the golden reference layout): every live sale in the period, Textilesoft bills plus ERP POS
 * invoices. Cancelled bills are excluded from every figure and shown on their own.
 */
const SalesReport: React.FC = () => {
    const period = useReportPeriod('this-month');
    const { from, to } = period.period;
    const [source, setSource] = useState('');
    const [mode, setMode] = useState('');
    const filters = useMemo(() => ({ from, to, source, mode }), [from, to, source, mode]);
    const report = useServerReport<SalesReportData, SalesBillRow>('/api/reports/finance/sales', filters, {
        numericSort: ['date', 'value', 'netSales', 'gst'],
        searchPlaceholder: 'Bill no. or customer…',
        noun: 'bills',
    });
    const { data, loading, error, reload, searchInput } = report;
    const s = data?.summary;
    const chart = useMemo(() => chartRows(data?.byDay ?? []), [data]);
    const active = [source, mode].filter(Boolean).length;

    const notes = [
        'Amounts include GST. Cancelled bills are excluded and shown separately.',
        'Shop bills: cash is the bill total minus card, UPI and other non-cash parts.',
        s && s.days ? `Average per day is over ${formatNumber(s.days)} days (up to the latest day in the shop data).` : '',
        data && data.checks.overpaidShopBills > 0 ? `${formatNumber(data.checks.overpaidShopBills)} shop bills record non-cash payments above the bill total; they were capped at the total.` : '',
    ].filter(Boolean).join(' ');

    return (
        <ReportPageShell<SalesBillRow>
            reportId="sales"
            period={period}
            filters={{
                activeCount: active,
                onClear: () => { setSource(''); setMode(''); },
                content: (
                    <>
                        <FilterSelect label="Source" value={source} onChange={setSource} options={SOURCES} allLabel="Shop and ERP" />
                        <FilterSelect label="Paid by" value={mode} onChange={setMode} options={MODES} allLabel="Any" />
                    </>
                ),
            }}
            note={notes}
            onRefresh={() => reload(true)}
            loading={loading}
            error={error}
            isEmpty={Boolean(s && s.bills === 0 && !active && !searchInput)}
            meta={{ resolvedSource: data?.source, asOf: data?.asOf, recordCount: data?.pagination.total }}
            export={{
                columns: EXPORT_COLUMNS,
                fetchRows: report.fetchAllRows,
                filterSummary: filterSummary([
                    ['Source', SOURCES.find(o => o.value === source)?.label],
                    ['Paid by', MODES.find(o => o.value === mode)?.label],
                    ['Search', report.params.search],
                ]),
            }}
        >
            {data && s && (
                <>
                    <ReportKpiGrid items={[
                        { label: 'Total revenue', value: rupees0(s.value), sub: `${rupees0(s.netSales)} net of GST`, icon: <IndianRupee className="w-4 h-4" /> },
                        { label: 'Total bills', value: formatNumber(s.bills), sub: `Average bill ${rupees0(s.avgBill)}`, icon: <Receipt className="w-4 h-4" /> },
                        { label: 'Average / day', value: rupees0(s.avgPerDay), sub: s.bestDay ? `Best day ${formatReportDate(s.bestDay.date)}: ${rupees0(s.bestDay.value)}` : undefined, icon: <CalendarDays className="w-4 h-4" /> },
                        { label: 'Cancelled amount', value: rupees0(data.cancelled.value), sub: `${formatNumber(data.cancelled.bills)} bills, excluded`, tone: data.cancelled.value > 0 ? 'negative' : 'default', icon: <Ban className="w-4 h-4" /> },
                    ]} />
                    <ReportAnalysisCard
                        title={chart.monthly ? 'Sales by month' : 'Daily sales'}
                        subtitle={`Sales value per ${chart.monthly ? 'month' : 'day'} · Shop ${rupees0(data.bySource.shop.value)} · ERP ${rupees0(data.bySource.erp.value)}`}
                        empty={chart.rows.length === 0}
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chart.rows} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                                <CartesianGrid {...gridProps} />
                                <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={16} />
                                <YAxis {...axisProps} width={56} tickFormatter={compactRupees} />
                                <Tooltip cursor={cursorFill} content={<ReportChartTooltip format={v => formatCurrency(v, { fractionDigits: 0 })} />} />
                                <Bar dataKey="value" name="Sales" fill={CHART_PRIMARY} radius={BAR_RADIUS} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ReportAnalysisCard>
                    <ReportAnalysisGrid>
                        <ReportAnalysisCard
                            title="Top customers"
                            subtitle={`By sales value · walk-in: ${formatNumber(data.walkIn.bills)} bills, ${rupees0(data.walkIn.value)}`}
                            autoHeight
                            empty={data.topCustomers.length === 0}
                        >
                            <ReportRankList items={data.topCustomers.map(c => ({ label: `${c.name} · ${formatNumber(c.bills)} bills`, value: c.value, display: rupees0(c.value) }))} />
                        </ReportAnalysisCard>
                        <ReportAnalysisCard title="Top items" subtitle="By sales value" autoHeight empty={data.topItems.length === 0}>
                            <ReportRankList items={data.topItems.map(i => ({ label: `${i.name} · qty ${formatQuantity(i.qty)}`, value: i.value, display: rupees0(i.value) }))} />
                        </ReportAnalysisCard>
                    </ReportAnalysisGrid>
                    <ReportTable
                        title="Sales transactions"
                        subtitle="One row per bill or invoice; newest first"
                        columns={COLUMNS}
                        rowKey={r => `${r.source}:${r.id}`}
                        {...report.tableProps}
                        emptyMessage="No bills match the search or filters."
                    />
                </>
            )}
        </ReportPageShell>
    );
};

export default SalesReport;
