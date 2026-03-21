import { useAuthStore } from '@repo/shared';
import { logger } from '@/shared/lib/logger';

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, CheckCircle, FileOutput, Printer, Lock, 
  Truck, ShieldCheck, Calendar, User, ShoppingCart,
  Target, Zap, AlertCircle, FileText, ArrowRightCircle,
  Boxes, TrendingUp, Sparkles, IndianRupee
} from 'lucide-react';
import { PurchaseOrder, PurchaseOrderItem } from "@repo/shared";
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from "@/app/store/store";

import CreateBillModal from '../Modals/CreateBillModal';
import ReceiveGoodsModal from '../Modals/ReceiveGoodsModal';
import { useParams, useNavigate } from 'react-router-dom';
import { AppDispatch } from "@/app/store/store";
import { fetchPurchaseById, resetSelectedOrder, updateOrder } from "@/entities/purchase/model/purchaseSlice";
import Layout from "@/shared/ui/Layout/Layout";
import PageShell from "@/shared/ui/Layout/PageShell";

interface Props {
    order?: PurchaseOrder;
    items?: PurchaseOrderItem[];
    onBack?: () => void;
    onApprove?: () => void;
    onConvert?: (order: PurchaseOrder, items: PurchaseOrderItem[]) => void;
    onUpdateStatus?: (orderId: string, status: string) => void;
}

const PurchaseOrderDetails: React.FC<Props> = ({ order: propOrder, items: propItems, onBack, onApprove, onConvert, onUpdateStatus }) => {
    logger.info("PurchaseOrderDetails loaded - Modernized Version");
    const { role } = useAuthStore();
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    // Redux State
    const { selectedOrder, isProcessing } = useSelector((state: RootState) => state.purchase);

    // Derived State: Use prop or Redux store
    const order = propOrder || selectedOrder;
    const items = propItems || (order?.items || []);

    useEffect(() => {
        if (id && !propOrder) {
            dispatch(fetchPurchaseById(id));
        }
    }, [id, propOrder, dispatch]);

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate('/purchase/register');
        }
    };

    const [showReceiveModal, setShowReceiveModal] = useState(false);
    const [showBillModal, setShowBillModal] = useState(false);

    const handleBillCreated = () => {
        if (!order) return;
        onUpdateStatus?.(order.id, 'Billed');
        setShowBillModal(false);
    };

    // Permissions
    const isOwner = role === 'Owner';
    const canApprove = isOwner && (order?.status === 'Pending Approval' || order?.status === 'Pending');
    const canSubmit = order?.status === 'Draft';
    const canReceive = order?.status === 'Approved' || order?.status === 'Partial Receipt';
    const canBill = order?.status === 'Fully Received' || order?.status === 'Partial Receipt';
    const canPay = order?.status === 'Billed';

    const handleReceiveConfirm = (receivedItems: any[], status: 'Partial Receipt' | 'Fully Received') => {
        if (!order) return;
        onUpdateStatus?.(order.id, status);
        setShowReceiveModal(false);
    };

    if (isProcessing && !order) {
        return (
            <Layout>
                <PageShell className="flex flex-col items-center justify-center py-40">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                        <Truck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-blue-500 animate-pulse" />
                    </div>
                    <p className="mt-6 text-sm font-black uppercase tracking-widest text-neutral-400 animate-pulse">Establishing Sourcing Link...</p>
                </PageShell>
            </Layout>
        );
    }

    if (!order) {
        return (
            <Layout>
                <PageShell className="flex flex-col items-center justify-center py-40">
                    <div className="p-8 bg-neutral-100 rounded-[3rem] text-neutral-400 mb-6">
                        <AlertCircle className="w-16 h-16" />
                    </div>
                    <h3 className="text-xl font-black text-neutral-900 uppercase tracking-tighter italic">Sequence Null</h3>
                    <button onClick={handleBack} className="mt-8 px-8 py-3 bg-neutral-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                        Return to Hub
                    </button>
                </PageShell>
            </Layout>
        );
    }

    // Lifecycle Steps
    const steps = [
        { label: 'Draft', status: 'Draft' },
        { label: 'Pending', status: ['Pending', 'Pending Approval'] },
        { label: 'Approved', status: 'Approved' },
        { label: 'Received', status: ['Partial Receipt', 'Fully Received', 'Converted'] },
        { label: 'Billed', status: 'Billed' },
        { label: 'Paid', status: 'Paid' }
    ];

    const getCurrentStepIndex = () => {
        if (order.status === 'Cancelled') return -1;
        return steps.findIndex(step =>
            Array.isArray(step.status)
                ? step.status.includes(order.status)
                : step.status === order.status
        );
    };

    const currentStepIndex = getCurrentStepIndex();

    return (
        <Layout>
            <PageShell className="bg-app flex-1 flex flex-col min-h-0 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto w-full">
                {/* Cinematic Supply Header */}
                <div className="erp-card rounded-[3.5rem] p-12 bg-neutral-900 text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 group-hover:rotate-12 transition-transform duration-1000">
                        <Truck className="w-80 h-80" />
                    </div>
                    
                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-8">
                                <button
                                    onClick={handleBack}
                                    className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all active:scale-95"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <span className="w-1 h-1 rounded-full bg-white/30" />
                                <div className="flex items-center gap-2 px-4 py-1.5 bg-blue-500/20 backdrop-blur-md rounded-xl border border-blue-500/20">
                                    <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300">Supply Sequence</span>
                                </div>
                            </div>
                            
                            <h1 className="text-6xl font-black tracking-tighter mb-4 flex items-baseline gap-4 leading-none">
                                {order.po_number}
                                <span className="text-xl font-bold text-white/40 tracking-normal italic font-serif">Inbound Intent</span>
                            </h1>
                            
                            <div className="flex flex-wrap items-center gap-8 mt-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/5">
                                        <User className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em] mb-1.5 leading-none">Prime Supplier</p>
                                        <p className="text-lg font-black uppercase tracking-tight leading-none text-white italic">
                                            {order.vendor_name}
                                        </p>
                                    </div>
                                </div>
                                <div className="w-px h-10 bg-white/10 hidden sm:block" />
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/5">
                                        <Calendar className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em] mb-1.5 leading-none">Inception Cycle</p>
                                        <p className="text-lg font-black uppercase tracking-tight leading-none text-white italic">
                                            {new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-6 self-end lg:self-center">
                            <div className="text-right">
                                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-2 italic">Procurement Value</p>
                                <h2 className="text-5xl font-black text-blue-400 tracking-tighter italic">₹{Number(order.total_amount).toLocaleString()}</h2>
                            </div>
                            <div className="flex gap-3">
                                <button className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all shadow-sm">
                                    <Printer className="w-5 h-5" />
                                </button>
                                {canSubmit && (
                                    <button 
                                        onClick={() => onUpdateStatus?.(order.id, 'Pending Approval')}
                                        className="px-8 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shadow-2xl shadow-blue-600/20"
                                    >
                                        <Zap className="w-4 h-4" /> <span>Submit Protocol</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Protocol Lifecycle Stepper */}
                <div className="erp-card rounded-[3rem] p-4 bg-[var(--erp-bg-sunken)] dark:bg-neutral-950/30 border border-default dark:border-neutral-800 shadow-inner group">
                    <div className="p-8 flex items-center justify-between min-w-[600px]">
                        {steps.map((step, idx) => {
                            const isCompleted = currentStepIndex > idx;
                            const isCurrent = currentStepIndex === idx;
                            const isCancelled = order.status === 'Cancelled';

                            return (
                                <React.Fragment key={step.label}>
                                    <div className="flex flex-col items-center gap-3 relative z-10 group/step">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-black transition-all duration-500 border-2
                                            ${isCompleted ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/30 scale-110' :
                                                isCurrent ? (isCancelled ? 'bg-rose-500 text-white border-rose-500' : 'bg-white dark:bg-neutral-900 text-blue-600 border-blue-600 ring-8 ring-blue-500/10 scale-110') :
                                                    'bg-white dark:bg-neutral-900 text-neutral-400 border-neutral-200 dark:border-neutral-800 opacity-50'}`}>
                                            {isCompleted ? <CheckCircle className="w-5 h-5" /> : idx + 1}
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <span className={`text-[10px] font-black uppercase tracking-[0.1em] ${isCurrent || isCompleted ? 'text-neutral-900 dark:text-main' : 'text-neutral-400'}`}>
                                                {step.label}
                                            </span>
                                            {isCurrent && (
                                                <div className="w-1 h-1 rounded-full bg-blue-600 mt-1 animate-ping" />
                                            )}
                                        </div>
                                    </div>
                                    {idx < steps.length - 1 && (
                                        <div className="flex-1 h-1.5 mx-4 bg-neutral-200 dark:bg-neutral-800 rounded-full relative overflow-hidden">
                                            <div
                                                className="absolute inset-y-0 left-0 bg-blue-600 transition-all duration-1000 ease-in-out"
                                                style={{ width: isCompleted ? '100%' : '0%' }}
                                            />
                                        </div>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-8 mb-24">
                    {/* Sourcing Intelligence Sidebar */}
                    <div className="col-span-12 lg:col-span-4 space-y-8">
                         {/* Command Actions Card */}
                        {(canApprove || canReceive || canBill || canPay) && (
                            <div className="erp-card rounded-[3rem] p-10 bg-white dark:bg-neutral-900 border-none shadow-sm flex flex-col gap-6">
                                <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] flex items-center gap-3 italic">
                                    <Target className="w-4 h-4 text-blue-500" /> Command Actions
                                </h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {canApprove && (
                                        <>
                                            <button
                                                onClick={() => onUpdateStatus?.(order.id, 'Approved')}
                                                className="w-full py-5 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-3"
                                            >
                                                <ShieldCheck className="w-5 h-5" /> Execute Approval
                                            </button>
                                            <button
                                                onClick={() => onUpdateStatus?.(order.id, 'Draft')}
                                                className="w-full py-5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center justify-center gap-3"
                                            >
                                                <AlertCircle className="w-5 h-5" /> Reject Protocol
                                            </button>
                                        </>
                                    )}
                                    {canReceive && (
                                        <button
                                            onClick={() => setShowReceiveModal(true)}
                                            className="w-full py-5 bg-orange-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-orange-600/20 flex items-center justify-center gap-3"
                                        >
                                            <Truck className="w-5 h-5" /> Log Material Inbound
                                        </button>
                                    )}
                                    {canBill && (
                                        <button
                                            onClick={() => setShowBillModal(true)}
                                            className="w-full py-5 bg-purple-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-purple-600/20 flex items-center justify-center gap-3"
                                        >
                                            <FileText className="w-5 h-5" /> Materialize Bill
                                        </button>
                                    )}
                                    {canPay && (
                                        <button
                                            onClick={() => onUpdateStatus?.(order.id, 'Paid')}
                                            className="w-full py-5 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3"
                                        >
                                            <IndianRupee className="w-5 h-5" /> Complete Settlement
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Order Identity Card */}
                        <div className="erp-card rounded-[2.5rem] p-8 shadow-sm border-none bg-white dark:bg-neutral-900 group">
                            <h3 className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-8 flex items-center gap-2 italic">
                                <FileText className="w-4 h-4 text-blue-500/50" /> Protocol Metrics
                            </h3>
                            <div className="space-y-6">
                                <div className="p-5 bg-[var(--erp-bg-sunken)] dark:bg-neutral-950/50 rounded-2xl border border-default dark:border-neutral-800">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest italic">Expected Cycle</span>
                                        <span className="text-xs font-black text-neutral-900 dark:text-main italic">{order.expected_delivery || 'UNSPECIFIED'}</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-default dark:border-neutral-800">
                                        <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest italic">Node Count</span>
                                        <span className="text-xs font-black text-blue-600 italic">{items.length} SKUs</span>
                                    </div>
                                </div>
                                {order.notes && (
                                     <div className="p-5 bg-amber-500/5 dark:bg-amber-950/10 rounded-2xl border border-amber-500/10 italic">
                                        <span className="text-[9px] font-black text-amber-500 uppercase tracking-[0.2em] block mb-2 leading-none">Intelligence Observation</span>
                                        <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed uppercase tracking-tight font-medium">{order.notes}</p>
                                     </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Main Sourcing Ledger */}
                    <div className="col-span-12 lg:col-span-8 space-y-8">
                        <div className="erp-card rounded-[3.5rem] p-1 shadow-2xl border-none overflow-hidden bg-white dark:bg-neutral-900 relative">
                             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 opacity-20" />
                             <div className="p-10">
                                <div className="flex items-center gap-4 mb-10 px-2">
                                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                        <Boxes className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-2xl font-black text-neutral-900 dark:text-main uppercase tracking-tighter italic leading-none">Inbound SKU Matrix</h3>
                                </div>

                                <div className="overflow-x-auto px-1">
                                    <table className="w-full text-left border-separate border-spacing-y-4">
                                        <thead>
                                            <tr className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400">
                                                <th className="px-8 py-2">Material Node</th>
                                                <th className="px-8 py-2 text-center">Protocol Qty</th>
                                                <th className="px-8 py-2 text-right">Unit Rate</th>
                                                <th className="px-8 py-2 text-right">Node Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((item, idx) => (
                                                <tr key={idx} className="group/row hover:transform hover:-translate-y-1 transition-all duration-500">
                                                    <td className="px-2 py-1">
                                                        <div className="bg-[var(--erp-bg-sunken)] dark:bg-neutral-950/50 rounded-[1.5rem] p-6 border border-default dark:border-neutral-800 group-hover/row:border-blue-500/20 transition-all flex items-center gap-4">
                                                            <div className="p-3 bg-white dark:bg-neutral-900 rounded-xl border border-default dark:border-neutral-800 text-blue-500">
                                                                <Target className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <p className="text-base font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight italic leading-none mb-1">{item.product_name}</p>
                                                                <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest italic leading-none">FISCAL MATERIAL NODE</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-1 text-center">
                                                        <div className="bg-[var(--erp-bg-sunken)] dark:bg-neutral-950/50 rounded-[1.5rem] p-6 border border-default dark:border-neutral-800 transition-all font-black text-lg text-blue-600 italic">
                                                            {item.quantity}
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-1 text-right">
                                                        <div className="bg-[var(--erp-bg-sunken)] dark:bg-neutral-950/50 rounded-[1.5rem] p-6 border border-default dark:border-neutral-800 transition-all font-mono font-bold text-neutral-500 italic text-sm">
                                                            ₹{item.rate?.toLocaleString()}
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-1 text-right">
                                                        <div className="bg-[var(--erp-bg-sunken)] dark:bg-neutral-950/50 rounded-[1.5rem] p-6 border border-default dark:border-neutral-800 transition-all font-mono font-black text-neutral-900 dark:text-main italic text-xl">
                                                            ₹{item.line_total?.toLocaleString()}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                
                                <div className="mt-12 p-10 bg-[var(--erp-bg-sunken)] dark:bg-neutral-950 rounded-[2.5rem] border border-default dark:border-neutral-800 flex flex-col items-end gap-2">
                                     <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] italic">Consolidated Supply Value</p>
                                     <h3 className="text-5xl font-black text-blue-600 dark:text-main tracking-tighter italic">₹{Number(order.total_amount).toLocaleString()}</h3>
                                     <div className="flex items-center gap-2 mt-4 px-4 py-1.5 bg-blue-500/10 rounded-full border border-blue-500/20">
                                        <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-blue-600">All Nodes Verified</span>
                                     </div>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Branded verification footprint */}
                <div className="mt-8 flex items-center justify-center gap-6 opacity-30 group pb-24">
                    <div className="h-px w-20 bg-neutral-400 dark:bg-neutral-600" />
                    <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em]">Supply Protocol Secured • Sequence Verification Integrity</span>
                    </div>
                    <div className="h-px w-20 bg-neutral-400 dark:bg-neutral-600" />
                </div>
            </PageShell>

            {/* Modals */}
            <ReceiveGoodsModal
                isOpen={showReceiveModal}
                onClose={() => setShowReceiveModal(false)}
                order={order}
                onConfirm={handleReceiveConfirm}
            />

            <CreateBillModal
                isOpen={showBillModal}
                onClose={() => setShowBillModal(false)}
                order={order}
                onBillCreated={handleBillCreated}
            />
        </Layout>
    );
};

export default PurchaseOrderDetails;
