import React, { useState } from 'react';
import { IndianRupee, ShoppingBag, Truck, Users } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { FilterSelect, ReportColumn, ReportKpiGrid, ReportPageShell, ReportTable, useServerReport } from './components';
import type { PageInfo, ResolvedSource } from './components';
import { filterSummary } from './utils/reportExport';
import { salesReturnsNote } from './utils/reportNotes';

const REPORT_URL = '/api/reports/party/all-parties';

interface PartyRow {
    type: 'Customer' | 'Supplier';
    name: string;
    code: string;
    city: string;
    phone: string;
    group: string;
    transactions: number;
    value: number;
    creditOrOpening: number;
    lastDate: string | null;
}

interface AllPartiesData {
    asOf: string | null;
    source?: ResolvedSource;
    type: 'all' | 'customer' | 'supplier';
    totals: { parties: number; customers: number; suppliers: number; salesValue: number; purchaseValue: number };
    walkIn: { bills: number; value: number };
    namedBills: number;
    salesReturnEntries?: number;
    items: PartyRow[];
    pagination: PageInfo;
}

const TYPES = [
    { value: 'customer', label: 'Customers only' },
    { value: 'supplier', label: 'Suppliers only' },
];

const rupees0 = (v: number) => formatCurrency(v, { fractionDigits: 0 });

const COLUMNS: ReportColumn<PartyRow>[] = [
    { key: 'type', header: 'Type', type: 'status', value: r => r.type, statusTones: { Customer: 'info', Supplier: 'success' }, sortable: true },
    { key: 'name', header: 'Party', value: r => r.name, subtext: r => [r.code && `Card ${r.code}`, r.phone].filter(Boolean).join(' · '), sortable: true, hideable: false },
    { key: 'city', header: 'City', value: r => r.city },
    { key: 'group', header: 'Group', value: r => r.group },
    { key: 'transactions', header: 'Bills / GRNs', type: 'number', value: r => r.transactions },
    { key: 'value', header: 'Sales / Purchases', type: 'currency', fractionDigits: 0, value: r => r.value },
    { key: 'creditOrOpening', header: 'Credit / Opening', type: 'currency', fractionDigits: 0, value: r => r.creditOrOpening || null },
    { key: 'lastDate', header: 'Last txn', type: 'date', value: r => r.lastDate },
];

const EXPORT_COLUMNS: ReportColumn<PartyRow>[] = [
    { key: 'type', header: 'Type', value: r => r.type },
    { key: 'name', header: 'Name', value: r => r.name },
    { key: 'code', header: 'Card no.', value: r => r.code },
    { key: 'city', header: 'City', value: r => r.city },
    { key: 'phone', header: 'Phone', value: r => r.phone },
    { key: 'group', header: 'Group', value: r => r.group },
    { key: 'transactions', header: 'Bills / GRNs', value: r => r.transactions },
    { key: 'value', header: 'Sales / Purchases', value: r => r.value },
    { key: 'creditOrOpening', header: 'Credit sales / Opening balance', value: r => r.creditOrOpening },
    { key: 'lastDate', header: 'Last transaction', value: r => r.lastDate },
];

/**
 * All Parties: named customers (from sales bills, by card no. or name) and suppliers (supplier master + GRNs, same as
 * the Suppliers page). Walk-in bills with no customer are summarised, not listed. All time (no period).
 */
const AllPartiesReport: React.FC = () => {
    const [type, setType] = useState('');
    const report = useServerReport<AllPartiesData, PartyRow>(REPORT_URL, { type }, {
        numericSort: ['transactions', 'value', 'creditOrOpening', 'lastDate'],
        searchPlaceholder: 'Name, card no., city, phone, group…',
        noun: 'parties',
    });
    const { data, loading, error, reload, searchInput } = report;
    const t = data?.totals;
    const namedShare = data && data.namedBills + data.walkIn.bills > 0
        ? Math.round((data.namedBills / (data.namedBills + data.walkIn.bills)) * 1000) / 10 : 0;
    const note = data
        ? `Customers come from sales bills that carry a card no. or name (${namedShare}% of bills); ${formatNumber(data.walkIn.bills)} walk-in bills worth ${rupees0(data.walkIn.value)} have no customer and are not listed. Suppliers match the Suppliers page. All time. ${salesReturnsNote(data.salesReturnEntries)}`
        : undefined;

    return (
        <ReportPageShell<PartyRow>
            reportId="all-parties"
            filters={{
                activeCount: type ? 1 : 0,
                onClear: () => setType(''),
                content: <FilterSelect label="Party type" value={type} onChange={setType} options={TYPES} allLabel="Customers & suppliers" />,
            }}
            note={note}
            onRefresh={() => reload(true)}
            loading={loading}
            error={error}
            isEmpty={Boolean(data && t?.parties === 0 && !type && !searchInput)}
            meta={{ resolvedSource: data?.source, asOf: data?.asOf, recordCount: data?.pagination.total }}
            export={{
                columns: EXPORT_COLUMNS,
                fetchRows: report.fetchAllRows,
                filterSummary: filterSummary([['Party type', TYPES.find(o => o.value === type)?.label], ['Search', report.params.search]]),
            }}
        >
            {t && data && (
                <>
                    <ReportKpiGrid items={[
                        { label: 'Parties', value: formatNumber(t.parties), icon: <Users className="w-4 h-4" /> },
                        { label: 'Customers', value: formatNumber(t.customers), sub: `${rupees0(t.salesValue)} sales`, icon: <ShoppingBag className="w-4 h-4" /> },
                        { label: 'Suppliers', value: formatNumber(t.suppliers), sub: `${rupees0(t.purchaseValue)} purchases`, icon: <Truck className="w-4 h-4" /> },
                        { label: 'Walk-in sales', value: rupees0(data.walkIn.value), sub: `${formatNumber(data.walkIn.bills)} bills with no customer`, icon: <IndianRupee className="w-4 h-4" /> },
                    ]} />
                    <ReportTable
                        title="Parties"
                        subtitle="Customers and suppliers with their sales or purchases"
                        columns={COLUMNS}
                        rowKey={r => `${r.type}:${r.name}:${r.code}`}
                        {...report.tableProps}
                        emptyMessage="No parties match the search or filters."
                    />
                </>
            )}
        </ReportPageShell>
    );
};

export default AllPartiesReport;
