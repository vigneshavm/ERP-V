import React from 'react';
import { Boxes, FileText, IndianRupee, Truck } from 'lucide-react';
import { formatCurrency, formatNumber, formatQuantity } from '@/utils/formatters';
import { ReportColumn, ReportKpiGrid, ReportPageShell, ReportTable, useReportPeriod, useServerReport } from './components';
import type { PageInfo, ResolvedSource } from './components';
import { filterSummary } from './utils/reportExport';
import { rangeText } from './utils/reportNotes';

const REPORT_URL = '/api/reports/party/purchase-by-party';

interface SupplierRow {
    supplier: string;
    city: string;
    grns: number;
    qty: number;
    value: number;
    returns: number;
    returnQty: number;
    returnValue: number;
    netValue: number;
    firstDate: string | null;
    lastDate: string | null;
    sharePct: number;
}

interface PurchaseByPartyData {
    asOf: string | null;
    source?: ResolvedSource;
    range: { from: string | null; to: string | null };
    totals: { suppliers: number; grns: number; qty: number; value: number; returns: number; returnQty: number; returnValue: number; netValue: number };
    items: SupplierRow[];
    pagination: PageInfo;
    checks?: { extraHeaderRows: number };
}

const rupees0 = (v: number) => formatCurrency(v, { fractionDigits: 0 });

const COLUMNS: ReportColumn<SupplierRow>[] = [
    { key: 'supplier', header: 'Supplier', value: r => r.supplier, sortable: true },
    { key: 'city', header: 'City', value: r => r.city },
    { key: 'grns', header: 'GRNs', type: 'number', value: r => r.grns },
    { key: 'qty', header: 'Pcs', type: 'quantity', value: r => r.qty },
    { key: 'value', header: 'Purchase value', type: 'currency', fractionDigits: 0, value: r => r.value },
    { key: 'returnValue', header: 'Returns', type: 'currency', fractionDigits: 0, value: r => r.returnValue || null },
    { key: 'netValue', header: 'Net', type: 'currency', fractionDigits: 0, value: r => r.netValue, cellClassName: () => 'font-bold' },
    { key: 'sharePct', header: 'Share', type: 'percent', value: r => r.sharePct, sortable: false },
    { key: 'lastDate', header: 'Last GRN', type: 'date', value: r => r.lastDate },
];

const EXPORT_COLUMNS: ReportColumn<SupplierRow>[] = [
    { key: 'supplier', header: 'Supplier', value: r => r.supplier },
    { key: 'city', header: 'City', value: r => r.city },
    { key: 'grns', header: 'GRNs', value: r => r.grns },
    { key: 'qty', header: 'Pieces', value: r => r.qty },
    { key: 'value', header: 'Purchase value (gross)', value: r => r.value },
    { key: 'returns', header: 'Returns', value: r => r.returns },
    { key: 'returnQty', header: 'Returned pieces', value: r => r.returnQty },
    { key: 'returnValue', header: 'Returned value', value: r => r.returnValue },
    { key: 'netValue', header: 'Net purchase', value: r => r.netValue },
    { key: 'sharePct', header: 'Share of net %', value: r => r.sharePct },
    { key: 'firstDate', header: 'First GRN', value: r => r.firstDate },
    { key: 'lastDate', header: 'Last GRN', value: r => r.lastDate },
];

/** Purchase by Party: GRNs grouped by supplier from the shop database (purgrnentry). */
const PurchaseByPartyReport: React.FC = () => {
    const period = useReportPeriod('all');
    const { from, to } = period.period;
    const report = useServerReport<PurchaseByPartyData, SupplierRow>(REPORT_URL, { from, to }, {
        numericSort: ['grns', 'qty', 'value', 'returnValue', 'netValue', 'lastDate', 'firstDate'],
        searchPlaceholder: 'Supplier or city…',
        noun: 'suppliers',
    });
    const { data, loading, error, reload, searchInput } = report;
    const t = data?.totals;
    const extra = data?.checks?.extraHeaderRows ?? 0;

    return (
        <ReportPageShell<SupplierRow>
            reportId="purchase-party"
            period={period}
            note={data && t ? `${rangeText('GRNs', data.range)}. Purchase value = GRN net total (totnetamot), same as the Suppliers page. Purchase returns (${formatNumber(t.returns)} in this period) are shown separately and deducted in Net purchase.${extra ? ` ${formatNumber(extra)} GRN numbers have more than one header row; all rows are counted, as on the Suppliers page.` : ''}` : undefined}
            onRefresh={() => reload(true)}
            loading={loading}
            error={error}
            isEmpty={Boolean(data && t?.suppliers === 0 && !searchInput)}
            meta={{ resolvedSource: data?.source, asOf: data?.asOf, recordCount: data?.pagination.total }}
            export={{ columns: EXPORT_COLUMNS, fetchRows: report.fetchAllRows, filterSummary: filterSummary([['Search', report.params.search]]) }}
        >
            {t && (
                <>
                    <ReportKpiGrid items={[
                        { label: 'Suppliers', value: formatNumber(t.suppliers), icon: <Truck className="w-4 h-4" /> },
                        { label: 'GRNs', value: formatNumber(t.grns), icon: <FileText className="w-4 h-4" /> },
                        { label: 'Pieces purchased', value: formatQuantity(t.qty), icon: <Boxes className="w-4 h-4" /> },
                        { label: 'Net purchase', value: rupees0(t.netValue), sub: t.returnValue ? `${rupees0(t.value)} − ${rupees0(t.returnValue)} returns` : `${rupees0(t.value)} gross`, icon: <IndianRupee className="w-4 h-4" /> },
                    ]} />
                    <ReportTable
                        title="Purchases by supplier"
                        subtitle="GRN totals with purchase returns deducted"
                        columns={COLUMNS}
                        rowKey={r => r.supplier}
                        {...report.tableProps}
                        emptyMessage="No purchases match the search."
                    />
                </>
            )}
        </ReportPageShell>
    );
};

export default PurchaseByPartyReport;
