import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calculator, 
  FileText, 
  User, 
  Search, 
  X, 
  Phone, 
  AlertCircle, 
  CheckCircle,
  Plus,
  Minus,
  Trash2,
  Printer,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  CreditCard,
  History,
  Zap,
  Activity,
  Terminal,
  ShieldCheck,
  Target,
  BarChart3
} from 'lucide-react';
import { toast } from "react-toastify";

import { getAllItems } from "../../../redux/slices/inventorySlice";
import { getAllCustomers } from "../../../redux/slices/customerSlice";
import Layout from "../../../components/shared/Layout/Layout";
import api from "../../../services/api";
import EstimateTemplate from "../../../components/sales/EstimateTemplate";
import { RootState } from "../../../redux/store";
import { Customer } from "../../../types/sales";
import { Product } from "../../../types/product";

interface CartItem {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

const Estimate = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Redux State
  const { items = [] } = useSelector((state: RootState) => state.inventory) || {};
  const { customers = [] } = useSelector((state: RootState) => state.customers) || {};

  // Form State
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    dispatch(getAllItems() as any);
    dispatch(getAllCustomers() as any);
  }, [dispatch]);

  // Derived State
  const filteredItems = useMemo(() => items.filter(
    (item: Product) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  ), [items, searchTerm]);

  const filteredCustomers = useMemo(() => customers.filter(
    (c: Customer) =>
      c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
      c.phone.includes(customerSearchTerm)
  ), [customers, customerSearchTerm]);

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.total, 0), [cart]);
  const total = useMemo(() => Math.max(0, subtotal - discount), [subtotal, discount]);

  // Cart Management
  const addToCart = (item: Product) => {
    const existingIndex = cart.findIndex((cartItem) => cartItem.itemId === item._id);

    if (existingIndex > -1) {
      const newCart = [...cart];
      newCart[existingIndex] = {
        ...newCart[existingIndex],
        quantity: newCart[existingIndex].quantity + 1,
        total: (newCart[existingIndex].quantity + 1) * (item.sellingPrice || 0),
      };
      setCart(newCart);
    } else {
      setCart([
        ...cart,
        {
          itemId: item._id || '',
          name: item.name,
          quantity: 1,
          price: item.sellingPrice || 0,
          total: item.sellingPrice || 0,
        },
      ]);
    }
  };

  const updateQuantity = (itemId: string, delta: number) => {
    const newItems = cart.map(item => {
      if (item.itemId === itemId) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty, total: newQty * item.price };
      }
      return item;
    }).filter(item => item.quantity > 0);
    setCart(newItems);
  };

  const handleSaveEstimate = async () => {
    if (!customer) {
      toast.warning("Entity Resolution Required: Please select a registered customer.");
      setShowCustomerSelect(true);
      return;
    }

    if (cart.length === 0) {
      toast.error("Protocol Error: Asset matrix cannot be empty.");
      return;
    }

    setIsLoading(true);

    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Authentication failure");
      const user = JSON.parse(userStr);

      const estimateData = {
        customerId: customer._id || customer.id,
        items: cart,
        subtotal,
        discount,
        totalAmount: total,
        notes,
      };

      const response = await api.post(`/api/estimates`, estimateData, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      toast.success("Synthesis Complete: Quotation synchronized");
      navigate(`/sales/estimate/${response.data.estimate._id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lattice Sync Failure");
    } finally {
      setIsLoading(false);
    }
  };

  const clearMatrix = () => {
    if (cart.length > 0) {
      setCart([]);
      setDiscount(0);
      setNotes("");
    }
  };

  // Rendering Helpers
  const GlassCard = ({ children, className = "", title, icon: Icon, action }: any) => (
    <div className={`glass-panel border border-white/5 shadow-2xl overflow-hidden flex flex-col group/card ${className}`}>
      {title && (
        <div className="px-8 py-5 border-b border-white/5 bg-white/5 flex items-center justify-between">
          <h2 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 group-hover/card:border-indigo-500/40 transition-all">
                {Icon && <Icon className="w-4 h-4 text-indigo-500" />}
            </div>
            {title}
          </h2>
          {action}
        </div>
      )}
      <div className="p-8 h-full flex flex-col">{children}</div>
    </div>
  );

  return (
    <Layout>
      <div className="min-h-screen bg-app p-4 lg:p-8 relative overflow-hidden">
        {/* Background High-Fidelity Accents */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[160px] pointer-events-none -mr-48 -mt-48 opacity-40"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none -ml-32 -mb-32 opacity-20"></div>

        <div className="max-w-7xl mx-auto relative z-10 space-y-10">
          {/* Master Tactical Header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3 text-indigo-500 font-black text-[10px] uppercase tracking-[0.5em]">
                <Terminal className="w-4 h-4" />
                Operational Engine: 2036.SYNTHESIS
              </div>
              <h1 className="text-5xl md:text-6xl font-display font-black text-main tracking-tighter uppercase leading-none">
                Quotation <br />
                <span className="text-secondary italic">Synthesis Engine</span>
              </h1>
              <p className="text-secondary/60 text-xs font-medium uppercase tracking-widest flex items-center gap-3">
                Architect high-precision commercial projections
                <span className="w-1 h-1 bg-indigo-500/40 rounded-full"></span>
                v4.0.2 LATTICE
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4"
            >
              <button
                onClick={() => navigate("/sales/estimates")}
                className="group px-8 py-4 glass-panel border border-white/10 hover:border-indigo-500/30 text-main flex items-center gap-4 transition-all"
              >
                <History className="w-5 h-5 text-indigo-500 group-hover:rotate-[-45deg] transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest text-secondary group-hover:text-main">Registry</span>
              </button>
              <button
                onClick={() => navigate("/sales")}
                className="group px-8 py-4 glass-panel border border-white/10 hover:border-white/20 text-main flex items-center gap-4 transition-all"
              >
                <ArrowLeft className="w-5 h-5 text-white/40 group-hover:-translate-x-1 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest text-secondary group-hover:text-main">Terminal</span>
              </button>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 print:hidden pb-32">
            {/* CORE OPERATIONAL AREA */}
            <div className="lg:col-span-8 space-y-10">
              {/* Entity Identification Matrix */}
              <GlassCard title="Entity Identification Protocol" icon={User}>
                {!customer ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowCustomerSelect(true)}
                    className="w-full h-32 border-2 border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 group hover:border-indigo-500/40 bg-white/[0.02] transition-all relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/5 transition-colors"></div>
                    <User className="w-8 h-8 text-indigo-500/20 group-hover:text-indigo-500 transition-all group-hover:scale-110" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-secondary/40 group-hover:text-indigo-400 Transition-colors">Resolve Commercial Counterparty</span>
                  </motion.button>
                ) : (
                  <div className="flex flex-col md:flex-row items-center gap-10 relative">
                    <div className="flex-1 space-y-6 w-full">
                      <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white font-black text-3xl font-display italic shadow-[0_0_40px_rgba(79,70,229,0.3)] border border-white/20">
                          {customer.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="space-y-2">
                          <div className="text-3xl font-display font-black text-white uppercase tracking-tight leading-none">{customer.name}</div>
                          <div className="flex items-center gap-4 text-[10px] font-bold text-secondary/60 uppercase tracking-widest">
                            <div className="flex items-center gap-2">
                                <Phone className="w-3.5 h-3.5 text-indigo-500" /> {customer.phone}
                            </div>
                            <div className="w-1 h-1 bg-white/10 rounded-full"></div>
                            <div className="flex items-center gap-2">
                                <Activity className="w-3.5 h-3.5 text-emerald-500 animate-pulse" /> Commercial Link Active
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setCustomer(null)}
                        className="group flex items-center gap-3 px-4 py-2 bg-rose-500/5 border border-rose-500/20 rounded-full text-[9px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all w-fit"
                      >
                        <X className="w-3 h-3 group-hover:rotate-90 transition-transform" /> Reset Resolution
                      </button>
                    </div>

                    <div className="w-full md:w-auto min-w-[300px]">
                      {customer.dues !== 0 && (
                        <div className={`p-8 rounded-[2.5rem] border relative overflow-hidden group/dues ${customer.dues < 0 ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-rose-500/5 border-rose-500/10'}`}>
                          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover/dues:scale-125 transition-transform">
                             {customer.dues < 0 ? <TrendingUp className="w-20 h-20" /> : <AlertCircle className="w-20 h-20" />}
                          </div>
                          <div className="space-y-4 relative z-10">
                            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary/40">Financial Integrity Status</div>
                            <div className="space-y-1">
                                <div className={`text-3xl font-display font-black tracking-tighter tabular-nums ${customer.dues < 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                ₹{Math.abs(customer.dues).toLocaleString()}
                                </div>
                                <div className={`text-[9px] font-black uppercase tracking-[0.2em] ${customer.dues < 0 ? 'text-emerald-500/60' : 'text-rose-500/60'}`}>
                                {customer.dues < 0 ? 'Credit Allocation Positive' : 'Outstanding Liability Found'}
                                </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </GlassCard>

              {/* Asset Catalog Matrix */}
              <GlassCard title="Asset Matrix Selection" icon={Search} action={
                <div className="flex gap-2">
                   <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[8px] font-black text-secondary uppercase tracking-widest flex items-center gap-2">
                      <Target className="w-3 h-3 text-indigo-500" /> High-Resolution Mode
                   </div>
                </div>
              }>
                <div className="relative mb-10 group/search">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-indigo-500/40 group-focus-within/search:text-indigo-500 transition-all" />
                  <input
                    type="text"
                    placeholder="SCAN OR SEARCH ASSET CATALOG PROTOCOL..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 pl-16 pr-8 text-[11px] font-black tracking-[0.3em] text-main placeholder:text-secondary/20 focus:outline-none focus:border-indigo-500/40 focus:ring-8 focus:ring-indigo-500/5 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-h-[600px] overflow-y-auto custom-scrollbar pr-4">
                  <AnimatePresence mode="popLayout">
                    {filteredItems.map((item, idx) => (
                      <motion.button
                        layout
                        key={item._id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        whileHover={{ y: -6, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => addToCart(item)}
                        className="p-6 bg-white/[0.02] border border-white/5 hover:border-indigo-500/40 rounded-[2rem] text-left transition-all space-y-4 relative group overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-indigo-500/20 transition-all duration-700"></div>
                        
                        <div className="flex justify-between items-start">
                            <div className="text-[9px] font-black text-indigo-500/60 uppercase tracking-[0.3em] tabular-nums">{item.sku || 'REF_NULL'}</div>
                            <Plus className="w-4 h-4 text-white/10 group-hover:text-indigo-500 group-hover:rotate-90 transition-all" />
                        </div>
                        
                        <div className="space-y-1">
                            <div className="font-display font-black text-white text-base truncate uppercase tracking-tight group-hover:text-indigo-400 transition-colors">{item.name}</div>
                            <div className="text-[8px] font-bold text-secondary/20 uppercase tracking-[0.2em] italic">Precision Provisioned</div>
                        </div>

                        <div className="flex items-end justify-between pt-4 border-t border-white/5">
                          <div className="text-2xl font-display font-black text-white tracking-tighter tabular-nums leading-none">
                            <span className="text-xs text-secondary/40 mr-1">₹</span>
                            {item.sellingPrice?.toLocaleString()}
                          </div>
                          <div className={`text-[8px] font-black px-3 py-1 rounded-full border shadow-xl transition-all ${item.stockQty > 5 ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/5 border-rose-500/20 text-rose-500'}`}>
                            {item.stockQty} UNITS
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </AnimatePresence>
                </div>
              </GlassCard>
            </div>

            {/* SYNTHESIS INTELLIGENCE TERMINAL */}
            <div className="lg:col-span-4 space-y-10">
              <GlassCard title="Synthesis Intelligence" icon={Calculator} className="sticky top-10 bg-white/[0.01]">
                {/* Cart Matrix Hub */}
                <div className="flex-1 space-y-6 mb-10 overflow-y-auto max-h-[500px] custom-scrollbar pr-2">
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 opacity-10 space-y-6">
                      <div className="w-20 h-20 border border-dashed border-white/40 rounded-full flex items-center justify-center">
                         <Calculator className="w-10 h-10" />
                      </div>
                      <div className="text-center space-y-2">
                        <div className="text-[10px] font-black text-white uppercase tracking-[0.5em]">Synthesis Matrix IDLE</div>
                        <div className="text-[8px] font-bold text-white uppercase tracking-widest">Awaiting Asset Input Stream</div>
                      </div>
                    </div>
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {cart.map((item) => (
                        <motion.div
                          layout
                          key={item.itemId}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9, x: 20 }}
                          className="p-5 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center gap-5 group hover:bg-white/[0.05] transition-all relative"
                        >
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 group-hover:h-8 bg-indigo-500/40 transition-all rounded-r-full"></div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] font-black text-white uppercase tracking-widest truncate group-hover:text-indigo-400 transition-colors">{item.name}</div>
                            <div className="text-[9px] font-bold text-secondary/40 uppercase tracking-widest tabular-nums mt-1 italic">₹{item.price.toLocaleString()} unit scalar</div>
                          </div>
                          
                          <div className="flex items-center gap-3 bg-white/5 rounded-xl p-1 px-2 border border-white/5">
                            <button 
                              onClick={() => updateQuantity(item.itemId, -1)}
                              className="w-8 h-8 bg-white/5 hover:bg-rose-500/20 hover:text-rose-500 rounded-lg flex items-center justify-center transition-all"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-[11px] font-black text-main w-6 text-center tabular-nums">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.itemId, 1)}
                              className="w-8 h-8 bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-500 rounded-lg flex items-center justify-center transition-all"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="text-right min-w-[80px]">
                            <div className="text-sm font-display font-black text-white tabular-nums tracking-tighter">₹{item.total.toLocaleString()}</div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>

                {/* Computational Node */}
                <div className="space-y-6 pt-10 border-t border-white/5">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-secondary/40 uppercase tracking-[0.3em] italic">Tactical Rebate (₹)</label>
                      <div className="relative group/input">
                        <input 
                            type="number" 
                            value={discount}
                            onChange={(e) => setDiscount(Number(e.target.value))}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-sm font-black text-rose-500 focus:outline-none focus:border-rose-500/50 focus:ring-4 focus:ring-rose-500/5 transition-all tabular-nums"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-500/20 group-focus-within/input:text-rose-500/40 transition-colors uppercase font-black text-[9px]">-VAL</div>
                      </div>
                    </div>
                    <div className="space-y-2 text-right">
                      <div className="text-[9px] font-black text-secondary/40 uppercase tracking-[0.3em] italic">Aggregation Ref</div>
                      <div className="text-2xl font-display font-black text-white/40 tabular-nums tracking-tighter h-[52px] flex items-center justify-end">₹{subtotal.toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-secondary/40 uppercase tracking-[0.3em] italic">Quotation Scope & Annotations</label>
                    <textarea 
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="ENTER PROTOCOL ANNOTATIONS..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-[10px] font-medium text-main resize-none h-24 placeholder:text-secondary/20 focus:outline-none focus:border-indigo-500/40 focus:ring-8 focus:ring-indigo-500/5 transition-all uppercase tracking-widest"
                    />
                  </div>

                  {/* Finalized Position Card */}
                  <div className="p-10 bg-indigo-600 rounded-[2.5rem] space-y-6 relative overflow-hidden group/final shadow-[0_0_80px_rgba(79,70,229,0.3)] border border-indigo-400/30">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/20 rounded-full blur-[60px] -mr-24 -mt-24 pointer-events-none group-hover/final:scale-125 transition-transform duration-1000"></div>
                    
                    <div className="flex flex-col relative z-10 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-[11px] font-black text-white/60 uppercase tracking-[0.5em] leading-none">Net Resolution Position</span>
                            <div className="flex gap-1">
                                <Activity className="w-4 h-4 text-white/40 animate-pulse" />
                            </div>
                        </div>
                        <div className="flex items-end gap-2">
                             <span className="text-xl text-white/40 font-display italic pb-1">₹</span>
                            <p className="text-6xl font-display font-black text-white tracking-tighter tabular-nums leading-none">
                            {total.toLocaleString()}
                            </p>
                        </div>
                    </div>
                    
                    <button 
                      onClick={handleSaveEstimate}
                      disabled={isLoading || cart.length === 0}
                      className="w-full py-6 bg-white text-indigo-600 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.5em] shadow-2xl hover:scale-[1.03] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all relative z-10 overflow-hidden group/btn"
                    >
                      <div className="absolute inset-0 bg-indigo-500/5 translate-x-full group-hover/btn:translate-x-0 transition-transform"></div>
                      {isLoading ? 'SYNCING PROTOCOL...' : 'FINALIZE RESOLUTION'}
                    </button>

                    <div className="flex gap-4 relative z-10 pt-2">
                       <button 
                        onClick={() => window.print()}
                        className="flex-1 py-4 bg-white/10 hover:bg-white/20 text-white/60 hover:text-white rounded-xl flex items-center justify-center transition-all border border-white/10 group/schema"
                      >
                        <Printer className="w-4 h-4 mr-3 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Capture Schema</span>
                      </button>
                      <button 
                        onClick={clearMatrix}
                        className="p-4 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl transition-all border border-rose-500/20 group/trash"
                      >
                        <Trash2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>

        {/* ENTITY RESOLUTION MODAL */}
        <AnimatePresence mode="wait">
          {showCustomerSelect && (
            <div className="fixed inset-0 flex items-center justify-center z-[100] px-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowCustomerSelect(false)}
                className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 50 }}
                className="w-full max-w-2xl glass-panel border border-white/10 shadow-[0_0_150px_rgba(79,70,229,0.2)] overflow-hidden relative z-10"
              >
                <div className="px-10 py-8 border-b border-white/10 bg-white/5 flex items-center justify-between">
                  <div className="space-y-1">
                     <h3 className="text-[12px] font-black text-indigo-500 uppercase tracking-[0.5em] leading-none">Entity Resolution</h3>
                     <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Identifying Commercial Counterparties</p>
                  </div>
                  <button onClick={() => setShowCustomerSelect(false)} className="p-3 bg-white/5 hover:bg-rose-500/20 hover:text-rose-500 rounded-xl transition-all border border-white/10">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="p-10 space-y-10">
                  <div className="relative group/modsearch">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-indigo-500/40 group-focus-within/modsearch:text-indigo-500 transition-all" />
                    <input
                      type="text"
                      placeholder="SCAN FOR NAME OR UNIQUE CONTACT ID..."
                      value={customerSearchTerm}
                      onChange={(e) => setCustomerSearchTerm(e.target.value)}
                      autoFocus
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 pl-16 pr-8 text-[11px] font-black tracking-[0.3em] text-main placeholder:text-secondary/20 focus:outline-none focus:border-indigo-500/40 transition-all uppercase"
                    />
                  </div>

                  <div className="space-y-4 max-h-[450px] overflow-y-auto custom-scrollbar pr-4">
                    {filteredCustomers.length > 0 ? filteredCustomers.map((c, idx) => (
                      <motion.button
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        key={c._id}
                        onClick={() => {
                          setCustomer(c);
                          setShowCustomerSelect(false);
                          setCustomerSearchTerm("");
                          toast.info(`Resolution Target Locked: ${c.name}`);
                        }}
                        className="w-full p-6 bg-white/[0.02] border border-white/5 hover:border-indigo-500/40 rounded-2xl flex items-center justify-between group transition-all relative overflow-hidden"
                      >
                         <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/5 transition-colors"></div>
                        <div className="flex items-center gap-6 relative z-10">
                          <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-all font-black text-xl font-display italic border border-white/5 group-hover:border-white/20">
                            {c.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="text-left">
                            <div className="text-base font-display font-black text-white uppercase tracking-wider group-hover:text-indigo-400 transition-colors">{c.name}</div>
                            <div className="text-[10px] font-bold text-secondary/40 flex items-center gap-3 mt-1 uppercase tracking-widest leading-none">
                              <Phone className="w-3.5 h-3.5 text-indigo-500/60" /> {c.phone}
                              <div className="w-1 h-1 bg-white/10 rounded-full"></div>
                              Verified Entity
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-6 h-6 text-white/10 group-hover:text-indigo-500 group-hover:translate-x-2 transition-all" />
                      </motion.button>
                    )) : (
                        <div className="py-20 flex flex-col items-center justify-center opacity-20 space-y-6">
                            <div className="w-20 h-20 border border-dashed border-white/40 rounded-full flex items-center justify-center">
                                <User className="w-10 h-10" />
                            </div>
                            <div className="text-[10px] font-black uppercase tracking-[0.5em]">No Entity Matches Found</div>
                        </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MASTER PRINT MANIFEST */}
        <div className="hidden print:block absolute top-0 left-0 w-full z-[1000]">
          <EstimateTemplate estimate={{
            estimateNo: "DRAFT_SYNTHESIS",
            createdAt: new Date().toISOString(),
            customer,
            items: cart,
            subtotal,
            discount,
            totalAmount: total,
            notes,
            status: "INITIAL_PROJECTION",
          }} />
        </div>

        <style>{`
          @media print {
            body * { visibility: hidden; }
            .print\\:block, .print\\:block * { visibility: visible; }
            .print\\:block { 
                position: absolute; 
                left: 0; 
                top: 0; 
                width: 100% !important; 
                margin: 0 !important;
                padding: 0 !important;
            }
            .print\\:hidden { display: none !important; }
          }
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.2); border-radius: 20px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(99, 102, 241, 0.4); }
          .glass-panel { background: rgba(255, 255, 255, 0.02); backdrop-filter: blur(25px); border-radius: 2.5rem; }
          .font-display { font-family: 'Outfit', sans-serif; }
        `}</style>
      </div>
    </Layout>
  );
};

export default Estimate;
