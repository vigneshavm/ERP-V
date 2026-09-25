import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, Clock3, Scale } from 'lucide-react';
import { formatNumber, formatReportDate } from '@/utils/formatters';
import { ReportKpiGrid, ReportPageShell, ReportTable, useClientReportTable, useReportData } from '../components';
import { ENTRY_COLUMNS, ENTRY_EXPORT_COLUMNS, TYPE_SUMMARY_COLUMNS, financeNotes, rupees, rupees0 } from './financeFormat';
import type { DayBookData, FinanceEntry } from './financeTypes';

const shiftDay = (iso: string, days: number): string => {
    const [y, m, d] = iso.split('-').map(Number);
    const t = new Date(y, m - 1, d + days);
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
};

const dayBtn = 'p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40';

/**
 * Day Book: every transaction of one day in time order (shop bills and GRNs, ERP invoices, receipts, returns,
 * supplier bills and payments, expenses, cash-book entries), with money in/out by cash and bank.
 * Opens on the latest day with shop data, since the shop copy is restored daily.
 */
const DayBookReport: React.FC = () => {
    // '' = let the server pick the latest day with data; the answer tells us which day it chose.
    const [date, setDate] = useState('');
    const { data, loading, error, reload } = useReportData<DayBookData>('/api/reports/finance/daybook', { date });
    const day = date || data?.date || '';
    const table = useClientReportTable<FinanceEntry>(data?.entries ?? [], ENTRY_COLUMNS, { pageSize: 50, searchPlaceholder: 'Ref, party, note…' });
    const t = data?.totals;

    const selector = (
        <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Day</span>
            <button type="button" className={dayBtn} onClick={() => day && setDate(shiftDay(day, -1))} disabled={!day || loading} aria-label="Previous day">
                <ChevronLeft className="w-4 h-4" />
            </button>
            <input
                type="date"
                value={day}
                onChange={e => e.target.value && setDate(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200"
            />
            <button type="button" className={dayBtn} onClick={() => day && setDate(shiftDay(day, 1))} disabled={!day || loading} aria-label="Next day">
                <ChevronRight className="w-4 h-4" />
            </button>
            {data?.asOf && day !== data.asOf && (
                <button type="button" onClick={() => setDate(data.asOf ?? '')} className="text-xs font-bold text-primary hover:underline">
                    Latest shop day ({formatReportDate(data.asOf)})
                </button>
            )}
        </div>
    );

    return (
        <ReportPageShell<FinanceEntry>
            reportId="daybook"
            primarySelector={selector}
            note={financeNotes(data?.checks)}
            onRefresh={() => reload(true)}
            loading={loading}
            error={error}
            isEmpty={Boolean(data && data.entries.length === 0)}
            meta={{ resolvedSource: data?.source, asOf: data?.asOf, recordCount: data?.entries.length }}
            export={{ columns: ENTRY_EXPORT_COLUMNS, fetchRows: () => data?.entries ?? [], filterSummary: day ? [`Day: ${day}`] : [] }}
        >
            {data && t && (
                <>
                    <ReportKpiGrid items={[
                        { label: 'Money in', value: rupees0(t.cashIn + t.bankIn), sub: `Cash ${rupees0(t.cashIn)} · Bank ${rupees0(t.bankIn)}`, icon: <ArrowDownLeft className="w-4 h-4" /> },
                        { label: 'Money out', value: rupees0(t.cashOut + t.bankOut), sub: `Cash ${rupees0(t.cashOut)} · Bank ${rupees0(t.bankOut)}`, icon: <ArrowUpRight className="w-4 h-4" /> },
                        { label: 'Net movement', value: rupees(t.net), sub: `Cash ${rupees0(t.cashIn - t.cashOut)} · Bank ${rupees0(t.bankIn - t.bankOut)}`, tone: t.net < 0 ? 'negative' : 'default', icon: <Scale className="w-4 h-4" /> },
                        { label: 'On credit', value: rupees0(t.credit), sub: `${formatNumber(t.entries)} entries on ${formatReportDate(data.date)}`, icon: <Clock3 className="w-4 h-4" /> },
                    ]} />
                    <ReportTable title="Summary by type" subtitle={`All entries on ${formatReportDate(data.date)}`} columns={TYPE_SUMMARY_COLUMNS} rows={data.byType} rowKey={r => r.type} />
                    <ReportTable
                        title="Entries"
                        subtitle="In time order; GRNs and entries without a time come first"
                        columns={ENTRY_COLUMNS}
                        rowKey={e => `${e.source}:${e.type}:${e.ref}:${e.time ?? ''}`}
                        {...table.tableProps}
                        emptyMessage="No entries match the search."
                    />
                </>
            )}
        </ReportPageShell>
    );
};

export default DayBookReport;
