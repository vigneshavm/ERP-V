import React, { useState } from 'react';
import { Boxes, IndianRupee, Package, Users } from 'lucide-react';
import { formatCurrency, formatNumber, formatQuantity } from '@/utils/formatters';
import { FilterSelect, ReportColumn, ReportKpiGrid, ReportPageShell, ReportTable, useReportPeriod, useServerReport } from './components';
import type { PageInfo, ResolvedSource } from './components';
import { filterSummary } from './utils/reportExport';
import { salesReturnsNote } from './utils/reportNotes';

const REPORT_URL = '/api/reports/party/by-item';

interface PartyItemRow {
    partyKey: string;
    party: string;
    code: string;
    item: string;
    docs: number;
    qty: number;
    value: number;
    avgRate: number;
    lastDate: string | null;
    returnedQty?: number;
}

interface PartyItemsData {
    asOf: string | null;
    source?: ResolvedSource;
    type: 'customer' | 'supplier';
    range: { from: string | null; to: string | null };
    defaultRange: boolean;
    truncated: boolean;
    totals: { rows: number; parties: number; items: number; qty: number; value: number };
    items: PartyItemRow[];
    pagination: PageInfo;
    salesReturnEntries?: number | null;
}

type PartyType = 'customer' | 'supplier';
const TYPES: { value: PartyType; label: string }[] = [
    { value: 'customer', label: 'Customers (sales)' },
    { value: 'supplier', label: 'Suppliers (purchases)' },
];

const rupees0 = (v: number) => formatCurrency(v, { fractionDigits: 0 });

const columnsFor = (type: PartyType): ReportColumn<PartyItemRow>[] => [
    { key: 'party', header: type === 'customer' ? 'Customer' : 'Supplier', value: r => r.party, subtext: r => (r.code ? `Card ${r.code}` : null), sortable: true },
    { key: 'item', header: 'Product', value: r => r.item, subtext: r => (r.returnedQty ? `${formatQuantity(r.returnedQty)} pcs returned (deducted)` : null), sortable: true },
    { key: 'docs', header: type === 'customer' ? 'Bills' : 'GRNs', type: 'number', value: r => r.docs },
    { key: 'qty', header: 'Pcs', type: 'quantity', value: r => r.qty },
    { key: 'value', header: 'Value', type: 'currency', fractionDigits: 0, value: r => r.value },
    { key: 'avgRate', header: 'Avg rate', type: 'currency', fractionDigits: 0, value: r => r.avgRate },
    { key: 'lastDate', header: 'Last', type: 'date', value: r => r.lastDate },
];

const exportColumnsFor = (type: PartyType): ReportColumn<PartyItemRow>[] => [
    { key: 'party', header: type === 'customer' ? 'Customer' : 'Supplier', value: r => r.party },
    { key: 'code', header: 'Card no.', value: r => r.code },
    { key: 'item', header: 'Product', value: r => r.item },
    { key: 'docs', header: type === 'customer' ? 'Bills' : 'GRNs', value: r => r.docs },
    { key: 'qty', header: 'Pieces', value: r => r.qty },
    { key: 'value', header: 'Value (incl. GST)', value: r => r.value },
    { key: 'avgRate', header: 'Average rate', value: r => r.avgRate },
    { key: 'lastDate', header: 'Last date', value: r => r.lastDate },
];

/** Party Report by Item: what each customer bought / each supplier supplied, per product, for a period. */
const PartyItemsReport: React.FC = () => {
    const [type, setType] = useState<PartyType>('customer');
    const period = useReportPeriod('all', { allowAllTime: false });
    const { from, to } = period.period;
    const report = useServerReport<PartyItemsData, PartyItemRow>(REPORT_URL, { type, from, to }, {
        numericSort: ['docs', 'qty', 'value', 'avgRate', 'lastDate'],
        searchPlaceholder: type === 'customer' ? 'Customer, card no. or product…' : 'Supplier or product…',
        noun: 'rows',
    });
    const { data, loading, error, reload, searchInput } = report;

    // With no dates the server uses the last 3 months of shop data (this report can be very large). Show that
    // range in the period control rather than "All time", so the label matches what's on screen.
    const [adopted, setAdopted] = useState(false);
    if (!adopted && data?.defaultRange && data.range.from && data.range.to && period.period.preset === 'all') {
        setAdopted(true);
        period.setCustom(data.range.from, data.range.to);
    }

    const t = data?.totals;
    const shownType = data?.type ?? type;

    return (
        <ReportPageShell<PartyItemRow>
            reportId="party-report-item"
            period={period}
            filters={{
                activeCount: type === 'supplier' ? 1 : 0,
                onClear: () => setType('customer'),
                content: <FilterSelect label="Parties" value={type} onChange={v => setType(v as PartyType)} options={TYPES} />,
            }}
            note={data ? `${shownType === 'customer' ? 'Named customers, sale lines of non-cancelled bills' : 'GRN lines'}. Values include GST. Products grouped by name. ${shownType === 'supplier' ? 'Purchase returns are deducted.' : salesReturnsNote(data.salesReturnEntries)}${data.truncated ? ' Too many rows for this period: only the first 1,00,000 are shown. Narrow the period.' : ''}` : undefined}
            onRefresh={() => reload(true)}
            loading={loading}
            error={error}
            isEmpty={Boolean(data && t?.rows === 0 && !searchInput)}
            meta={{ resolvedSource: data?.source, asOf: data?.asOf, recordCount: data?.pagination.total }}
            export={{
                columns: exportColumnsFor(shownType),
                fetchRows: report.fetchAllRows,
                filterSummary: filterSummary([['Parties', TYPES.find(o => o.value === type)?.label], ['Search', report.params.search]]),
            }}
        >
            {t && (
                <>
                    <ReportKpiGrid items={[
                        { label: shownType === 'customer' ? 'Customers' : 'Suppliers', value: formatNumber(t.parties), icon: <Users className="w-4 h-4" /> },
                        { label: 'Products', value: formatNumber(t.items), sub: `${formatNumber(t.rows)} party × product rows`, icon: <Package className="w-4 h-4" /> },
                        { label: 'Pieces', value: formatQuantity(t.qty), icon: <Boxes className="w-4 h-4" /> },
                        { label: 'Value', value: rupees0(t.value), icon: <IndianRupee className="w-4 h-4" /> },
                    ]} />
                    <ReportTable
                        // Remount when the party type changes: the columns differ.
                        key={shownType}
                        title={shownType === 'customer' ? 'What each customer bought' : 'What each supplier supplied'}
                        columns={columnsFor(shownType)}
                        rowKey={r => `${r.partyKey}|${r.item}`}
                        {...report.tableProps}
                        emptyMessage="Nothing matches the search for this period."
                    />
                </>
            )}
        </ReportPageShell>
    );
};

export default PartyItemsReport;
