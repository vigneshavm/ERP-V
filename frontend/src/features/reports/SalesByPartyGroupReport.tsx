import React from 'react';
import { IndianRupee, Layers, Receipt, Users } from 'lucide-react';
import { formatCurrency, formatNumber, formatQuantity } from '@/utils/formatters';
import { ReportAnalysisCard, ReportColumn, ReportKpiGrid, ReportPageShell, ReportRankList, ReportTable, useReportPeriod, useServerReport } from './components';
import type { ResolvedSource } from './components';
import { filterSummary } from './utils/reportExport';
import { rangeText, salesReturnsNote } from './utils/reportNotes';

interface GroupSalesRow {
    group: string;
    kind: 'group' | 'none' | 'walkin';
    customers: number;
    bills: number;
    qty: number;
    value: number;
    avgBill: number;
    sharePct: number;
}

interface SalesByGroupData {
    asOf: string | null;
    source?: ResolvedSource;
    range: { from: string | null; to: string | null };
    totals: { groups: number; customers: number; bills: number; qty: number; value: number };
    walkIn: { bills: number; qty: number; value: number };
    items: GroupSalesRow[];
    salesReturnEntries?: number;
}

const rupees0 = (v: number) => formatCurrency(v, { fractionDigits: 0 });
const muted = (r: GroupSalesRow) => (r.kind !== 'group' ? 'italic text-slate-500!' : undefined);

const COLUMNS: ReportColumn<GroupSalesRow>[] = [
    { key: 'group', header: 'Customer group', value: r => r.group, sortable: true, cellClassName: muted },
    { key: 'customers', header: 'Customers', type: 'number', value: r => (r.kind === 'walkin' ? null : r.customers) },
    { key: 'bills', header: 'Bills', type: 'number', value: r => r.bills },
    { key: 'qty', header: 'Pcs', type: 'quantity', value: r => r.qty },
    { key: 'value', header: 'Sales', type: 'currency', fractionDigits: 0, value: r => r.value, cellClassName: () => 'font-bold' },
    { key: 'avgBill', header: 'Avg bill', type: 'currency', fractionDigits: 0, value: r => r.avgBill },
    { key: 'sharePct', header: 'Share', type: 'percent', value: r => r.sharePct, sortable: false },
];

const EXPORT_COLUMNS: ReportColumn<GroupSalesRow>[] = [
    { key: 'group', header: 'Customer group', value: r => r.group },
    { key: 'customers', header: 'Customers', value: r => (r.kind === 'walkin' ? '' : r.customers) },
    { key: 'bills', header: 'Bills', value: r => r.bills },
    { key: 'qty', header: 'Pieces', value: r => r.qty },
    { key: 'value', header: 'Sales value', value: r => r.value },
    { key: 'avgBill', header: 'Average bill', value: r => r.avgBill },
    { key: 'sharePct', header: 'Share %', value: r => r.sharePct },
];

/**
 * Sales by Party Group: the same bills as Sales by Party, grouped by customer group (Textilesoft cus_cat, named via
 * CustomerGroup). "No group" and "Walk-in" are their own rows, so the rows always add up to total sales.
 */
const SalesByPartyGroupReport: React.FC = () => {
    const period = useReportPeriod('all');
    const { from, to } = period.period;
    const report = useServerReport<SalesByGroupData & { pagination?: undefined }, GroupSalesRow>('/api/reports/party/sales-by-party-group', { from, to }, {
        numericSort: ['customers', 'bills', 'qty', 'value', 'avgBill'],
        searchPlaceholder: 'Group name…',
    });
    const { data, loading, error, reload, searchInput } = report;
    const t = data?.totals;
    const ranked = (data?.items ?? []).filter(r => r.kind !== 'walkin').slice().sort((a, b) => b.value - a.value).slice(0, 10);

    return (
        <ReportPageShell<GroupSalesRow>
            reportId="sales-party-group"
            period={period}
            note={data && t ? `${rangeText('Bills', data.range)}, cancelled bills excluded. Group = the customer's group on their bills (Textilesoft customer category). Rows add up to total sales ${rupees0(t.value)}. ${salesReturnsNote(data.salesReturnEntries)} ERP POS sales are not included yet.` : undefined}
            onRefresh={() => reload(true)}
            loading={loading}
            error={error}
            isEmpty={Boolean(data && data.items.length === 0 && !searchInput)}
            meta={{ resolvedSource: data?.source, asOf: data?.asOf, recordCount: data?.items.length }}
            export={{ columns: EXPORT_COLUMNS, fetchRows: () => data?.items ?? [], filterSummary: filterSummary([['Search', report.params.search]]) }}
        >
            {t && data && (
                <>
                    <ReportKpiGrid items={[
                        { label: 'Customer groups', value: formatNumber(t.groups), icon: <Layers className="w-4 h-4" /> },
                        { label: 'Named customers', value: formatNumber(t.customers), icon: <Users className="w-4 h-4" /> },
                        { label: 'Bills', value: formatNumber(t.bills), sub: `${formatQuantity(t.qty)} pcs`, icon: <Receipt className="w-4 h-4" /> },
                        { label: 'Total sales', value: rupees0(t.value), sub: `${rupees0(data.walkIn.value)} walk-in`, icon: <IndianRupee className="w-4 h-4" /> },
                    ]} />
                    {ranked.length > 1 && (
                        <ReportAnalysisCard title="Sales by customer group" subtitle="Named-customer sales, top 10 groups (walk-in excluded)" autoHeight>
                            <ReportRankList items={ranked.map(r => ({ label: r.group, value: r.value, display: rupees0(r.value) }))} />
                        </ReportAnalysisCard>
                    )}
                    <ReportTable
                        title="Customer groups"
                        subtitle="“No group” and “Walk-in” rows keep the total equal to all sales"
                        columns={COLUMNS}
                        rowKey={r => r.group}
                        {...report.tableProps}
                        emptyMessage="No group matches the search."
                    />
                </>
            )}
        </ReportPageShell>
    );
};

export default SalesByPartyGroupReport;
