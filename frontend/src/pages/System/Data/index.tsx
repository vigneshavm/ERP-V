import React, { lazy, Suspense } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../redux/store';
import { setActiveTab } from '../../../redux/slices/uiSlice';
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
            case 'GROW_DATA_CLEANUP': return 'export'; // Or a cleanup tab if it existed
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
        { id: 'export', label: 'Data Export', icon: Download },
        { id: 'import', label: 'Bulk Import', icon: Upload },
        { id: 'labels', label: 'Label Engine', icon: QrCode },
        { id: 'series', label: 'Number Series', icon: Hash },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase underline decoration-indigo-500 decoration-4 underline-offset-8">Data Operations Hub</h1>
                    <p className="text-slate-500 mt-2 font-medium">Wings-grade data control, migration, and numbering intelligence.</p>
                </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl w-fit shadow-inner">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id as DataTab)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeDataTab === tab.id
                                ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-xl scale-105'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50 dark:hover:bg-white/5'
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
