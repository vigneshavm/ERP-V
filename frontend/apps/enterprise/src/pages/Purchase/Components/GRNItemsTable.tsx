import React from 'react';
import { Package, Search, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { GRNItem, InspectionStatus } from "@repo/shared-kernel";

interface GRNItemsTableProps {
    items?: GRNItem[];
    poNumber?: string;
    onItemChange: (index: number, field: keyof GRNItem, value: any) => void;
}

const GRNItemsTable: React.FC<GRNItemsTableProps> = ({
    items,
    poNumber,
    onItemChange
}) => {
    const getStatusIcon = (status: InspectionStatus) => {
        switch (status) {
            case 'Accepted': return <CheckCircle className="w-4 h-4 text-success" />;
            case 'Rejected': return <XCircle className="w-4 h-4 text-error" />;
            case 'Hold': return <Clock className="w-4 h-4 text-warning" />;
            case 'Partial': return <AlertTriangle className="w-4 h-4 text-warning" />;
        }
    };

    return (
        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-neutral-100 dark:border-neutral-700 flex justify-between items-center">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" /> Item Inspection
                </h3>
                <div className="text-xs font-medium text-neutral-500 p-2 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                    {items?.length || 0} Items linked to {poNumber || 'PO'}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-neutral-50 dark:bg-neutral-900 text-neutral-500 uppercase text-[10px] font-bold tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Product Details</th>
                            <th className="px-4 py-4 text-center">Ordered</th>
                            <th className="px-4 py-4 text-center">Received</th>
                            <th className="px-4 py-4 text-center">Accepted</th>
                            <th className="px-4 py-4 text-center">Status</th>
                            <th className="px-6 py-4">Batch / Serial</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                        {!items || items.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-neutral-400">
                                    <div className="flex flex-col items-center gap-2">
                                        <Search className="w-8 h-8 opacity-20" />
                                        <p>Select a Purchase Order to load items</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            items.map((item, idx) => (
                                <tr key={item.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-700/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-neutral-900 dark:text-white mb-0.5">{item.productName}</p>
                                        <p className="text-xs text-neutral-500 font-mono">{item.sku}</p>
                                    </td>
                                    <td className="px-4 py-4 text-center font-bold text-neutral-400">
                                        {item.orderedQty}
                                    </td>
                                    <td className="px-4 py-4">
                                        <input
                                            type="number"
                                            className="w-20 mx-auto px-2 py-1.5 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-center font-bold focus:ring-1 focus:ring-primary outline-none"
                                            value={item.receivedQty}
                                            onChange={e => onItemChange(idx, 'receivedQty', parseInt(e.target.value) || 0)}
                                        />
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex flex-col gap-1 items-center">
                                            <input
                                                type="number"
                                                className={`w-20 mx-auto px-2 py-1.5 border rounded-lg text-center font-bold focus:ring-1 outline-none transition-all ${
                                                    item.acceptedQty !== item.receivedQty 
                                                    ? 'bg-rose-50 border-rose-200 text-rose-600 focus:ring-rose-500' 
                                                    : 'bg-success/5 border-success/20 text-success focus:ring-success'
                                                }`}
                                                value={item.acceptedQty}
                                                onChange={e => onItemChange(idx, 'acceptedQty', parseInt(e.target.value) || 0)}
                                            />
                                            {item.acceptedQty !== item.receivedQty && (
                                                <span className="text-[8px] font-black text-rose-500 uppercase tracking-tighter animate-pulse">Discrepancy!</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <div className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-700/50">
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(item.inspectionStatus)}
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${
                                                    item.inspectionStatus === 'Accepted' ? 'text-emerald-600' :
                                                    item.inspectionStatus === 'Rejected' ? 'text-rose-600' :
                                                    'text-amber-600'
                                                }`}>
                                                    {item.inspectionStatus}
                                                </span>
                                            </div>
                                            <div className="w-full h-1 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${
                                                    item.inspectionStatus === 'Accepted' ? 'bg-emerald-500 w-full' :
                                                    item.inspectionStatus === 'Rejected' ? 'bg-rose-500 w-full' :
                                                    'bg-amber-500 w-1/2'
                                                }`} />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-2">
                                            <input
                                                type="text"
                                                placeholder="Batch #"
                                                className="w-full px-3 py-1.5 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs outline-none"
                                                value={item.batchNumber || ''}
                                                onChange={e => onItemChange(idx, 'batchNumber', e.target.value)}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Expiry Date"
                                                className="w-full px-3 py-1.5 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs outline-none"
                                                onFocus={(e) => e.target.type = 'date'}
                                                onBlur={(e) => e.target.type = 'text'}
                                                value={item.expiryDate || ''}
                                                onChange={e => onItemChange(idx, 'expiryDate', e.target.value)}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default GRNItemsTable;
