import React from 'react';
import { Download, Printer, Share2, FileText, ArrowLeft } from 'lucide-react';
import payslipViewData from '../../../mockData/payslipViewData.json';

const PayslipViewMockUI: React.FC = () => {
    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto text-main animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center glass-panel p-4 rounded-xl">
                <div className="flex items-center gap-4">
                    <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5 text-main/70" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Employee Payslip
                        </h1>
                        <p className="text-sm text-main/60">Cyber-Carbon Document Viewer</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button className="btn-ghost flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/5 transition-all text-sm">
                        <Share2 className="w-4 h-4" /> Share
                    </button>
                    <button className="btn-ghost flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/5 transition-all text-sm">
                        <Printer className="w-4 h-4" /> Print
                    </button>
                    <button className="btn-primary flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition-all text-sm">
                        <Download className="w-4 h-4" /> Download PDF
                    </button>
                </div>
            </div>

            {/* Document Preview Area */}
            <div className="glass-panel p-12 rounded-xl border border-white/5 bg-white/[0.02] min-h-[600px] flex flex-col shadow-2xl">
                <div className="flex justify-between items-start border-b border-white/10 pb-8 mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-main">{payslipViewData.company.name}</h2>
                        <p className="text-main/60 mt-2">{payslipViewData.company.address}</p>
                        <p className="text-main/60">{payslipViewData.company.city}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-bold text-purple-400 uppercase tracking-widest mb-2">Employee Payslip</h2>
                        <p className="text-main/80 font-medium">Doc ID: {payslipViewData.payslip.docId}</p>
                        <p className="text-main/60">Period: {payslipViewData.payslip.period}</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-12 flex-1">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <h3 className="text-main/50 text-xs uppercase tracking-wider font-semibold">Employee Details</h3>
                            <div className="bg-black/20 p-4 rounded-lg border border-white/5 space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-main/60">Name:</span> <span className="font-medium">{payslipViewData.payslip.employee.name}</span></div>
                                <div className="flex justify-between"><span className="text-main/60">ID:</span> <span className="font-medium">{payslipViewData.payslip.employee.id}</span></div>
                                <div className="flex justify-between"><span className="text-main/60">Role:</span> <span className="font-medium">{payslipViewData.payslip.employee.role}</span></div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <h3 className="text-main/50 text-xs uppercase tracking-wider font-semibold">Summary</h3>
                            <div className="bg-black/20 p-4 rounded-lg border border-white/5 space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-main/60">Base:</span> <span className="font-medium">{payslipViewData.payslip.summary.base}</span></div>
                                <div className="flex justify-between"><span className="text-main/60">Deductions:</span> <span className="font-medium text-red-400">{payslipViewData.payslip.summary.deductions}</span></div>
                                <div className="flex justify-between pt-2 border-t border-white/10 text-base"><span className="text-main/80 font-bold">Net Total:</span> <span className="font-bold text-emerald-400">{payslipViewData.payslip.summary.netTotal}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PayslipViewMockUI;
