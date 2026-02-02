import React from 'react';
import { Loader2, Users, Eye, IndianRupee, Pencil, History, Trash2, Phone, FileText } from 'lucide-react';
import { Vendor } from "../../../types/vendor";

interface VendorTableProps {
    isLoading: boolean;
    vendors: Vendor[];
    onViewDetails: (id: string) => void;
    onRecordPayment: (vendor: Vendor) => void;
    onEditVendor: (vendor: Vendor) => void;
    onViewHistory: (id: string) => void;
    onDeleteVendor: (vendor: Vendor) => void;
}

const VendorTable: React.FC<VendorTableProps> = ({
    isLoading, vendors, onViewDetails, onRecordPayment, onEditVendor, onViewHistory, onDeleteVendor
}) => {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                            <th className="px-6 py-4">Business / Supplier Name</th>
                            <th className="px-6 py-4">Contact Person</th>
                            <th className="px-6 py-4">Phone / Email</th>
                            <th className="px-6 py-4">Balance Status</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {isLoading ? (
                            <tr>
                                <td colSpan={6} className="py-20 text-center">
                                    <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto mb-4" />
                                    <p className="text-slate-500 font-medium tracking-tight">Accessing supplier registry...</p>
                                </td>
                            </tr>
                        ) : vendors.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-20 text-center">
                                    <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                                    <h4 className="text-lg font-bold text-slate-800 dark:text-white">No Suppliers Found</h4>
                                    <p className="text-slate-500 text-sm mt-1">Try adjusting your search or add a new supplier.</p>
                                </td>
                            </tr>
                        ) : (
                            vendors.map(vendor => (
                                <tr key={vendor.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight">{vendor.businessName}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">ID: {vendor.id.slice(0, 8)}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{vendor.contactPersonName || '-'}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-0.5">
                                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                                                <Phone className="w-3 h-3" /> {vendor.contactNo || 'NA'}
                                            </div>
                                            {vendor.email && (
                                                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                                    <FileText className="w-3 h-3" /> {vendor.email}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className={`text-xs font-black ${(vendor.currentBalance ?? 0) >= 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                                                ₹{Math.abs(vendor.currentBalance ?? 0).toLocaleString()}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                {(vendor.currentBalance ?? 0) >= 0 ? 'Payable' : 'Advance'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${vendor.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {vendor.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => onViewDetails(vendor.id)}
                                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onRecordPayment(vendor)}
                                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all"
                                                title="Record Payment"
                                            >
                                                <IndianRupee className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onEditVendor(vendor)}
                                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                title="Edit Supplier"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onViewHistory(vendor.id)}
                                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-all"
                                                title="View Ledger"
                                            >
                                                <History className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onDeleteVendor(vendor)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                title="Delete Supplier"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
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

export default VendorTable;
