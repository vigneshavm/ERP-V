import React, { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

const SystemDataHubWidget = lazy(() => import('@/widgets/system-data-hub'));

const PageLoading = () => (
    <div className="min-h-[600px] flex flex-col items-center justify-center text-muted gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
        <p className="text-sm font-black uppercase tracking-[0.2em]">Synchronizing Data Hub...</p>
    </div>
);

const DataManagerPage: React.FC = () => {
    return (
        <div className="page-shell">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-main tracking-tight uppercase underline decoration-indigo-500 decoration-4 underline-offset-8">Data Operations Hub</h1>
                    <p className="text-muted mt-2 font-medium">Wings-grade data control, migration, and numbering intelligence.</p>
                </div>
            </div>

            <Suspense fallback={<PageLoading />}>
                <SystemDataHubWidget />
            </Suspense>
        </div>
    );
};

export default DataManagerPage;
