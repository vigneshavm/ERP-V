import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Search, Plus, Download, ChevronRight, ChevronLeft, BarChart2, TrendingUp, Users, Terminal, CreditCard } from 'lucide-react';
import { salesInvoices, branches, employees, MockSalesInvoice, MockEmployee, MockBranch } from '../../data';
import Layout from '../../components/shared/Layout';

const POSOrdersIntelligenceMockUI: React.FC = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [selectedTerminal, setSelectedTerminal] = React.useState('All Terminals');
    const [selectedCashier, setSelectedCashier] = React.useState('All Cashiers');
    const [currentPage, setCurrentPage] = React.useState(1);
    const [sortField, setSortField] = React.useState<'id' | 'terminal' | 'cashier' | 'time' | 'amount' | 'status' | null>(null);
    const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('desc');
    const PAGE_SIZE = 10;

    // Filter for TEN001 (Main Tenant)
    const activeInvoices = useMemo(() => {
        return (salesInvoices as MockSalesInvoice[]).filter(inv => inv.tenant_id === 'TEN001');
    }, []);

    // Derive terminal and cashier names from core data
    const terminalsList = useMemo(() => {
        return ['All Terminals', ...(branches as MockBranch[]).filter(b => b.tenant_id === 'TEN001').map(b => b.name)];
    }, []);

    const cashiersList = useMemo(() => {
        return ['All Cashiers', ...(employees as MockEmployee[]).filter(e => e.tenant_id === 'TEN001').map(e => e.full_name)];
    }, []);

    const handleSort = (field: 'id' | 'terminal' | 'cashier' | 'time' | 'amount' | 'status') => {
        if (sortField === field) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('asc');
        }
        setCurrentPage(1);
    };

    const SortIcon = ({ field }: { field: string }) => (
        <span className={`ml-1 inline-block text-[9px] ${sortField === field ? 'text-primary' : 'text-secondary opacity-30'}`}>
            {sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
        </span>
    );

    const processedOrders = useMemo(() => {
        let list = activeInvoices.map(inv => {
            const branch = (branches as MockBranch[]).find(b => b.id === inv.branch_id);
            const cashier = (employees as MockEmployee[]).find(e => e.branch_id === inv.branch_id); // Simplified mapping
            return {
                id: inv.invoice_no,
                terminal: branch?.name || 'Main Terminal',
                cashier: cashier?.full_name || 'System User',
                time: inv.date,
                amount: inv.total,
                status: inv.status
            };
        }).filter(order => {
            const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                order.terminal.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                order.cashier.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTerminal = selectedTerminal === 'All Terminals' || order.terminal === selectedTerminal;
            const matchesCashier = selectedCashier === 'All Cashiers' || order.cashier === selectedCashier;
            return matchesSearch && matchesTerminal && matchesCashier;
        });

        if (sortField) {
            list = [...list].sort((a, b) => {
                let av: any = a[sortField as keyof typeof a];
                let bv: any = b[sortField as keyof typeof b];
                if (sortField === 'amount') { 
                    av = Number(av); 
                    bv = Number(bv); 
                }
                if (av < bv) return sortDir === 'asc' ? -1 : 1;
                if (av > bv) return sortDir === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return list;
    }, [activeInvoices, searchTerm, selectedTerminal, selectedCashier, sortField, sortDir]);

    const metrics = useMemo(() => {
        const totalVolume = processedOrders.reduce((sum, o) => sum + o.amount, 0);
        const avgTicket = processedOrders.length > 0 ? totalVolume / processedOrders.length : 0;

        return [
            { label: 'Today\'s Volume', val: `₹${totalVolume.toLocaleString()}`, icon: TrendingUp, color: 'primary', trend: '+12.4%' },
            { label: 'Avg Ticket', val: `₹${Math.round(avgTicket).toLocaleString()}`, icon: CreditCard, color: 'info', trend: '+5.2%' },
            { label: 'Active Terminals', val: `${branches.length}/4`, icon: Terminal, color: 'warning', trend: 'Nominal' },
            { label: 'Live Cashiers', val: `${employees.filter(e => e.tenant_id === 'TEN001').length}`, icon: Users, color: 'accent', trend: 'Peak' }
        ];
    }, [processedOrders]);

    const totalPages = Math.max(1, Math.ceil(processedOrders.length / PAGE_SIZE));
    const safePage = Math.min(currentPage, totalPages);
    const pageStart = (safePage - 1) * PAGE_SIZE;
    const pageEnd = pageStart + PAGE_SIZE;
    const pageRecords = processedOrders.slice(pageStart, pageEnd);

    const goToPage = (p: number) => setCurrentPage(Math.max(1, Math.min(p, totalPages)));
    const handleSearch = (v: string) => { setSearchTerm(v); setCurrentPage(1); };
    const handleTerminal = (t: string) => { setSelectedTerminal(t); setCurrentPage(1); };
    const handleCashier = (c: string) => { setSelectedCashier(c); setCurrentPage(1); };

    return (
        <Layout>
            <div className="flex-1 w-full bg-app text-main font-sans selection:bg-primary/30 relative">
                {/* Ambient Background Blobs */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-15%] left-[5%] w-[55%] h-[55%] bg-warning/10 rounded-full blur-[160px] animate-aura opacity-60" />
                    <div className="absolute bottom-[-10%] right-[5%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[140px] animate-aura opacity-50" style={{ animationDelay: '7s' }} />
                    <div className="absolute top-[40%] right-[20%] w-[25%] h-[25%] bg-accent/5 rounded-full blur-[100px] animate-aura opacity-40" style={{ animationDelay: '3s' }} />
                </div>

            <main className="relative z-10 max-w-7xl mx-auto px-6 py-10 space-y-10">
                {/* Header */}
                <header className="flex justify-between items-end">
                    <div className="relative pl-5">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--color-primary),0.5)]" />
                        <h1 className="text-3xl font-display font-black tracking-tighter text-main flex items-center gap-3">
                            POS <span className="text-primary">Orders</span>
                            <span className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary rounded-sm text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" /> Live Activity
                            </span>
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="flex h-2 w-2 rounded-full bg-success animate-pulse" />
                            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-secondary">Real-Time Transactions Tracking</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 px-5 py-2.5 rounded-sm bg-card border border-default text-xs font-black uppercase tracking-widest text-muted hover:text-main hover:border-primary/30 transition-all">
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                        <button className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-sm hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all text-xs font-black uppercase tracking-widest">
                            <BarChart2 className="w-4 h-4" /> Run Analytics
                        </button>
                    </div>
                </header>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {metrics.map((stat, i) => (
                        <div key={i} className="glass-panel border border-default rounded-sm p-6 group hover:border-primary/30 transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 bg-${stat.color}/10 text-${stat.color} rounded-sm`}>
                                    <stat.icon className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-black text-success bg-success/10 px-2 py-1 rounded-full">{stat.trend}</span>
                            </div>
                            <p className="text-3xl font-black text-main tracking-tighter mb-1">{stat.val}</p>
                            <p className="text-[10px] font-black text-secondary uppercase tracking-widest">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Active Cashiers Badge Row */}
                <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mr-2">Currently Active:</span>
                    {cashiersList.filter(c => c !== 'All Cashiers').map((name, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-accent/5 border border-accent/20 rounded-full group hover:border-accent/50 transition-all cursor-default">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                            <span className="text-[10px] font-bold text-main opacity-80">{name}</span>
                        </div>
                    ))}
                </div>

                {/* Filters & Search */}
                <div className="glass-panel p-5 rounded-sm border border-default flex flex-wrap gap-5 items-center">
                    <div className="relative flex-1 min-w-[300px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                        <input 
                            type="text" 
                            placeholder="Search receipt IDs, cashiers, or terminals..." 
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full bg-card border border-default rounded-sm py-3 pl-12 pr-4 text-xs font-bold focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all text-main placeholder:text-secondary"
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-6">
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-secondary uppercase tracking-widest shrink-0">Terminal</span>
                            <select 
                                value={selectedTerminal}
                                onChange={(e) => handleTerminal(e.target.value)}
                                className="bg-app border border-default rounded-sm px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-main focus:outline-none focus:border-primary/50 transition-all cursor-pointer"
                            >
                                {terminalsList.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-secondary uppercase tracking-widest shrink-0">Cashier</span>
                            <select 
                                value={selectedCashier}
                                onChange={(e) => handleCashier(e.target.value)}
                                className="bg-app border border-default rounded-sm px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-main focus:outline-none focus:border-primary/50 transition-all cursor-pointer"
                            >
                                {cashiersList.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Order Grid */}
                <div className="glass-panel rounded-sm border border-default overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-surface/50 sticky top-0 z-20 border-b border-default">
                                <tr>
                                    <th onClick={() => handleSort('id')} className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-secondary cursor-pointer hover:text-primary transition-colors select-none">
                                        Receipt ID <SortIcon field="id" />
                                    </th>
                                    <th onClick={() => handleSort('terminal')} className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-secondary cursor-pointer hover:text-primary transition-colors select-none">
                                        Terminal <SortIcon field="terminal" />
                                    </th>
                                    <th onClick={() => handleSort('cashier')} className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-secondary cursor-pointer hover:text-primary transition-colors select-none">
                                        Cashier <SortIcon field="cashier" />
                                    </th>
                                    <th onClick={() => handleSort('time')} className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-secondary cursor-pointer hover:text-primary transition-colors select-none">
                                        Time <SortIcon field="time" />
                                    </th>
                                    <th onClick={() => handleSort('amount')} className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-secondary text-right cursor-pointer hover:text-primary transition-colors select-none">
                                        Settlement <SortIcon field="amount" />
                                    </th>
                                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-secondary text-center">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-default">
                                {pageRecords.length > 0 ? (
                                    pageRecords.map((rec, i) => (
                                        <tr key={i} className="hover:bg-primary/[0.03] transition-all group cursor-pointer" onClick={() => navigate(`/sales/invoice/${rec.id}`)}>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center">
                                                        <CreditCard className="w-4 h-4 text-primary" />
                                                    </div>
                                                    <span className="font-mono text-sm font-bold text-main group-hover:text-primary transition-colors tracking-tighter">
                                                        {rec.id}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                                    <span className="text-sm font-medium text-main">{rec.terminal}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-sm font-bold text-main opacity-80">{rec.cashier}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="text-[10px] text-secondary font-black uppercase tracking-widest flex items-center gap-1">
                                                    {rec.time}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="text-lg font-display font-black tracking-tighter text-main tabular-nums">₹{rec.amount.toLocaleString()}</div>
                                                <div className="text-[9px] text-success font-black uppercase tracking-widest mt-1">PAID IN FULL</div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center justify-center">
                                                    <span className={`px-3 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest ${
                                                        rec.status === 'Paid' ? 'bg-success/10 border border-success/20 text-success' : 
                                                        'bg-warning/10 border border-warning/20 text-warning'
                                                    }`}>
                                                        {rec.status}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="p-4 bg-card rounded-full border border-default">
                                                    <Search className="w-8 h-8 text-muted" />
                                                </div>
                                                <p className="text-sm font-medium text-muted">No transactions found matching your criteria.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                        <div className="text-xs font-bold text-secondary">
                            Showing {pageStart + 1} to {Math.min(pageEnd, processedOrders.length)} of {processedOrders.length} entries
                        </div>
                        <div className="flex gap-1">
                            <button 
                                onClick={() => goToPage(safePage - 1)}
                                disabled={safePage === 1}
                                className="p-2 rounded-sm bg-card border border-default text-main hover:bg-surface disabled:opacity-50 transition-all"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                <button
                                    key={p}
                                    onClick={() => goToPage(p)}
                                    className={`w-8 h-8 rounded-sm text-xs font-bold transition-all ${
                                        safePage === p 
                                        ? 'bg-primary text-white shadow-sm border border-primary' 
                                        : 'bg-card border border-default text-main hover:bg-surface'
                                    }`}
                                >
                                    {p}
                                </button>
                            ))}
                            <button 
                                onClick={() => goToPage(safePage + 1)}
                                disabled={safePage === totalPages}
                                className="p-2 rounded-sm bg-card border border-default text-main hover:bg-surface disabled:opacity-50 transition-all"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
        </Layout>
    );
};

export default POSOrdersIntelligenceMockUI;

