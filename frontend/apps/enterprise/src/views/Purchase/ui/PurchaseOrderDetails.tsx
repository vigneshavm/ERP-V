import { logger } from '@/shared/lib/logger';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, FileOutput, Printer, Lock } from 'lucide-react';
import { PurchaseOrder, PurchaseOrderItem } from "@repo/shared";
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from "@/app/store/store";

import CreateBillModal from '../Modals/CreateBillModal';
import ReceiveGoodsModal from '../Modals/ReceiveGoodsModal';
import { useParams, useNavigate } from 'react-router-dom'; // Ensure useParams is imported
import { AppDispatch } from "@/app/store/store";
import { fetchPurchaseById, resetSelectedOrder, updateOrder } from "@/entities/purchase/model/purchaseSlice";

interface Props {
    order?: PurchaseOrder;
    items?: PurchaseOrderItem[];
    onBack?: () => void;
    onApprove?: () => void;
    onConvert?: (order: PurchaseOrder, items: PurchaseOrderItem[]) => void;
    onUpdateStatus?: (orderId: string, status: string) => void;
}

const PurchaseOrderDetails: React.FC<Props> = ({ order: propOrder, items: propItems, onBack, onApprove, onConvert, onUpdateStatus }) => {
    logger.info("PurchaseOrderDetails loaded - Version with ReceiveGoodsModal fix");
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

        return () => {
            // Optional: clear selected order on unmount if you want fresh state every time
            // dispatch(resetSelectedOrder());
        };
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
        // In a real app, we would send receivedItems to backend to create a GRN
        // For now, we update the status
        onUpdateStatus?.(order.id, status);
        setShowReceiveModal(false);
    };

    if (isProcessing && !order) {
        return <div className="p-8 text-center text-neutral-500">Loading Order Details...</div>;
    }

    if (!order) {
        return <div className="p-8 text-center text-neutral-500">No Order Found</div>;
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
        <div className="flex flex-col h-full bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800">
            {/* Header */}
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={handleBack} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            {order.po_number}
                            <span className={`text-xs font-normal px-2 py-0.5 rounded-full border ${order.status === 'Cancelled' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'}`}>
                                {order.status}
                            </span>
                        </h2>
                        <p className="text-xs text-neutral-500">Created on {new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors" title="Print">
                        <Printer className="w-5 h-5" />
                    </button>

                    {/* Dynamic Action Buttons */}
                    {canSubmit && (
                        <button
                            onClick={() => onUpdateStatus?.(order.id, 'Pending Approval')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold shadow hover:bg-blue-700 transition-all flex items-center gap-2"
                        >
                            <CheckCircle className="w-4 h-4" /> Submit for Approval
                        </button>
                    )}

                    {canApprove && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => onUpdateStatus?.(order.id, 'Draft')} // Reject back to draft
                                className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg font-bold hover:bg-red-100 transition-all"
                            >
                                Reject
                            </button>
                            <button
                                onClick={() => onUpdateStatus?.(order.id, 'Approved')}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold shadow hover:bg-green-700 transition-all flex items-center gap-2"
                            >
                                <CheckCircle className="w-4 h-4" /> Approve
                            </button>
                        </div>
                    )}

                    {canReceive && (
                        <button
                            onClick={() => setShowReceiveModal(true)}
                            className="px-4 py-2 bg-orange-600 text-white rounded-lg font-bold shadow hover:bg-orange-700 transition-all flex items-center gap-2"
                        >
                            <FileOutput className="w-4 h-4" /> Receive Items
                        </button>
                    )}

                    {canBill && (
                        <button
                            onClick={() => setShowBillModal(true)}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-bold shadow hover:bg-purple-700 transition-all flex items-center gap-2"
                        >
                            <FileOutput className="w-4 h-4" /> Create Bill
                        </button>
                    )}

                    {canPay && (
                        <button
                            onClick={() => onUpdateStatus?.(order.id, 'Paid')}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold shadow hover:bg-emerald-700 transition-all flex items-center gap-2"
                        >
                            <CheckCircle className="w-4 h-4" /> Mark Paid
                        </button>
                    )}
                </div>
            </div>

            {/* Stepper Status Bar */}
            <div className="px-8 py-6 bg-neutral-50/50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 overflow-x-auto">
                <div className="flex items-center justify-between min-w-[600px]">
                    {steps.map((step, idx) => {
                        const isCompleted = currentStepIndex > idx;
                        const isCurrent = currentStepIndex === idx;
                        const isCancelled = order.status === 'Cancelled';

                        return (
                            <React.Fragment key={step.label}>
                                <div className="flex flex-col items-center gap-2 relative z-10">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                                        ${isCompleted ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110' :
                                            isCurrent ? (isCancelled ? 'bg-red-500 text-white' : 'bg-primary text-white ring-4 ring-primary/20 scale-110') :
                                                'bg-neutral-200 dark:bg-neutral-700 text-neutral-400'}`}>
                                        {isCompleted ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                                    </div>
                                    <span className={`text-xs font-bold whitespace-nowrap ${isCurrent || isCompleted ? 'text-neutral-900 dark:text-white' : 'text-neutral-400'}`}>
                                        {step.label}
                                    </span>
                                </div>
                                {idx < steps.length - 1 && (
                                    <div className="flex-1 h-0.5 mx-4 bg-neutral-200 dark:bg-neutral-700 relative">
                                        <div
                                            className="absolute inset-y-0 left-0 bg-primary transition-all duration-500"
                                            style={{ width: isCompleted ? '100%' : '0%' }}
                                        />
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700">
                        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Supplier</h3>
                        <p className="font-bold text-lg">{order.vendor_name}</p>
                    </div>
                    <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700">
                        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Dates</h3>
                        <div className="text-sm">
                            <div className="flex justify-between"><span>PO Date:</span> <span className="font-medium">{order.po_date}</span></div>
                            <div className="flex justify-between mt-1"><span>Expected:</span> <span className="font-medium">{order.expected_delivery || '-'}</span></div>
                        </div>
                    </div>
                    <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700">
                        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Total Value</h3>
                        <p className="font-bold text-2xl text-primary">₹{Number(order.total_amount).toLocaleString()}</p>
                    </div>
                </div>

                {/* Items Table */}
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden mb-6">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-neutral-50 dark:bg-neutral-800">
                            <tr>
                                <th className="px-4 py-3 font-semibold text-neutral-500">Product</th>
                                <th className="px-4 py-3 font-semibold text-neutral-500 text-right">Qty</th>
                                <th className="px-4 py-3 font-semibold text-neutral-500 text-right">Rate</th>
                                <th className="px-4 py-3 font-semibold text-neutral-500 text-right">Tax</th>
                                <th className="px-4 py-3 font-semibold text-neutral-500 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {items.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="px-4 py-3 font-medium">{item.product_name}</td>
                                    <td className="px-4 py-3 text-right text-neutral-600">{item.quantity}</td>
                                    <td className="px-4 py-3 text-right text-neutral-600">₹{item.rate}</td>
                                    <td className="px-4 py-3 text-right text-neutral-600">{item.tax_percent}%</td>
                                    <td className="px-4 py-3 text-right font-bold">₹{item.line_total}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {order.notes && (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
                        <span className="font-bold block mb-1">Notes:</span>
                        {order.notes}
                    </div>
                )}
            </div>

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
        </div >
    );
};

export default PurchaseOrderDetails;

