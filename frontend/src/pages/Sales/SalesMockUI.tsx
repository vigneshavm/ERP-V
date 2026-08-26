import React, { useState, useMemo } from 'react';
import { 
    FileText, Plus, Search, Filter, CheckCircle2, Clock, 
    AlertCircle, ArrowRight, Download, Printer, TrendingUp, 
    ChevronLeft, ChevronRight 
} from 'lucide-react';
import { salesInvoices } from '../../data';
import Layout from '../../components/shared/Layout';

const IconMap: Record<string, React.ElementType> = {
    FileText, Clock, AlertCircle, CheckCircle2
};

const PAGE_SIZE = 10;

const SalesMockUI: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState<'date' | 'amount' | 'client' | 'id' | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    // Map data to UI format
    const mappedInvoices = useMemo(() => {
        return salesInvoices.map(inv => ({
            id: inv.id,
            date: inv.date,
            client: inv.customer_name,
            amount: inv.total,
            status: inv.status === 'COMPLETED' ? 'Paid' : inv.status === 'PARTIAL' ? 'Open' : 'Draft',
            due: inv.due_date
        }));
    }, []);

    // Sort handler
    const handleSort = (field: 'date' | 'amount' | 'client' | 'id') => {
        if (sortField === field) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('asc');
        }
        setCurrentPage(1);
    };

    const SortIcon = ({ field }: { field: string }) => (
        <span className={`ml-1 inline-block text-[9px] ${sortField === field ? 'text-warning' : 'text-secondary opacity-30'}`}>
            {sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
        </span>
    );

    // Pipeline Data
    const pipelineStages = useMemo(() => {
        const totalAmount = mappedInvoices.reduce((sum, inv) => sum + inv.amount, 0);
        const openInvoices = mappedInvoices.filter(inv => inv.status === 'Open').length;
        const overdueInvoices = mappedInvoices.filter(inv => inv.status === 'Draft').length; // Simulate overdue with Draft for now
        const paidInvoices = mappedInvoices.filter(inv => inv.status === 'Paid').length;

        return [
            { label: 'Total Revenue', val: mappedInvoices.length, amount: `₹${(totalAmount/100000).toFixed(2)}L`, iconName: 'FileText', color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Open Receivables', val: openInvoices, amount: '₹12.4k', iconName: 'Clock', color: 'text-warning', bg: 'bg-warning/10' },
            { label: 'Overdue Nodes', val: overdueInvoices, amount: '₹4.2k', iconName: 'AlertCircle', color: 'text-danger', bg: 'bg-danger/10' },
            { label: 'Settled Ledger', val: paidInvoices, amount: '₹24.8k', iconName: 'CheckCircle2', color: 'text-success', bg: 'bg-success/10' }
        ];
    }, [mappedInvoices]);

    // Filter + sort logic
    const filteredInvoices = useMemo(() => {
        let list = mappedInvoices.filter(inv => {
            const matchesSearch =
                inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                inv.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                inv.amount.toString().includes(searchTerm);

            const matchesTab =
                activeTab === 'All' ||
                (activeTab === 'Unpaid' && (inv.status === 'Open' || inv.status === 'Draft')) ||
                inv.status === activeTab;

            return matchesSearch && matchesTab;
        });

        if (sortField) {
            list = [...list].sort((a, b) => {
                let av: any = a[sortField as keyof typeof a];
                let bv: any = b[sortField as keyof typeof b];
                if (sortField === 'amount') { av = Number(av); bv = Number(bv); }
                if (av < bv) return sortDir === 'asc' ? -1 : 1;
                if (av > bv) return sortDir === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return list;
    }, [mappedInvoices, searchTerm, activeTab, sortField, sortDir]);

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / PAGE_SIZE));
    const safePage = Math.min(currentPage, totalPages);
    const pageStart = (safePage - 1) * PAGE_SIZE;
    const pageEnd = pageStart + PAGE_SIZE;
    const pageRecords = filteredInvoices.slice(pageStart, pageEnd);

    const goToPage = (p: number) => setCurrentPage(Math.max(1, Math.min(p, totalPages)));
    const handleSearch = (v: string) => { setSearchTerm(v); setCurrentPage(1); };
    const handleTab = (t: string) => { setActiveTab(t); setCurrentPage(1); };

    const pageButtons = useMemo(() => {
        const pages: (number | '...')[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (safePage > 3) pages.push('...');
            for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) pages.push(i);
            if (safePage < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    }, [safePage, totalPages]);

    return (
        <Layout>
            <div className="space-y-8 pt-4">
                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="relative pl-5">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-warning rounded-full shadow-[0_0_15px_rgba(var(--color-warning),0.5)]" />
                        <h1 className="text-3xl font-display font-black tracking-tighter text-main flex items-center gap-3">
                            Sales <span className="text-warning italic">Register</span>
                            <span className="px-3 py-1 bg-warning/10 border border-warning/20 text-warning rounded-sm text-[10px] font-black uppercase tracking-widest">
                                Protocol V4
                            </span>
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="flex h-2 w-2 rounded-full bg-success animate-pulse" />
                            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-neutral-500">Live Ledger Active</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-main rounded-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all text-xs font-bold shadow-sm uppercase tracking-widest">
                            <FileText className="w-4 h-4 text-warning" /> Draft Estimate
                        </button>
                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-warning text-white rounded-sm shadow-lg shadow-warning/20 transition-all text-xs font-black uppercase tracking-widest hover:opacity-90">
                            <Plus className="w-4 h-4" /> New Invoice
                        </button>
                    </div>
                </header>

                {/* Pipeline Stage Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {pipelineStages.map((stage, i) => {
                        const Icon = IconMap[stage.iconName];
                        return (
                            <div
                                key={i}
                                onClick={() => handleTab(stage.label === 'Overdue Nodes' ? 'Draft' : stage.label.includes('Open') ? 'Unpaid' : 'All')}
                                className="card-interactive p-6 relative overflow-hidden group cursor-pointer bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm"
                            >
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div className={`p-3 rounded-sm ${stage.bg} ${stage.color} border border-current/10`}>
                                        {Icon && <Icon className="w-5 h-5" />}
                                    </div>
                                    <span className="text-2xl font-display font-black text-main tabular-nums tracking-tighter">{stage.val}</span>
                                </div>
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">{stage.label}</p>
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <p className={`text-xl font-black tracking-tighter ${stage.color}`}>{stage.amount}</p>
                                        <div className="flex items-center gap-0.5 text-[10px] font-bold text-success">
                                            <TrendingUp className="w-3 h-3" /> 12%
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-current/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                            </div>
                        );
                    })}
                </div>

                {/* Toolbar */}
                <div className="bg-white dark:bg-neutral-900 rounded-sm border border-neutral-200 dark:border-neutral-800 p-5 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto items-center">
                        <div className="relative w-full md:w-96">
                            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-warning" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder="FILTER BY INVOICE / CLIENT / VALUE..."
                                className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-sm py-3 pl-12 pr-4 text-[10px] font-black tracking-widest focus:outline-none focus:border-warning/50 transition-all text-main uppercase"
                            />
                        </div>
                        <button className="h-10 px-5 w-full md:w-auto bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm text-[9px] font-black uppercase tracking-widest text-neutral-500 flex items-center justify-center gap-2 hover:text-warning transition-all">
                            <Filter className="w-4 h-4" /> Global Filters
                        </button>
                    </div>
                    <div className="flex bg-neutral-50 dark:bg-neutral-950 p-1 rounded-sm border border-neutral-200 dark:border-neutral-800 w-full md:w-auto overflow-x-auto gap-1">
                        {['All', 'Unpaid', 'Paid'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => handleTab(tab)}
                                className={`px-6 py-2 rounded-sm text-[9px] font-black uppercase tracking-widest transition-all flex-1 md:flex-none ${
                                    activeTab === tab
                                    ? 'bg-white dark:bg-neutral-900 text-warning shadow-md border border-neutral-200 dark:border-neutral-800'
                                    : 'text-neutral-400 hover:text-main'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-neutral-900 flex flex-col overflow-hidden rounded-sm border border-neutral-200 dark:border-neutral-800 shadow-sm">
                    <div className="flex-1 overflow-auto min-h-[400px]">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-neutral-50 dark:bg-neutral-950 sticky top-0 z-20 border-b border-neutral-200 dark:border-neutral-800">
                                <tr>
                                    <th onClick={() => handleSort('id')} className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-neutral-400 cursor-pointer hover:text-warning transition-colors select-none">
                                        Deployment Node <SortIcon field="id" />
                                    </th>
                                    <th onClick={() => handleSort('date')} className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-neutral-400 cursor-pointer hover:text-warning transition-colors select-none">
                                        Timestamp <SortIcon field="date" />
                                    </th>
                                    <th onClick={() => handleSort('client')} className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-neutral-400 cursor-pointer hover:text-warning transition-colors select-none">
                                        Client Entity <SortIcon field="client" />
                                    </th>
                                    <th onClick={() => handleSort('amount')} className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-neutral-400 text-right cursor-pointer hover:text-warning transition-colors select-none">
                                        Throughput <SortIcon field="amount" />
                                    </th>
                                    <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-neutral-400 text-center">Protocol State</th>
                                    <th className="px-8 py-5 w-24" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {pageRecords.length > 0 ? (
                                    pageRecords.map((inv, idx) => (
                                        <tr key={idx} className="hover:bg-warning/[0.02] transition-all group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-sm bg-warning/10 border border-warning/20 flex items-center justify-center">
                                                        <FileText className="w-5 h-5 text-warning" />
                                                    </div>
                                                    <span className="font-mono text-sm font-black text-main group-hover:text-warning transition-colors cursor-pointer tracking-tighter uppercase">{inv.id}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="text-xs font-black text-main uppercase tracking-tight">{inv.date}</div>
                                                <div className="text-[9px] text-neutral-400 font-black uppercase tracking-widest mt-1 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> DUE: {inv.due}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="text-sm font-black text-main group-hover:translate-x-1 transition-transform inline-block uppercase tracking-tight">{inv.client}</div>
                                                <div className="text-[9px] text-neutral-400 font-black uppercase tracking-widest mt-1 flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-warning inline-block" /> INSTITUTIONAL
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="text-lg font-display font-black tracking-tighter text-main tabular-nums uppercase">₹{inv.amount.toLocaleString()}</div>
                                                <div className="text-[8px] text-success font-black uppercase tracking-widest mt-1">+ GST INCLUDED</div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex justify-center">
                                                    <span className={`px-4 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${
                                                        inv.status === 'Paid'    ? 'bg-success/10 text-success border-success/30' :
                                                        'bg-warning/10 text-warning border-warning/30'
                                                    }`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full ${
                                                            inv.status === 'Paid' ? 'bg-success shadow-[0_0_8px_rgba(34,197,94,0.4)]' :
                                                            'bg-warning shadow-[0_0_8px_rgba(234,179,8,0.4)]'
                                                        }`} />
                                                        {inv.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button className="p-2 text-neutral-400 hover:text-warning transition-all"><Download className="w-5 h-5" /></button>
                                                    <button className="p-2 text-neutral-400 hover:text-warning transition-all"><Printer className="w-5 h-5" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center bg-neutral-50/50 dark:bg-neutral-950/50">
                                            <div className="flex flex-col items-center gap-6">
                                                <div className="p-8 bg-white dark:bg-neutral-900 rounded-sm border border-neutral-200 dark:border-neutral-800 shadow-xl">
                                                    <Search className="w-12 h-12 text-neutral-200 animate-pulse" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-black text-main uppercase tracking-widest">No Node Data Found</h3>
                                                    <p className="text-xs text-neutral-500 mt-2 font-bold uppercase tracking-widest italic opacity-60">Refine global filters or adjust search parameters.</p>
                                                </div>
                                                <button
                                                    onClick={() => { setSearchTerm(''); setActiveTab('All'); setCurrentPage(1); }}
                                                    className="mt-2 px-8 py-3 bg-warning text-white text-[10px] font-black uppercase tracking-widest rounded-sm hover:opacity-90 shadow-lg shadow-warning/20 transition-all"
                                                >
                                                    Reset Protocol Filters
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="p-5 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-6">
                            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                                Node Records <span className="text-main">{pageRecords.length === 0 ? 0 : pageStart + 1}–{Math.min(pageEnd, filteredInvoices.length)}</span> // TOTAL <span className="text-main">{filteredInvoices.length}</span>
                            </p>
                            <div className="h-1 w-24 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                                <div className="h-full bg-warning transition-all duration-300 rounded-full"
                                    style={{ width: `${filteredInvoices.length === 0 ? 0 : (Math.min(pageEnd, filteredInvoices.length) / filteredInvoices.length) * 100}%` }}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => goToPage(safePage - 1)}
                                disabled={safePage === 1}
                                className="h-10 px-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm text-[9px] font-black uppercase tracking-widest text-neutral-500 disabled:opacity-20 hover:text-warning transition-all flex items-center gap-2 shadow-sm"
                            >
                                <ChevronLeft className="w-4 h-4" /> Prev
                            </button>

                            <div className="flex items-center gap-1 mx-2">
                                {pageButtons.map((p, i) =>
                                    p === '...' ? (
                                        <span key={`ellipsis-${i}`} className="px-2 text-neutral-400 text-xs">…</span>
                                    ) : (
                                        <button
                                            key={p}
                                            onClick={() => goToPage(p as number)}
                                            className={`w-10 h-10 rounded-sm text-[10px] font-black transition-all border ${
                                                safePage === p
                                                    ? 'bg-warning text-white border-warning shadow-lg shadow-warning/20'
                                                    : 'bg-white dark:bg-neutral-900 text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:text-warning'
                                            }`}
                                        >
                                            {p}
                                        </button>
                                    )
                                )}
                            </div>

                            <button
                                onClick={() => goToPage(safePage + 1)}
                                disabled={safePage === totalPages}
                                className="h-10 px-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm text-[9px] font-black uppercase tracking-widest text-neutral-500 disabled:opacity-20 hover:text-warning transition-all flex items-center gap-2 shadow-sm"
                            >
                                Next <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest opacity-50 hidden lg:block italic">
                            Buffer: {PAGE_SIZE} nodes / page
                        </p>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default SalesMockUI;
