import React, { useMemo } from 'react';
import { Download, Printer, Share2, ArrowLeft, ShieldCheck, IndianRupee, MapPin, Building2, UserCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { employees } from '../../../data';
import Layout from '../../../components/shared/Layout';

const PayslipViewMockUI: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    
    const employee = useMemo(() => {
        return employees.find(e => e.id === id) || employees[0];
    }, [id]);

    const payslipData = useMemo(() => {
        const base = employee.salary / 12;
        const tax = base * 0.1;
        const pf = base * 0.05;
        const totalDeductions = tax + pf;
        const netTotal = base - totalDeductions;

        return {
            period: 'MAY 2026',
            docId: `PAY-${employee.id.split('-').pop()}-0526`,
            summary: {
                base: base.toFixed(0),
                tax: tax.toFixed(0),
                pf: pf.toFixed(0),
                deductions: totalDeductions.toFixed(0),
                netTotal: netTotal.toFixed(0)
            }
        };
    }, [employee]);

    return (
        <Layout>
            <div className="p-8 space-y-8 h-full flex flex-col text-main animate-fade-in relative z-10">
                {/* Header */}
                <div className="flex justify-between items-center bg-white dark:bg-neutral-900 p-6 rounded-sm border border-neutral-200 dark:border-neutral-800 shadow-sm">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => navigate(-1)}
                            className="w-12 h-12 flex items-center justify-center bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm hover:bg-primary hover:text-white transition-all group"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-display font-black tracking-tighter text-neutral-900 dark:text-white flex items-center gap-3">
                                Digital <span className="text-primary">Payslip</span>
                            </h1>
                            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-neutral-500 dark:text-neutral-400 mt-1">
                                Secure Document Vault // Payroll Verification
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button className="h-12 px-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white font-bold text-xs tracking-widest rounded-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all flex items-center gap-3 uppercase">
                            <Share2 className="w-4 h-4 text-primary" /> Share
                        </button>
                        <button className="h-12 px-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white font-bold text-xs tracking-widest rounded-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all flex items-center gap-3 uppercase">
                            <Printer className="w-4 h-4 text-primary" /> Print
                        </button>
                        <button className="h-12 px-8 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-sm transition-all shadow-lg shadow-primary/20 flex items-center gap-3 hover:opacity-90">
                            <Download className="w-4 h-4" /> Download PDF
                        </button>
                    </div>
                </div>

                {/* Payslip Document */}
                <div className="flex-1 max-w-5xl mx-auto w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm shadow-2xl p-16 flex flex-col relative overflow-hidden">
                    {/* Watermark */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none rotate-[-35deg] select-none">
                        <h2 className="text-[12rem] font-black tracking-tighter">VERIFIED</h2>
                    </div>

                    {/* Doc Header */}
                    <div className="flex justify-between items-start border-b-4 border-primary pb-12 mb-12 relative z-10">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-primary flex items-center justify-center text-white font-black text-xl rounded-sm">V</div>
                                <h2 className="text-3xl font-display font-black text-neutral-900 dark:text-white tracking-tighter italic">VIGNESH ERP</h2>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 uppercase tracking-widest">
                                    <MapPin className="w-3.5 h-3.5 text-primary" /> Industrial Estate, Phase II, Chennai
                                </div>
                                <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 uppercase tracking-widest">
                                    <Building2 className="w-3.5 h-3.5 text-primary" /> GSTIN: 33AAAAA0000A1Z5
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="px-6 py-2 bg-primary/5 border border-primary/10 rounded-sm inline-block mb-4">
                                <span className="text-xs font-black text-primary tracking-widest uppercase italic">Official Remittance Advice</span>
                            </div>
                            <p className="text-3xl font-display font-black text-neutral-900 dark:text-white tabular-nums tracking-tighter">{payslipData.docId}</p>
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mt-1">Statement Period: {payslipData.period}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-16 relative z-10 flex-1">
                        {/* Employee Column */}
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] border-b border-neutral-100 dark:border-neutral-800 pb-2">Employee Identity</h3>
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-100 dark:border-neutral-800 rounded-sm flex items-center justify-center text-primary">
                                        <UserCircle className="w-12 h-12 opacity-20" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xl font-black text-neutral-900 dark:text-white uppercase">{employee.full_name}</p>
                                        <p className="text-xs font-bold text-primary uppercase tracking-widest">{employee.role}</p>
                                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Employee ID: {employee.id}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] border-b border-neutral-100 dark:border-neutral-800 pb-2">Account Allocation</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Department</p>
                                        <p className="text-xs font-black text-neutral-700 dark:text-neutral-300 uppercase">{employee.dept}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">PAN Card</p>
                                        <p className="text-xs font-black text-neutral-700 dark:text-neutral-300 font-mono uppercase tracking-widest">ABCDE1234F</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Bank Node</p>
                                        <p className="text-xs font-black text-neutral-700 dark:text-neutral-300 uppercase">HDFC Bank - 5012...</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">PF Number</p>
                                        <p className="text-xs font-black text-neutral-700 dark:text-neutral-300 font-mono">TN/MAS/00123/000</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Financial Column */}
                        <div className="space-y-8 bg-neutral-50/50 dark:bg-neutral-950/50 p-8 rounded-sm border border-neutral-100 dark:border-neutral-800">
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] border-b border-emerald-500/10 pb-2">Earnings</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm font-bold text-neutral-600 dark:text-neutral-400">
                                        <span>Basic Component</span>
                                        <span className="font-mono tabular-nums text-neutral-900 dark:text-white">₹{payslipData.summary.base}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-bold text-neutral-600 dark:text-neutral-400">
                                        <span>House Rent Allowance (HRA)</span>
                                        <span className="font-mono tabular-nums text-neutral-900 dark:text-white">₹0</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] border-b border-rose-500/10 pb-2">Deductions</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm font-bold text-neutral-600 dark:text-neutral-400">
                                        <span>Income Tax (TDS)</span>
                                        <span className="font-mono tabular-nums text-rose-500">-₹{payslipData.summary.tax}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-bold text-neutral-600 dark:text-neutral-400">
                                        <span>Provident Fund (PF)</span>
                                        <span className="font-mono tabular-nums text-rose-500">-₹{payslipData.summary.pf}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 border-t-2 border-primary mt-8">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-black text-neutral-400 uppercase tracking-widest italic flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-primary" /> Net Credit Value
                                    </span>
                                    <div className="flex items-center gap-2 text-3xl font-display font-black text-primary tabular-nums tracking-tighter">
                                        <IndianRupee className="w-5 h-5 stroke-[3]" />
                                        {parseInt(payslipData.summary.netTotal).toLocaleString()}
                                    </div>
                                </div>
                                <p className="text-[10px] font-black text-neutral-400 text-right uppercase tracking-[0.2em]">Authorized Disbursal Pipeline Node</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-16 pt-8 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-end relative z-10">
                        <div className="space-y-4 max-w-md">
                            <p className="text-[9px] font-bold text-neutral-400 italic leading-relaxed uppercase tracking-widest">
                                This is a computer-generated digital remittance advice and does not require a physical signature. All values are subject to statutory audits.
                            </p>
                        </div>
                        <div className="text-center space-y-2">
                            <div className="w-32 h-1 bg-neutral-100 dark:bg-neutral-800 mx-auto rounded-full mb-4"></div>
                            <p className="text-[10px] font-black text-neutral-900 dark:text-white uppercase tracking-[0.2em]">Digitally Certified By</p>
                            <p className="text-[9px] font-black text-primary uppercase tracking-widest">Vignesh ERP Systems</p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default PayslipViewMockUI;

