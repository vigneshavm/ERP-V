import React from 'react';
import { IndianRupee, Percent, TrendingUp, Wallet } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { ReportColumn, ReportKpiGrid, ReportPageShell, ReportTable, useReportPeriod, useServerReport } from './components';
import type { PageInfo, ResolvedSource } from './components';
import { filterSummary } from './utils/reportExport';
import { rangeText, salesReturnsNote } from './utils/reportNotes';

const REPORT_URL = '/api/reports/party/pnl';

interface PnlRow {
    key: string;
    party: string;
    code: string;
    city: string;
    group: string;
    walkIn: boolean;
    bills: number;
    grossSales: number;
    gst: number;
    netSales: number;
    cost: number;
    profit: number;
    marginPct: number | null;
    costCoveragePct: number;
}

interface PnlData {
    asOf: string | null;
    source?: ResolvedSource;
    range: { from: string | null; to: string | null };
    totals: { parties: number; bills: number; grossSales: number; gst: number; netSales: number; cost: number; profit: number; marginPct: number | null; costCoveragePct: number };
    items: PnlRow[];
    pagination: PageInfo;
    salesReturnEntries?: number;
}

const rupees0 = (v: number) => formatCurrency(v, { fractionDigits: 0 });

const COLUMNS: ReportColumn<PnlRow>[] = [
    {
        key: 'party', header: 'Customer', value: r => r.party, sortable: true,
        subtext: r => [r.code && `Card ${r.code}`, r.city, r.group].filter(Boolean).join(' · '),
        cellClassName: r => (r.walkIn ? 'italic text-slate-500!' : undefined),
    },
    { key: 'bills', header: 'Bills', type: 'number', value: r => r.bills },
    { key: 'netSales', header: 'Net sales', type: 'currency', fractionDigits: 0, value: r => r.netSales },
    { key: 'cost', header: 'Cost', type: 'currency', fractionDigits: 0, value: r => r.cost },
    { key: 'profit', header: 'Gross profit', type: 'currency', fractionDigits: 0, value: r => r.profit, cellClassName: r => (r.profit < 0 ? 'text-rose-600! font-bold' : 'font-bold') },
    { key: 'marginPct', header: 'Margin', type: 'percent', value: r => r.marginPct },
    { key: 'costCoveragePct', header: 'Cost known', type: 'percent', value: r => r.costCoveragePct, cellClassName: r => (r.costCoveragePct < 90 ? 'text-amber-600!' : undefined) },
];

const EXPORT_COLUMNS: ReportColumn<PnlRow>[] = [
    { key: 'party', header: 'Customer', value: r => r.party },
    { key: 'code', header: 'Card no.', value: r => r.code },
    { key: 'city', header: 'City', value: r => r.city },
    { key: 'group', header: 'Group', value: r => r.group },
    { key: 'bills', header: 'Bills', value: r => r.bills },
    { key: 'grossSales', header: 'Sales incl. GST', value: r => r.grossSales },
    { key: 'gst', header: 'GST', value: r => r.gst },
    { key: 'netSales', header: 'Net sales', value: r => r.netSales },
    { key: 'cost', header: 'Cost', value: r => r.cost },
    { key: 'profit', header: 'Gross profit', value: r => r.profit },
    { key: 'marginPct', header: 'Margin %', value: r => r.marginPct },
    { key: 'costCoveragePct', header: 'Cost known for % of sales', value: r => r.costCoveragePct },
];

/** Party-Wise P&L: per customer, sales excl. GST minus the purchase rate of each barcode sold. */
const PartyPnlReport: React.FC = () => {
    const period = useReportPeriod('all');
    const { from, to } = period.period;
    const report = useServerReport<PnlData, PnlRow>(REPORT_URL, { from, to }, {
        numericSort: ['bills', 'netSales', 'cost', 'profit', 'marginPct', 'costCoveragePct'],
        searchPlaceholder: 'Customer, card no., city, group…',
        noun: 'customers',
    });
    const { data, loading, error, reload, searchInput } = report;
    const t = data?.totals;

    return (
        <ReportPageShell<PnlRow>
            reportId="party-wise-pl"
            period={period}
            note={data && t ? `${rangeText('Bills', data.range)}, cancelled bills excluded. Gross profit = sales excl. GST − purchase rate (excl. GST) of each barcode sold. Sale lines whose barcode has no purchase rate are left out of both sales and cost; the cost was known for ${t.costCoveragePct}% of sales. ${salesReturnsNote(data.salesReturnEntries)} ERP POS sales are not included yet.` : undefined}
            onRefresh={() => reload(true)}
            loading={loading}
            error={error}
            isEmpty={Boolean(data && data.pagination.total === 0 && !searchInput)}
            meta={{ resolvedSource: data?.source, asOf: data?.asOf, recordCount: data?.pagination.total }}
            export={{ columns: EXPORT_COLUMNS, fetchRows: report.fetchAllRows, filterSummary: filterSummary([['Search', report.params.search]]) }}
        >
            {t && (
                <>
                    <ReportKpiGrid items={[
                        { label: 'Net sales (excl. GST)', value: rupees0(t.netSales), sub: `${rupees0(t.grossSales)} incl. GST`, icon: <IndianRupee className="w-4 h-4" /> },
                        { label: 'Cost of goods sold', value: rupees0(t.cost), icon: <Wallet className="w-4 h-4" /> },
                        { label: 'Gross profit', value: rupees0(t.profit), tone: t.profit < 0 ? 'negative' : 'default', icon: <TrendingUp className="w-4 h-4" /> },
                        { label: 'Margin', value: formatPercentage(t.marginPct), sub: `${formatNumber(t.parties)} customers + walk-in`, icon: <Percent className="w-4 h-4" /> },
                    ]} />
                    <ReportTable
                        title="Profit by customer"
                        subtitle="Walk-in bills are one row"
                        columns={COLUMNS}
                        rowKey={r => r.key}
                        {...report.tableProps}
                        emptyMessage="No sales match the search."
                    />
                </>
            )}
        </ReportPageShell>
    );
};

export default PartyPnlReport;
