import React, { useMemo, useState } from 'react';
import { IndianRupee, Percent, TrendingDown, TrendingUp } from 'lucide-react';
import { formatNumber, formatPercentage } from '@/utils/formatters';
import { FilterSelect, ReportKpiGrid, ReportPageShell, ReportTable, useReportPeriod, useServerReport } from '../components';
import type { ReportColumn } from '../components';
import { filterSummary } from '../utils/reportExport';
import { SOURCE_OPTIONS, rupees0 } from './financeFormat';
import type { BillProfitData, ProfitRow } from './financeTypes';

const SHOW_OPTIONS = [
    { value: 'loss', label: 'Loss-making bills' },
    { value: 'uncosted', label: 'Bills with uncosted items' },
];

const COLUMNS: ReportColumn<ProfitRow>[] = [
    { key: 'date', header: 'Date', type: 'date', value: r => r.date, subtext: r => r.time, sortable: true },
    { key: 'ref', header: 'Bill', value: r => r.ref, subtext: r => `${r.source === 'shop' ? 'Shop' : 'ERP'}${r.kind === 'return' ? ' · return' : ''}`, sortable: true },
    { key: 'party', header: 'Customer', value: r => r.party, sortable: true },
    { key: 'netSales', header: 'Net sales', type: 'currency', value: r => r.netSales, sortable: true },
    { key: 'cost', header: 'Cost', type: 'currency', value: r => r.cost, sortable: true },
    {
        key: 'profit', header: 'Profit', type: 'currency', value: r => r.profit, sortable: true,
        render: r => <span className={r.profit < 0 ? 'text-danger dark:text-danger font-bold' : ''}>{rupees0(r.profit)}</span>,
    },
    { key: 'marginPct', header: 'Margin', type: 'percent', value: r => r.marginPct, sortable: true },
    {
        key: 'coverage', header: 'Costed', type: 'percent', value: r => Math.round(r.coverage * 1000) / 10, sortable: true,
        render: r => <span className={r.coverage < 1 ? 'text-warning dark:text-warning' : ''}>{formatPercentage(r.coverage * 100, 0)}</span>,
    },
];

const EXPORT_COLUMNS: ReportColumn<ProfitRow>[] = [
    { key: 'date', header: 'Date', value: r => r.date },
    { key: 'time', header: 'Time', value: r => r.time },
    { key: 'source', header: 'Source', value: r => (r.source === 'shop' ? 'Textilesoft' : 'ERP') },
    { key: 'kind', header: 'Type', value: r => (r.kind === 'return' ? 'Return' : 'Bill') },
    { key: 'ref', header: 'Bill', value: r => r.ref },
    { key: 'party', header: 'Customer', value: r => r.party },
    { key: 'total', header: 'Bill total (incl. GST)', value: r => r.total },
    { key: 'gst', header: 'GST', value: r => r.gst },
    { key: 'netSales', header: 'Net sales', value: r => r.netSales },
    { key: 'cost', header: 'Cost', value: r => r.cost },
    { key: 'profit', header: 'Profit', value: r => r.profit },
    { key: 'marginPct', header: 'Margin %', value: r => r.marginPct },
    { key: 'coverage', header: 'Costed share', value: r => r.coverage },
];

/**
 * Bill-wise Profit: each bill's net sales (excl. GST), cost at lot purchase rates and profit, the Party P&L rule.
 * Lines with no known cost are left out of both sides; "Costed" shows how much of the bill that covers.
 */
const BillWiseProfitReport: React.FC = () => {
    const period = useReportPeriod('this-month');
    const { from, to } = period.period;
    const [source, setSource] = useState('');
    const [show, setShow] = useState('');
    const filters = useMemo(() => ({ from, to, source, show }), [from, to, source, show]);
    const report = useServerReport<BillProfitData, ProfitRow>('/api/reports/finance/bill-profit', filters, {
        numericSort: ['date', 'netSales', 'cost', 'profit', 'marginPct', 'coverage'],
        searchPlaceholder: 'Bill no. or customer…',
        noun: 'bills',
    });
    const { data, loading, error, reload, searchInput } = report;
    const s = data?.summary;
    const active = [source, show].filter(Boolean).length;

    return (
        <ReportPageShell<ProfitRow>
            reportId="bill-wise-profit"
            period={period}
            filters={{
                activeCount: active,
                onClear: () => { setSource(''); setShow(''); },
                content: (
                    <>
                        <FilterSelect label="Source" value={source} onChange={setSource} options={SOURCE_OPTIONS} allLabel="Shop and ERP" />
                        <FilterSelect label="Show" value={show} onChange={setShow} options={SHOW_OPTIONS} allLabel="All bills" />
                    </>
                ),
            }}
            note="Net sales = bill total minus GST. Cost = quantity × the lot's purchase rate (excl. GST) from the shop database, or the ERP item's cost price. Lines with no known cost are left out of both sales and cost, so profit and margin cover the costed share only; ERP returns appear as negative rows. Totals agree with Party-Wise P&L for shop bills."
            onRefresh={() => reload(true)}
            loading={loading}
            error={error}
            isEmpty={Boolean(s && s.bills === 0 && !active && !searchInput)}
            meta={{ resolvedSource: data?.source, asOf: data?.asOf, recordCount: data?.pagination.total }}
            export={{
                columns: EXPORT_COLUMNS,
                fetchRows: report.fetchAllRows,
                filterSummary: filterSummary([
                    ['Source', SOURCE_OPTIONS.find(o => o.value === source)?.label],
                    ['Show', SHOW_OPTIONS.find(o => o.value === show)?.label],
                    ['Search', report.params.search],
                ]),
            }}
        >
            {data && s && (
                <>
                    <ReportKpiGrid items={[
                        { label: 'Net sales', value: rupees0(s.netSales), sub: `${formatNumber(s.bills)} bills · ${s.coveragePct}% costed`, icon: <IndianRupee className="w-4 h-4" /> },
                        { label: 'Gross profit', value: rupees0(s.grossProfit), sub: `on ${rupees0(s.costedSales)} costed sales`, tone: s.grossProfit < 0 ? 'negative' : 'positive', icon: <TrendingUp className="w-4 h-4" /> },
                        { label: 'Margin', value: s.marginPct === null ? '—' : formatPercentage(s.marginPct), sub: 'of costed sales', icon: <Percent className="w-4 h-4" /> },
                        { label: 'Loss-making bills', value: formatNumber(data.lossBills), sub: 'sold below lot cost', tone: data.lossBills > 0 ? 'warning' : 'default', icon: <TrendingDown className="w-4 h-4" /> },
                    ]} />
                    <ReportTable
                        title="Bills"
                        subtitle="Newest first; sort by profit or margin to find the outliers"
                        columns={COLUMNS}
                        rowKey={r => `${r.source}:${r.kind}:${r.id}`}
                        {...report.tableProps}
                        emptyMessage="No bills match the search or filters."
                    />
                </>
            )}
        </ReportPageShell>
    );
};

export default BillWiseProfitReport;
