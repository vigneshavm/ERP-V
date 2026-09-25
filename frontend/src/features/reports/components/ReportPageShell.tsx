import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { formatDateTime, formatReportDate } from '@/utils/formatters';
import { periodLabel } from '../hooks/useReportPeriod';
import { REPORT_CATEGORIES, getReport } from '../config/reportRegistry';
import type { ReportId } from '../config/reportRegistry';
import type { UseReportPeriod } from '../hooks/useReportPeriod';
import { buildReportCsv, reportFileName, saveCsv } from '../utils/reportExport';
import type { CsvCell } from '../utils/reportExport';
import { ReportHeader } from './ReportHeader';
import { ReportToolbar, ReportFiltersConfig } from './ReportToolbar';
import { ReportAuditMeta } from './ReportAuditMeta';
import { dataSourceLabel } from './reportHelpers';
import type { ResolvedSource } from './reportHelpers';
import { ReportComingSoon, ReportEmpty, ReportError, ReportLoading } from './ReportStates';
import type { ReportDisplayStatus } from './ReportStatusBadge';
import type { ReportColumn } from './ReportTable';

export interface ReportExportConfig<Row> {
    /** Usually the same columns as the detail table; `exportable: false` columns are skipped. */
    columns: ReportColumn<Row>[];
    /** Every row for the current period and filters, not just the visible page. */
    fetchRows: () => Promise<Row[]> | Row[];
    /** Applied filters for the file's header block, e.g. ['Customer: Ravi', 'Counter: 2']. */
    filterSummary?: string[];
}

export interface ReportMeta {
    /** `source` from the API response: what actually produced the numbers. */
    resolvedSource?: ResolvedSource | null;
    /** Latest date the data covers (`asOf` from the API). */
    asOf?: string | null;
    /** Total records for the current period and filters (all pages). */
    recordCount?: number | null;
}

export interface ReportPageShellProps<Row = unknown> {
    reportId: ReportId;
    /** Omit for reports without a date range (e.g. All Parties). */
    period?: UseReportPeriod;
    filters?: ReportFiltersConfig;
    /** Report-level selector that sits above the content, e.g. the party on Party Statement. */
    primarySelector?: React.ReactNode;
    /**
     * How to read the figures: what's included or excluded, how values are computed. Shown under the
     * toolbar and written into the CSV header, because it's part of what makes the numbers auditable.
     */
    note?: React.ReactNode;
    /** Plain-text version of `note` for the CSV header (defaults to `note` when it is a string). */
    noteText?: string;
    onRefresh?: () => void;
    export?: ReportExportConfig<Row>;
    loading?: boolean;
    error?: string | null;
    onRetry?: () => void;
    /** Loaded, and nothing matches the period/filters. */
    isEmpty?: boolean;
    meta?: ReportMeta;
    children?: React.ReactNode;
}

/**
 * The one layout every report uses: header → toolbar → (filters) → content → audit footer.
 * Reports supply only their business content (KPIs, analysis, table) as children.
 *
 * Title, description, category, status and data source come from reportRegistry, so the catalog and
 * the page can't disagree. A 'coming-soon' report renders the header and a coming-soon body and
 * ignores children, so a report can't show sample figures by accident.
 */
export function ReportPageShell<Row = unknown>({
    reportId, period, filters, primarySelector, note, noteText, onRefresh, export: exportConfig,
    loading = false, error, onRetry, isEmpty, meta, children,
}: ReportPageShellProps<Row>) {
    const report = getReport(reportId);
    const [filtersOpen, setFiltersOpen] = useState(false);

    // "Last refreshed" = when this screen last loaded successfully (tracked during render, not in an
    // effect). Null until the first successful load, which is also what decides skeleton vs stale data.
    const [refreshedAt, setRefreshedAt] = useState<Date | null>(() => (loading || error ? null : new Date()));
    const [wasLoading, setWasLoading] = useState(loading);
    if (wasLoading !== loading) {
        setWasLoading(loading);
        if (!loading && !error) setRefreshedAt(new Date());
    }

    if (!report) {
        return <ReportError message={`Unknown report "${reportId}"`} />;
    }

    const categoryTitle = REPORT_CATEGORIES.find(c => c.id === report.category)?.title ?? '';
    const comingSoon = report.implementationStatus === 'coming-soon';

    const status: ReportDisplayStatus = comingSoon
        ? 'coming-soon'
        : error ? 'error'
            : !loading && isEmpty ? 'no-data'
                : report.implementationStatus;

    const runExport = exportConfig && (async () => {
        const rows = await exportConfig.fetchRows();
        const columns = exportConfig.columns.filter(c => c.exportable !== false);
        const metaRows: [string, string][] = [
            ['Report', report.title],
            ...(period ? [['Period', periodLabel(period.period)] as [string, string]] : []),
            ['Filters', exportConfig.filterSummary?.length ? exportConfig.filterSummary.join('; ') : 'None'],
            ['Data source', dataSourceLabel(report.dataSource, meta?.resolvedSource)],
            ...(meta?.asOf ? [['Data as of', formatReportDate(meta.asOf)] as [string, string]] : []),
            ['Status', status === 'live' ? 'Live data' : status === 'validation' ? 'Data validation (not yet reconciled)' : status],
            ...((noteText ?? (typeof note === 'string' ? note : '')) ? [['Notes', noteText ?? String(note)] as [string, string]] : []),
            ['Exported at', formatDateTime(new Date())],
            ['Records', String(rows.length)],
            ['Currency', 'INR (amounts are unformatted numbers)'],
        ];
        const body: CsvCell[][] = rows.map(row => columns.map(c => c.value(row)));
        saveCsv(
            reportFileName(report.id, period?.period.from, period?.period.to),
            buildReportCsv(metaRows, columns.map(c => c.header), body),
        );
    });

    let content: React.ReactNode;
    if (comingSoon) content = <ReportComingSoon title={report.title} />;
    else if (error) content = <ReportError message={error} onRetry={onRetry ?? onRefresh} />;
    else if (loading && refreshedAt === null) content = <ReportLoading />; // first load only; refreshes keep the old data visible
    else if (isEmpty) content = <ReportEmpty onClearFilters={filters && filters.activeCount > 0 ? filters.onClear : undefined} />;
    else content = children;

    return (
        <div className="space-y-5 pb-8">
            <ReportHeader breadcrumb={[categoryTitle]} title={report.title} description={report.description} status={status} />

            {!comingSoon && (
                <ReportToolbar
                    period={period}
                    filters={filters}
                    filtersOpen={filtersOpen}
                    onToggleFilters={() => setFiltersOpen(o => !o)}
                    onExport={!error && !isEmpty ? runExport : undefined}
                    onRefresh={onRefresh}
                    loading={loading}
                />
            )}

            {!comingSoon && primarySelector}

            {!comingSoon && note && !error && (
                <p className="flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                    <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden />
                    <span>{note}</span>
                </p>
            )}

            {status === 'validation' && (
                <div className="p-3 rounded-sm border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/10 dark:text-amber-300 text-xs font-bold">
                    Data validation: this report is being reconciled against your shop's records. Don't rely on it for audit yet.
                </div>
            )}

            <div className="space-y-5">{content}</div>

            {!comingSoon && (
                <ReportAuditMeta
                    dataSource={report.dataSource}
                    resolvedSource={meta?.resolvedSource}
                    asOf={meta?.asOf}
                    refreshedAt={error ? null : refreshedAt}
                    recordCount={error ? null : meta?.recordCount}
                    status={status}
                />
            )}
        </div>
    );
}
