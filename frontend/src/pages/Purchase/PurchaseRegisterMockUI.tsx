import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Search, Plus, Download, ChevronRight, BarChart2, ShieldCheck, FileText, Factory } from 'lucide-react';
import purchaseRegisterData from '../../mockData/purchaseRegisterData.json';

const PurchaseRegisterMockUI: React.FC = () => {
    const navigate = useNavigate();

    // State
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Filtering Logic
    const filteredRecords = useMemo(() => {
        return purchaseRegisterData.records.filter(rec => 
            rec.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            rec.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
            rec.status.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
    const paginatedRecords = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredRecords.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredRecords, currentPage]);

    // Reset pagination on search
    const handleSearch = (val: string) => {
        setSearchTerm(val);
        setCurrentPage(1);
    };

    // Export Logic
    const handleExport = () => {
        const headers = ["Record ID", "Date", "Supplier", "Status", "Amount"];
        const rows = filteredRecords.map(rec => [
            rec.id,
            rec.date,
            rec.supplier,
            rec.status,
            rec.amount.replace('₹', '').replace(/,/g, '')
        ]);
        
        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Purchase_Register_Protocol_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // New Acquisition Navigation
    const handleNewAcquisition = () => {
        navigate('/purchase/new');
    };

    return (
        <div className="min-h-screen bg-[#050505] text-[#e0e0e0] font-sans selection:bg-cyan-500/30 overflow-hidden flex flex-col relative">
            {/* Ambient Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-600/5 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(20,20,20,0)_0%,rgba(5,5,5,1)_100%)]" />
            </div>

            <main className="relative z-10 flex-1 flex flex-col max-w-[1600px] w-full mx-auto px-8 py-8 space-y-8 animate-in fade-in duration-700">
                {/* Header Section */}
                <header className="flex justify-between items-end">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent uppercase">
                                Purchase Register
                            </h1>
                            <span className="px-2.5 py-0.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-md text-[10px] font-black uppercase tracking-[0.2em]">
                                Archive Node
                            </span>
                        </div>
                        <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest flex items-center gap-2">
                            <Factory className="w-3.5 h-3.5" /> Institutional Procurement Traceability Ledger
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button 
                            onClick={handleExport}
                            className="h-11 px-6 bg-white/5 hover:bg-white/10 text-neutral-300 font-bold text-xs uppercase tracking-widest rounded-xl transition-all border border-white/10 flex items-center gap-2 active:scale-95"
                        >
                            <Download className="w-4 h-4" /> Export Protocol
                        </button>
                        <button 
                            onClick={handleNewAcquisition}
                            className="h-11 px-6 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-black uppercase tracking-[0.15em] text-[10px] rounded-xl transition-all shadow-[0_0_20px_rgba(8,145,178,0.2)] hover:shadow-[0_0_30px_rgba(8,145,178,0.4)] flex items-center gap-2 active:scale-95"
                        >
                            <Plus className="w-4 h-4" /> New Acquisition
                        </button>
                    </div>
                </header>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {purchaseRegisterData.metrics.map((stat, i) => (
                        <div key={i} className="group relative overflow-hidden bg-white/[0.03] border border-white/5 rounded-3xl p-6 transition-all hover:bg-white/[0.05] hover:border-white/10">
                            <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-cyan-500/10 to-transparent blur-2xl group-hover:scale-150 transition-transform duration-700" />
                            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-2">{stat.label}</p>
                            <p className="text-3xl font-black text-neutral-100 tabular-nums tracking-tighter">{stat.value}</p>
                            <div className="mt-4 h-1 w-12 bg-cyan-500/30 rounded-full group-hover:w-20 transition-all duration-500" />
                        </div>
                    ))}
                </div>

                {/* Filter & Command Bar */}
                <div className="flex flex-col md:flex-row gap-4 items-center bg-white/[0.02] border border-white/5 p-4 rounded-[2rem] backdrop-blur-md">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within:text-cyan-400 transition-colors" />
                        <input 
                            type="text" 
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="QUERY SYSTEM NODES (PO # / SUPPLIER / ID)..." 
                            className="w-full bg-black/40 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-[10px] font-black uppercase tracking-widest focus:border-cyan-500/50 outline-none transition-all placeholder:text-neutral-700"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-200 active:scale-95">
                            <Filter className="w-4 h-4" /> Parameters
                        </button>
                        <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-200 active:scale-95">
                            <BarChart2 className="w-4 h-4" /> Intelligence
                        </button>
                    </div>
                </div>

                {/* Data Matrix */}
                <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col backdrop-blur-sm relative shadow-2xl">
                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/[0.03] border-b border-white/5">
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">Record Identity</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">Temporal Node</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">Institutional Entity</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 text-center">Protocol State</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 text-right">Quantum (INR)</th>
                                    <th className="px-8 py-5 w-16"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {paginatedRecords.length > 0 ? (
                                    paginatedRecords.map((rec, i) => (
                                        <tr key={i} className="hover:bg-white/[0.03] transition-all cursor-pointer group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-cyan-500/10 transition-colors">
                                                        <FileText className="w-4 h-4 text-neutral-600 group-hover:text-cyan-400 transition-colors" />
                                                    </div>
                                                    <span className="font-mono text-sm font-bold text-cyan-500 group-hover:text-cyan-400 transition-colors tracking-tighter">{rec.id}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-xs font-bold text-neutral-400 uppercase tracking-widest">{rec.date}</td>
                                            <td className="px-8 py-6">
                                                <span className="text-sm font-black text-neutral-100 uppercase tracking-tight">{rec.supplier}</span>
                                                <div className="text-[9px] font-black text-neutral-600 uppercase tracking-[0.2em] mt-1">Verified Node</div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex justify-center">
                                                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 border bg-${rec.color}-500/5 text-${rec.color}-400 border-${rec.color}-500/20`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full bg-${rec.color}-400 animate-pulse`} />
                                                        {rec.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right font-mono text-lg font-black text-neutral-100 tracking-tighter tabular-nums">
                                                {rec.amount}
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <button className="p-2.5 rounded-xl bg-white/5 opacity-0 group-hover:opacity-100 transition-all hover:bg-cyan-500/20 hover:text-cyan-400 text-neutral-500">
                                                    <ChevronRight className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center text-neutral-600 font-black uppercase tracking-[0.3em] text-[10px]">
                                            No nodes found in current query context
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination Matrix */}
                    <footer className="mt-auto p-8 border-t border-white/5 bg-white/[0.02] flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em]">
                            Displaying <span className="text-neutral-400">{filteredRecords.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredRecords.length)}</span> of <span className="text-neutral-400">{filteredRecords.length}</span> Acquisition Nodes
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-neutral-500 hover:text-neutral-200 transition-all active:scale-95 disabled:opacity-20 disabled:pointer-events-none"
                            >
                                Previous Node
                            </button>
                            <div className="flex gap-2">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                                    <button 
                                        key={n} 
                                        onClick={() => setCurrentPage(n)}
                                        className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${n === currentPage ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20' : 'bg-white/5 text-neutral-500 hover:bg-white/10'}`}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                            <button 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-neutral-500 hover:text-neutral-200 transition-all active:scale-95 disabled:opacity-20 disabled:pointer-events-none"
                            >
                                Next Node
                            </button>
                        </div>
                    </footer>
                </div>

                {/* Ambient Intelligence Alert */}
                <div className="bg-cyan-500/5 border border-cyan-500/10 p-6 rounded-[2rem] flex items-center gap-6 animate-pulse duration-[4s]">
                    <div className="p-4 bg-cyan-500/10 rounded-2xl border border-cyan-500/20">
                        <ShieldCheck className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em]">System Governance Active</h4>
                        <p className="text-xs text-neutral-500 font-bold mt-1 italic uppercase tracking-widest">All procurement nodes are being synchronized with the institutional audit trail.</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PurchaseRegisterMockUI;
