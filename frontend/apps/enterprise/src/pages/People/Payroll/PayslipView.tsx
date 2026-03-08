import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
    Printer, 
    Download, 
    Mail, 
    ChevronLeft,
    Shield,
    DollarSign,
    Briefcase,
    Building2,
    Calendar,
    FileText,
    CheckCircle2,
    TrendingUp,
    Clock,
    History as HistoryIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import Layout from '../../../components/shared/Layout';
import PageHeader from '../../../components/shared/Layout/PageHeader';
import { formatDateISO, formatCurrency } from '../../../utils/helpers';
import api from '../../../services/api';

const PayslipView = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const payslip = location.state?.payslip;

    const showToast = (msg: string, type: 'success' | 'error') => {
        alert(`${type.toUpperCase()}: ${msg}`);
    };

    if (!payslip) {
        return (
            <Layout>
                <div className="h-[80vh] flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center text-rose-500 mb-6">
                        <FileText size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Quantum Data Missing</h2>
                    <p className="text-slate-500 mt-2">The requested payslip record is not available in the current temporal slice.</p>
                    <button 
                        onClick={() => navigate('/people/payroll')}
                        className="mt-8 text-blue-600 font-bold flex items-center gap-2 hover:underline uppercase tracking-widest text-xs"
                    >
                        <ChevronLeft size={20} /> Return to Console
                    </button>
                </div>
            </Layout>
        );
    }

    const handlePrint = () => {
        window.print();
    };

    const handleEmail = async () => {
        try {
            await api.post(`/api/hr/payroll/payslips/${payslip._id}/send`, { channels: ['EMAIL'] });
            showToast('Payslip queued for email delivery', 'success');
        } catch (error) {
            showToast('Failed to send email', 'error');
        }
    };

    return (
        <Layout>
            <div className="max-w-4xl mx-auto px-4 py-8 print:p-0 print:max-w-none">
                <div className="print:hidden mb-10">
                    <PageHeader
                        title={`Agent Payslip: ${payslip.employeeId?.name || 'Unknown'}`}
                        description={`Vortex Cycle: ${new Date(0, payslip.month).toLocaleString('default', { month: 'long' })} ${payslip.year}`}
                        backButton={
                            <button 
                                onClick={() => navigate(-1)}
                                className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors font-bold text-xs uppercase tracking-widest"
                            >
                                <ChevronLeft size={16} /> Back to History
                            </button>
                        }
                        actions={
                            <div className="flex gap-3">
                                <button onClick={handlePrint} className="bg-white dark:bg-slate-800 text-slate-700 dark:text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-all active:scale-95">
                                    <Printer size={18} /> Print Record
                                </button>
                                <button onClick={handleEmail} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95">
                                    <Mail size={18} /> Email Dispatch
                                </button>
                            </div>
                        }
                    />
                </div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-900 shadow-2xl rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 print:shadow-none print:border print:rounded-none"
                >
                    {/* Premium Header */}
                    <div className="bg-slate-950 text-white p-12 relative overflow-hidden print:bg-slate-100 print:text-slate-900 border-b border-white/5">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-32 -mt-32 blur-3xl print:hidden" />
                        <div className="relative flex justify-between items-start">
                            <div className="space-y-4">
                                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl shadow-blue-500/20">V</div>
                                <div>
                                    <h1 className="text-3xl font-black tracking-tighter uppercase mb-1">Quantum Payslip</h1>
                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">Confidential Personnel Data</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <h2 className="text-xl font-black tracking-tight text-white print:text-slate-900 uppercase">Neural Dynamics Inc.</h2>
                                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Global Ops // Tech Sector 7</p>
                                <div className="mt-6 inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <Shield size={12} className="text-blue-500" /> Secure Encryption Active
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Meta Data Section */}
                    <div className="px-12 py-10 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Briefcase size={12} className="text-blue-500" /> Agent Profile
                                </h3>
                                <div>
                                    <p className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none">{payslip.employeeId?.name}</p>
                                    <p className="text-xs font-bold text-slate-500 mt-2 uppercase tracking-widest">{payslip.employeeId?.role || 'Operational Staff'}</p>
                                    <p className="text-[10px] font-mono font-bold text-slate-400 mt-1 tracking-widest">UID: {payslip.employeeId?._id?.toUpperCase() || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Building2 size={12} className="text-blue-500" /> Nexus Details
                                </h3>
                                <div>
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest">Bank: {payslip.bankDetailsSnapshot?.bankName || 'Direct Disbursement'}</p>
                                    <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">Channel: {payslip.bankDetailsSnapshot?.accountNumber ? `A/C ****${payslip.bankDetailsSnapshot.accountNumber.slice(-4)}` : 'Internal Transfer'}</p>
                                    <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">Location: Headquarters</p>
                                </div>
                            </div>
                            <div className="space-y-4 md:text-right">
                                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] md:justify-end flex items-center gap-2">
                                    <Calendar size={12} className="text-blue-500" /> Cycle Metrics
                                </h3>
                                <div>
                                    <p className="text-xl font-black text-blue-600 uppercase tracking-tight leading-none">
                                        {new Date(0, payslip.month).toLocaleString('default', { month: 'long' })} {payslip.year}
                                    </p>
                                    <div className="flex md:justify-end gap-6 mt-4">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Work Days</p>
                                            <p className="text-sm font-black text-slate-800 dark:text-white">{payslip.daysPresent} / {payslip.daysTotal}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dispatch</p>
                                            <p className="text-sm font-black text-slate-800 dark:text-white">{payslip.paymentDate ? formatDateISO(payslip.paymentDate) : 'Processing'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Breakdown Section */}
                    <div className="px-12 py-10">
                        <div className="grid md:grid-cols-2 gap-16">
                            {/* Earnings Column */}
                            <div>
                                <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                    <TrendingUp size={14} /> Value Generation (Earnings)
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-slate-800/50">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Core Base Salary</span>
                                        <span className="text-sm font-black text-slate-800 dark:text-white font-mono">{formatCurrency(payslip.basicSalary || 0)}</span>
                                    </div>
                                    {payslip.earnings?.map((e: any, i: number) => (
                                        <div key={i} className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-slate-800/50">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{e.name}</span>
                                            <span className="text-sm font-black text-slate-800 dark:text-white font-mono">{formatCurrency(e.amount || 0)}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center py-5">
                                        <span className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Gross Neural Value</span>
                                        <span className="text-lg font-black text-slate-800 dark:text-white font-mono">{formatCurrency(payslip.grossPay || 0)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Deductions Column */}
                            <div>
                                <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                    <HistoryIcon size={14} className="scale-x-[-1]" /> System Retractions (Deductions)
                                </h3>
                                <div className="space-y-4">
                                    {payslip.deductions?.length > 0 ? (
                                        payslip.deductions.map((d: any, i: number) => (
                                            <div key={i} className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-slate-800/50">
                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{d.name}</span>
                                                <span className="text-sm font-black text-rose-500 font-mono">-{formatCurrency(d.amount || 0)}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-10 text-center border-b border-dashed border-slate-200 dark:border-slate-800">
                                            <p className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">No Retractions Detected</p>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center py-5">
                                        <span className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Total Retractions</span>
                                        <span className="text-lg font-black text-rose-500 font-mono">-{formatCurrency(payslip.totalDeductions || 0)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Net Payout Summary */}
                    <div className="mx-12 mb-12 p-10 bg-slate-950 dark:bg-black rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -mr-32 -mt-32 blur-3xl transition-transform group-hover:scale-110" />
                        <div className="relative flex flex-col md:flex-row justify-between items-center gap-8">
                            <div>
                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-2">Net Dispatched Value</p>
                                <h2 className="text-5xl font-black text-white tracking-tighter font-mono">
                                    {formatCurrency(payslip.netPay || 0)}
                                </h2>
                            </div>
                            <div className="text-center md:text-right space-y-4">
                                <div className={`inline-flex items-center gap-2 px-5 py-2 rounded-2xl font-black text-xs uppercase tracking-widest border ${
                                    payslip.paymentStatus === 'PAID' 
                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                                    : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                }`}>
                                    {payslip.paymentStatus === 'PAID' ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                                    {payslip.paymentStatus === 'PAID' ? 'Nexus Verification: PAID' : 'Nexus Status: PENDING'}
                                </div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest max-w-[200px] leading-relaxed opacity-60">
                                    Certified by Vortex Neural Network Core. Final value reconciled under Protocol 7.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer Warning */}
                    <div className="px-12 py-8 bg-slate-50/50 dark:bg-slate-800/10 border-t border-slate-100 dark:border-slate-800 text-center">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            Universal Neural Resource Management // Industrial Efficiency Matrix // Verified Record
                        </p>
                    </div>
                </motion.div>
                
                <div className="mt-8 text-center text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest flex items-center justify-center gap-4">
                    <span>Generated: {new Date().toISOString()}</span>
                    <div className="w-1 h-1 bg-slate-200 dark:bg-slate-800 rounded-full" />
                    <span>Reference: {payslip._id?.toUpperCase()}</span>
                </div>
            </div>
        </Layout>
    );
};

export default PayslipView;
