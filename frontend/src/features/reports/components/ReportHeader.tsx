import React from 'react';
import { ChevronRight } from 'lucide-react';
import { ReportDisplayStatus, ReportStatusBadge } from './ReportStatusBadge';

export interface ReportHeaderProps {
    /** Breadcrumb trail after "Reports", e.g. ['Transaction Reports']. */
    breadcrumb: string[];
    title: string;
    description: string;
    status: ReportDisplayStatus;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({ breadcrumb, title, description, status }) => (
    <header className="space-y-2">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {/* The top level is dropped on phones so the trail fits on one line. */}
            <span className="hidden sm:inline">Business Intelligence</span>
            {['Reports', ...breadcrumb].map((crumb, i) => (
                <React.Fragment key={crumb}>
                    <ChevronRight className={`w-3 h-3 ${i === 0 ? 'hidden sm:block' : ''}`} aria-hidden />
                    <span className="whitespace-nowrap">{crumb}</span>
                </React.Fragment>
            ))}
        </nav>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="min-w-0">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{title}</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">{description}</p>
            </div>
            <div className="shrink-0">
                <ReportStatusBadge status={status} />
            </div>
        </div>
    </header>
);
