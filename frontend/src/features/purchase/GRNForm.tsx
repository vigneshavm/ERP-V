import React from 'react';
import { CheckCircle, ArrowLeft, Truck, ClipboardCheck, Loader2, AlertTriangle } from 'lucide-react';
import Layout from "../../components/shared/Layout/Layout";
import PageHeader from "../../components/shared/Layout/PageHeader";
import { useGRNForm } from './hooks/useGRNForm';
import GRNGeneralInfo from './Components/GRNGeneralInfo';
import GRNItemsTable from './Components/GRNItemsTable';
import GRNSummary from './Components/GRNSummary';

const GRNForm: React.FC = () => {
    const {
        poId,
        grnData,
        availablePOs,
        warehouses,
        handlePOSelect,
        handleItemChange,
        saveGRN,
        isSaving,
        saveError,
        setGrnField,
        navigate
    } = useGRNForm();

    return (
        <Layout>
            <div className="pt-8 space-y-10 pb-32">
                <PageHeader
                    title={poId ? "Authorize Receipt" : "Incoming Node Initialization"}
                    description="Record institutional shipment arrivals and execute node-level quality verification."
                    breadcrumbs={[
                        { label: 'Procurement', link: '/purchase' },
                        { label: 'GRN Archive', link: '/purchase/grn' },
                        { label: 'New Receipt' }
                    ]}
                    actions={
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/purchase/grn')}
                                className="px-5 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-50 shadow-sm transition active:scale-95"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2 inline" /> Abort
                            </button>
                            <button
                                onClick={() => saveGRN()}
                                disabled={isSaving}
                                className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition hover:scale-105 active:scale-95 flex items-center gap-2 disabled:opacity-60"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
                                {isSaving ? 'Recording...' : 'Authorize & Receive'}
                            </button>
                        </div>
                    }
                />

                {saveError && (
                    <div className="p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl text-sm font-bold flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>{saveError}</span>
                    </div>
                )}

                {/* Logistics Context Node */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-neutral-800 p-8 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-700 shadow-sm flex items-center gap-6 group hover:border-primary/20 transition-all">
                        <div className="p-4 bg-primary/10 text-primary rounded-sm group-hover:rotate-12 transition-transform">
                            <Truck className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none mb-1">Transit Node</p>
                            <p className="text-xl font-black text-neutral-900 dark:text-white tracking-tighter uppercase tabular-nums">In-Bound</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-neutral-800 p-8 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-700 shadow-sm flex items-center gap-6 group hover:border-success/20 transition-all">
                        <div className="p-4 bg-emerald-50 text-success dark:bg-emerald-900/20 rounded-sm group-hover:rotate-12 transition-transform">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none mb-1">QA Protocol</p>
                            <p className="text-xl font-black text-emerald-600 dark:text-success tracking-tighter uppercase tabular-nums">Active</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Node Workspace */}
                    <div className="lg:col-span-8 space-y-10">
                        <div className="bg-white dark:bg-neutral-800 rounded-[3rem] border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700">
                            <div className="p-10">
                                <GRNGeneralInfo
                                    poId={poId}
                                    availablePOs={availablePOs}
                                    onPOSelect={handlePOSelect}
                                    grnNumber={grnData.grnNumber}
                                    receivedDate={grnData.receivedDate}
                                    onDateChange={(date) => setGrnField('receivedDate', date)}
                                    vendorName={grnData.vendorName}
                                    warehouses={warehouses}
                                    warehouseId={grnData.warehouseId}
                                    onWarehouseChange={(id) => setGrnField('warehouseId', id)}
                                />
                            </div>
                        </div>

                        <div className="bg-white dark:bg-neutral-800 rounded-[3rem] border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-700">
                            <div className="p-2 pt-10">
                                <GRNItemsTable
                                    items={grnData.items}
                                    poNumber={grnData.poNumber}
                                    onItemChange={handleItemChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Fiscal & Notes Sidebar */}
                    <div className="lg:col-span-4">
                        <GRNSummary
                            items={grnData.items}
                            attachments={grnData.attachments}
                            notes={grnData.notes}
                            onNotesChange={(notes) => setGrnField('notes', notes)}
                        />
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default GRNForm;
