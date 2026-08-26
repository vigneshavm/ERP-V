import React from 'react';
import { Truck } from 'lucide-react';
import FormField from "../../../components/shared/Form/FormField";
import { PurchaseOrder } from "../../../types/purchase";

interface GRNGeneralInfoProps {
    poId?: string;
    availablePOs: PurchaseOrder[];
    onPOSelect: (poId: string) => void;
    grnNumber?: string;
    receivedDate?: string;
    onDateChange: (date: string) => void;
    vendorName?: string;
}

const GRNGeneralInfo: React.FC<GRNGeneralInfoProps> = ({
    poId,
    availablePOs,
    onPOSelect,
    grnNumber,
    receivedDate,
    onDateChange,
    vendorName
}) => {
    return (
        <div className="bg-white dark:bg-neutral-800 p-6 rounded-sm border border-neutral-200 dark:border-neutral-700 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" /> General Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!poId && (
                    <FormField label="Select Purchase Order" required>
                        <select
                            className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                            onChange={(e) => onPOSelect(e.target.value)}
                        >
                            <option value="">Choose a PO...</option>
                            {availablePOs.map((po) => (
                                <option key={po.id} value={po.id}>{po.po_number} - {po.vendor_name}</option>
                            ))}
                        </select>
                    </FormField>
                )}
                <FormField label="GRN Number">
                    <input
                        type="text"
                        readOnly
                        className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-500"
                        value={grnNumber || ''}
                    />
                </FormField>
                <FormField label="Receipt Date" required>
                    <input
                        type="date"
                        className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                        value={receivedDate || ''}
                        onChange={e => onDateChange(e.target.value)}
                    />
                </FormField>
                <FormField label="Vendor">
                    <input
                        type="text"
                        readOnly
                        className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-500"
                        value={vendorName || ''}
                    />
                </FormField>
            </div>
        </div>
    );
};

export default GRNGeneralInfo;
