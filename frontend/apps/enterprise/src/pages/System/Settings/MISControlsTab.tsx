import React from 'react';
import { AlertTriangle, DollarSign, FileText, Shield, Info, ChevronRight, CheckCircle2, LucideIcon } from 'lucide-react';
import { MISControlsTabProps } from './types';

const MISControlsTab: React.FC<MISControlsTabProps> = ({ misConfig, handleMisToggle, setMaxDiscountPercent }) => {

    interface ControlItemProps {
        k: string;
        label: string;
        desc: string;
        icon: LucideIcon;
    }

    const ControlItem: React.FC<ControlItemProps> = ({ k, label, desc, icon: Icon }) => (
        <div className="group flex items-center justify-between p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-indigo-300 transition-all shadow-sm">
            <div className="flex items-center gap-5">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <p className="font-extrabold text-slate-800 dark:text-white text-sm leading-none mb-1">{label}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{desc}</p>
                </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
                <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={!!misConfig[k]}
                    onChange={() => handleMisToggle(k)}
                />
                <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
        </div>
    );

    return (
        <div className="p-6 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Global Advisory Alert */}
            <div className="p-6 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800 rounded-3xl flex items-start gap-5">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                    <p className="text-sm font-black text-indigo-800 dark:text-indigo-200">Management Information System (MIS) Governance</p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 leading-relaxed max-w-2xl">
                        These protocols dictate the operational boundaries for your staff. Enabling or disabling these controls will immediately affect transaction workflows, inventory validation, and financial compliance across all terminals.
                    </p>
                </div>
            </div>

            {/* Financial & Inventory Governance */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-none">Financial & Inventory Governance</h3>
                        <p className="text-xs text-slate-500 font-medium mt-1">Control stock movements and credit exposure</p>
                    </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                    <ControlItem icon={Shield} k="allowNegativeStock" label="Restrict Negative Stock" desc="Block sales if physical stock is unavailable" />
                    <ControlItem icon={Shield} k="allowSaleBelowCost" label="Restrict Sale Below Cost" desc="Prevent selling products at a loss" />
                    <ControlItem icon={CheckCircle2} k="enableCreditSales" label="Enterprise Credit Sales" desc="Allow authorized customers to pay later" />
                    <ControlItem icon={CheckCircle2} k="enableVendorPayables" label="Track Payables" desc="Monitor outstanding dues to suppliers" />
                    <ControlItem icon={CheckCircle2} k="enableCustomerReceivables" label="Track Receivables" desc="Monitor outstanding customer payments" />
                </div>
            </section>

            {/* Transactional Integrity */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-none">Transactional Integrity</h3>
                        <p className="text-xs text-slate-500 font-medium mt-1">Configure billing flexibility and discount caps</p>
                    </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                    <ControlItem icon={Shield} k="allowPriceOverride" label="POS Price Override" desc="Allow staff to modify unit rates during billing" />
                    <ControlItem icon={Shield} k="allowDiscountOverride" label="Custom Discount Logic" desc="Allow manual discount entry for items" />
                    <ControlItem icon={Shield} k="allowBackdatedBills" label="Backdated Invoicing" desc="Allow creating bills for previous dates" />
                    <ControlItem icon={Shield} k="allowCancelledBillsEdit" label="Recall Cancelled Bills" desc="Allow editing of invalidated transactions" />
                </div>

                {/* Discount Cap Card */}
                <div className="mt-6 flex items-center justify-between p-6 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-slate-400" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-slate-800 dark:text-white leading-none">Global Discount Ceiling</p>
                            <p className="text-xs text-slate-500 font-medium mt-1">Staff cannot apply discounts above this percentage</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={misConfig.maxDiscountPercent}
                            onChange={(e) => setMaxDiscountPercent(parseInt(e.target.value) || 0)}
                            className="w-24 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-center font-black outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white shadow-sm"
                        />
                        <span className="text-sm font-black text-slate-400">%</span>
                    </div>
                </div>
            </section>

            {/* Audit & Compliance */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-none">Audit & Compliance</h3>
                        <p className="text-xs text-slate-500 font-medium mt-1">Ensure total transparency and prevent fraud</p>
                    </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                    <ControlItem icon={CheckCircle2} k="enableAuditTrail" label="Full Audit Logging" desc="Maintain immutable logs of all system edits" />
                    <ControlItem icon={Shield} k="lockFinancialYearAfterClose" label="Lock Closed Financial Years" desc="Prevent edits to closed periods" />
                    <ControlItem icon={Shield} k="requireApprovalForHighDiscount" label="Supervisor Approval (Discount)" desc="Flag high discounts for management sign-off" />
                    <ControlItem icon={Shield} k="requireApprovalForVoidBill" label="Supervisor Approval (Void)" desc="Sign-off required for bill cancellations" />
                    <ControlItem icon={Shield} k="requireApprovalForPriceChange" label="Supervisor Approval (Price)" desc="Sign-off required for price overrides" />
                </div>
            </section>
        </div>
    );
};

export default MISControlsTab;
