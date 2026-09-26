import React, { useCallback, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Columns3, Search } from 'lucide-react';
import { ReportPagination, ReportPaginationProps } from './ReportPagination';
import { useDismiss } from './useDismiss';
import { formatCell, isNumericColumn } from './reportHelpers';

export type ReportColumnType = 'text' | 'currency' | 'number' | 'quantity' | 'percent' | 'date' | 'datetime' | 'status';
export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
export type SortDir = 'asc' | 'desc';

export type CellValue = string | number | null | undefined;

export interface ReportColumn<Row> {
    key: string;
    header: string;
    type?: ReportColumnType;
    /** Raw value: used for display (via the type's formatter), sorting and CSV export. */
    value: (row: Row) => CellValue;
    /** Custom cell content. Sorting and export still use `value`. */
    render?: (row: Row) => React.ReactNode;
    /** Currency decimals. Default 2: detail rows show exact amounts. */
    fractionDigits?: number;
    /** Show zero as an empty cell (ledger debit/credit columns). */
    blankZero?: boolean;
    /** Secondary grey line under the value (card no., phone, …). Not exported. */
    subtext?: (row: Row) => string | null | undefined;
    /** Extra classes for this cell, e.g. red for a loss. */
    cellClassName?: (row: Row) => string | undefined;
    /** 'status' columns: value → badge colour. Unlisted values are neutral. */
    statusTones?: Record<string, StatusTone>;
    /** Default true for every column except the first. */
    sortable?: boolean;
    /** Default true for every column except the first. */
    hideable?: boolean;
    defaultHidden?: boolean;
    /** Default true. */
    exportable?: boolean;
}

export interface ReportTableSort {
    key: string | null;
    dir: SortDir;
    onSort: (key: string) => void;
}

export interface ReportTableProps<Row> {
    title: string;
    subtitle?: string;
    columns: ReportColumn<Row>[];
    rows: Row[];
    rowKey: (row: Row, index: number) => string;
    loading?: boolean;
    search?: { value: string; onChange: (value: string) => void; placeholder?: string };
    sort?: ReportTableSort;
    pagination?: Omit<ReportPaginationProps, 'disabled'>;
    onRowClick?: (row: Row) => void;
    /** Per-row buttons, rendered in a last column. */
    rowActions?: (row: Row) => React.ReactNode;
    /** Extra controls in the table header (next to Columns). */
    actions?: React.ReactNode;
    emptyMessage?: string;
    /** Extra classes for a whole row (e.g. muted walk-in row). */
    rowClassName?: (row: Row) => string | undefined;
    /** Rows fixed above/below the data (opening and closing balance), not sorted or paged. */
    pinnedTopRows?: Row[];
    pinnedBottomRows?: Row[];
}

const TONE: Record<StatusTone, string> = {
    success: 'bg-success-soft text-success dark:bg-success-soft dark:text-success',
    warning: 'bg-warning-soft text-warning dark:bg-warning-soft dark:text-warning',
    danger: 'bg-danger-soft text-danger dark:bg-danger-soft dark:text-danger',
    info: 'bg-info-soft text-info dark:bg-info-soft dark:text-info',
    neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
};

function CellValue<Row>({ column, row }: { column: ReportColumn<Row>; row: Row }) {
    if (column.render) return <>{column.render(row)}</>;
    const raw = column.value(row);
    if (column.blankZero && (raw === 0 || raw === null || raw === undefined || raw === '')) return null;
    if (column.type === 'status' && raw !== null && raw !== undefined && raw !== '') {
        const tone = column.statusTones?.[String(raw)] ?? 'neutral';
        return <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${TONE[tone]}`}>{String(raw)}</span>;
    }
    return <>{formatCell(column, raw)}</>;
}

function Cell<Row>({ column, row }: { column: ReportColumn<Row>; row: Row }) {
    const sub = column.subtext?.(row);
    if (!sub) return <CellValue column={column} row={row} />;
    return (
        <>
            <CellValue column={column} row={row} />
            <span className="block text-[11px] font-normal text-slate-400">{sub}</span>
        </>
    );
}

/**
 * The detail table for every report: title, search, column visibility, sortable headers (sticky),
 * formatted and right-aligned numbers, horizontal scroll, empty state and pagination.
 *
 * Controlled: the report owns rows, sort, search and page, so large datasets can be paged and sorted
 * on the server. For complete, small lists use useClientReportTable to get the same props.
 */
export function ReportTable<Row>({
    title, subtitle, columns, rows, rowKey, loading, search, sort, pagination, onRowClick, rowActions, actions,
    emptyMessage = 'No records match the current search or filters.', rowClassName, pinnedTopRows, pinnedBottomRows,
}: ReportTableProps<Row>) {
    const [hidden, setHidden] = useState<Set<string>>(() => new Set(columns.filter(c => c.defaultHidden).map(c => c.key)));
    const [columnsOpen, setColumnsOpen] = useState(false);
    const closeColumns = useCallback(() => setColumnsOpen(false), []);
    const columnsRef = useDismiss<HTMLDivElement>(columnsOpen, closeColumns);

    const canHide = (c: ReportColumn<Row>, i: number) => c.hideable ?? i > 0;
    const canSort = (c: ReportColumn<Row>, i: number) => Boolean(sort) && (c.sortable ?? i > 0);
    const visible = columns.filter(c => !hidden.has(c.key));
    const colCount = visible.length + (rowActions ? 1 : 0);

    const renderRow = (row: Row, key: string, pinned: boolean) => (
        <tr
            key={key}
            onClick={onRowClick && !pinned ? () => onRowClick(row) : undefined}
            className={`${pinned ? 'bg-slate-50/80 dark:bg-slate-900/40 font-bold' : ''} ${onRowClick && !pinned ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30' : ''} ${rowClassName?.(row) ?? ''}`}
        >
            {visible.map((c, ci) => (
                <td
                    key={c.key}
                    className={`px-4 py-3 whitespace-nowrap ${isNumericColumn(c) ? 'text-right tabular-nums' : ''} ${ci === 0 || pinned ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'} ${c.cellClassName?.(row) ?? ''}`}
                >
                    <Cell column={c} row={row} />
                </td>
            ))}
            {rowActions && (
                <td className="px-4 py-3 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>{pinned ? null : rowActions(row)}</td>
            )}
        </tr>
    );

    const toggleColumn = (key: string) => setHidden(prev => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key); else next.add(key);
        return next;
    });

    return (
        <section className="bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden min-w-0">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">{title}</h3>
                    {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
                </div>
                <div className="flex items-center gap-2">
                    {search && (
                        <label className="relative flex-1 md:w-72">
                            <span className="sr-only">Search</span>
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden />
                            <input
                                type="search"
                                value={search.value}
                                onChange={e => search.onChange(e.target.value)}
                                placeholder={search.placeholder ?? 'Search…'}
                                className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.2)]"
                            />
                        </label>
                    )}
                    {actions}
                    <div ref={columnsRef} className="relative">
                        <button
                            type="button"
                            onClick={() => setColumnsOpen(o => !o)}
                            aria-expanded={columnsOpen}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                        >
                            <Columns3 className="w-4 h-4" aria-hidden /> <span className="hidden sm:inline">Columns</span>
                        </button>
                        {columnsOpen && (
                            <div role="dialog" aria-label="Visible columns" className="absolute right-0 z-30 mt-1 w-56 max-h-80 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl p-2">
                                {columns.map((c, i) => (
                                    <label key={c.key} className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs font-medium ${canHide(c, i) ? 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer' : 'text-slate-400'}`}>
                                        <input type="checkbox" checked={!hidden.has(c.key)} disabled={!canHide(c, i)} onChange={() => toggleColumn(c.key)} className="accent-[rgb(var(--color-primary))]" />
                                        {c.header}
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto max-h-[640px]">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider sticky top-0 z-10">
                        <tr>
                            {visible.map(c => {
                                const i = columns.indexOf(c);
                                const numeric = isNumericColumn(c);
                                const active = sort?.key === c.key;
                                const Icon = !active ? ArrowUpDown : sort?.dir === 'asc' ? ArrowUp : ArrowDown;
                                return (
                                    <th
                                        key={c.key}
                                        scope="col"
                                        className={`px-4 py-3 whitespace-nowrap ${numeric ? 'text-right' : ''}`}
                                        aria-sort={active ? (sort?.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                                    >
                                        {canSort(c, i) ? (
                                            <button
                                                type="button"
                                                onClick={() => sort?.onSort(c.key)}
                                                className={`inline-flex items-center gap-1 uppercase tracking-wider font-bold hover:text-[rgb(var(--color-primary))] ${numeric ? 'flex-row-reverse' : ''} ${active ? 'text-primary' : ''}`}
                                            >
                                                {c.header}
                                                <Icon className={`w-3 h-3 ${active ? '' : 'opacity-40'}`} aria-hidden />
                                            </button>
                                        ) : c.header}
                                    </th>
                                );
                            })}
                            {rowActions && <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>}
                        </tr>
                    </thead>
                    <tbody className={`divide-y divide-slate-100 dark:divide-slate-700 ${loading ? 'opacity-50' : ''}`}>
                        {pinnedTopRows?.map((row, r) => renderRow(row, `pinned-top-${r}`, true))}
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={colCount} className="px-4 py-12 text-center text-xs font-bold text-slate-400">
                                    {loading ? 'Loading records…' : emptyMessage}
                                </td>
                            </tr>
                        ) : rows.map((row, r) => renderRow(row, rowKey(row, r), false))}
                        {pinnedBottomRows?.map((row, r) => renderRow(row, `pinned-bottom-${r}`, true))}
                    </tbody>
                </table>
            </div>

            {pagination && <ReportPagination {...pagination} disabled={loading} />}
        </section>
    );
}
