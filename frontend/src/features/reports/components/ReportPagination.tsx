import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatNumber } from '@/utils/formatters';
import { pageWindow } from './reportHelpers';

export interface ReportPaginationProps {
    /** 1-based. */
    page: number;
    pageSize: number;
    total: number;
    onPage: (page: number) => void;
    disabled?: boolean;
    noun?: string;
}

const pageBtn = 'min-w-8 h-8 px-2 rounded-md text-xs font-bold tabular-nums disabled:opacity-40';

export const ReportPagination: React.FC<ReportPaginationProps> = ({ page, pageSize, total, onPage, disabled, noun = 'records' }) => {
    if (total <= 0) return null;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const first = (page - 1) * pageSize + 1;
    const last = Math.min(page * pageSize, total);

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>
                Showing <b className="tabular-nums text-slate-700 dark:text-slate-300">{formatNumber(first)}</b> to{' '}
                <b className="tabular-nums text-slate-700 dark:text-slate-300">{formatNumber(last)}</b> of{' '}
                <b className="tabular-nums text-slate-700 dark:text-slate-300">{formatNumber(total)}</b> {noun}
            </span>
            {pages > 1 && (
                <nav aria-label="Pagination" className="flex items-center gap-1 self-end sm:self-auto">
                    <button type="button" onClick={() => onPage(page - 1)} disabled={disabled || page <= 1} className={`${pageBtn} border border-slate-200 dark:border-slate-700`} aria-label="Previous page">
                        <ChevronLeft className="w-4 h-4 mx-auto" />
                    </button>
                    {pageWindow(page, pages).map((p, i) =>
                        p === 'gap' ? (
                            <span key={`gap-${i}`} className="px-1 text-slate-400" aria-hidden>…</span>
                        ) : (
                            <button
                                key={p}
                                type="button"
                                onClick={() => onPage(p)}
                                disabled={disabled}
                                aria-current={p === page ? 'page' : undefined}
                                className={`${pageBtn} ${p === page ? 'bg-primary text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                            >
                                {formatNumber(p)}
                            </button>
                        ),
                    )}
                    <button type="button" onClick={() => onPage(page + 1)} disabled={disabled || page >= pages} className={`${pageBtn} border border-slate-200 dark:border-slate-700`} aria-label="Next page">
                        <ChevronRight className="w-4 h-4 mx-auto" />
                    </button>
                </nav>
            )}
        </div>
    );
};
