import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileOutput, Printer, Info, Clock, Activity, FileText, CheckCircle2, XCircle, Zap, ShieldCheck, Truck } from 'lucide-react';
import { PurchaseOrder, PurchaseOrderItem } from "../../hooks/usePurchaseOrders";
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from "../../redux/store";

import CreateBillModal from './Modals/CreateBillModal';
import ReceiveGoodsModal, { ReceiveGoodsItem } from './Modals/ReceiveGoodsModal';
import { useParams, useNavigate } from 'react-router-dom';
import { AppDispatch } from '../../redux/store';
import { fetchPurchaseById, addGRN } from '../../redux/slices/purchaseSlice';
import { createGRN, mapGrnToFrontendGRN } from '../../services/grnService';

interface Props {
    order?: PurchaseOrder;
    items?: PurchaseOrderItem[];
    onBack?: () => void;
    onApprove?: () => void;
    onConvert?: (order: PurchaseOrder, items: PurchaseOrderItem[]) => void;
    onUpdateStatus?: (orderId: string, status: string) => void;
    // Called after a real GRN has been created against this order, so the caller can re-fetch
    // the authoritative PO state (status/received quantities recalculated server-side).
    onAfterReceive?: (orderId: string) => void;
}

const PurchaseOrderDetails: React.FC<Props> = ({ order: propOrder, items: propItems, onBack, onApprove: __onApprove, onConvert: __onConvert, onUpdateStatus, onAfterReceive }) => {
    const { role } = useSelector((state: RootState) => state.auth);
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
            navigate('/purchase/orders');
        }
    };

    const [showReceiveModal, setShowReceiveModal] = useState(false);
    const [showBillModal, setShowBillModal] = useState(false);
    const [isReceiving, setIsReceiving] = useState(false);
    const [receiveError, setReceiveError] = useState<string | null>(null);

    const handleBillCreated = () => {
        if (!order) return;
        onUpdateStatus?.(order.id, 'Billed');
        setShowBillModal(false);
    };

    // Permissions - status vocabulary matches backend IPurchase.status exactly (DRAFT ->
    // SUBMITTED -> APPROVED -> SENT_TO_VENDOR -> [PARTIALLY_RECEIVED ->] COMPLETED).
    const isOwner = role === 'Owner';
    const canSubmit = order?.status === 'DRAFT';
    const canApprove = isOwner && order?.status === 'SUBMITTED';
    const canSendToVendor = order?.status === 'APPROVED';
    const canReceive = order?.status === 'SENT_TO_VENDOR' || order?.status === 'PARTIALLY_RECEIVED';
    const canBill = order?.status === 'COMPLETED' || order?.status === 'PARTIALLY_RECEIVED';
    const canPay = order?.status === 'Billed';

    // Records a real Goods Receipt Note against this PO: POST /api/grn (GRNController.createGRN)
    // computes acceptedQty per item, moves inventory via InventoryService.addStock, writes a
    // StockLog entry, and recalculates the Purchase's status - this is no longer a local status
    // relabel, it's the actual E2E-001 "create GRN / update inventory" step.
    const handleReceiveConfirm = async (receivedItems: ReceiveGoodsItem[]) => {
        if (!order) return;
        const itemsToSend = receivedItems.filter(i => i.receivedQty > 0);
        if (itemsToSend.length === 0) {
            setShowReceiveModal(false);
            return;
        }
        setIsReceiving(true);
        setReceiveError(null);
        try {
            const result = await createGRN({
                purchaseId: order.id,
                items: itemsToSend.map(i => ({
                    productId: i.productId,
                    productName: i.productName,
                    receivedQty: i.receivedQty,
                    rejectedQty: i.rejectedQty,
                })),
            });
            if (result?.grn) {
                dispatch(addGRN(mapGrnToFrontendGRN(result.grn, {
                    poNumber: order.po_number,
                    vendorName: order.vendor_name,
                })));
            }
            setShowReceiveModal(false);
            onAfterReceive?.(order.id);
        } catch (err: any) {
            setReceiveError(err?.response?.data?.message || err?.message || 'Failed to record goods receipt');
        } finally {
            setIsReceiving(false);
        }
    };

    if (isProcessing && !order) {
        return (
            <div className="flex justify-center items-center py-40">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] animate-pulse">Decompressing Node Intel...</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="p-20 text-center">
                <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-sm flex items-center justify-center mx-auto mb-6">
                    <Info className="w-10 h-10 text-neutral-400" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-neutral-900 dark:text-white">Node Not Found</h3>
                <p className="text-xs font-bold text-neutral-500 mt-2 italic leading-relaxed">The requested procurement node does not exist in the institutional archive.</p>
                <button onClick={handleBack} className="mt-8 text-primary font-black uppercase tracking-widest text-[10px] hover:underline">Return to Register</button>
            </div>
        );
    }

    // Lifecycle Steps - matches backend IPurchase.status (DRAFT -> SUBMITTED -> APPROVED ->
    // SENT_TO_VENDOR -> [PARTIALLY_RECEIVED ->] COMPLETED), plus the local-only Billed/Paid tail.
    const steps = [
        { label: 'Draft', status: 'DRAFT' },
        { label: 'Pending', status: 'SUBMITTED' },
        { label: 'Approved', status: 'APPROVED' },
        { label: 'Sent to Vendor', status: 'SENT_TO_VENDOR' },
        { label: 'Received', status: ['PARTIALLY_RECEIVED', 'COMPLETED', 'RECEIVED'] },
        { label: 'Billed', status: 'Billed' },
        { label: 'Paid', status: 'Paid' }
    ];

    const getCurrentStepIndex = () => {
        if (order.status === 'CANCELLED') return -1;
        return steps.findIndex(step =>
            Array.isArray(step.status)
                ? step.status.includes(order.status)
                : step.status === order.status
        );
    };

    const currentStepIndex = getCurrentStepIndex();

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Context Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <button onClick={handleBack} className="p-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm hover:bg-neutral-50 shadow-sm transition active:scale-95">
                        <ArrowLeft className="w-5 h-5 text-neutral-500" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-3xl font-black tracking-tighter text-neutral-900 dark:text-white uppercase">
                                #{order.po_number}
                            </h2>
                            <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${order.status === 'CANCELLED' ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20' : 'bg-primary/10 text-primary'}`}>
                                {order.status}
                            </span>
                        </div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1 italic">Node initialized on {order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'N/A'}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="p-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm hover:bg-neutral-50 shadow-sm transition active:scale-95">
                        <Printer className="w-5 h-5 text-neutral-400" />
                    </button>

                    {canSubmit && (
                        <button
                            onClick={() => onUpdateStatus?.(order.id, 'SUBMITTED')}
                            className="px-6 py-3 bg-primary text-white rounded-sm text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-primary/90 transition hover:scale-105 active:scale-95"
                        >
                            <Zap className="w-4 h-4" /> Submit Protocol
                        </button>
                    )}

                    {canApprove && (
                        <div className="flex gap-3">
                            <button
                                onClick={() => onUpdateStatus?.(order.id, 'DRAFT')}
                                className="px-6 py-3 bg-rose-50 text-rose-600 dark:bg-rose-900/20 rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all active:scale-95 flex items-center gap-2"
                            >
                                <XCircle className="w-4 h-4" /> Reject Node
                            </button>
                            <button
                                onClick={() => onUpdateStatus?.(order.id, 'APPROVED')}
                                className="px-6 py-3 bg-emerald-500 text-white rounded-sm text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 flex items-center gap-2 hover:bg-emerald-600 transition hover:scale-105 active:scale-95"
                            >
                                <CheckCircle2 className="w-4 h-4" /> Authorize Node
                            </button>
                        </div>
                    )}

                    {canSendToVendor && (
                        <button
                            onClick={() => onUpdateStatus?.(order.id, 'SENT_TO_VENDOR')}
                            className="px-6 py-3 bg-sky-500 text-white rounded-sm text-[10px] font-black uppercase tracking-widest shadow-lg shadow-sky-500/20 flex items-center gap-2 hover:bg-sky-600 transition hover:scale-105 active:scale-95"
                        >
                            <Truck className="w-4 h-4" /> Send to Vendor
                        </button>
                    )}

                    {canReceive && (
                        <button
                            onClick={() => setShowReceiveModal(true)}
                            className="px-6 py-3 bg-indigo-500 text-white rounded-sm text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 flex items-center gap-2 hover:bg-indigo-600 transition hover:scale-105 active:scale-95"
                        >
                            <FileOutput className="w-4 h-4" /> Initialize Receipt
                        </button>
                    )}

                    {canBill && (
                        <button
                            onClick={() => setShowBillModal(true)}
                            className="px-6 py-3 bg-purple-500 text-white rounded-sm text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-500/20 flex items-center gap-2 hover:bg-purple-600 transition hover:scale-105 active:scale-95"
                        >
                            <FileText className="w-4 h-4" /> Generate Invoice
                        </button>
                    )}

                    {canPay && (
                        <button
                            onClick={() => onUpdateStatus?.(order.id, 'Paid')}
                            className="px-6 py-3 bg-emerald-500 text-white rounded-sm text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 flex items-center gap-2 hover:bg-emerald-600 transition hover:scale-105 active:scale-95"
                        >
                            <ShieldCheck className="w-4 h-4" /> Resolve Settlement
                        </button>
                    )}
                </div>
            </div>

            {/* Cyber-Carbon Node Stepper */}
            <div className="bg-white dark:bg-neutral-800 p-10 rounded-[3.5rem] border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-x-auto custom-scrollbar relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Activity className="w-32 h-32 text-primary" />
                </div>
                
                <div className="flex items-center justify-between min-w-[800px] relative z-10">
                    {steps.map((step, idx) => {
                        const isCompleted = currentStepIndex > idx;
                        const isCurrent = currentStepIndex === idx;
                        const isCancelled = order.status === 'CANCELLED';

                        return (
                            <React.Fragment key={step.label}>
                                <div className="flex flex-col items-center gap-4 relative z-10">
                                    <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center text-xs font-black transition-all duration-700
                                        ${isCompleted ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/30 rotate-[360deg]' :
                                            isCurrent ? (isCancelled ? 'bg-rose-500 text-white' : 'bg-primary text-white ring-8 ring-primary/10 scale-110 shadow-xl shadow-primary/20') :
                                                'bg-neutral-50 dark:bg-neutral-900 text-neutral-300 dark:text-neutral-600 border border-neutral-100 dark:border-neutral-800'}`}>
                                        {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : idx + 1}
                                    </div>
                                    <div className="text-center">
                                        <p className={`text-[10px] font-black uppercase tracking-widest ${isCurrent || isCompleted ? 'text-neutral-900 dark:text-white' : 'text-neutral-400'}`}>
                                            {step.label}
                                        </p>
                                        {isCurrent && !isCancelled && (
                                            <div className="w-1.5 h-1.5 bg-primary rounded-full mx-auto mt-2 animate-ping" />
                                        )}
                                    </div>
                                </div>
                                {idx < steps.length - 1 && (
                                    <div className="flex-1 h-0.5 mx-6 bg-neutral-100 dark:bg-neutral-900 relative">
                                        <div
                                            className={`absolute inset-y-0 left-0 transition-all duration-1000 ease-out ${isCompleted ? 'bg-emerald-500 w-full' : 'bg-primary/20 w-0'}`}
                                            style={{ width: isCompleted ? '100%' : '0%' }}
                                        />
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* Node Intel Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-8">
                    {/* Items Workspace */}
                    <div className="bg-white dark:bg-neutral-800 rounded-[3rem] border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                            <h3 className="text-sm font-black uppercase tracking-widest">Allocated SKU Nodes</h3>
                            <span className="px-3 py-1 bg-neutral-50 dark:bg-neutral-900 text-[10px] font-black text-neutral-400 uppercase tracking-widest rounded-full">{items.length} Units</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-neutral-50/50 dark:bg-neutral-900/50 text-[10px] font-black text-neutral-400 uppercase tracking-widest border-b border-neutral-100 dark:border-neutral-800">
                                    <tr>
                                        <th className="px-8 py-5">Product Node</th>
                                        <th className="px-8 py-5 text-center">Fulfillment</th>
                                        <th className="px-8 py-5 text-right">Unit Rate</th>
                                        <th className="px-8 py-5 text-center">Fiscal Tax</th>
                                        <th className="px-8 py-5 text-right">Node Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {items.map((item, idx) => {
                                        const productName = item.product_name || (item as any).productName || 'Unknown Product';
                                        const rate = item.rate || 0;
                                        const lineTotal = item.line_total || (item as any).amount || 0;
                                        const taxPercent = item.tax_percent || (item as any).taxPercent || 0;
                                        const qty = item.quantity || 0;
                                        const unit = (item as any).unit || (item as any).unitId || 'pcs';

                                        return (
                                            <tr key={idx} className="group hover:bg-neutral-50/50 dark:hover:bg-neutral-900/40 transition-all">
                                                <td className="px-8 py-6">
                                                    <p className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-tighter">{productName}</p>
                                                    <p className="text-[10px] font-black text-neutral-400 mt-1 uppercase tracking-widest italic">Institutional SKU</p>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <div className="flex flex-col items-center gap-1.5">
                                                        <span className="text-[10px] font-black text-neutral-900 dark:text-white tabular-nums">{qty} {unit}</span>
                                                        <div className="w-16 h-1 bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden">
                                                            <div className="h-full bg-primary" style={{ width: '100%' }} />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <span className="text-xs font-black text-neutral-900 dark:text-white tabular-nums">₹{(rate || 0).toLocaleString()}</span>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <span className="px-2 py-0.5 bg-neutral-50 dark:bg-neutral-900 text-[9px] font-black text-neutral-400 uppercase tracking-widest rounded-full">{taxPercent}%</span>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <span className="text-sm font-black text-primary tabular-nums">₹{(lineTotal || 0).toLocaleString()}</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Narrative Node */}
                    {order.notes && (
                        <div className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 p-10 rounded-[3rem] relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-10">
                                <FileText className="w-20 h-20 text-warning" />
                            </div>
                            <h4 className="text-[10px] font-black text-amber-900/60 dark:text-warning uppercase tracking-widest mb-4">Protocol Narrative</h4>
                            <p className="text-xs font-bold text-amber-800 dark:text-amber-300 italic leading-relaxed pl-6 border-l-2 border-warning/30">
                                {order.notes}
                            </p>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-4 space-y-8">
                    {/* Institutional Intelligence */}
                    <div className="bg-neutral-900 dark:bg-neutral-900 p-10 rounded-[3.5rem] text-white shadow-2xl space-y-10 relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 opacity-10 group-hover:scale-110 transition-transform duration-1000">
                            <ShieldCheck className="w-48 h-48" />
                        </div>
                        <div className="relative z-10">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 mb-10">Operational Intel</h4>
                            <div className="space-y-8">
                                <div className="flex items-start gap-5">
                                    <div className="p-3 bg-white/5 rounded-sm">
                                        <Activity className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Institutional Vendor</p>
                                        <p className="text-sm font-black text-white uppercase tracking-tighter mt-1">{order.vendor_name}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-5">
                                    <div className="p-3 bg-white/5 rounded-sm">
                                        <Clock className="w-5 h-5 text-warning" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">ETA Constraint</p>
                                        <p className="text-sm font-black text-white uppercase tracking-tighter mt-1">{order.expected_delivery || 'No ETA Provided'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-5">
                                    <div className="p-3 bg-white/5 rounded-sm">
                                        <Zap className="w-5 h-5 text-success" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Fiscal Aggregate</p>
                                        <p className="text-2xl font-black text-primary tracking-tighter mt-1 tabular-nums">₹{(Number(order.total_amount || (order as any).totalAmount) || 0).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 p-10 rounded-[3.5rem] border border-neutral-200 dark:border-neutral-700 shadow-sm space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-sm text-primary">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Protocol Validator</h4>
                        </div>
                        <p className="text-[10px] text-neutral-500 font-bold leading-relaxed italic border-l-2 border-primary/20 pl-4">
                            All procurement parameters have been synchronized with the institutional supply-chain ledger. Audit integrity is currently verified.
                        </p>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <ReceiveGoodsModal
                isOpen={showReceiveModal}
                onClose={() => { setShowReceiveModal(false); setReceiveError(null); }}
                order={order}
                onConfirm={handleReceiveConfirm}
                isSubmitting={isReceiving}
                error={receiveError}
            />

            <CreateBillModal
                isOpen={showBillModal}
                onClose={() => setShowBillModal(false)}
                order={order}
                onBillCreated={handleBillCreated}
            />
        </div>
    );
};

export default PurchaseOrderDetails;
