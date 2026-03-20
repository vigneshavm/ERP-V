import React from 'react';
import { Truck, CheckCircle, AlertTriangle, Clock, Eye, Receipt, ClipboardCheck } from 'lucide-react';
import { GoodsReceivedNote } from '@/pages/Purchase/hooks/useGRNData';
import { useBranchResolver } from "@/hooks/useBranchResolver";

interface GRNTableProps {
    records: GoodsReceivedNote[];
    onView: (id: string) => void;
    onCreateBill: (id: string) => void;
}

const GRNTable: React.FC<GRNTableProps> = ({ records, onView, onCreateBill }) => {
    const { getBranchName } = useBranchResolver();

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'COMPLETE':
                return <span className="px-2 py-1 bg-success/10 text-success text-xs font-bold rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Complete
                </span>;
            case 'PARTIAL':
                return <span className="px-2 py-1 bg-warning/10 text-warning text-xs font-bold rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Partial
                </span>;
            case 'PENDING':
                return <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 text-xs font-bold rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Pending
                </span>;
            default:
                return null;
        }
    };

    return (
        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-neutral-50 dark:bg-neutral-900 text-secondary uppercase text-xs font-medium">
                        <tr>
                            <th className="p-4">GRN #</th>
                            <th className="p-4">PO Reference</th>
                            <th className="p-4">Vendor</th>
                            <th className="p-4">Received Date</th>
                            <th className="p-4">Branch</th>
                            <th className="p-4 text-center">Items</th>
                            <th className="p-4 text-center">Status</th>
                            <th className="p-4 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                        {records.length === 0 ? (
                            <tr><td colSpan={8} className="p-8 text-center text-neutral-500">
                                <div className="flex flex-col items-center gap-2">
                                    <ClipboardCheck className="w-8 h-8 text-neutral-300" />
                                    <p>No goods received notes found</p>
                                </div>
                            </td></tr>
                        ) : (
                            records.map(grn => (
                                <tr key={grn.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                                    <td className="p-4 font-mono text-xs text-success font-medium">{grn.id}</td>
                                    <td className="p-4 font-mono text-xs text-primary">{grn.poNumber}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <Truck className="w-4 h-4 text-primary" />
                                            </div>
                                            <span className="font-medium text-neutral-900 dark:text-white">{grn.vendorName}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-secondary">
                                        {new Date(grn.receivedDate).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-neutral-500">{getBranchName(grn.branchId)}</td>
                                    <td className="p-4 text-center">
                                        <span className={`font-bold ${grn.receivedItems < grn.expectedItems ? 'text-warning' : 'text-success'}`}>
                                            {grn.receivedItems}
                                        </span>
                                        <span className="text-neutral-400"> / {grn.expectedItems}</span>
                                    </td>
                                    <td className="p-4 text-center">
                                        {getStatusBadge(grn.status)}
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex justify-center gap-1">
                                            <button
                                                onClick={() => onView(grn.id)}
                                                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4 text-primary" />
                                            </button>
                                            <button
                                                onClick={() => onCreateBill(grn.id)}
                                                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
                                                title="Create Bill from GRN"
                                            >
                                                <Receipt className="w-4 h-4 text-success" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-neutral-100 dark:divide-neutral-700">
                {records.length === 0 ? (
                    <div className="p-8 text-center text-neutral-500">No GRN records</div>
                ) : (
                    records.map(grn => (
                        <div key={grn.id} className="p-4">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-mono text-xs text-success font-medium">{grn.id}</p>
                                    <p className="font-bold text-neutral-900 dark:text-white">{grn.vendorName}</p>
                                    <p className="text-xs text-neutral-500">PO: {grn.poNumber}</p>
                                </div>
                                {getStatusBadge(grn.status)}
                            </div>
                            <div className="flex justify-between items-center bg-neutral-50 dark:bg-neutral-700/50 p-3 rounded-lg mt-2">
                                <div className="text-sm">
                                    <span className="font-bold text-primary">{grn.receivedItems}</span>
                                    <span className="text-neutral-400"> / {grn.expectedItems} items</span>
                                </div>
                                <p className="text-xs text-neutral-500">{new Date(grn.receivedDate).toLocaleDateString()}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default GRNTable;
