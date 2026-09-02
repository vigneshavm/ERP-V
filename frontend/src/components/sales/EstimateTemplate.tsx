
import React from 'react';
import { formatDate } from '../../utils/helpers';

interface EstimateTemplateProps {
    estimate: {
        estimateNo: string;
        createdAt: Date | string;
        customer: any;
        items: any[];
        subtotal: number;
        discount: number;
        totalAmount: number;
        notes: string;
        status: string;
    };
}

const EstimateTemplate: React.FC<EstimateTemplateProps> = ({ estimate }) => {
    return (
        <div className="bg-white p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-start mb-8 border-b pb-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">ESTIMATE</h1>
                    <p className="text-gray-500 mt-1">#{estimate.estimateNo}</p>
                </div>
                <div className="text-right">
                    <p className="font-medium text-gray-700">Date:</p>
                    <p className="text-gray-600">
                        {formatDate(estimate.createdAt)}
                    </p>
                </div>
            </div>

            {/* Customer & Company Details */}
            <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Estimate For:</h3>
                    {estimate.customer ? (
                        <div className="text-gray-700">
                            <p className="font-bold">{estimate.customer.name}</p>
                            <p>{estimate.customer.phone}</p>
                            {estimate.customer.email && <p>{estimate.customer.email}</p>}
                            {estimate.customer.address && (
                                <p className="whitespace-pre-line">{typeof estimate.customer.address === 'string' ? estimate.customer.address : estimate.customer.address.line1}</p>
                            )}
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">Walk-in Customer</p>
                    )}
                </div>
                <div className="text-right">
                    {/* Add Company details here if available in context/store, otherwise simplified */}
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">From:</h3>
                    <div className="text-gray-700">
                        <p className="font-bold">Your Company Name</p>
                        <p>Company Address</p>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b-2 border-gray-200">
                            <th className="py-3 text-sm font-bold text-gray-600 uppercase">Item</th>
                            <th className="py-3 text-sm font-bold text-gray-600 uppercase text-right">Price</th>
                            <th className="py-3 text-sm font-bold text-gray-600 uppercase text-center">Qty</th>
                            <th className="py-3 text-sm font-bold text-gray-600 uppercase text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {estimate.items.map((item, index) => (
                            <tr key={index}>
                                <td className="py-3 pr-4">
                                    <p className="font-medium text-gray-800">{item.name}</p>
                                    {item.sku && <p className="text-xs text-gray-500">sku: {item.sku}</p>}
                                </td>
                                <td className="py-3 text-right text-gray-700">₹{item.price}</td>
                                <td className="py-3 text-center text-gray-700">{item.quantity}</td>
                                <td className="py-3 text-right font-medium text-gray-800">₹{item.total?.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-8">
                <div className="w-64 space-y-3">
                    <div className="flex justify-between text-gray-600">
                        <span>Subtotal:</span>
                        <span>₹{estimate.subtotal?.toFixed(2)}</span>
                    </div>
                    {estimate.discount > 0 && (
                        <div className="flex justify-between text-red-500">
                            <span>Discount:</span>
                            <span>-₹{estimate.discount?.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-xl font-bold text-gray-800 border-t pt-3">
                        <span>Total:</span>
                        <span>₹{estimate.totalAmount?.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Footer / Notes */}
            {estimate.notes && (
                <div className="border-t pt-4">
                    <h4 className="text-sm font-bold text-gray-500 uppercase mb-2">Notes:</h4>
                    <p className="text-gray-600 text-sm whitespace-pre-wrap">{estimate.notes}</p>
                </div>
            )}

            <div className="mt-12 text-center text-xs text-gray-400">
                <p>This is a computer-generated estimate and does not require a signature.</p>
            </div>
        </div>
    );
};

export default EstimateTemplate;
