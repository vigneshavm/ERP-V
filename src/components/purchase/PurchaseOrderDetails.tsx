import React from 'react';
import { FileText, X, Printer } from 'lucide-react';
import { PurchaseOrder } from '../../types/purchase';

interface PurchaseOrderDetailsProps {
    order: PurchaseOrder;
    onClose: () => void;
    onPrint: () => void;
    getBranchName: (id: string) => string;
    role: string;
    currentSector: string;
}

const PurchaseOrderDetails: React.FC<PurchaseOrderDetailsProps> = ({
    order, onClose, onPrint, getBranchName, role, currentSector
}) => {
    return (
        <div id="po-modal-root" className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div id="po-modal" className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95">
                {/* Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 rounded-t-xl no-print">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <FileText className="w-5 h-5 text-indigo-500" /> Purchase Order Details
                        </h3>
                        <p className="text-xs text-slate-500 font-mono mt-1">ID: {order.id}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    </button>
                </div>

                {/* Wrapper for print extraction */}
                <div id="po-modal-content-wrapper" className="flex-1 overflow-y-auto">
                    {/* Printable Header for PO (Hidden on screen, shown in popup print) */}
                    <div className="hidden print:block p-6 border-b border-slate-300">
                        <h1 className="text-2xl font-bold uppercase tracking-wider mb-2 text-black">Purchase Order</h1>
                        <p className="text-sm text-black">ID: {order.id}</p>
                        <p className="text-sm text-slate-500">{currentSector} - {getBranchName(order.branchId)}</p>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {/* Meta Info */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 p-4 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-100 dark:border-slate-700/50">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Vendor</label>
                                <p className="font-bold text-slate-900 dark:text-white text-base truncate" title={order.vendor}>{order.vendor}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date</label>
                                <p className="text-slate-900 dark:text-white text-sm font-medium">{new Date(order.date).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Branch</label>
                                <p className="text-slate-900 dark:text-white text-sm font-medium">{getBranchName(order.branchId)}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</label>
                                <div className={`mt-0.5 inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${order.status === 'APPROVED' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/20'}`}>
                                    {order.status}
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase font-bold text-xs">
                                    <tr>
                                        <th className="p-3">Item Details</th>
                                        <th className="p-3 text-center">Qty</th>
                                        <th className="p-3 text-right">Unit Cost</th>
                                        <th className="p-3 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                    {order.items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="p-3">
                                                <p className="font-bold text-slate-800 dark:text-slate-200">{item.name}</p>
                                                <p className="text-[10px] text-slate-500 font-mono">{item.sku || 'No SKU'}</p>
                                            </td>
                                            <td className="p-3 text-center text-slate-700 dark:text-slate-300 font-medium">{item.qty}</td>
                                            {role === 'Owner' ? (
                                                <td className="p-3 text-right text-slate-700 dark:text-slate-300 font-mono">₹{item.cost.toFixed(2)}</td>
                                            ) : (
                                                <td className="p-3 text-right text-slate-400 dark:text-slate-600 font-mono">***</td>
                                            )}
                                            {role === 'Owner' ? (
                                                <td className="p-3 text-right font-bold text-slate-900 dark:text-white font-mono">₹{(item.qty * item.cost).toFixed(2)}</td>
                                            ) : (
                                                <td className="p-3 text-right font-bold text-slate-400 dark:text-slate-600 font-mono">***</td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
                                    <tr>
                                        <td colSpan={3} className="p-3 text-right font-bold text-slate-500 dark:text-slate-400 uppercase text-xs">Total Amount</td>
                                        {role === 'Owner' ? (
                                            <td className="p-3 text-right font-bold text-lg text-indigo-600 dark:text-indigo-400 font-mono">₹{order.total.toFixed(2)}</td>
                                        ) : (
                                            <td className="p-3 text-right font-bold text-lg text-slate-400 dark:text-slate-600 font-mono">***</td>
                                        )}
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between gap-3 rounded-b-xl no-print">
                    <button
                        onClick={onPrint}
                        className="px-6 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                    >
                        <Printer className="w-4 h-4" /> Print Order
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PurchaseOrderDetails;
