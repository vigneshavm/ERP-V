import React, { lazy, Suspense, useState } from 'react';
import { Download, Upload, QrCode, Hash, Loader2 } from 'lucide-react';

const DataExportFeature = lazy(() => import('@/features/system/data-export'));
const BulkImportFeature = lazy(() => import('@/features/system/bulk-import'));
const BarcodeGeneratorFeature = lazy(() => import('@/features/system/barcode-generator'));
const SequenceControlFeature = lazy(() => import('@/features/system/sequence-control'));

type DataTab = 'export' | 'import' | 'labels' | 'series';

const TabLoading = () => (
    <div className="min-h-[400px] flex flex-col items-center justify-center text-muted gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-xs font-black uppercase tracking-widest text-center">Initializing Intelligence Layer...</p>
    </div>
);

export const SystemDataHub: React.FC = () => {
    const [activeDataTab, setActiveDataTab] = useState<DataTab>('export');

    const tabs = [
        { id: 'export', label: 'Data Export',   icon: Download },
        { id: 'import', label: 'Bulk Import',   icon: Upload },
        { id: 'labels', label: 'Label Engine',  icon: QrCode },
        { id: 'series', label: 'Number Series', icon: Hash },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center gap-2 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)] p-1.5 rounded-2xl w-fit shadow-inner">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveDataTab(tab.id as DataTab)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                activeDataTab === tab.id
                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-xl scale-105'
                                    : 'text-muted hover:text-secondary hover:bg-white/50 dark:hover:bg-[var(--erp-bg-sunken)]'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            <div className="min-h-[500px]">
                <Suspense fallback={<TabLoading />}>
                    {activeDataTab === 'export' && <DataExportFeature />}
                    {activeDataTab === 'import' && <BulkImportFeature />}
                    {activeDataTab === 'labels' && <BarcodeGeneratorFeature />}
                    {activeDataTab === 'series' && <SequenceControlFeature />}
                </Suspense>
            </div>
        </div>
    );
};
