import React from 'react';
import { FileText, IndianRupee, Layers, Truck } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { ReportColumn, ReportKpiGrid, ReportPageShell, ReportTable, useReportPeriod, useServerReport } from './components';
import type { ResolvedSource } from './components';
import { filterSummary } from './utils/reportExport';

interface GroupRow {
    group: string;
    assigned: boolean;
    suppliers: number;
    grns: number;
    qty: number;
    value: number;
    returnValue: number;
    netValue: number;
    sharePct: number;
}

interface PurchaseGroupData {
    asOf: string | null;
    source?: ResolvedSource;
    range: { from: string | null; to: string | null };
    totals: { groups: number; suppliers: number; grns: number; value: number; returnValue: number; netValue: number };
    unassigned: { suppliers: number; value: number };
    items: GroupRow[];
}

const rupees0 = (v: number) => formatCurrency(v, { fractionDigits: 0 });

const COLUMNS: ReportColumn<GroupRow>[] = [
    { key: 'group', header: 'Supplier group', value: r => r.group, sortable: true, cellClassName: r => (r.assigned ? undefined : 'italic text-slate-500!') },
    { key: 'suppliers', header: 'Suppliers', type: 'number', value: r => r.suppliers },
    { key: 'grns', header: 'GRNs', type: 'number', value: r => r.grns },
    { key: 'qty', header: 'Pcs', type: 'quantity', value: r => r.qty },
    { key: 'value', header: 'Purchase value', type: 'currency', fractionDigits: 0, value: r => r.value },
    { key: 'returnValue', header: 'Returns', type: 'currency', fractionDigits: 0, value: r => r.returnValue || null },
    { key: 'netValue', header: 'Net', type: 'currency', fractionDigits: 0, value: r => r.netValue, cellClassName: () => 'font-bold' },
    { key: 'sharePct', header: 'Share', type: 'percent', value: r => r.sharePct, sortable: false },
];

const EXPORT_COLUMNS: ReportColumn<GroupRow>[] = [
    { key: 'group', header: 'Supplier group', value: r => r.group },
    { key: 'suppliers', header: 'Suppliers', value: r => r.suppliers },
    { key: 'grns', header: 'GRNs', value: r => r.grns },
    { key: 'qty', header: 'Pieces', value: r => r.qty },
    { key: 'value', header: 'Purchase value (gross)', value: r => r.value },
    { key: 'returnValue', header: 'Returned value', value: r => r.returnValue },
    { key: 'netValue', header: 'Net purchase', value: r => r.netValue },
    { key: 'sharePct', header: 'Share of net %', value: r => r.sharePct },
];

/**
 * Purchase by Party Group: Purchase by Party totals grouped by the supplier group set on the ERP Suppliers page
 * (matched by supplier name). Textilesoft has no supplier groups, so unmatched suppliers are "Unassigned".
 */
const PurchaseByPartyGroupReport: React.FC = () => {
    const period = useReportPeriod('all');
    const { from, to } = period.period;
    const report = useServerReport<PurchaseGroupData & { pagination?: undefined }, GroupRow>('/api/reports/party/purchase-by-party-group', { from, to }, {
        numericSort: ['suppliers', 'grns', 'qty', 'value', 'returnValue', 'netValue'],
        searchPlaceholder: 'Group name…',
    });
    const { data, loading, error, reload, searchInput } = report;
    const t = data?.totals;
    const unassignedPct = data && t && t.value > 0 ? Math.round((data.unassigned.value / t.value) * 1000) / 10 : 0;

    return (
        <ReportPageShell<GroupRow>
            reportId="purchase-party-group"
            period={period}
            note={data ? `Same GRN totals and purchase returns as Purchase by Party, grouped by the supplier group set on the Suppliers page (matched by supplier name). ${formatNumber(data.unassigned.suppliers)} suppliers (${unassignedPct}% of purchase value) have no group yet. Assign groups on the Suppliers page to split them.` : undefined}
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
                        { label: 'Supplier groups', value: formatNumber(t.groups), icon: <Layers className="w-4 h-4" /> },
                        { label: 'Suppliers', value: formatNumber(t.suppliers), sub: `${formatNumber(data.unassigned.suppliers)} unassigned`, icon: <Truck className="w-4 h-4" /> },
                        { label: 'GRNs', value: formatNumber(t.grns), icon: <FileText className="w-4 h-4" /> },
                        { label: 'Net purchase', value: rupees0(t.netValue), sub: t.returnValue ? `${rupees0(t.value)} − ${rupees0(t.returnValue)} returns` : `${rupees0(t.value)} gross`, icon: <IndianRupee className="w-4 h-4" /> },
                    ]} />
                    <ReportTable
                        title="Supplier groups"
                        subtitle="Suppliers with no group on the Suppliers page are “Unassigned”"
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

export default PurchaseByPartyGroupReport;
