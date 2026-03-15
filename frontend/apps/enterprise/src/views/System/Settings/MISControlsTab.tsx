import React from 'react';
import { 
    DollarSign, FileText, Shield, 
    Zap, Target, Lock, Eye, 
    LucideIcon, ShieldAlert, Activity 
} from 'lucide-react';
import { MISControlsTabProps } from './types';

const MISControlsTab: React.FC<MISControlsTabProps> = ({ misConfig, handleMisToggle, setMaxDiscountPercent }) => {

    interface ControlItemProps {
        k: string;
        label: string;
        desc: string;
        icon: LucideIcon;
        color: string;
    }

    const ControlItem: React.FC<ControlItemProps> = ({ k, label, desc, icon: Icon, color }) => {
        const isEnabled = !!misConfig[k];
        return (
            <div className={`group flex items-center justify-between p-6 rounded-[2rem] border transition-all duration-500 ${
                isEnabled 
                    ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-indigo-500' 
                    : 'bg-slate-50/50 dark:bg-slate-800/20 border-slate-100 dark:border-slate-700 opacity-60'
            }`}>
                <div className="flex items-center gap-5">
                    <div className={`p-4 rounded-2xl transition-all duration-500 group-hover:scale-110 ${
                        isEnabled 
                            ? `bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400` 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <div>
                        <p className={`font-black uppercase tracking-tight text-sm leading-none mb-1 ${isEnabled ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                            {label}
                        </p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                            {desc}
                        </p>
                    </div>
                </div>
                
                <button 
                    onClick={() => handleMisToggle(k)}
                    className={`relative w-12 h-7 rounded-full transition-all duration-300 ${
                        isEnabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                >
                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all duration-300 shadow-md ${
                        isEnabled ? 'left-6' : 'left-1'
                    }`} />
                </button>
            </div>
        );
    };

    return (
        <div className="p-8 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Global Governance HUD */}
            <div className="bg-slate-900 rounded-[3rem] p-10 flex flex-col md:flex-row items-center gap-10 border border-slate-800 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                    <ShieldAlert className="w-64 h-64 text-red-500" />
                </div>
                <div className="relative z-10 w-24 h-24 rounded-[2.5rem] bg-red-600 flex items-center justify-center shrink-0 shadow-2xl shadow-red-500/30 group-hover:scale-105 transition-transform">
                    <Shield className="w-12 h-12 text-white" />
                </div>
                <div className="relative z-10 flex-1 text-center md:text-left">
                    <h3 className="text-3xl font-black text-white italic uppercase tracking-tight mb-2">Management <span className="text-red-400">Governance</span></h3>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-2xl">
                        Define the operational boundaries of your enterprise. Protocols configured here propagate as mandatory logic constraints across all POS terminals.
                    </p>
                </div>
                <div className="relative z-10 flex gap-4 px-6 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full text-[10px] font-black tracking-widest shrink-0">
                    <Zap className="w-3.5 h-3.5 animate-pulse" /> HIGH-INTEGRITY MODE
                </div>
            </div>

            {/* Inventory & Financial Constraints */}
            <section className="space-y-6">
                <div className="flex items-center gap-4 px-2">
                    <DollarSign className="w-5 h-5 text-emerald-500" />
                    <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em]">Inventory & Financial Constraints</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                    {/* eslint-disable-next-line  */}
                    <ControlItem icon={Lock} k="allowNegativeStock" label="Lock Negative Stock" desc="Block sales if payload is unavailable" color="emerald" />
                    {/* eslint-disable-next-line  */}
                    <ControlItem icon={ShieldAlert} k="allowSaleBelowCost" label="Restrict Margin Loss" desc="Prevent selling below acquisition rate" color="rose" />
                    {/* eslint-disable-next-line  */}
                    <ControlItem icon={Target} k="enableCreditSales" label="Enterprise Credit Hub" desc="Provision staff to issue credit notes" color="indigo" />
                    {/* eslint-disable-next-line  */}
                    <ControlItem icon={Activity} k="enableVendorPayables" label="Payables Ledger" desc="Monitor upstream liability traffic" color="amber" />
                    {/* eslint-disable-next-line  */}
                    <ControlItem icon={Activity} k="enableCustomerReceivables" label="Receivables Ledger" desc="Monitor downstream asset reclaim" color="blue" />
                </div>
            </section>

            {/* POS Thresholds & Integrity */}
            <section className="space-y-6">
                <div className="flex items-center gap-4 px-2">
                    <FileText className="w-5 h-5 text-indigo-500" />
                    <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em]">POS Thresholds & Integrity</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                    {/* eslint-disable-next-line  */}
                    <ControlItem icon={Zap} k="allowPriceOverride" label="Fluid Price Schema" desc="Allow manual override of unit rates" color="indigo" />
                    {/* eslint-disable-next-line  */}
                    <ControlItem icon={Zap} k="allowDiscountOverride" label="Custom Rebate Logic" desc="Enable ad-hoc discount entry" color="indigo" />
                    {/* eslint-disable-next-line  */}
                    <ControlItem icon={Activity} k="allowBackdatedBills" label="Temporal Backdating" desc="Issue bills for previous timeframes" color="rose" />
                    {/* eslint-disable-next-line  */}
                    <ControlItem icon={Activity} k="allowCancelledBillsEdit" label="Mutation of Voids" desc="Allow editing of invalidated bills" color="amber" />
                </div>

                {/* Discount Ceiling Meter */}
                <div className="mt-8 p-10 bg-white dark:bg-slate-950 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-10 group overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent pointer-events-none" />
                    <div className="flex items-center gap-8 relative z-10">
                        <div className="w-20 h-20 rounded-[2rem] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <DollarSign className="w-10 h-10 text-indigo-500" />
                        </div>
                        <div>
                            <h4 className="text-xl font-black text-slate-900 dark:text-white italic uppercase tracking-tight">Global Discount Ceiling</h4>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Maximum allowable staff rebate percentage</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 relative z-10">
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={misConfig.maxDiscountPercent}
                            onChange={(e) => setMaxDiscountPercent(parseInt(e.target.value) || 0)}
                            className="w-32 px-8 py-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] text-2xl font-black text-center outline-none focus:ring-8 focus:ring-indigo-500/10 focus:border-indigo-500 dark:text-white shadow-inner transition-all"
                        />
                        <span className="text-2xl font-black text-slate-300 uppercase tracking-tighter">%</span>
                    </div>
                </div>
            </section>

            {/* Compliance Hub */}
            <section className="space-y-6">
                <div className="flex items-center gap-4 px-2">
                    <Eye className="w-5 h-5 text-amber-500" />
                    <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em]">Compliance & Sign-off Hub</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                    {/* eslint-disable-next-line  */}
                    <ControlItem icon={Activity} k="enableAuditTrail" label="Immutable Logging" desc="High-integrity ledger of all edits" color="indigo" />
                    {/* eslint-disable-next-line  */}
                    <ControlItem icon={Lock} k="lockFinancialYearAfterClose" label="Epoch Lockdown" desc="Prevent mutation of closed periods" color="rose" />
                    {/* eslint-disable-next-line  */}
                    <ControlItem icon={ShieldAlert} k="requireApprovalForHighDiscount" label="Rebate Oversight" desc="Sign-off for high-impact discounts" color="amber" />
                    {/* eslint-disable-next-line  */}
                    <ControlItem icon={ShieldAlert} k="requireApprovalForVoidBill" label="Void Oversight" desc="Sign-off for billing invalidation" color="amber" />
                    {/* eslint-disable-next-line  */}
                    <ControlItem icon={ShieldAlert} k="requireApprovalForPriceChange" label="Price Oversight" desc="Sign-off for unit rate mutations" color="amber" />
                </div>
            </section>
        </div>
    );
};

export default MISControlsTab;
