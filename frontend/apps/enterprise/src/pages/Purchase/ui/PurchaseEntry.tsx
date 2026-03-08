import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { PurchaseForm } from '@/widgets/purchase/purchase-form';
import { createPurchaseOrder } from '@/entities/purchase/model/purchaseSlice';
import Layout from '@/shared/ui/Layout/Layout';
import PageHeader from '@/shared/ui/Layout/PageHeader';
import { PurchaseOrder } from "@vignesh-erp/shared-kernel";

const PurchaseEntry: React.FC = () => {
    const dispatch = useDispatch<any>();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSave = async (data: Partial<PurchaseOrder>) => {
        setIsSubmitting(true);
        try {
            const result = await dispatch(createPurchaseOrder(data)).unwrap();
            if (result.success) {
                toast.success("Strategic Purchase Manifest Registered");
                navigate('/purchase/history');
            }
        } catch (err: any) {
            toast.error(err.message || "Fiscal validation failed for purchase entry");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Layout>
            <div className="flex flex-col h-full bg-slate-50/30 dark:bg-slate-950/30">
                <PageHeader 
                    title="Purchase Strategy & Inwarding" 
                    subtitle="Orchestrate inventory replenishment and fiscal commitments"
                />
                
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <PurchaseForm 
                        onSave={handleSave} 
                        isSubmitting={isSubmitting} 
                    />
                </div>
            </div>
        </Layout>
    );
};

export default PurchaseEntry;
