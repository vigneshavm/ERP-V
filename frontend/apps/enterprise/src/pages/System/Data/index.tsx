import React, { lazy, Suspense } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { setActiveTab } from '@/redux/slices/uiSlice';
import { Download, Upload, QrCode, Hash, Loader2 } from 'lucide-react';

// Lazy load heavy components
const DataExport = lazy(() => import('./components/DataExport'));
const BulkImport = lazy(() => import('./components/BulkImport'));
const BarcodeGenerator = lazy(() => import('./components/BarcodeGenerator'));
const SequenceControl = lazy(() => import('./components/SequenceControl'));

type DataTab = 'export' | 'import' | 'labels' | 'series';

const TabLoading = () => (
    <div className="min-h-[400px] flex flex-col items-center justify-center text-slate-400 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-xs font-black uppercase tracking-widest">Loading Intelligence Layer...</p>
    </div>
);

const DataManager: React.FC = () => {
    const dispatch = useDispatch();
    const { activeTab } = useSelector((state: RootState) => state.ui);

    // Map Redux activeTab to internal section
    const activeDataTab: DataTab = (() => {
        switch (activeTab) {
            case 'GROW_DATA_IMPORT': return 'import';
            case 'GROW_DATA_EXPORT': return 'export';
            case 'GROW_DATA_CLEANUP': return 'export'; 
            case 'GROW_DATA_DUPLICATES': return 'export';
            case 'GROW_DATA_HEALTH': return 'export';
            case 'BARCODE_GENERATOR': return 'labels';
            case 'LABEL_PRINTING': return 'labels';
            case 'BULK_IMPORT': return 'import';
            case 'DATA_EXPORT': return 'export';
            case 'NUMBER_SERIES': return 'series';
            default: return 'export';
        }
    })();

    const handleTabChange = (tab: DataTab) => {
        const tabMap: Record<DataTab, string> = {
            export: 'GROW_DATA_EXPORT',
            import: 'GROW_DATA_IMPORT',
            labels: 'BARCODE_GENERATOR',
            series: 'NUMBER_SERIES'
        };
        dispatch(setActiveTab((tabMap[tab] || 'GROW_DATA_EXPORT') as any));
    };

    const tabs = [
        { id: 'export', label: 'Data Extractions', icon: Download },
        { id: 'import', label: 'Bulk Ingestion', icon: Upload },
        { id: 'labels', label: 'Label Synthesis', icon: QrCode },
        { id: 'series', label: 'Governed Series', icon: Hash },
    ];

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 border-b border-slate-100 dark:border-slate-800 pb-10">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
                        Data <span className="text-indigo-600">Operations</span> Hub
                    </h1>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-1 bg-indigo-500 rounded-full"></div>
                        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Wings-grade portability & ledger governance</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-[1.5rem] shadow-inner border border-slate-200/50 dark:border-slate-800/50">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isSelected = activeDataTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id as DataTab)}
                                className={`flex items-center gap-3 px-6 py-3.5 rounded-[1.1rem] text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${isSelected
                                    ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-xl shadow-indigo-500/10 scale-105'
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50'
                                    }`}
                            >
                                <Icon className={`w-4 h-4 ${isSelected ? 'animate-pulse' : ''}`} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="min-h-[500px]">
                <Suspense fallback={<TabLoading />}>
                    {activeDataTab === 'export' && <DataExport />}
                    {activeDataTab === 'import' && <BulkImport />}
                    {activeDataTab === 'labels' && <BarcodeGenerator />}
                    {activeDataTab === 'series' && <SequenceControl />}
                </Suspense>
            </div>
        </div>
    );
};

export default DataManager;
