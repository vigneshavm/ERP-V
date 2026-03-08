import React from 'react';

export interface SkeletonProps {
    className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = "" }) => (
    <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded ${className}`} />
);

export const CardSkeleton: React.FC = () => (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <Skeleton className="w-12 h-12 rounded-2xl mb-4" />
        <Skeleton className="w-24 h-4 mb-2" />
        <Skeleton className="w-16 h-8" />
    </div>
);

export const GridSkeleton: React.FC = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm h-[320px]">
                <Skeleton className="aspect-[4/3] w-full" />
                <div className="p-5 space-y-3">
                    <div className="flex justify-between">
                        <Skeleton className="w-16 h-3" />
                        <Skeleton className="w-10 h-3" />
                    </div>
                    <Skeleton className="w-full h-5" />
                    <Skeleton className="w-2/3 h-4" />
                    <div className="flex justify-between items-center pt-2">
                        <Skeleton className="w-20 h-8" />
                        <Skeleton className="w-10 h-10 rounded-xl" />
                    </div>
                </div>
            </div>
        ))}
    </div>
);

export const TableSkeleton: React.FC = () => (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex gap-4">
            {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="flex-1 h-6" />
            ))}
        </div>
        <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {[...Array(10)].map((_, i) => (
                <div key={i} className="p-4 flex gap-4">
                    {[...Array(5)].map((_, j) => (
                        <Skeleton key={j} className="flex-1 h-8" />
                    ))}
                </div>
            ))}
        </div>
    </div>
);

export const FormSkeleton: React.FC = () => (
    <div className="max-w-4xl mx-auto space-y-8 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4 mb-8">
            <Skeleton className="w-16 h-16 rounded-2xl" />
            <div className="space-y-2">
                <Skeleton className="w-48 h-6" />
                <Skeleton className="w-32 h-4" />
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                    <Skeleton className="w-20 h-3" />
                    <Skeleton className="w-full h-12 rounded-xl" />
                </div>
            ))}
        </div>
        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
            <Skeleton className="w-24 h-12 rounded-xl" />
            <Skeleton className="w-32 h-12 rounded-xl" />
        </div>
    </div>
);

export const DashboardSkeleton: React.FC = () => (
    <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <TableSkeleton />
            </div>
            <div className="space-y-6">
                <CardSkeleton />
                <CardSkeleton />
            </div>
        </div>
    </div>
);
