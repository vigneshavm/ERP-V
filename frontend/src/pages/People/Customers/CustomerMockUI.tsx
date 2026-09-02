import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, UserPlus, Phone, Mail, Briefcase, ChevronRight, Zap } from 'lucide-react';
import { customers, salesInvoices, MockCustomer, MockSalesInvoice } from '../../../data';
import Layout from '../../../components/shared/Layout';

const CustomerMockUI: React.FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');

    // Process customer data with invoice stats
    const customersWithStats = useMemo(() => {
        return (customers as MockCustomer[]).map(c => {
            const customerInvoices = (salesInvoices as MockSalesInvoice[]).filter(inv => inv.customer_id === c.id);
            const totalSpent = customerInvoices.reduce((sum, inv) => sum + inv.total, 0);
            return {
                ...c,
                totalSpent,
                orderCount: customerInvoices.length,
                recentInvoices: customerInvoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)
            };
        });
    }, []);

    const filteredCustomers = useMemo(() => {
        return customersWithStats.filter(c => 
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            c.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [customersWithStats, searchQuery]);

    const activeCustomer = useMemo(() => {
        return customersWithStats.find(c => c.id === selectedCustomerId) || customersWithStats[0];
    }, [customersWithStats, selectedCustomerId]);

    return (
        <Layout>
            <div className="flex-1 w-full bg-app text-main font-sans selection:bg-indigo-500/30 relative">
                {/* Ambient Background */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[10%] left-[20%] w-[60%] h-[40%] bg-primary/10 rounded-full blur-[150px]" />
                    <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[150px]" />
                </div>

                <div className="relative z-10 flex h-full overflow-hidden">
                    <main className="flex-1 flex flex-col h-full overflow-hidden">
                        {/* Header */}
                        <header className="h-24 px-10 flex items-center justify-between border-b border-default bg-slate-900/20 backdrop-blur-md">
                            <div>
                                <h1 className="text-3xl font-black tracking-tight text-main flex items-center gap-3">
                                    Client <span className="text-primary">Directory</span>
                                    <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] uppercase tracking-widest font-black">CRM Protocol V2</span>
                                </h1>
                                <p className="text-sm text-secondary mt-1 font-medium tracking-wide">Unified Customer Intelligence Layer // {customers.length} Entities</p>
                            </div>
                            <div className="flex gap-4 items-center">
                                <div className="relative group">
                                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-primary transition-colors" />
                                    <input 
                                        type="text" 
                                        placeholder="Search registry..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-72 glass-panel border border-default rounded-xl py-3 pl-12 pr-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-main placeholder:text-slate-600"
                                    />
                                </div>
                                <button className="h-11 px-6 bg-indigo-600 hover:bg-indigo-500 text-main font-bold text-sm tracking-wide rounded-xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] flex items-center gap-2 uppercase tracking-widest">
                                    <UserPlus className="w-4 h-4" /> Add Client
                                </button>
                            </div>
                        </header>

                        <div className="flex-1 flex overflow-hidden">
                            {/* List Section */}
                            <div className="w-1/3 border-r border-default flex flex-col bg-slate-900/10">
                                <div className="p-6 border-b border-default flex justify-between items-center">
                                    <h2 className="text-[10px] font-black uppercase tracking-widest text-muted">Master Registry ({filteredCustomers.length})</h2>
                                    <button className="text-muted hover:text-main transition-colors">
                                        <Filter className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                    {filteredCustomers.map((customer) => (
                                        <div 
                                            key={customer.id} 
                                            onClick={() => setSelectedCustomerId(customer.id)}
                                            className={`p-4 rounded-sm border transition-all cursor-pointer group flex items-center gap-4 ${selectedCustomerId === customer.id ? 'bg-card border-primary/30 shadow-lg' : 'bg-slate-900/30 border-default hover:bg-card/40'}`}
                                        >
                                            <div className="relative">
                                                <div className="w-12 h-12 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-400">
                                                    {customer.name.charAt(0)}
                                                </div>
                                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-main truncate">{customer.name}</h3>
                                                <p className="text-[10px] text-secondary font-mono truncate uppercase tracking-tighter">{customer.email}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded flex items-center gap-1 mb-1 bg-primary/10 text-primary`}>
                                                    {customer.sector}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Detail Section */}
                            <div className="flex-1 flex flex-col overflow-y-auto p-10 relative custom-scrollbar">
                                {activeCustomer && (
                                    <>
                                        {/* Profile Hero */}
                                        <div className="flex items-start gap-8 mb-12 relative z-10">
                                            <div className="w-32 h-32 rounded-sm bg-indigo-500/10 border-4 border-default flex items-center justify-center text-5xl font-black text-indigo-500 shadow-2xl">
                                                {activeCustomer.name.charAt(0)}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-4 mb-2">
                                                    <h2 className="text-4xl font-black text-main tracking-tight">{activeCustomer.name}</h2>
                                                    <span className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                                                        <Zap className="w-3 h-3" /> {activeCustomer.tier || 'Gold'} Member
                                                    </span>
                                                </div>
                                                <p className="text-muted font-mono mb-6 uppercase tracking-widest text-xs">Customer ID: {activeCustomer.id}</p>
                                                
                                                <div className="flex gap-4">
                                                    <button className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-default rounded-sm text-xs font-bold text-main transition-colors flex items-center gap-2 uppercase tracking-widest">
                                                        <Mail className="w-4 h-4" /> Message
                                                    </button>
                                                    <button className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-default rounded-sm text-xs font-bold text-main transition-colors flex items-center gap-2 uppercase tracking-widest">
                                                        <Phone className="w-4 h-4" /> {activeCustomer.phone}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-3 gap-6 mb-12 relative z-10">
                                            <div className="glass-panel border border-default rounded-sm p-6 backdrop-blur-sm hover:bg-card/40 transition-colors">
                                                <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">Total Lifecycle Value</p>
                                                <p className="text-3xl font-black text-main mb-1">₹{activeCustomer.totalSpent.toLocaleString()}</p>
                                                <p className="text-xs text-primary font-medium">{activeCustomer.orderCount} Orders Processed</p>
                                            </div>
                                            <div className="glass-panel border border-default rounded-sm p-6 backdrop-blur-sm hover:bg-card/40 transition-colors">
                                                <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">Credit Utilization</p>
                                                <p className="text-3xl font-black text-main mb-1">₹{activeCustomer.creditBalance.toLocaleString()}</p>
                                                <p className="text-xs text-warning font-medium">Limit: ₹{activeCustomer.creditLimit.toLocaleString()}</p>
                                            </div>
                                            <div className="glass-panel border border-default rounded-sm p-6 backdrop-blur-sm hover:bg-card/40 transition-colors">
                                                <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">Risk Factor</p>
                                                <p className={`text-3xl font-black mb-1 ${activeCustomer.riskScore === 'LOW' ? 'text-success' : 'text-warning'}`}>{activeCustomer.riskScore}</p>
                                                <p className="text-xs text-secondary font-medium">Auto-Calculated V2</p>
                                            </div>
                                        </div>

                                        {/* Recent Activity */}
                                        <div className="relative z-10">
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="text-xs font-black uppercase tracking-widest text-muted">Recent Synchronized Invoices</h3>
                                                <button 
                                                    onClick={() => navigate('/sales/invoice')}
                                                    className="text-xs font-bold text-primary hover:underline uppercase tracking-widest"
                                                >
                                                    View All
                                                </button>
                                            </div>
                                            <div className="glass-panel border border-default rounded-sm overflow-hidden backdrop-blur-sm">
                                                {activeCustomer.recentInvoices.length > 0 ? activeCustomer.recentInvoices.map((inv, __i) => (
                                                    <div 
                                                        key={inv.invoice_no} 
                                                        onClick={() => navigate(`/sales/invoice/${inv.invoice_no}`)}
                                                        className="flex items-center justify-between p-5 border-b border-default last:border-0 hover:bg-card/40 transition-colors cursor-pointer group"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-sm bg-primary/10 flex items-center justify-center text-primary">
                                                                <Briefcase className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-main">Invoice #{inv.invoice_no}</p>
                                                                <p className="text-[10px] text-secondary mt-0.5 uppercase tracking-widest">{inv.date} • {inv.status}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right flex items-center gap-4">
                                                            <span className="text-sm font-mono font-bold text-main">₹{inv.total.toLocaleString()}</span>
                                                            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-primary transition-colors" />
                                                        </div>
                                                    </div>
                                                )) : (
                                                    <div className="p-10 text-center text-secondary text-sm font-medium">No transaction history found.</div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </Layout>
    );
};

export default CustomerMockUI;

