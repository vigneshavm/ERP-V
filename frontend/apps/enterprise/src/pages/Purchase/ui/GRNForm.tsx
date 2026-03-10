import React from 'react';
import { CheckCircle } from 'lucide-react';
import Layout from "@/shared/ui/Layout/Layout";
import PageHeader from "@/shared/ui/Layout/PageHeader";
import { useGRNForm } from '../hooks/useGRNForm';
import GRNGeneralInfo from '../Components/GRNGeneralInfo';
import GRNItemsTable from '../Components/GRNItemsTable';
import GRNSummary from '../Components/GRNSummary';

const GRNForm: React.FC = () => {
    const {
        poId,
        grnData,
        availablePOs,
        handlePOSelect,
        handleItemChange,
        saveGRN,
        setGrnField,
        navigate
    } = useGRNForm();

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in pb-20">
                <PageHeader
                    title={poId ? "Create GRN" : "New Goods Receipt"}
                    description="Record incoming shipment details and perform quality checks."
                    actions={
                        <div className="flex gap-2">
                            <button
                                onClick={() => navigate('/purchase/grn')}
                                className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => saveGRN('Accepted')}
                                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 flex items-center gap-2"
                            >
                                <CheckCircle className="w-4 h-4" /> Accept & Receive
                            </button>
                        </div>
                    }
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <GRNGeneralInfo
                            poId={poId}
                            availablePOs={availablePOs}
                            onPOSelect={handlePOSelect}
                            grnNumber={grnData.grnNumber}
                            receivedDate={grnData.receivedDate}
                            onDateChange={(date) => setGrnField('receivedDate', date)}
                            vendorName={grnData.vendorName}
                        />

                        <GRNItemsTable
                            items={grnData.items}
                            poNumber={grnData.poNumber}
                            onItemChange={handleItemChange}
                        />
                    </div>

                    {/* Sidebar */}
                    <GRNSummary
                        items={grnData.items}
                        attachments={grnData.attachments}
                        notes={grnData.notes}
                        onNotesChange={(notes) => setGrnField('notes', notes)}
                    />
                </div>
            </div>
        </Layout>
    );
};

export default GRNForm;
