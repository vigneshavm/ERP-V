import React from 'react';
import { AlertTriangle, DollarSign, FileText, Shield } from 'lucide-react';

interface MISConfig {
    allowNegativeStock: boolean;
    allowSaleBelowCost: boolean;
    enableCreditSales: boolean;
    enableVendorPayables: boolean;
    enableCustomerReceivables: boolean;
    allowPriceOverride: boolean;
    allowDiscountOverride: boolean;
    maxDiscountPercent: number;
    allowBackdatedBills: boolean;
    allowCancelledBillsEdit: boolean;
    enableAuditTrail: boolean;
    lockFinancialYearAfterClose: boolean;
    requireApprovalForHighDiscount: boolean;
    requireApprovalForVoidBill: boolean;
    requireApprovalForPriceChange: boolean;
    autoDeductStockOnInvoice: boolean;
    allowManualStockAdjustments: boolean;
    enableBatchExpiryTracking: boolean;
    enableSerialNumberTracking: boolean;
}

interface MISControlsTabProps {
    misConfig: MISConfig;
    handleMisToggle: (key: keyof MISConfig) => void;
    setMaxDiscountPercent: (val: number) => void;
}

const MISControlsTab: React.FC<MISControlsTabProps> = ({ misConfig, handleMisToggle, setMaxDiscountPercent }) => {
    const ControlItem = ({ k, label, desc }: { k: keyof MISConfig, label: string, desc: string }) => (
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
                <p className="font-bold text-slate-800 dark:text-white text-sm">{label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
                <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={misConfig[k] as boolean}
                    onChange={() => handleMisToggle(k)}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
        </div>
    );

    return (
        <div className="p-6 md:p-8 space-y-8">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl flex items-start gap-4">
                <AlertTriangle className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                <div>
                    <p className="text-sm font-bold text-indigo-800 dark:text-indigo-200">Management Information System Controls</p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">These settings control how your staff can bill, handle inventory, and access system features. Changes apply immediately to all users.</p>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-indigo-500" /> Financial Controls
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <ControlItem k="allowNegativeStock" label="Allow Negative Stock" desc="Allow selling items even when stock is zero or negative" />
                    <ControlItem k="allowSaleBelowCost" label="Allow Sale Below Cost" desc="Allow selling products below their cost price" />
                    <ControlItem k="enableCreditSales" label="Enable Credit Sales" desc="Allow customers to purchase on credit" />
                    <ControlItem k="enableVendorPayables" label="Enable Vendor Payables" desc="Track amounts owed to vendors/suppliers" />
                    <ControlItem k="enableCustomerReceivables" label="Enable Customer Receivables" desc="Track amounts owed by customers" />
                </div>
            </div>

            <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-500" /> Billing Controls
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <ControlItem k="allowPriceOverride" label="Allow Price Override at POS" desc="Staff can change item price during billing" />
                    <ControlItem k="allowDiscountOverride" label="Allow Discount Override" desc="Staff can apply custom discounts" />
                    <ControlItem k="allowBackdatedBills" label="Allow Backdated Bills" desc="Create invoices with past dates" />
                    <ControlItem k="allowCancelledBillsEdit" label="Allow Cancelled Bills to be Edited" desc="Re-open and modify cancelled invoices" />
                </div>
                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-bold text-slate-800 dark:text-white text-sm">Maximum Discount Allowed (%)</p>
                            <p className="text-xs text-slate-500 mt-0.5">Staff cannot apply discounts above this percentage</p>
                        </div>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={misConfig.maxDiscountPercent}
                            onChange={(e) => setMaxDiscountPercent(parseInt(e.target.value) || 0)}
                            className="w-24 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-bold outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                        />
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-indigo-500" /> Reporting & Audit Controls
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <ControlItem k="enableAuditTrail" label="Enable Audit Trail" desc="Log all system changes for compliance" />
                    <ControlItem k="lockFinancialYearAfterClose" label="Lock Financial Year After Close" desc="Prevent edits to closed financial years" />
                    <ControlItem k="requireApprovalForHighDiscount" label="Require Approval for High Discount" desc="Supervisor must approve discounts above max %" />
                    <ControlItem k="requireApprovalForVoidBill" label="Require Approval for Void Bill" desc="Supervisor must approve bill cancellations" />
                    <ControlItem k="requireApprovalForPriceChange" label="Require Approval for Price Change" desc="Supervisor must approve price overrides" />
                </div>
            </div>
        </div>
    );
};

export default MISControlsTab;
