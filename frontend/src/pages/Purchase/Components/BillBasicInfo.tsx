import React from 'react';
import { FileText } from 'lucide-react';
import { PurchaseBill } from "../../../types/purchase";

interface BillBasicInfoProps {
    bill: Partial<PurchaseBill>;
    vendors: any[];
    onVendorChange: (vendorId: string) => void;
    onBillChange: (field: keyof PurchaseBill, value: any) => void;
}

const BillBasicInfo: React.FC<BillBasicInfoProps> = ({ bill, vendors, onVendorChange, onBillChange }) => {
    return (
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-4 h-4" /> Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold text-neutral-500 mb-2">Vendor / Supplier</label>
                    <select
                        value={bill.vendor_id || ''}
                        onChange={(e) => onVendorChange(e.target.value)}
                        className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                    >
                        <option value="">Select Vendor</option>
                        {vendors.map(v => <option key={v._id || v.id} value={v._id || v.id}>{v.businessName || v.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-neutral-500 mb-2">Bill Number</label>
                    <input
                        type="text"
                        value={bill.bill_number || ''}
                        onChange={(e) => onBillChange('bill_number', e.target.value)}
                        placeholder="INV-2024-001"
                        className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-neutral-500 mb-2">Bill Date</label>
                    <input
                        type="date"
                        value={bill.bill_date}
                        onChange={(e) => onBillChange('bill_date', e.target.value)}
                        className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-neutral-500 mb-2">Due Date</label>
                    <input
                        type="date"
                        value={bill.due_date || ''}
                        onChange={(e) => onBillChange('due_date', e.target.value)}
                        className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                    />
                </div>
            </div>
        </div>
    );
};

export default BillBasicInfo;
