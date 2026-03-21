import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { PurchaseForm } from '@/widgets/purchase/purchase-form';
import { createPurchaseOrder } from '@/entities/purchase/model/purchaseSlice';
import Layout from '@/shared/ui/Layout/Layout';
import PageShell from '@/shared/ui/Layout/PageShell';
import { PurchaseOrder } from "@repo/shared";
import { Plus, Boxes, Sparkles, Truck } from 'lucide-react';

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
            <PageShell className="bg-app flex-1 flex flex-col min-h-0 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Cinematic Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-md border border-blue-500/20">Procurement Command</span>
                            <span className="text-neutral-300 dark:text-neutral-700">/</span>
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Inbound Logistics</span>
                        </div>
                        <h2 className="text-4xl font-black text-neutral-900 dark:text-main tracking-tight leading-none flex items-center gap-3">
                            Purchase Strategy <Sparkles className="w-8 h-8 text-blue-500" />
                        </h2>
                        <p className="text-sm text-neutral-500 font-medium italic mt-3">
                            Orchestrate inventory replenishment and fiscal commitments with precision.
                        </p>
                    </div>
                </div>

                {/* Form Container */}
                <div className="erp-card rounded-[3rem] p-10 shadow-2xl border-none bg-white dark:bg-neutral-900 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                        <Boxes className="w-64 h-64 text-blue-500" />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <Truck className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-neutral-900 dark:text-main uppercase tracking-tighter italic leading-none">Manifest Construction</h3>
                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1 italic">Define the supply vector and material requirements</p>
                            </div>
                        </div>

                        <div className="custom-scrollbar">
                            <PurchaseForm
                                onSave={handleSave}
                                isSubmitting={isSubmitting}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Brand */}
                <div className="mt-8 flex items-center justify-center gap-6 opacity-30 group pb-24">
                    <div className="h-px w-20 bg-neutral-400 dark:bg-neutral-600" />
                    <div className="flex items-center gap-2">
                        <Boxes className="w-4 h-4" />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em]">Supply Matrix Entry Points Secured • BizzAI Inbound Protocol</span>
                    </div>
                    <div className="h-px w-20 bg-neutral-400 dark:bg-neutral-600" />
                </div>
            </PageShell>
        </Layout>
    );
};

export default PurchaseEntry;
