import React, { useState } from 'react';
import { IndianRupee, Receipt, UserCheck, Users } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercentage, formatQuantity } from '@/utils/formatters';
import { FilterSelect, ReportColumn, ReportKpiGrid, ReportPageShell, ReportTable, useReportPeriod, useServerReport } from './components';
import type { PageInfo, ResolvedSource } from './components';
import { filterSummary } from './utils/reportExport';
import { rangeText, salesReturnsNote } from './utils/reportNotes';

const REPORT_URL = '/api/reports/party/sales-by-party';

interface CustomerSalesRow {
    key: string;
    name: string;
    code: string;
    city: string;
    phone: string;
    group: string;
    bills: number;
    qty: number;
    value: number;
    credit: number;
    avgBill: number;
    firstDate: string | null;
    lastDate: string | null;
    sharePct: number;
}

interface Totals { bills: number; qty: number; value: number }

interface SalesByPartyData {
    asOf: string | null;
    source?: ResolvedSource;
    range: { from: string | null; to: string | null };
    groups: string[];
    totals: Totals & { customers: number };
    named: { customers: number; bills: number; value: number };
    walkIn: Totals;
    all: Totals;
    salesReturnEntries?: number;
    items: CustomerSalesRow[];
    pagination: PageInfo;
}

const rupees0 = (v: number) => formatCurrency(v, { fractionDigits: 0 });

const COLUMNS: ReportColumn<CustomerSalesRow>[] = [
    { key: 'name', header: 'Customer', value: r => r.name, subtext: r => [r.code && `Card ${r.code}`, r.phone].filter(Boolean).join(' · '), sortable: true },
    { key: 'city', header: 'City', value: r => r.city },
    { key: 'group', header: 'Group', value: r => r.group },
    { key: 'bills', header: 'Bills', type: 'number', value: r => r.bills },
    { key: 'qty', header: 'Pcs', type: 'quantity', value: r => r.qty },
    { key: 'value', header: 'Sales', type: 'currency', fractionDigits: 0, value: r => r.value, cellClassName: () => 'font-bold' },
    { key: 'avgBill', header: 'Avg bill', type: 'currency', fractionDigits: 0, value: r => r.avgBill },
    { key: 'credit', header: 'Credit', type: 'currency', fractionDigits: 0, value: r => r.credit || null },
    { key: 'lastDate', header: 'Last bill', type: 'date', value: r => r.lastDate },
];

const EXPORT_COLUMNS: ReportColumn<CustomerSalesRow>[] = [
    { key: 'name', header: 'Customer', value: r => r.name },
    { key: 'code', header: 'Card no.', value: r => r.code },
    { key: 'city', header: 'City', value: r => r.city },
    { key: 'phone', header: 'Phone', value: r => r.phone },
    { key: 'group', header: 'Group', value: r => r.group },
    { key: 'bills', header: 'Bills', value: r => r.bills },
    { key: 'qty', header: 'Pieces', value: r => r.qty },
    { key: 'value', header: 'Sales value', value: r => r.value },
    { key: 'avgBill', header: 'Average bill', value: r => r.avgBill },
    { key: 'credit', header: 'Credit sales', value: r => r.credit },
    { key: 'sharePct', header: 'Share of all sales %', value: r => r.sharePct },
    { key: 'firstDate', header: 'First bill', value: r => r.firstDate },
    { key: 'lastDate', header: 'Last bill', value: r => r.lastDate },
];

/** Sales by Party: bills (sales2, not cancelled) grouped by named customer; walk-in bills reported separately. */
const SalesByPartyReport: React.FC = () => {
    const period = useReportPeriod('all');
    const { from, to } = period.period;
    const [group, setGroup] = useState('');
    const report = useServerReport<SalesByPartyData, CustomerSalesRow>(REPORT_URL, { from, to, group }, {
        numericSort: ['bills', 'qty', 'value', 'avgBill', 'credit', 'lastDate'],
        searchPlaceholder: 'Customer, card no., city, phone…',
        noun: 'customers',
    });
    const { data, loading, error, reload, searchInput } = report;
    const t = data?.totals;
    const namedPct = data && data.all.value > 0 ? Math.round((data.named.value / data.all.value) * 1000) / 10 : 0;
    const filtered = Boolean(group || searchInput);

    return (
        <ReportPageShell<CustomerSalesRow>
            reportId="sales-party"
            period={period}
            filters={{
                activeCount: group ? 1 : 0,
                onClear: () => setGroup(''),
                content: <FilterSelect label="Customer group" value={group} onChange={setGroup} options={(data?.groups ?? []).map(g => ({ value: g }))} allLabel="All groups" />,
            }}
            note={data ? `${rangeText('Bills', data.range)}, cancelled bills excluded. Named customers ${rupees0(data.named.value)} + walk-in ${rupees0(data.walkIn.value)} = total sales ${rupees0(data.all.value)}. ${salesReturnsNote(data.salesReturnEntries)} ERP POS sales are not included yet.` : undefined}
            onRefresh={() => reload(true)}
            loading={loading}
            error={error}
            isEmpty={Boolean(data && t?.customers === 0 && !filtered)}
            meta={{ resolvedSource: data?.source, asOf: data?.asOf, recordCount: data?.pagination.total }}
            export={{ columns: EXPORT_COLUMNS, fetchRows: report.fetchAllRows, filterSummary: filterSummary([['Customer group', group], ['Search', report.params.search]]) }}
        >
            {t && data && (
                <>
                    <ReportKpiGrid items={[
                        { label: 'Customers', value: formatNumber(t.customers), sub: filtered ? `of ${formatNumber(data.named.customers)} with a bill` : undefined, icon: <Users className="w-4 h-4" /> },
                        { label: 'Bills', value: formatNumber(t.bills), sub: `${formatQuantity(t.qty)} pcs`, icon: <Receipt className="w-4 h-4" /> },
                        { label: 'Sales value', value: rupees0(t.value), icon: <IndianRupee className="w-4 h-4" /> },
                        { label: 'Named customer share', value: formatPercentage(namedPct), sub: `${formatNumber(data.walkIn.bills)} walk-in bills, ${rupees0(data.walkIn.value)}`, icon: <UserCheck className="w-4 h-4" /> },
                    ]} />
                    <ReportTable
                        title="Sales by customer"
                        subtitle="Named customers only; walk-in bills are in the note above"
                        columns={COLUMNS}
                        rowKey={r => r.key}
                        {...report.tableProps}
                        emptyMessage="No customer sales match the search or filters."
                    />
                </>
            )}
        </ReportPageShell>
    );
};

export default SalesByPartyReport;
