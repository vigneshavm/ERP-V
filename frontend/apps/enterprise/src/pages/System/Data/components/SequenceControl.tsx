import { useState, useEffect } from 'react';
import api from "@/services/api";
import { toast } from 'react-toastify';
import { 
    Hash, ShieldCheck, AlertCircle, 
    Lock, Unlock, RefreshCw, 
    Search, Filter, ChevronRight,
    Target, History, Info,
    Zap, Calendar, Layout as LayoutIcon,
    AlertTriangle
} from 'lucide-react';

interface NumberSeries {
    _id: string;
    branch?: { name: string };
    seriesType: string;
    prefix: string;
    padding: number;
    currentValue: number;
    description?: string;
    status: 'ACTIVE' | 'LOCKED';
    lastUpdated: string;
}

const SequenceControl = () => {
    const [series, setSeries] = useState<NumberSeries[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterBranch, setFilterBranch] = useState('ALL_SECTORS');

    const fetchSeries = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/metadata/number-series');
            setSeries(response.data);
        } catch (error) {
            console.error('Logic core failure:', error);
            toast.error('Sector Retrieval Failure: Sequence Ledger unreachable.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSeries();
    }, []);

    const toggleLock = async (id: string, currentStatus: string) => {
        try {
            const newStatus = currentStatus === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
            await api.patch(`/api/metadata/number-series/${id}`, { status: newStatus });
            toast.success(`Protocol ${newStatus}: Sequence ${newStatus === 'LOCKED' ? 'Secured' : 'Released'}`);
            fetchSeries();
        } catch (error) {
            toast.error('Override Failure: Security protocol rejected change.');
        }
    };

    const handleReset = (id: string) => {
        toast.warning('Epoch Reset detected. Confirm biometric override? (Mock)');
    };

    const filteredSeries = series.filter(s => {
        const matchesSearch = s.seriesType.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             s.prefix.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesBranch = filterBranch === 'ALL_SECTORS' || s.branch?.name === filterBranch;
        return matchesSearch && matchesBranch;
    });

    const formatPreview = (s: NumberSeries) => {
        const paddedValue = String(s.currentValue + 1).padStart(s.padding, '0');
        return `${s.prefix}${paddedValue}`;
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Sequence Governance HUD */}
            <div className="bg-slate-900 rounded-[3rem] p-10 flex flex-col md:flex-row items-center gap-10 border border-slate-800 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                    <Hash className="w-64 h-64 text-indigo-500" />
                </div>
                <div className="relative z-10 w-24 h-24 rounded-[2.5rem] bg-indigo-600 flex items-center justify-center shrink-0 shadow-2xl shadow-indigo-500/30 group-hover:scale-110 transition-transform duration-500">
                    <ShieldCheck className="w-12 h-12 text-white" />
                </div>
                <div className="relative z-10 flex-1 text-center md:text-left">
                    <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">Sequence <span className="text-indigo-400">Governance</span></h1>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-2xl">High-integrity indexing control for legal documentation. Auto-incrementing logic and branch-wise series isolation active.</p>
                </div>
                <div className="relative z-10 flex flex-col items-end gap-3 shrink-0">
                    <div className="px-6 py-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full text-[10px] font-black tracking-widest flex items-center gap-3">
                        <History className="w-3.5 h-3.5 animate-spin-slow" /> AUDIT TRAIL SYNCED
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Control Matrix */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Filter Deck */}
                    <div className="bg-white dark:bg-slate-950 rounded-[3rem] p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-6">
                        <div className="flex-1 w-full flex items-center gap-6 px-4">
                            <Search className="w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Locate sequence protocol..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-transparent w-full text-xs font-black uppercase tracking-widest outline-none text-slate-900 dark:text-white"
                            />
                        </div>
                        <div className="h-10 w-[1px] bg-slate-100 dark:bg-slate-800 hidden md:block"></div>
                        <div className="flex items-center gap-4 px-4 w-full md:w-auto">
                            <Filter className="w-4 h-4 text-slate-400" />
                            <select
                                value={filterBranch}
                                onChange={(e) => setFilterBranch(e.target.value)}
                                className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none text-slate-500"
                            >
                                <option value="ALL_SECTORS">All Sectors</option>
                                <option value="HQ">Headquarters</option>
                                <option value="WAREHOUSE">Secondary Node</option>
                            </select>
                        </div>
                    </div>

                    {/* Sequence Ledger */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {loading ? (
                            [1, 2, 3, 4].map(i => (
                                <div key={i} className="h-64 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900 animate-pulse border border-slate-100 dark:border-slate-800"></div>
                            ))
                        ) : filteredSeries.length > 0 ? (
                            filteredSeries.map((s) => (
                                <div key={s._id} className="bg-white dark:bg-slate-950 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm hover:border-indigo-200 dark:hover:border-slate-700 transition-all group">
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                                            <Hash className="w-6 h-6" />
                                        </div>
                                        <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 ${
                                            s.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                                        }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${s.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                            {s.status}
                                        </div>
                                    </div>
                                    
                                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-2">{s.seriesType}</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-6">{s.branch?.name || 'GLOBAL_SYSTEM'}</p>
                                    
                                    <div className="bg-slate-50/50 dark:bg-slate-800/20 rounded-[1.5rem] p-5 mb-8 border border-slate-50 dark:border-slate-800/50 relative overflow-hidden">
                                        <div className="flex items-center justify-between relative z-10">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Next Index</span>
                                            <span className="text-xl font-black text-indigo-500 italic tracking-tighter">{formatPreview(s)}</span>
                                        </div>
                                        <div className="absolute bottom-0 left-0 h-1 bg-indigo-500/10 w-full"></div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button 
                                            onClick={() => toggleLock(s._id, s.status)}
                                            className="flex-1 py-4 bg-slate-900 text-white rounded-[1.2rem] text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
                                        >
                                            {s.status === 'ACTIVE' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                                            {s.status === 'ACTIVE' ? 'Secure Index' : 'Release Control'}
                                        </button>
                                        <button 
                                            onClick={() => handleReset(s._id)}
                                            className="p-4 bg-rose-500/5 text-rose-500 border border-rose-500/10 rounded-[1.2rem] hover:bg-rose-500 hover:text-white transition-all group/btn"
                                            title="Initiate Epoch Reset"
                                        >
                                            <RefreshCw className="w-4 h-4 group-hover/btn:rotate-180 transition-transform duration-700" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-2 py-32 text-center bg-slate-50/30 dark:bg-slate-900/30 rounded-[3rem] border border-dashed border-slate-100 dark:border-slate-800">
                                <LayoutIcon className="w-12 h-12 text-slate-300 mx-auto mb-6 opacity-40" />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">No active sequence clusters detected in this sector.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Governance Sidecar */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Compliance Metrics HUD */}
                    <div className="bg-indigo-600 rounded-[3rem] p-10 text-white shadow-2xl shadow-indigo-600/30 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                            <Target className="w-48 h-48" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-10 opacity-70 italic">Compliance Integrity</h3>
                            
                            <div className="space-y-8">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-4xl font-black italic tracking-tighter">100%</p>
                                        <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest">Logical Alignment</p>
                                    </div>
                                    <Zap className="w-10 h-10 text-indigo-300 animate-pulse" />
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <div className="w-full h-full bg-white rounded-full"></div>
                                    </div>
                                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest opacity-60">
                                        <span>Gaps Detected: 0</span>
                                        <span>Sync: Normal</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Fiscal Epoch Warning */}
                    <div className="bg-white dark:bg-slate-950 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-sm relative group overflow-hidden">
                        <div className="absolute -top-12 -right-12 w-24 h-24 bg-rose-500/10 rounded-full blur-3xl group-hover:bg-rose-500/20 transition-all duration-700"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-6 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/30">
                                    <Calendar className="w-6 h-6 text-white" />
                                </div>
                                <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Fiscal Epoch</h4>
                            </div>
                            <p className="text-[11px] font-bold text-slate-500 leading-relaxed uppercase italic mb-8">
                                Sequence reset scheduled for <span className="text-rose-500">April 01, 2026</span>. Manual override required for early epoch transition.
                            </p>
                            <button className="w-full py-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 hover:border-rose-500 transition-all">
                                Scheduling Matrix
                            </button>
                        </div>
                    </div>

                    {/* Crisis Protocol */}
                    <div className="p-8 bg-rose-900 rounded-[2.5rem] border border-rose-800 flex items-start gap-4 shadow-2xl">
                        <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-1" />
                        <div>
                            <p className="text-[10px] font-black text-white leading-relaxed uppercase mb-2">Security Override</p>
                            <p className="text-[10px] font-bold text-rose-300 leading-relaxed uppercase italic opacity-70">
                                Index locking suspends all transaction processing for the target cluster. Use only for <span className="underline decoration-rose-500">Forensic Audits</span>.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SequenceControl;
