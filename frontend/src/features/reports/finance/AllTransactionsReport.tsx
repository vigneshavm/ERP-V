import React, { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Clock3, Scale } from 'lucide-react';
import { formatNumber } from '@/utils/formatters';
import { FilterSelect, ReportKpiGrid, ReportPageShell, ReportTable, useReportPeriod, useServerReport } from '../components';
import { filterSummary } from '../utils/reportExport';
import { ENTRY_COLUMNS, ENTRY_EXPORT_COLUMNS, MODE_OPTIONS, SOURCE_OPTIONS, TYPE_OPTIONS, TYPE_SUMMARY_COLUMNS, financeNotes, rupees, rupees0 } from './financeFormat';
import type { FinanceEntry, TransactionsData } from './financeTypes';

/**
 * All Transactions: every money movement over a period, filterable by type, payment mode and source.
 * KPIs and the type summary follow the filters and search, not just the visible page.
 */
const AllTransactionsReport: React.FC = () => {
    const period = useReportPeriod('this-month');
    const { from, to } = period.period;
    const [type, setType] = useState('');
    const [mode, setMode] = useState('');
    const [source, setSource] = useState('');
    const filters = useMemo(() => ({ from, to, type, mode, source }), [from, to, type, mode, source]);
    const report = useServerReport<TransactionsData, FinanceEntry>('/api/reports/finance/transactions', filters, {
        numericSort: ['date', 'amount', 'in', 'out'],
        searchPlaceholder: 'Ref, party, note…',
        noun: 'entries',
    });
    const { data, loading, error, reload, searchInput } = report;
    const t = data?.totals;
    const active = [type, mode, source].filter(Boolean).length;

    return (
        <ReportPageShell<FinanceEntry>
            reportId="all-transactions"
            period={period}
            filters={{
                activeCount: active,
                onClear: () => { setType(''); setMode(''); setSource(''); },
                content: (
                    <>
                        <FilterSelect label="Type" value={type} onChange={setType} options={TYPE_OPTIONS} allLabel="All types" />
                        <FilterSelect label="Paid by" value={mode} onChange={setMode} options={MODE_OPTIONS} allLabel="Any" />
                        <FilterSelect label="Source" value={source} onChange={setSource} options={SOURCE_OPTIONS} allLabel="Shop and ERP" />
                    </>
                ),
            }}
            note={financeNotes(data?.checks)}
            onRefresh={() => reload(true)}
            loading={loading}
            error={error}
            isEmpty={Boolean(data && t?.entries === 0 && !active && !searchInput)}
            meta={{ resolvedSource: data?.source, asOf: data?.asOf, recordCount: data?.pagination.total }}
            export={{
                columns: ENTRY_EXPORT_COLUMNS,
                fetchRows: report.fetchAllRows,
                filterSummary: filterSummary([
                    ['Type', TYPE_OPTIONS.find(o => o.value === type)?.label],
                    ['Paid by', MODE_OPTIONS.find(o => o.value === mode)?.label],
                    ['Source', SOURCE_OPTIONS.find(o => o.value === source)?.label],
                    ['Search', report.params.search],
                ]),
            }}
        >
            {data && t && (
                <>
                    <ReportKpiGrid items={[
                        { label: 'Money in', value: rupees0(t.cashIn + t.bankIn), sub: `Cash ${rupees0(t.cashIn)} · Bank ${rupees0(t.bankIn)}`, icon: <ArrowDownLeft className="w-4 h-4" /> },
                        { label: 'Money out', value: rupees0(t.cashOut + t.bankOut), sub: `Cash ${rupees0(t.cashOut)} · Bank ${rupees0(t.bankOut)}`, icon: <ArrowUpRight className="w-4 h-4" /> },
                        { label: 'Net movement', value: rupees(t.net), tone: t.net < 0 ? 'negative' : 'default', icon: <Scale className="w-4 h-4" /> },
                        { label: 'On credit', value: rupees0(t.credit), sub: `${formatNumber(t.entries)} entries`, icon: <Clock3 className="w-4 h-4" /> },
                    ]} />
                    <ReportTable title="Summary by type" subtitle="Everything matching the period, filters and search" columns={TYPE_SUMMARY_COLUMNS} rows={data.byType} rowKey={r => r.type} />
                    <ReportTable
                        title="Transactions"
                        subtitle="Newest first; click a column to sort"
                        columns={ENTRY_COLUMNS}
                        rowKey={e => `${e.source}:${e.type}:${e.ref}:${e.date}:${e.time ?? ''}`}
                        {...report.tableProps}
                        emptyMessage="No transactions match the search or filters."
                    />
                </>
            )}
        </ReportPageShell>
    );
};

export default AllTransactionsReport;
