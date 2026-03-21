import React from 'react';
import { Info, Camera, Plus, FileText, Trash2 } from 'lucide-react';
import { GRNItem } from "@repo/shared";

interface GRNSummaryProps {
    items?: GRNItem[];
    attachments?: string[];
    notes?: string;
    onNotesChange: (notes: string) => void;
}

const GRNSummary: React.FC<GRNSummaryProps> = ({
    items,
    attachments,
    notes,
    onNotesChange
}) => {
    const totalAccepted = items?.reduce((sum, item) => sum + item.acceptedQty, 0) || 0;
    const totalRejected = items?.reduce((sum, item) => sum + (item.receivedQty - item.acceptedQty), 0) || 0;

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-[var(--erp-card)] p-6 rounded-2xl border border-default dark:border-default shadow-sm">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5 text-primary" /> Summary
                </h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] rounded-xl">
                        <span className="text-sm text-neutral-500">Total Items</span>
                        <span className="font-bold">{items?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-success/5 rounded-xl">
                        <span className="text-sm text-success">Accepted Qty</span>
                        <span className="font-bold text-success">{totalAccepted}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-error/5 rounded-xl">
                        <span className="text-sm text-error">Rejected Qty</span>
                        <span className="font-bold text-error">{totalRejected}</span>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-[var(--erp-card)] p-6 rounded-2xl border border-default dark:border-default shadow-sm">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Camera className="w-5 h-5 text-primary" /> Attachments
                </h3>
                <div className="border-2 border-dashed border-default dark:border-default rounded-2xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer capitalize">
                    <Plus className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                    <p className="text-xs text-neutral-500 font-medium">Upload Delivery Challan or Photos</p>
                </div>
                <div className="mt-4 space-y-2">
                    {attachments?.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] rounded-lg">
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary" />
                                <span className="text-xs font-medium truncate max-w-[150px]">{file}</span>
                            </div>
                            <button className="text-error hover:text-error/80"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-[var(--erp-card)] p-6 rounded-2xl border border-default dark:border-default shadow-sm">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" /> Discrepancy Notes
                </h3>
                <textarea
                    className="w-full p-4 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] border border-default dark:border-default rounded-2xl text-sm focus:ring-2 focus:ring-primary outline-none min-h-[120px]"
                    placeholder="Any shortages, damages, or notes from the delivery..."
                    value={notes || ''}
                    onChange={e => onNotesChange(e.target.value)}
                />
            </div>
        </div>
    );
};

export default GRNSummary;

