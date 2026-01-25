import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../redux/store';
import { updateChequeStatus, addCheque } from '../../redux/slices/financeSlice';
import Layout from '../../components/Layout';
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
    Activity,
    ShieldCheck,
    Zap,
    Download,
    TrendingUp,
    Filter,
    ArrowRight
} from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

const Cheques: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { cheques } = useSelector((state: RootState) => state.finance);
    const { currentSector } = useSelector((state: RootState) => state.auth);

    const [showAddCheque, setShowAddCheque] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [selectedCheque, setSelectedCheque] = useState<any | null>(null);
    const [statusFilter, setStatusFilter] = useState<'all' | 'PENDING' | 'CLEARED' | 'BOUNCED'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        number: '',
        payee: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        bankName: '',
        type: 'RECEIVED' as 'RECEIVED' | 'ISSUED',
        notes: ''
    });

    const sectorCheques = useMemo(() =>
        (cheques || []).filter((c: any) => c.sector === currentSector)
        , [cheques, currentSector]);

    const filteredCheques = useMemo(() =>
        sectorCheques.filter((c: any) => {
            const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
            const matchesSearch = c.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.payee.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesStatus && matchesSearch;
        })
        , [sectorCheques, statusFilter, searchTerm]);

    const statusCounts = {
        all: sectorCheques.length,
        PENDING: sectorCheques.filter((c: any) => c.status === 'PENDING').length,
        CLEARED: sectorCheques.filter((c: any) => c.status === 'CLEARED').length,
        BOUNCED: sectorCheques.filter((c: any) => c.status === 'BOUNCED').length
    };

    const statusValues = {
        PENDING: sectorCheques.filter((c: any) => c.status === 'PENDING').reduce((sum: number, c: any) => sum + c.amount, 0),
        CLEARED: sectorCheques.filter((c: any) => c.status === 'CLEARED').reduce((sum: number, c: any) => sum + c.amount, 0),
        BOUNCED: sectorCheques.filter((c: any) => c.status === 'BOUNCED').reduce((sum: number, c: any) => sum + c.amount, 0)
    };

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        dispatch(addCheque({
            id: Math.random().toString(36).substr(2, 9),
            ...formData,
            amount: parseFloat(formData.amount),
            status: 'PENDING',
            sector: currentSector
        }));
        setShowAddCheque(false);
        setFormData({ number: '', payee: '', amount: '', date: new Date().toISOString().split('T')[0], bankName: '', type: 'RECEIVED', notes: '' });
    };

    const handleUpdateStatus = (id: string, status: string) => {
        dispatch(updateChequeStatus({ id, status }));
        setShowDetails(false);
    };

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in text-neutral-900 dark:text-neutral-100 pb-16">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-black flex items-center gap-2 tracking-tight uppercase">
                            <Receipt className="w-8 h-8 text-primary" />
                            Instrument Clearing Console
                        </h2>
                        <p className="text-sm text-neutral-500 mt-1 font-medium flex items-center gap-2">
                            Authority Node: <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-md font-bold italic">{currentSector}</span>
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-5 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-[10px] font-black flex items-center gap-2 hover:bg-neutral-50 shadow-sm transition active:scale-95 uppercase tracking-[0.2em]">
                            <Download className="w-4 h-4 text-primary" /> Export Ledger
                        </button>
                        <button
                            onClick={() => setShowAddCheque(true)}
                            className="px-5 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-primary/90 transition hover:scale-105 active:scale-95 uppercase tracking-[0.2em]"
                        >
                            <Plus className="w-4 h-4 fill-current" /> Register Instrument
                        </button>
                    </div>
                </div>

                {/* KPI Pulse Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-neutral-800 p-6 rounded-[2rem] border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden group">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-1">Clearing Rate</p>
                        <h3 className="text-3xl font-black text-primary italic tracking-tighter">
                            {statusCounts.all > 0 ? ((statusCounts.CLEARED / statusCounts.all) * 100).toFixed(0) : 0}%
                        </h3>
                        <div className="mt-3 h-1 bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-1000"
                                style={{ width: `${statusCounts.all > 0 ? (statusCounts.CLEARED / statusCounts.all) * 100 : 0}%` }}
                            />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 p-6 rounded-[2rem] border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden group">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-1">Pending Capital</p>
                        <h3 className="text-3xl font-black text-warning italic tracking-tighter">
                            ₹{formatCurrency(statusValues.PENDING)}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-2">
                            <Clock className="w-4 h-4 text-warning" />
                            <span className="text-[10px] font-black text-warning uppercase">{statusCounts.PENDING} Active Wrappers</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 p-6 rounded-[2rem] border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden group">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-1">Successfully Cleared</p>
                        <h3 className="text-3xl font-black text-success italic tracking-tighter">
                            ₹{formatCurrency(statusValues.CLEARED)}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-2">
                            <FileCheck className="w-4 h-4 text-success" />
                            <span className="text-[10px] font-black text-success uppercase">Commited to Vault</span>
                        </div>
                    </div>

                    <div className="bg-neutral-950 text-white p-6 rounded-[2rem] shadow-2xl relative overflow-hidden group">
                        <Zap className="absolute -top-4 -right-4 w-20 h-20 text-primary opacity-20 group-hover:scale-125 transition duration-1000" />
                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-primary/20 border border-primary/30 rounded-full text-primary-light text-[9px] font-black uppercase tracking-[0.2em] mb-2">
                                <ShieldCheck className="w-3 h-3 fill-current" /> Instrument Guard
                            </div>
                            <p className="text-xs font-bold leading-relaxed italic pr-4">
                                Monitoring <span className="text-primary">{statusCounts.all} instruments</span> across {currentSector} zone.
                            </p>
                            <ArrowRight className="absolute bottom-0 right-0 w-4 h-4 text-primary group-hover:translate-x-1 transition cursor-pointer" />
                        </div>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-neutral-800 p-2 rounded-2xl border border-neutral-200 dark:border-neutral-700">
                    <div className="flex p-1 bg-neutral-100 dark:bg-neutral-900 rounded-xl w-full md:w-auto">
                        {[
                            { id: 'all', label: 'All Node' },
                            { id: 'PENDING', label: 'Pending' },
                            { id: 'CLEARED', label: 'Cleared' },
                            { id: 'BOUNCED', label: 'Bounced' }
                        ].map(f => (
                            <button
                                key={f.id}
                                onClick={() => setStatusFilter(f.id as any)}
                                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${statusFilter === f.id
                                        ? 'bg-white dark:bg-neutral-800 text-primary shadow-sm'
                                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto px-2">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Search Instruments..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20 transition font-black tracking-tight italic"
                            />
                        </div>
                        <button className="p-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-500 hover:text-primary transition shadow-sm">
                            <Filter className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Instrument Grid */}
                {filteredCheques.length === 0 ? (
                    <div className="py-32 bg-white dark:bg-neutral-800 rounded-[3rem] border-2 border-dashed border-neutral-200 dark:border-neutral-700 text-center flex flex-col items-center">
                        <Layers className="w-16 h-16 text-neutral-100 dark:text-neutral-900 mb-6" />
                        <h4 className="text-xl font-black italic text-neutral-400 uppercase tracking-widest">No Instruments located in node</h4>
                        <p className="text-xs font-bold text-neutral-300 mt-2 uppercase tracking-widest italic">Clear filters or register a new transaction pulse</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCheques.map((c: any) => (
                            <div
                                key={c.id}
                                onClick={() => { setSelectedCheque(c); setShowDetails(true); }}
                                className="bg-white dark:bg-neutral-800 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-700 p-8 hover:shadow-2xl hover:border-primary/30 transition-all group cursor-pointer relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-neutral-50 dark:bg-neutral-900/50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />

                                <div className="relative z-10">
                                    <div className="flex items-start justify-between mb-8">
                                        <div className={`p-4 rounded-2xl ${c.type === 'RECEIVED' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'}`}>
                                            {c.type === 'RECEIVED' ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                                        </div>
                                        <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${c.status === 'PENDING' ? 'bg-warning/10 text-warning border-warning/20' :
                                                c.status === 'CLEARED' ? 'bg-success/10 text-success border-success/20' :
                                                    'bg-error/10 text-error border-error/20'
                                            }`}>
                                            {c.status}
                                        </span>
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        <div>
                                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Party / Payee</p>
                                            <h4 className="text-xl font-black italic tracking-tighter truncate">{c.payee}</h4>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">Instrument #</p>
                                                <p className="text-xs font-black font-mono tracking-tighter italic">{c.number}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">Entity Bank</p>
                                                <p className="text-xs font-black italic tracking-tighter truncate uppercase">{c.bankName}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-neutral-100 dark:border-neutral-700 flex items-end justify-between">
                                        <div>
                                            <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">Commitment Value</p>
                                            <p className={`text-2xl font-black italic tracking-tighter ${c.type === 'RECEIVED' ? 'text-success' : 'text-primary'}`}>
                                                ₹{formatCurrency(c.amount)}
                                            </p>
                                        </div>
                                        <div className="text-[9px] font-black text-neutral-300 uppercase italic">
                                            {new Date(c.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* --- MODALS --- */}
            {showAddCheque && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-neutral-950/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-neutral-800 w-full max-w-2xl rounded-[3rem] shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden relative">
                        <Activity className="absolute -top-10 -right-10 w-48 h-48 text-primary opacity-5" />

                        <div className="p-10">
                            <div className="flex items-center justify-between mb-10">
                                <div>
                                    <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-1">Register Instrument</h3>
                                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest italic">Securing asset node in {currentSector} zone</p>
                                </div>
                                <button onClick={() => setShowAddCheque(false)} className="p-3 bg-neutral-100 dark:bg-neutral-900 rounded-full text-neutral-400 hover:text-error transition">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleRegister} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] pl-1">Instrument ID</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.number}
                                            onChange={e => setFormData({ ...formData, number: e.target.value })}
                                            className="w-full px-5 py-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-700 rounded-2xl text-sm font-black italic outline-none focus:ring-4 focus:ring-primary/10 transition-all font-mono"
                                            placeholder="CHQ-XXXXXX"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] pl-1">Entry Date</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                            className="w-full px-5 py-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-700 rounded-2xl text-sm font-black italic outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] pl-1">Counter-Party Label</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.payee}
                                            onChange={e => setFormData({ ...formData, payee: e.target.value })}
                                            className="w-full px-5 py-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-700 rounded-2xl text-sm font-black italic outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                            placeholder="Entity Name..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] pl-1">Magnitude (₹)</label>
                                        <input
                                            type="number"
                                            required
                                            value={formData.amount}
                                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                            className="w-full px-5 py-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-700 rounded-2xl text-sm font-black italic outline-none focus:ring-4 focus:ring-primary/10 transition-all font-mono"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] pl-1">Issuing Bank</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.bankName}
                                            onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                                            className="w-full px-5 py-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-700 rounded-2xl text-sm font-black italic outline-none focus:ring-4 focus:ring-primary/10 transition-all uppercase"
                                            placeholder="HDFC, SBI, etc..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] pl-1">Pulse Direction</label>
                                        <div className="flex bg-neutral-50 dark:bg-neutral-900 p-1 rounded-2xl border border-neutral-100 dark:border-neutral-700">
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, type: 'RECEIVED' })}
                                                className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${formData.type === 'RECEIVED' ? 'bg-success text-white shadow-lg shadow-success/20' : 'text-neutral-400'}`}
                                            >
                                                Received
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, type: 'ISSUED' })}
                                                className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${formData.type === 'ISSUED' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-neutral-400'}`}
                                            >
                                                Issued
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" className="w-full py-5 mt-6 bg-neutral-950 text-white rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-neutral-900 transition-all flex items-center justify-center gap-4 border border-neutral-700">
                                    <ShieldCheck className="w-5 h-5 text-primary" />
                                    Authorize Instrument Deployment
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {showDetails && selectedCheque && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-neutral-950/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-neutral-800 w-full max-w-lg rounded-[3.5rem] shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                        <div className="p-10 border-b border-neutral-50 dark:border-neutral-700 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/10">
                            <div>
                                <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-1">{selectedCheque.number}</h3>
                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] italic">Authority Node Audit</p>
                            </div>
                            <button onClick={() => setShowDetails(false)} className="p-3 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-700 rounded-2xl text-neutral-400 hover:text-error transition shadow-sm">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-10 text-center">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-primary text-[9px] font-black uppercase tracking-[0.2em] mb-6 italic">
                                <Zap className="w-3.5 h-3.5 fill-current" /> Instrument Value Extraction
                            </div>
                            <h2 className={`text-6xl font-black italic tracking-tighter mb-4 ${selectedCheque.type === 'RECEIVED' ? 'text-success' : 'text-primary'}`}>
                                ₹{formatCurrency(selectedCheque.amount)}
                            </h2>
                            <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest italic mb-10">Commitment to {selectedCheque.payee}</p>

                            <div className="grid grid-cols-2 gap-4 mb-12">
                                <div className="p-6 bg-neutral-50 dark:bg-neutral-900 rounded-[2rem] border border-neutral-100 dark:border-neutral-800 text-left">
                                    <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">Status Protocol</p>
                                    <p className="text-xs font-black italic text-neutral-900 dark:text-white uppercase">{selectedCheque.status}</p>
                                </div>
                                <div className="p-6 bg-neutral-50 dark:bg-neutral-900 rounded-[2rem] border border-neutral-100 dark:border-neutral-800 text-left">
                                    <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">Entity Direction</p>
                                    <p className={`text-xs font-black italic uppercase ${selectedCheque.type === 'RECEIVED' ? 'text-success' : 'text-primary'}`}>{selectedCheque.type}</p>
                                </div>
                            </div>

                            {selectedCheque.status === 'PENDING' && (
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => handleUpdateStatus(selectedCheque.id, 'CLEARED')}
                                        className="flex-1 py-5 bg-success text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-success/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle2 className="w-5 h-5 fill-current" /> Commit to Vault
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(selectedCheque.id, 'BOUNCED')}
                                        className="flex-1 py-5 bg-error text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-error/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
                                    >
                                        <XCircle className="w-5 h-5 fill-current" /> Log Rejection
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
