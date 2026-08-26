import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { getAllItems } from "../../../redux/slices/inventorySlice";
import { getAllCustomers } from "../../../redux/slices/customerSlice";
import api from "../../../services/api";
import { toast } from "react-toastify";
import EstimateTemplate from "../../../components/sales/EstimateTemplate";
import { RootState } from "../../../redux/store";
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
  Trash2,
  Save,
  ArrowLeft,
  Clock,
  ChevronRight,
  ShieldCheck,
  Zap,
  Info,
  Layers,
  Globe,
  RefreshCw,
  ShoppingBag,
  Tag,
  IndianRupee,
  Minus
} from 'lucide-react';
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
  const inventoryState = useSelector((state: RootState) => state.inventory);
  const items = inventoryState?.items || [];
  const customerState = useSelector((state: RootState) => state.customers);
  const customers = customerState?.customers || [];

  // State
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

  const filteredItems = useMemo(() => {
    return items.filter(
      (item: Product) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [items, searchTerm]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(
      (c: Customer) =>
        c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
        c.phone.includes(customerSearchTerm)
    );
  }, [customers, customerSearchTerm]);

  // Cart management
  const addToCart = (item: Product) => {
    const existingItem = cart.find((cartItem) => cartItem.itemId === item._id);

    if (existingItem) {
      setCart(
        cart.map((cartItem) =>
          cartItem.itemId === item._id
            ? {
              ...cartItem,
              quantity: cartItem.quantity + 1,
              total: (cartItem.quantity + 1) * cartItem.price,
            }
            : cartItem
        )
      );
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
    toast.info(`Node ${item.name.slice(0, 10)} mapped to matrix.`, { autoClose: 1000 });
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCart(
      cart.map((cartItem) =>
        cartItem.itemId === itemId
          ? {
            ...cartItem,
            quantity: newQuantity,
            total: newQuantity * cartItem.price,
          }
          : cartItem
      )
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter((cartItem) => cartItem.itemId !== itemId));
  };

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.total, 0), [cart]);
  const total = useMemo(() => subtotal - discount, [subtotal, discount]);

  const selectCustomer = (c: Customer) => {
    setCustomer(c);
    setShowCustomerSelect(false);
    setCustomerSearchTerm("");
  };

  const handleSaveEstimate = async () => {
    if (!customer) {
      toast.warning("Critical: Customer entity path must be defined.");
      setShowCustomerSelect(true);
      return;
    }

    if (cart.length === 0) {
      toast.error("Cart matrix empty. Protocol abort.");
      return;
    }

    setIsLoading(true);

    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        toast.error("Session expired.");
        return;
      }
      const user = JSON.parse(userStr);

      const estimateData = {
        customerId: customer._id || customer.id,
        items: cart,
        subtotal,
        discount,
        totalAmount: total,
        notes,
      };

      const response = await api.post(
        `/api/estimates`,
        estimateData,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      toast.success("Estimate initialized in the system matrix.");
      navigate(`/sales/estimate/${response.data.estimate._id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Protocol initialization failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    if (cart.length > 0 && confirm("Purge cart matrix?")) {
      setCart([]);
      setDiscount(0);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white font-sans selection:bg-amber-500/30 overflow-x-hidden flex flex-col transition-colors animate-fade-in relative">
      {/* Ambient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[10%] w-[60%] h-[60%] bg-amber-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[40%] h-[40%] bg-rose-600/10 rounded-full blur-[150px]" />
      </div>

      <main className="relative z-10 flex-1 flex flex-col max-w-[1600px] w-full mx-auto px-8 py-8 space-y-8">
        {/* Modern Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="relative">
            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
            <h1 className="text-3xl font-display font-black tracking-tighter text-neutral-900 dark:text-white flex items-center gap-3">
              Proforma <span className="text-warning">Architect</span>
              <span className="px-3 py-1 bg-warning/10 border border-warning/20 text-warning rounded-lg text-xs font-bold uppercase tracking-widest">
                Valuation Node
              </span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-[10px] uppercase tracking-[0.2em] font-black text-neutral-500 dark:text-neutral-400">Ledger Pipeline Ready // Status: Drafting</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Link to="/sales/estimates" className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all text-xs font-bold shadow-sm">
              <ArrowLeft className="w-4 h-4 text-warning" /> Back to Registry
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
          {/* Left Panel: Inventory & Customer */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Section 1: Entity Mapping */}
            <div className="bg-white dark:bg-neutral-900 rounded-[32px] border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm">
               <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-warning/10 rounded-sm flex items-center justify-center text-warning">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-[0.2em]">B2B Entity Mapping</h3>
                  <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mt-1">Assign proforma recipient node</p>
                </div>
              </div>

              {customer ? (
                <div className="p-6 bg-amber-500/5 rounded-sm border border-amber-500/10 flex items-center justify-between transition-all hover:bg-warning/10">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-amber-500 rounded-sm flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
                      <User className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="font-black text-neutral-900 dark:text-white text-lg tracking-tighter">{customer.name}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-[10px] text-warning font-black uppercase tracking-widest flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {customer.phone}
                        </span>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${customer.dues > 0 ? 'text-danger' : 'text-success'}`}>
                          Dues: ₹{customer.dues.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setCustomer(null)} className="p-3 text-neutral-400 hover:text-danger hover:bg-danger/10 rounded-xl transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowCustomerSelect(true)}
                  className="w-full py-12 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-[32px] flex flex-col items-center justify-center gap-5 text-neutral-400 hover:border-amber-500/50 hover:text-warning hover:bg-amber-500/[0.02] transition-all group"
                >
                  <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-sm flex items-center justify-center group-hover:scale-110 transition-all shadow-inner">
                    <Plus className="w-8 h-8 opacity-40 group-hover:opacity-100" />
                  </div>
                  <span className="font-black text-[10px] uppercase tracking-[0.2em]">Initialize Customer Path</span>
                </button>
              )}
            </div>

            {/* Section 2: Asset Grid */}
            <div className="bg-white dark:bg-neutral-900 rounded-[32px] border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col overflow-hidden">
               <div className="p-8 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-950/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-danger/10 rounded-sm flex items-center justify-center text-danger">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-[0.2em]">Asset Grid</h3>
                    <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mt-1">Select objects for valuation</p>
                  </div>
                </div>
                <div className="relative w-full max-w-xs group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-warning" />
                  <input
                    type="text"
                    placeholder="Search SKUs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl py-3 pl-10 pr-4 text-[10px] font-black uppercase tracking-widest focus:border-amber-500/50 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="p-8 grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto custom-scrollbar bg-white dark:bg-neutral-900">
                {filteredItems.map((item: Product) => (
                  <button
                    key={item._id}
                    onClick={() => addToCart(item)}
                    className="group p-5 bg-neutral-50 dark:bg-neutral-950/50 border border-neutral-200 dark:border-neutral-800 rounded-sm text-left hover:border-amber-500/50 hover:bg-amber-500/[0.02] transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[8px] font-black text-neutral-400 uppercase tracking-widest">{item.sku || 'N/A'}</span>
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      </div>
                      <h4 className="font-black text-neutral-900 dark:text-white text-xs uppercase tracking-tight line-clamp-2 leading-relaxed mb-3">{item.name}</h4>
                    </div>
                    <div className="flex items-end justify-between mt-auto">
                      <p className="text-lg font-mono font-black text-neutral-900 dark:text-white tracking-tighter flex items-center">
                        <span className="text-xs text-warning mr-1 font-bold">₹</span>{item.sellingPrice.toLocaleString()}
                      </p>
                      <div className="p-2 bg-amber-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 shadow-lg shadow-amber-500/20">
                        <Plus className="w-3 h-3" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: Cart & Valuation */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white dark:bg-neutral-900 rounded-[32px] border border-neutral-200 dark:border-neutral-800 flex flex-col shadow-sm sticky top-8">
              <div className="p-8 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-900 dark:bg-black rounded-t-[32px]">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-5 h-5 text-warning" />
                  <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Cart Matrix</h3>
                </div>
                <span className="px-2 py-1 bg-amber-500 text-neutral-900 rounded-md text-[10px] font-black">{cart.length}</span>
              </div>

              <div className="p-8 space-y-6 max-h-[400px] overflow-y-auto custom-scrollbar">
                {cart.length === 0 ? (
                  <div className="py-20 flex flex-col items-center gap-4 text-neutral-400">
                    <Layers className="w-12 h-12 opacity-20" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Protocol Matrix Empty</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.itemId} className="flex items-center justify-between group">
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="font-black text-neutral-900 dark:text-white text-[11px] uppercase truncate tracking-tight">{item.name}</p>
                        <p className="text-[10px] font-bold text-neutral-400 font-mono tracking-tighter mt-1">₹{item.price.toLocaleString()} / UNIT</p>
                      </div>
                      <div className="flex items-center gap-3 bg-neutral-50 dark:bg-neutral-950 p-1.5 rounded-sm border border-neutral-200 dark:border-neutral-800">
                        <button onClick={() => updateQuantity(item.itemId, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center hover:bg-rose-500 hover:text-white rounded-xl transition-all">
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-6 text-center text-xs font-mono font-black text-neutral-900 dark:text-white">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.itemId, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-emerald-500 hover:text-white rounded-xl transition-all">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <button onClick={() => removeFromCart(item.itemId)} className="ml-4 p-2 text-neutral-300 hover:text-danger transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Valuation Engine */}
              <div className="p-8 pt-0 space-y-6">
                <div className="h-px bg-neutral-100 dark:bg-neutral-800 w-full"></div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center group">
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-danger" /> Yield Discount
                    </span>
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      className="w-24 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl py-2 px-3 text-sm font-mono font-black text-danger text-right outline-none focus:border-rose-500/50 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                      <Info className="w-3.5 h-3.5 text-warning" /> Matrix Notes
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Protocol adjustments..."
                      rows={2}
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-sm p-4 text-[11px] font-bold text-neutral-600 dark:text-neutral-400 focus:border-amber-500/50 outline-none transition-all resize-none shadow-inner"
                    />
                  </div>
                </div>

                {/* Total Valuation Block */}
                <div className="bg-neutral-950 rounded-sm p-8 relative overflow-hidden group border border-neutral-800">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-warning/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-all"></div>
                   <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Subtotal</span>
                      <span className="text-sm font-mono font-bold text-neutral-400">₹{subtotal.toLocaleString()}</span>
                    </div>
                    <p className="text-[11px] font-black text-white/50 uppercase tracking-[0.3em] mt-4 mb-2">Net Valuation</p>
                    <h2 className="text-4xl font-display font-black text-white tracking-tighter flex items-baseline gap-2">
                      <span className="text-warning text-2xl font-mono">₹</span>
                      {total.toLocaleString()}
                    </h2>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button onClick={handleClear} className="py-4 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all">
                    Purge Matrix
                  </button>
                  <button onClick={handleSaveEstimate} disabled={isLoading || cart.length === 0} className="py-4 bg-amber-500 text-white rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50">
                    {isLoading ? "Syncing..." : "Finalize Protocol"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modern Customer Selector Modal */}
      {showCustomerSelect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
          <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-md" onClick={() => setShowCustomerSelect(false)}></div>
          <div className="relative bg-white dark:bg-neutral-900 w-full max-w-2xl rounded-[40px] border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col h-[80vh]">
            <div className="p-8 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-950/50">
              <h3 className="text-xl font-display font-black tracking-tighter text-neutral-900 dark:text-white uppercase">Initialize Entity Path</h3>
              <button onClick={() => setShowCustomerSelect(false)} className="p-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-sm hover:text-danger transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 space-y-6 flex-1 overflow-hidden flex flex-col">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-warning" />
                <input
                  type="text"
                  placeholder="Scan Entity (Name, Contact...)"
                  value={customerSearchTerm}
                  onChange={(e) => setCustomerSearchTerm(e.target.value)}
                  className="w-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-sm py-5 pl-14 pr-6 text-sm font-bold focus:border-amber-500 outline-none transition-all dark:text-white shadow-inner"
                />
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                {filteredCustomers.map((c: Customer) => (
                  <button
                    key={c._id}
                    onClick={() => selectCustomer(c)}
                    className="w-full p-6 bg-neutral-50 dark:bg-neutral-950/50 border border-neutral-200 dark:border-neutral-800 rounded-sm flex items-center justify-between hover:border-amber-500/50 hover:bg-amber-500/[0.02] transition-all group"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-800 rounded-sm flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all">
                        <User className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <p className="font-black text-neutral-900 dark:text-white text-sm uppercase tracking-tight">{c.name}</p>
                        <p className="text-[10px] font-bold text-neutral-400 mt-1 uppercase tracking-widest">{c.phone}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-warning transition-all" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Estimate;

