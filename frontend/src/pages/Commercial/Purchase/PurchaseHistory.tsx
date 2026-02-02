import React from 'react';
import { Eye, Check, Lock } from 'lucide-react';
import { PurchaseOrder } from "../../../types/purchase";

interface PurchaseHistoryProps {
    sectorOrders: PurchaseOrder[];
    setViewOrder: (order: PurchaseOrder) => void;
    getBranchName: (id: string) => string;
    role: string;
    onApprove: (order: PurchaseOrder) => void;
}

const PurchaseHistory: React.FC<PurchaseHistoryProps> = ({
    sectorOrders, setViewOrder, getBranchName, role, onApprove
}) => {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col h-full max-h-[calc(100vh-8rem)] transition-colors">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Purchase Orders</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {sectorOrders.length === 0 && <p className="text-slate-500 text-center mt-10">No purchase orders found for this branch.</p>}
                {sectorOrders.map(order => (
                    <div
                        key={order.id}
                        onClick={() => setViewOrder(order)}
                        className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group relative"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded">{getBranchName(order.branch_id || '')}</span>
                                    <h4 className="font-bold text-slate-800 dark:text-slate-200">{order.vendor_name}</h4>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">{new Date(order.po_date).toLocaleDateString()} {new Date(order.po_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${order.status === 'Approved' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'}`}>
                                {order.status}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-1">
                                {order.items.length} items
                                <Eye className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </span>
                            <div className="flex items-center gap-3">
                                {role === 'Owner' ? (
                                    <span className="font-bold text-slate-900 dark:text-white">₹{order.total_amount.toFixed(2)}</span>
                                ) : (
                                    <span className="font-bold text-slate-400 dark:text-slate-600">Hidden</span>
                                )}

                                {order.status === 'Pending' && (
                                    <>
                                        {role === 'Owner' ? (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onApprove(order);
                                                }}
                                                className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors relative z-10"
                                                title="Approve & Update Inventory"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                        ) : (
                                            <div title="Awaiting Owner Approval">
                                                <Lock className="w-4 h-4 text-slate-400" />
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PurchaseHistory;
