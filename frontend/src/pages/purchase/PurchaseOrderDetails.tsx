
import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, FileOutput, Printer, Lock } from 'lucide-react';
import { PurchaseOrder, PurchaseOrderItem } from '../../hooks/usePurchaseOrders';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';

import { useNavigate } from 'react-router-dom';

interface Props {
    order: PurchaseOrder;
    items: PurchaseOrderItem[];
    onBack: () => void;
    onApprove: () => void;
    onConvert: (order: PurchaseOrder, items: PurchaseOrderItem[]) => void;
}

const PurchaseOrderDetails: React.FC<Props> = ({ order, items, onBack, onApprove, onConvert }) => {
    const { role } = useSelector((state: RootState) => state.auth);
    const canApprove = (role === 'Owner') && order.status === 'Draft' || order.status === 'Pending';
    const canConvert = (role === 'Owner') && order.status === 'Approved';

    return (
        <div className="flex flex-col h-full bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800">
            {/* Header */}
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            {order.po_number}
                            <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
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
                    {canApprove && (
                        <button
                            onClick={onApprove}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-bold shadow hover:bg-purple-700 transition-all flex items-center gap-2"
                        >
                            <CheckCircle className="w-4 h-4" /> Approve
                        </button>
                    )}
                    {canConvert && (
                        <button
                            onClick={() => onConvert(order, items)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold shadow hover:bg-green-700 transition-all flex items-center gap-2"
                        >
                            <FileOutput className="w-4 h-4" /> Convert to Purchase
                        </button>
                    )}
                    {order.status === 'Converted' && (
                        <div className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 rounded-lg font-medium flex items-center gap-2">
                            <Lock className="w-4 h-4" /> Conversion Completed
                        </div>
                    )}
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
        </div>
    );
};

export default PurchaseOrderDetails;
