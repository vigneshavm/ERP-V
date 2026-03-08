import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Receipt, Search, Plus, Trash2, Printer, Mail, MessageCircle,
    Calendar, User, CreditCard, Banknote, Smartphone, Building2,
    CheckCircle, AlertCircle, ChevronDown, Save, RefreshCw, Wallet,
    ShieldCheck, Zap, Activity, TrendingUp, ArrowRight, X, ChevronRight,
    ArrowUpCircle
} from 'lucide-react';
import { RootState } from "@/redux/store";
import Layout from "@/components/shared/Layout/Layout";

// Types
interface Customer {
    id: string;
    name: string;
    phone: string;
    email?: string;
    outstandingBalance: number;
    advanceBalance: number;
}

interface Invoice {
    id: string;
    invoiceNo: string;
    date: string;
    totalAmount: number;
    balanceDue: number;
    allocatedAmount: number;
}

interface PaymentMethod {
    id: string;
    method: 'CASH' | 'UPI' | 'CARD' | 'BANK' | 'CHEQUE' | 'WALLET';
    amount: number;
    reference: string;
    depositTo: string;
}

const methodConfig = {
    CASH: { label: 'Cash', icon: Banknote, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    UPI: { label: 'UPI', icon: Smartphone, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    CARD: { label: 'Card', icon: CreditCard, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    BANK: { label: 'Bank Transfer', icon: Building2, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    CHEQUE: { label: 'Cheque', icon: Receipt, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    WALLET: { label: 'Wallet', icon: Wallet, color: 'text-pink-500', bg: 'bg-pink-500/10' },
};

const depositOptions = ['Cash Counter', 'HDFC Bank - 1234', 'ICICI Bank - 5678', 'Petty Cash'];

const PaymentInCreator: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const { customers: posCustomers } = useSelector((state: RootState) => state.pos);

    const availableCustomers: Customer[] = useMemo(() => {
        return posCustomers.map((c: any) => ({
            id: c.id,
            name: c.name,
            phone: c.phone || '',
            email: c.email,
            outstandingBalance: c.outstandingBalance || c.outstanding_balance || 0,
            advanceBalance: c.advanceBalance || 0
        }));
    }, [posCustomers]);

    // State
    const [receiptNo] = useState(`SET-${Date.now().toString().slice(-6)}`);
    const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [customerSearch, setCustomerSearch] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
        { id: 'PM1', method: 'CASH', amount: 0, reference: '', depositTo: 'Cash Counter' }
    ]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isCustomerLocked, setIsCustomerLocked] = useState(false);

    // Filtered customers
    const filteredCustomers = useMemo(() => {
        if (!customerSearch) return [];
        const q = customerSearch.toLowerCase();
        return availableCustomers.filter(c =>
            c.name.toLowerCase().includes(q) || c.phone.includes(q)
        );
    }, [customerSearch, availableCustomers]);

    const selectCustomer = (c: Customer) => {
        setCustomer(c);
        // Demo invoices generator
        setInvoices([
            { id: 'INV001', invoiceNo: 'INV/2026/0001', date: '2026-01-05', totalAmount: 25000, balanceDue: 25000, allocatedAmount: 0 },
            { id: 'INV002', invoiceNo: 'INV/2026/0002', date: '2026-01-08', totalAmount: 15000, balanceDue: 10000, allocatedAmount: 0 },
        ]);
        setShowCustomerDropdown(false);
        setCustomerSearch('');
    };

    const addPaymentMethod = () => {
        setPaymentMethods([...paymentMethods, {
            id: `PM${Date.now()}`,
            method: 'CASH',
            amount: 0,
            reference: '',
            depositTo: 'Cash Counter'
        }]);
        setIsCustomerLocked(true);
    };

    const updatePaymentMethod = (id: string, field: keyof PaymentMethod, value: any) => {
        setPaymentMethods(methods => methods.map(m =>
            m.id === id ? { ...m, [field]: value } : m
        ));
        if (field === 'amount' && value > 0) setIsCustomerLocked(true);
    };

    const removePaymentMethod = (id: string) => {
        if (paymentMethods.length > 1) {
            setPaymentMethods(methods => methods.filter(m => m.id !== id));
        }
    };

    const autoAllocate = () => {
        let remaining = totalPayment;
        setInvoices(invs => invs.map(inv => {
            const allocate = Math.min(remaining, inv.balanceDue);
            remaining -= allocate;
            return { ...inv, allocatedAmount: allocate };
        }));
    };

    const totalPayment = useMemo(() => paymentMethods.reduce((sum, m) => sum + (m.amount || 0), 0), [paymentMethods]);
    const totalAllocated = useMemo(() => invoices.reduce((sum, inv) => sum + (inv.allocatedAmount || 0), 0), [invoices]);
    const advanceCreated = Math.max(0, totalPayment - totalAllocated);

    const GlassPanel = ({ children, title, icon: Icon, className = "" }: any) => (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass-panel border border-white/5 shadow-2xl overflow-hidden ${className}`}
        >
            {title && (
                <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-3">
                        {Icon && <Icon className="w-4 h-4" />}
                        {title}
                    </h3>
                    <div className="flex gap-1">
                        <div className="w-1 h-1 bg-primary/40 rounded-full"></div>
                    </div>
                </div>
            )}
            <div className="p-6">{children}</div>
        </motion.div>
    );

    return (
        <Layout>
            <div className="min-h-screen bg-app p-4 lg:p-8 relative overflow-hidden">
                {/* Visual Background Elements */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[140px] pointer-events-none -mr-48 -mt-48"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none -ml-32 -mb-32"></div>

                <div className="max-w-7xl mx-auto relative z-10 space-y-8 pb-20">
                    {/* Control Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 text-primary font-black text-[10px] uppercase tracking-[0.4em]">
                                <ShieldCheck className="w-4 h-4" />
                                Protocol: Liquidity Injection / 2036
                            </div>
                            <h1 className="text-4xl md:text-5xl font-display font-black text-main tracking-tighter uppercase">
                                Capital <span className="text-primary italic">Settlement</span>
                            </h1>
                            <p className="text-secondary text-sm font-medium opacity-60">High-precision fund allocation and industrial-grade receipting.</p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end mr-6">
                                <div className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-40">Settlement Instance</div>
                                <div className="text-xl font-display font-black text-primary tracking-tighter">{receiptNo}</div>
                            </div>
                            <button className="px-10 py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl shadow-primary/40 hover:bg-primary-hover hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-4">
                                <Save className="w-5 h-5 shadow-inner" />
                                Commit Settlement
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* LEFT: Configuration & Methods */}
                        <div className="lg:col-span-8 space-y-8">
                            <div className="grid md:grid-cols-2 gap-8">
                                {/* Entity Selection */}
                                <GlassPanel title="Counterparty Identification" icon={User} className="h-full">
                                    {customer ? (
                                        <div className="space-y-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-14 h-14 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center text-primary font-black text-xl">
                                                        {customer.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="text-xl font-display font-black text-main uppercase tracking-tight">{customer.name}</div>
                                                        <div className="text-[10px] font-bold text-secondary/60 uppercase tracking-widest mt-1 italic">{customer.phone}</div>
                                                    </div>
                                                </div>
                                                {!isCustomerLocked && (
                                                    <button onClick={() => setCustomer(null)} className="p-2 hover:bg-rose-500/10 rounded-lg text-rose-500 transition-colors">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-xl">
                                                    <div className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1">Liability Exposure</div>
                                                    <div className="text-lg font-display font-black text-main tracking-tighter">₹{customer.outstandingBalance.toLocaleString()}</div>
                                                </div>
                                                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                                                    <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Advance Reserve</div>
                                                    <div className="text-lg font-display font-black text-main tracking-tighter">₹{customer.advanceBalance.toLocaleString()}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                            <div className="relative pt-2 group/search">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40 group-focus-within/search:text-primary transition-colors" />
                                                <input
                                                    type="text"
                                                    placeholder="Scan for counterparty hash or label..."
                                                    value={customerSearch}
                                                    onChange={e => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); }}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-main focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all"
                                                />
                                                <AnimatePresence>
                                                    {showCustomerDropdown && filteredCustomers.length > 0 && (
                                                        <motion.div 
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: 10 }}
                                                            className="absolute top-full left-0 right-0 mt-3 bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-20 backdrop-blur-xl"
                                                        >
                                                            {filteredCustomers.map(c => (
                                                                <button
                                                                    key={c.id}
                                                                    onClick={() => selectCustomer(c)}
                                                                    className="w-full h-20 px-6 flex items-center justify-between hover:bg-primary/10 transition-colors border-b border-white/5 last:border-0 group"
                                                                >
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-xs font-black text-secondary group-hover:text-primary transition-colors">
                                                                            {c.name.charAt(0)}
                                                                        </div>
                                                                        <div className="text-left">
                                                                            <div className="text-xs font-black text-main uppercase tracking-tight group-hover:text-primary transition-colors">{c.name}</div>
                                                                            <div className="text-[9px] font-bold text-secondary/40 uppercase tracking-widest">{c.phone}</div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <div className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-0.5">Exposure</div>
                                                                        <div className="text-sm font-black text-main tracking-tighter">₹{c.outstandingBalance.toLocaleString()}</div>
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                    )}
                                </GlassPanel>

                                {/* Temporal Context */}
                                <GlassPanel title="Protocol Temporal Markers" icon={Calendar} className="h-full">
                                    <div className="space-y-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-secondary uppercase tracking-widest">Injection Date</label>
                                            <input 
                                                type="date" 
                                                value={receiptDate}
                                                onChange={e => setReceiptDate(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-main focus:outline-none focus:border-primary/40"
                                            />
                                        </div>
                                        <div className="p-4 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                                    <Activity className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-black text-main uppercase">Injection Verified</div>
                                                    <div className="text-[9px] font-bold text-secondary/40 uppercase tracking-widest">By: {user?.name || 'Protocol Admin'}</div>
                                                </div>
                                            </div>
                                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                                        </div>
                                    </div>
                                </GlassPanel>
                            </div>

                            {/* Liquidity Channels */}
                            <GlassPanel title="Injection Channels" icon={Zap}>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="text-[10px] font-black text-secondary uppercase tracking-[0.3em]">Operational Channels</div>
                                        <button onClick={addPaymentMethod} className="px-6 py-2 bg-white/5 border border-white/10 hover:border-primary/40 rounded-xl transition-all flex items-center gap-2 group">
                                            <Plus className="w-4 h-4 text-primary group-hover:scale-125 transition-transform" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-secondary group-hover:text-main">Add Channel</span>
                                        </button>
                                    </div>

                                    <div className="grid gap-4">
                                        <AnimatePresence mode="popLayout">
                                            {paymentMethods.map((pm, idx) => {
                                                const config = methodConfig[pm.method];
                                                const Icon = config.icon;
                                                return (
                                                    <motion.div 
                                                        layout
                                                        key={pm.id}
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        className="grid lg:grid-cols-12 gap-4 items-center p-4 bg-white/5 border border-white/5 rounded-2xl group hover:bg-white-[0.07] transition-all"
                                                    >
                                                        <div className="lg:col-span-3">
                                                            <div className="relative">
                                                                <select 
                                                                    value={pm.method}
                                                                    onChange={e => updatePaymentMethod(pm.id, 'method', e.target.value)}
                                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-black text-main focus:outline-none focus:border-primary/40 appearance-none"
                                                                >
                                                                    {Object.entries(methodConfig).map(([key, val]) => (
                                                                        <option key={key} value={key} className="bg-neutral-900">{val.label}</option>
                                                                    ))}
                                                                </select>
                                                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.color.replace('text', 'bg')} rounded-l-xl`}></div>
                                                            </div>
                                                        </div>
                                                        <div className="lg:col-span-3">
                                                            <div className="relative">
                                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-secondary/40">₹</span>
                                                                <input
                                                                    type="number"
                                                                    placeholder="Magnitude"
                                                                    value={pm.amount || ''}
                                                                    onChange={e => updatePaymentMethod(pm.id, 'amount', parseFloat(e.target.value) || 0)}
                                                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm font-black text-main focus:outline-none focus:border-primary/40"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="lg:col-span-3">
                                                            <input
                                                                type="text"
                                                                placeholder="Reference Hash..."
                                                                value={pm.reference}
                                                                onChange={e => updatePaymentMethod(pm.id, 'reference', e.target.value)}
                                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] font-bold text-secondary/60 focus:outline-none focus:border-primary/40 placeholder:opacity-20"
                                                            />
                                                        </div>
                                                        <div className="lg:col-span-2">
                                                            <select
                                                                value={pm.depositTo}
                                                                onChange={e => updatePaymentMethod(pm.id, 'depositTo', e.target.value)}
                                                                className="w-full bg-transparent border-none focus:ring-0 text-[10px] font-black text-primary uppercase tracking-widest cursor-pointer"
                                                            >
                                                                {depositOptions.map(opt => (
                                                                    <option key={opt} value={opt} className="bg-neutral-900">{opt}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div className="lg:col-span-1 flex justify-end">
                                                            {paymentMethods.length > 1 && (
                                                                <button onClick={() => removePaymentMethod(pm.id)} className="p-3 bg-rose-500/5 hover:bg-rose-500/20 rounded-xl text-rose-500 transition-all group/del">
                                                                    <Trash2 className="w-4 h-4 group-hover/del:scale-110" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </AnimatePresence>
                                        
                                        <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex justify-between items-center mt-2 overflow-hidden relative group">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] -mr-16 -mt-16 group-hover:bg-emerald-500/20 transition-all"></div>
                                            <div className="flex items-center gap-4 relative z-10">
                                                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                                                    <TrendingUp className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Total Injection</div>
                                                    <div className="text-[9px] font-bold text-secondary/40 uppercase tracking-widest">Aggregated Channel Magnitude</div>
                                                </div>
                                            </div>
                                            <div className="text-3xl font-display font-black text-main tracking-tighter relative z-10">
                                                ₹{totalPayment.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </GlassPanel>
                        </div>

                        {/* RIGHT: Allocation Logic */}
                        <div className="lg:col-span-4 space-y-8">
                            <GlassPanel title="Protocol Allocation" icon={Receipt} className="sticky top-8">
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">Liability Lattice</div>
                                        {customer && invoices.length > 0 && (
                                            <button 
                                                onClick={autoAllocate} 
                                                className="px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-lg text-[9px] font-black text-primary uppercase tracking-widest hover:bg-primary/20 transition-all"
                                            >
                                                Auto-Settle
                                            </button>
                                        )}
                                    </div>

                                    <div className="space-y-3 min-h-[300px]">
                                        {!customer ? (
                                            <div className="flex flex-col items-center justify-center py-20 opacity-20">
                                                <User className="w-12 h-12 mb-4" />
                                                <div className="text-[10px] font-black uppercase tracking-widest">Awaiting Entity</div>
                                            </div>
                                        ) : invoices.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-20 opacity-40">
                                                <CheckCircle className="w-12 h-12 mb-4 text-emerald-500" />
                                                <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest text-center">Protocol Ideal:<br/>Zero Exposure</div>
                                            </div>
                                        ) : (
                                            <AnimatePresence>
                                                {invoices.map(inv => (
                                                    <motion.div 
                                                        initial={{ opacity: 0, x: 20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        className="p-4 bg-white/5 border border-white/5 rounded-2xl group hover:border-primary/20 transition-all"
                                                        key={inv.id}
                                                    >
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div>
                                                                <div className="text-[10px] font-black text-primary uppercase tracking-tight">{inv.invoiceNo}</div>
                                                                <div className="text-[9px] font-bold text-secondary/40 uppercase tracking-widest">{inv.date}</div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-[10px] font-black text-main tracking-tighter">₹{inv.totalAmount.toLocaleString()}</div>
                                                                <div className="text-[9px] font-bold text-rose-500/60 uppercase tracking-widest">Due: ₹{inv.balanceDue.toLocaleString()}</div>
                                                            </div>
                                                        </div>
                                                        <div className="relative pt-2">
                                                            <input
                                                                type="number"
                                                                placeholder="Allocate..."
                                                                value={inv.allocatedAmount || ''}
                                                                onChange={e => {
                                                                    const val = parseFloat(e.target.value) || 0;
                                                                    setInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, allocatedAmount: Math.min(val, i.balanceDue) } : i));
                                                                }}
                                                                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-right text-xs font-black text-emerald-500 focus:outline-none focus:border-emerald-500/40 appearance-none"
                                                            />
                                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 -mt-1">
                                                                <ArrowRight className="w-3 h-3 text-emerald-500/40" />
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        )}
                                    </div>

                                    {/* Final Settlement Logic */}
                                    <div className="pt-6 border-t border-white/5 space-y-4">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-secondary/60">Total Allocated</span>
                                            <span className="text-emerald-500">₹{totalAllocated.toLocaleString()}</span>
                                        </div>
                                        {advanceCreated > 0 && (
                                            <div className="flex justify-between items-center p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                                                <div className="flex items-center gap-2">
                                                    <ArrowUpCircle className="w-4 h-4 text-blue-500" />
                                                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Surplus Reserve</span>
                                                </div>
                                                <span className="text-xs font-black text-blue-500">₹{advanceCreated.toLocaleString()}</span>
                                            </div>
                                        )}
                                        
                                        <div className="grid grid-cols-2 gap-3 pt-2">
                                            <button className="py-4 bg-white/5 border border-white/10 hover:border-primary/40 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] text-secondary hover:text-main transition-all flex items-center justify-center gap-2">
                                                <Printer className="w-4 h-4" /> Receipt
                                            </button>
                                            <button className="py-4 bg-white/5 border border-white/10 hover:border-emerald-500/40 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] text-secondary hover:text-main transition-all flex items-center justify-center gap-2">
                                                <Smartphone className="w-4 h-4" /> UPI TRACE
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </GlassPanel>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.01); }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--color-primary-rgb), 0.2); border-radius: 20px; }
                select option { background-color: #0a0a0a; color: white; }
                input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
            `}</style>
        </Layout>
    );
};

export default PaymentInCreator;
