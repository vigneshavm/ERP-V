import React, { useState } from 'react';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import CashBankInput from './components/CashBankInput';
import CashBankHero from './components/CashBankHero';
import { Cheque, TypeConfig } from './types';
import {
    FileCheck,
    Clock,
    XCircle,
    Receipt,
    Building2,
    Plus,
    Search,
    Calendar,
    IndianRupee,
    User,
    FileText,
    X,
    CheckCircle2,
    ArrowDownLeft,
    ArrowUpRight,
    Activity
} from 'lucide-react';

const Cheques: React.FC = () => {
    const [showAddCheque, setShowAddCheque] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [selectedCheque, setSelectedCheque] = useState<Cheque | null>(null);
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'cleared' | 'bounced'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState<Partial<Cheque>>({
        chequeNo: '',
        partyName: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        bankName: '',
        type: 'received',
        status: 'pending',
        notes: ''
    });

    // Sample data (keeping for now as per original logic)
    const cheques: Cheque[] = [
        { id: 1, chequeNo: 'CHQ001', partyName: 'ABC Suppliers', amount: 25000, date: '2024-01-15', bankName: 'HDFC Bank', type: 'issued', status: 'cleared', clearDate: '2024-01-20' },
        { id: 2, chequeNo: 'CHQ002', partyName: 'XYZ Customer', amount: 15000, date: '2024-01-18', bankName: 'ICICI Bank', type: 'received', status: 'pending', clearDate: null },
        { id: 3, chequeNo: 'CHQ003', partyName: 'PQR Traders', amount: 30000, date: '2024-01-20', bankName: 'SBI', type: 'received', status: 'cleared', clearDate: '2024-01-25' },
        { id: 4, chequeNo: 'CHQ004', partyName: 'LMN Distributors', amount: 12000, date: '2024-01-22', bankName: 'Axis Bank', type: 'issued', status: 'bounced', clearDate: null },
        { id: 5, chequeNo: 'CHQ005', partyName: 'DEF Enterprises', amount: 20000, date: '2024-01-25', bankName: 'HDFC Bank', type: 'received', status: 'pending', clearDate: null }
    ];

    const filteredCheques = cheques.filter(c => {
        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
        const matchesSearch = c.chequeNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.partyName.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const statusConfig: TypeConfig = {
        pending: { icon: Clock, color: 'from-amber-500 to-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600', border: 'border-amber-200 dark:border-amber-800' },
        cleared: { icon: CheckCircle2, color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600', border: 'border-emerald-200 dark:border-emerald-800' },
        bounced: { icon: XCircle, color: 'from-rose-500 to-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-600', border: 'border-rose-200 dark:border-rose-800' }
    };

    const statusCounts = {
        all: cheques.length,
        pending: cheques.filter(c => c.status === 'pending').length,
        cleared: cheques.filter(c => c.status === 'cleared').length,
        bounced: cheques.filter(c => c.status === 'bounced').length
    };

    const statusValues = {
        all: cheques.reduce((sum, c) => sum + c.amount, 0),
        pending: cheques.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0),
        cleared: cheques.filter(c => c.status === 'cleared').reduce((sum, c) => sum + c.amount, 0),
        bounced: cheques.filter(c => c.status === 'bounced').reduce((sum, c) => sum + c.amount, 0)
    };

    const totalValue = cheques.reduce((sum, c) => sum + c.amount, 0);

    return (
        <Layout>
            <PageHeader
                title="Cheque Clearing Console"
                description="Instrument tracking, clearance monitoring, and reconciliation management"
                breadcrumbs={[{ label: 'Treasury', link: '/cashbank/position' }, { label: 'Cheques' }]}
                actions={
                    <button
                        onClick={() => setShowAddCheque(true)}
                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Register Instrument
                    </button>
                }
            />

            <CashBankHero
                title="Total Instrument Value"
                value={`₹${totalValue.toLocaleString('en-IN')}`}
                icon={Receipt}
                stats={
                    <>
                        <div className="px-4 py-2 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <FileCheck className="w-4 h-4" />
                            {cheques.length} Active Instruments
                        </div>
                        <div className="px-4 py-2 bg-amber-500/20 rounded-2xl backdrop-blur-md border border-amber-400/30 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-amber-300">
                            <Clock className="w-4 h-4" />
                            ₹{statusValues.pending.toLocaleString('en-IN')} Pending Clearance
                        </div>
                    </>
                }
                extraActions={
                    <div className="bg-white/10 rounded-[2rem] p-6 backdrop-blur-md border border-white/20">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200 mb-4">Clearance Rate</p>
                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-black">{cheques.length > 0 ? ((statusCounts.cleared / cheques.length) * 100).toFixed(0) : 0}%</span>
                            <span className="text-sm font-bold text-emerald-400 pb-1">Cleared</span>
                        </div>
                        <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${cheques.length > 0 ? (statusCounts.cleared / cheques.length) * 100 : 0}%` }}></div>
                        </div>
                    </div>
                }
            />

            {/* Status Pipeline Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {(['pending', 'cleared', 'bounced'] as const).map((status) => {
                    const config = statusConfig[status];
                    const Icon = config.icon;
                    const isActive = statusFilter === status;

                    return (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
                            className={`${config.bg} ${config.border} border-2 rounded-[2rem] p-6 transition-all hover:shadow-lg text-left group ${isActive ? 'ring-4 ring-indigo-500/20 scale-[1.02]' : ''}`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${config.color} flex items-center justify-center text-white shadow-lg group-hover:rotate-12 transition-transform`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <span className={`text-3xl font-black ${config.text}`}>{statusCounts[status]}</span>
                            </div>
                            <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight capitalize">{status}</h4>
                            <p className="text-xs font-bold text-slate-400 mt-1">₹{statusValues[status].toLocaleString('en-IN')}</p>
                        </button>
                    );
                })}
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-4 mb-8">
                <div className="flex-1 relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by cheque number or party name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm"
                    />
                </div>
                {statusFilter !== 'all' && (
                    <button
                        onClick={() => setStatusFilter('all')}
                        className="px-5 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
                    >
                        <X className="w-4 h-4" /> Clear Filter
                    </button>
                )}
            </div>

            {/* Instrument Registry */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Receipt className="w-4 h-4" />
                        Instrument Registry
                    </h3>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        {filteredCheques.length} Instrument{filteredCheques.length !== 1 ? 's' : ''} Found
                    </span>
                </div>

                {filteredCheques.length === 0 ? (
                    <div className="py-20 bg-slate-50 dark:bg-slate-800/20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] text-center flex flex-col items-center">
                        <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl flex items-center justify-center text-slate-200 mb-6">
                            <Receipt className="w-10 h-10" />
                        </div>
                        <h4 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">No Instruments Found</h4>
                        <p className="text-xs font-medium text-slate-400 mt-2">Register a new cheque or adjust your filters.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredCheques.map((cheque) => {
                            const config = statusConfig[cheque.status] || statusConfig.pending;
                            const StatusIcon = config.icon;
                            const isReceived = cheque.type === 'received';

                            return (
                                <div
                                    key={cheque.id}
                                    onClick={() => { setSelectedCheque(cheque); setShowDetails(true); }}
                                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 transition-all hover:shadow-xl hover:border-indigo-100 dark:hover:border-indigo-900 cursor-pointer group"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isReceived ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'} group-hover:scale-110 transition-transform`}>
                                                {isReceived ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{cheque.chequeNo}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 capitalize">{cheque.type}</p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${config.bg} ${config.text}`}>
                                            {cheque.status}
                                        </span>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <User className="w-3.5 h-3.5" />
                                            <span className="font-bold">{cheque.partyName}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <Building2 className="w-3.5 h-3.5" />
                                            <span>{cheque.bankName}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span>{new Date(cheque.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                        <p className={`text-xl font-black ${isReceived ? 'text-emerald-600' : 'text-blue-600'}`}>
                                            ₹{cheque.amount.toLocaleString('en-IN')}
                                        </p>
                                        <StatusIcon className={`w-5 h-5 ${config.text}`} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Add Cheque Modal */}
            {showAddCheque && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Register Instrument</h2>
                                <p className="text-xs font-medium text-slate-400">Add a new cheque to the clearing queue</p>
                            </div>
                            <button onClick={() => setShowAddCheque(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <CashBankInput label="Cheque Number" icon={FileText}>
                                    <input
                                        type="text"
                                        value={formData.chequeNo}
                                        onChange={(e) => setFormData({ ...formData, chequeNo: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm"
                                        placeholder="CHQ001"
                                    />
                                </CashBankInput>
                                <CashBankInput label="Date" icon={Calendar}>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm"
                                    />
                                </CashBankInput>
                                <CashBankInput label="Party Name" icon={User}>
                                    <input
                                        type="text"
                                        value={formData.partyName}
                                        onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm"
                                        placeholder="Enter party name"
                                    />
                                </CashBankInput>
                                <CashBankInput label="Amount (₹)" icon={IndianRupee}>
                                    <input
                                        type="number"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm"
                                        placeholder="0.00"
                                    />
                                </CashBankInput>
                                <CashBankInput label="Bank Name" icon={Building2}>
                                    <input
                                        type="text"
                                        value={formData.bankName}
                                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm"
                                        placeholder="Enter bank name"
                                    />
                                </CashBankInput>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Type</label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: 'received' })}
                                            className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${formData.type === 'received' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
                                        >
                                            <ArrowDownLeft className="w-4 h-4" /> Received
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: 'issued' })}
                                            className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${formData.type === 'issued' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
                                        >
                                            <ArrowUpRight className="w-4 h-4" /> Issued
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows={2}
                                    className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm"
                                    placeholder="Additional notes..."
                                />
                            </div>
                        </div>

                        <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                            <button onClick={() => setShowAddCheque(false)} className="px-8 py-3.5 border border-slate-200 dark:border-slate-700 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all">Cancel</button>
                            <button className="px-10 py-3.5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all">
                                Register Instrument
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cheque Details Modal */}
            {showDetails && selectedCheque && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{selectedCheque.chequeNo}</h2>
                                <p className="text-xs font-medium text-slate-400">Instrument Details</p>
                            </div>
                            <button onClick={() => setShowDetails(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        <div className="p-8">
                            <div className="text-center mb-6">
                                <p className={`text-4xl font-black ${selectedCheque.type === 'received' ? 'text-emerald-600' : 'text-blue-600'}`}>
                                    ₹{selectedCheque.amount.toLocaleString('en-IN')}
                                </p>
                                <span className={`inline-block mt-2 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${statusConfig[selectedCheque.status].bg} ${statusConfig[selectedCheque.status].text}`}>
                                    {selectedCheque.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Party</p>
                                    <p className="text-sm font-bold text-slate-800 dark:text-white">{selectedCheque.partyName}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Bank</p>
                                    <p className="text-sm font-bold text-slate-800 dark:text-white">{selectedCheque.bankName}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</p>
                                    <p className="text-sm font-bold text-slate-800 dark:text-white">{selectedCheque.date}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Type</p>
                                    <p className={`text-sm font-bold capitalize ${selectedCheque.type === 'received' ? 'text-emerald-600' : 'text-blue-600'}`}>{selectedCheque.type}</p>
                                </div>
                            </div>

                            {selectedCheque.status === 'pending' && (
                                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 flex gap-3">
                                    <button className="flex-1 py-3.5 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" /> Mark Cleared
                                    </button>
                                    <button className="flex-1 py-3.5 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-rose-700 transition-all flex items-center justify-center gap-2">
                                        <XCircle className="w-4 h-4" /> Mark Bounced
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Cheques;
