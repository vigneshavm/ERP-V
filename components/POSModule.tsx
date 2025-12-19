import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch, addToCart, removeFromCart, updateCartQty, processSale, setCustomer, setActiveSession, setTaxMode, setPaymentMethod } from '../store';
import { Search, ShoppingCart, Trash2, CreditCard, User, AlertOctagon, CreditCard as CardIcon, Banknote, Smartphone, Barcode, Check, Loader2, IndianRupee, LayoutGrid } from 'lucide-react';
import { TaxMode, PaymentMethod, Product, Customer } from '../types';

const POSModule: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { currentSector, currentBranch } = useSelector((state: RootState) => state.auth);
  const { products } = useSelector((state: RootState) => state.inventory);
  const { sessions, activeSessionIndex, customers } = useSelector((state: RootState) => state.pos);
  
  // --- Global State ---
  const activeSession = useMemo(() => sessions[activeSessionIndex], [sessions, activeSessionIndex]);
  const cart = activeSession.cart;
  const activeCustomerId = activeSession.customerId;
  const activeCustomer = customers.find(c => c.id === activeCustomerId) || customers[0];
  const isBranchAll = currentBranch === 'All';

  // --- Local Search State ---
  const [skuQuery, setSkuQuery] = useState('');
  const [nameQuery, setNameQuery] = useState('');
  const [phoneQuery, setPhoneQuery] = useState('');

  // --- Suggestions State ---
  const [nameSuggestions, setNameSuggestions] = useState<Product[]>([]);
  const [phoneSuggestions, setPhoneSuggestions] = useState<Customer[]>([]);
  const [selectedNameIndex, setSelectedNameIndex] = useState(-1);
  const [selectedPhoneIndex, setSelectedPhoneIndex] = useState(-1);

  // --- Interaction State ---
  const [isProcessing, setIsProcessing] = useState(false);
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null);

  // --- Refs ---
  const skuInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const cartQtyRefs = useRef<{[key: string]: HTMLInputElement | null}>({});

  // --- Computed Data ---
  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.sector === currentSector && 
      (currentBranch === 'All' || p.branch === currentBranch)
    );
  }, [products, currentSector, currentBranch]);

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const taxAmount = activeSession.taxMode === 'EXCLUSIVE' ? cartSubtotal * 0.18 : 0;
  const cartTotal = cartSubtotal + taxAmount;

  // --- Effect: Auto-focus Cart Qty ---
  useEffect(() => {
      if (focusedItemId && cartQtyRefs.current[focusedItemId]) {
          const el = cartQtyRefs.current[focusedItemId];
          if (el) {
              el.focus();
              el.select(); // Select all text for quick overwrite
              setFocusedItemId(null); // Reset trigger
          }
      }
  }, [cart, focusedItemId]);

  // --- Handlers: SKU Input ---
  const handleSkuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const match = filteredProducts.find(p => p.sku === skuQuery || p.barcode === skuQuery);
      if (match) {
        if (match.stock > 0) {
            dispatch(addToCart({ ...match, qty: 1 }));
            setSkuQuery('');
            // Don't focus qty here to allow rapid scanning
        }
      } 
    }
  };

  // --- Handlers: Name Input ---
  useEffect(() => {
    if (nameQuery.length > 1) {
        const matches = filteredProducts.filter(p => p.name.toLowerCase().includes(nameQuery.toLowerCase())).slice(0, 5);
        setNameSuggestions(matches);
        setSelectedNameIndex(-1);
    } else {
        setNameSuggestions([]);
    }
  }, [nameQuery, filteredProducts]);

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedNameIndex(prev => Math.min(prev + 1, nameSuggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedNameIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedNameIndex >= 0 && nameSuggestions[selectedNameIndex]) {
            handleSelectProduct(nameSuggestions[selectedNameIndex]);
        }
    }
  };

  const handleSelectProduct = (product: Product) => {
      dispatch(addToCart({ ...product, qty: 1 }));
      setFocusedItemId(product.id); // Trigger focus in cart
      setNameQuery('');
      setNameSuggestions([]);
  };

  // --- Handlers: Phone Input ---
  useEffect(() => {
      if (phoneQuery) {
          const matches = customers.filter(c => c.phone.includes(phoneQuery) || c.name.toLowerCase().includes(phoneQuery.toLowerCase())).slice(0, 5);
          setPhoneSuggestions(matches);
      } else {
          setPhoneSuggestions([]);
      }
  }, [phoneQuery, customers]);

  const handlePhoneKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedPhoneIndex(prev => Math.min(prev + 1, phoneSuggestions.length - 1));
      } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedPhoneIndex(prev => Math.max(prev - 1, -1));
      } else if (e.key === 'Enter') {
          e.preventDefault();
          if (selectedPhoneIndex >= 0 && phoneSuggestions[selectedPhoneIndex]) {
              const cust = phoneSuggestions[selectedPhoneIndex];
              dispatch(setCustomer(cust.id));
              setPhoneQuery(''); 
              setPhoneSuggestions([]);
          }
      }
  };

  // --- Global Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Tab Switching
        if (e.altKey) {
            if (['1', '2', '3', '4'].includes(e.key)) {
                e.preventDefault();
                dispatch(setActiveSession(parseInt(e.key) - 1));
            }
        }
        // Focus Shortcuts
        if (e.ctrlKey && e.key === 'b') { // Barcode
            e.preventDefault();
            skuInputRef.current?.focus();
        }
        if (e.ctrlKey && e.key === 'f') { // Find Name
            e.preventDefault();
            nameInputRef.current?.focus();
        }
        if (e.ctrlKey && e.key === 'k') { // Customer
             e.preventDefault();
             phoneInputRef.current?.focus();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch]);

  const handleCheckout = async () => {
    if (cart.length === 0 || isBranchAll) return;
    
    setIsProcessing(true);
    
    // Simulate API Delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    dispatch(processSale({
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      items: [...cart],
      total: cartTotal,
      customerId: activeCustomerId || undefined,
      sector: currentSector,
      branch: currentBranch,
      taxMode: activeSession.taxMode,
      paymentMethod: activeSession.paymentMethod
    }));
    
    setIsProcessing(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)] relative">
      {/* Session Tabs */}
      <div className="flex gap-2 mb-4 shrink-0">
          {sessions.map((session, index) => (
              <button
                key={session.id}
                onClick={() => dispatch(setActiveSession(index))}
                className={`flex-1 py-3 px-4 rounded-t-xl font-bold flex flex-col items-center justify-center transition-all border-b-2 ${
                    activeSessionIndex === index 
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-900/20' 
                    : 'bg-slate-800 text-slate-400 border-transparent hover:bg-slate-700'
                }`}
              >
                  <span className="text-sm flex items-center gap-2">
                      {session.label}
                      <span className="text-[10px] opacity-60 font-normal bg-black/20 px-1.5 rounded">Alt+{index+1}</span>
                  </span>
                  <span className="text-xs font-normal mt-1 opacity-80">
                      {session.cart.length} items &bull; ${session.cart.reduce((s, i) => s + (i.price * i.qty), 0).toFixed(0)}
                  </span>
              </button>
          ))}
      </div>

      <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* LEFT 2/3 - BILLING TABLE & SEARCH */}
        <div className="col-span-12 lg:col-span-8 flex flex-col bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-hidden min-h-0">
            
            {/* Search Bar Row */}
            <div className="p-4 border-b border-slate-700 bg-slate-900/50 grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0 z-20">
                {/* SKU Input */}
                <div className="relative group">
                    <div className="absolute left-3 top-3 text-slate-500">
                        <Barcode className="w-5 h-5" />
                    </div>
                    <input 
                        ref={skuInputRef}
                        type="text"
                        placeholder="Scan SKU/Barcode (Exact Match)"
                        className="w-full pl-10 pr-16 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-slate-900 transition-colors shadow-inner"
                        value={skuQuery}
                        onChange={e => setSkuQuery(e.target.value)}
                        onKeyDown={handleSkuKeyDown}
                    />
                    <kbd className="absolute right-3 top-3.5 text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-400 border border-slate-600 font-mono">Ctrl+B</kbd>
                </div>

                {/* Name Input */}
                <div className="relative group">
                     <div className="absolute left-3 top-3 text-slate-500">
                        <Search className="w-5 h-5" />
                    </div>
                    <input 
                        ref={nameInputRef}
                        type="text"
                        placeholder="Search Product Name..."
                        className="w-full pl-10 pr-16 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-slate-900 transition-colors shadow-inner"
                        value={nameQuery}
                        onChange={e => setNameQuery(e.target.value)}
                        onKeyDown={handleNameKeyDown}
                        autoComplete="off"
                    />
                    <kbd className="absolute right-3 top-3.5 text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-400 border border-slate-600 font-mono">Ctrl+F</kbd>

                    {/* Name Suggestions Dropdown */}
                    {nameSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-50 max-h-80 overflow-y-auto ring-1 ring-black/20">
                            {nameSuggestions.map((prod, idx) => (
                                <button 
                                    key={prod.id}
                                    onClick={() => handleSelectProduct(prod)}
                                    className={`w-full text-left px-4 py-3 border-b border-slate-700/50 flex justify-between items-center group transition-colors ${idx === selectedNameIndex ? 'bg-indigo-600 text-white' : 'text-slate-200 hover:bg-slate-700'}`}
                                >
                                    <div>
                                        <p className="font-bold text-sm">{prod.name}</p>
                                        <div className="flex gap-2 mt-0.5">
                                            <span className={`text-[10px] px-1.5 rounded border ${idx === selectedNameIndex ? 'border-indigo-400 bg-indigo-500/30' : 'border-slate-600 bg-slate-700 text-slate-400'}`}>{prod.sku}</span>
                                            <span className={`text-[10px] px-1.5 rounded border ${idx === selectedNameIndex ? 'border-indigo-400 bg-indigo-500/30' : 'border-slate-600 bg-slate-700 text-slate-400'}`}>{prod.branch}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold font-mono">${prod.price.toFixed(2)}</p>
                                        <p className={`text-[10px] ${idx === selectedNameIndex ? 'text-indigo-200' : 'text-slate-500'}`}>{prod.stock} left</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Billing Table */}
            <div className="flex-1 overflow-auto bg-slate-800 relative">
                {cart.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 opacity-60">
                        <ShoppingCart className="w-16 h-16 mb-4" />
                        <p className="text-lg font-medium">Cart is empty</p>
                        <p className="text-sm">Scan items or search to begin</p>
                    </div>
                ) : (
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-slate-900 text-xs uppercase font-bold text-slate-500 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-4 w-12 text-center">#</th>
                                <th className="p-4">Item Details</th>
                                <th className="p-4 w-32 text-center">Unit Price</th>
                                <th className="p-4 w-40 text-center">Quantity</th>
                                <th className="p-4 w-32 text-right">Total</th>
                                <th className="p-4 w-16 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {cart.map((item, idx) => (
                                <tr key={item.id} className="hover:bg-slate-700/30 transition-colors group">
                                    <td className="p-4 text-center text-slate-500 font-mono">{idx + 1}</td>
                                    <td className="p-4">
                                        <p className="font-bold text-slate-200 text-base">{item.name}</p>
                                        <p className="text-xs text-slate-500 font-mono mt-0.5">{item.sku}</p>
                                    </td>
                                    <td className="p-4 text-center font-mono text-slate-400">
                                        ${item.price.toFixed(2)}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-center gap-1 bg-slate-900/50 rounded-lg p-1 border border-slate-700 w-fit mx-auto">
                                            <button 
                                                onClick={() => dispatch(updateCartQty({ id: item.id, qty: item.qty - 1 }))}
                                                className="w-8 h-8 flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded text-slate-200 transition-colors"
                                                tabIndex={-1}
                                            >-</button>
                                            <input 
                                                ref={(el) => { cartQtyRefs.current[item.id] = el; }}
                                                type="number"
                                                value={item.qty}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value);
                                                    if (!isNaN(val) && val >= 0) {
                                                        dispatch(updateCartQty({ id: item.id, qty: val }));
                                                    }
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        nameInputRef.current?.focus(); // Return to search on Enter
                                                    }
                                                }}
                                                className="w-14 text-center bg-slate-800 border-none text-white font-bold focus:ring-2 focus:ring-indigo-500 rounded h-8 spin-hide"
                                            />
                                            <button 
                                                onClick={() => dispatch(updateCartQty({ id: item.id, qty: item.qty + 1 }))}
                                                className="w-8 h-8 flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded text-slate-200 transition-colors"
                                                tabIndex={-1}
                                            >+</button>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right font-bold text-emerald-400 font-mono text-base">
                                        ${(item.price * item.qty).toFixed(2)}
                                    </td>
                                    <td className="p-4 text-center">
                                        <button 
                                            onClick={() => dispatch(removeFromCart(item.id))}
                                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                            tabIndex={-1}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>

        {/* RIGHT 1/3 - CUSTOMER & SETTLEMENT */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 min-h-0">
            
            {/* Customer Panel */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 shadow-lg shrink-0">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase text-xs tracking-wider">
                        <User className="w-4 h-4" /> Customer Info
                    </div>
                    {activeCustomer.id !== 'c1' && (
                        <button onClick={() => dispatch(setCustomer('c1'))} className="text-xs text-red-400 hover:underline">Reset</button>
                    )}
                </div>

                <div className="relative mb-3">
                    <input 
                        ref={phoneInputRef}
                        type="text" 
                        placeholder="Search Phone or Name..."
                        className={`w-full pl-9 pr-4 py-2.5 text-sm bg-slate-900 border ${activeCustomer.id !== 'c1' ? 'border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/20' : 'border-slate-600 text-slate-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                        value={phoneQuery}
                        onChange={e => setPhoneQuery(e.target.value)}
                        onKeyDown={handlePhoneKeyDown}
                    />
                    <Smartphone className={`absolute left-3 top-3 w-4 h-4 ${activeCustomer.id !== 'c1' ? 'text-emerald-500' : 'text-slate-500'}`} />
                    
                    {/* Customer Suggestions */}
                    {phoneSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
                            {phoneSuggestions.map((cust, idx) => (
                                <button 
                                    key={cust.id}
                                    onClick={() => {
                                        dispatch(setCustomer(cust.id));
                                        setPhoneQuery('');
                                        setPhoneSuggestions([]);
                                    }}
                                    className={`w-full text-left px-3 py-2.5 text-sm border-b border-slate-700/50 block ${idx === selectedPhoneIndex ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                                >
                                    <span className="font-bold">{cust.name}</span>
                                    <span className={`block text-xs ${idx === selectedPhoneIndex ? 'text-indigo-200' : 'text-slate-500'}`}>{cust.phone} &bull; {cust.points} pts</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-slate-400 text-xs">Customer Name</span>
                        <span className="text-slate-200 font-bold text-sm">{activeCustomer.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-xs">Loyalty Points</span>
                        <span className="text-indigo-400 font-bold text-sm">{activeCustomer.points} pts</span>
                    </div>
                </div>
            </div>

            {/* Settlement Panel */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-lg flex-1 flex flex-col min-h-0">
                <h3 className="text-indigo-400 font-bold uppercase text-xs tracking-wider mb-4 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> Settlement
                </h3>
                
                {/* Toggles */}
                <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <span className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase">Tax Mode</span>
                            <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
                                {(['EXCLUSIVE', 'INCLUSIVE'] as TaxMode[]).map(mode => (
                                    <button
                                        key={mode}
                                        onClick={() => dispatch(setTaxMode(mode))}
                                        className={`flex-1 text-[10px] py-1.5 rounded-md font-bold transition-all ${activeSession.taxMode === mode ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                                    >
                                        {mode === 'EXCLUSIVE' ? '+ Tax' : 'Incl.'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase">Payment</span>
                            <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
                                {(['CASH', 'CARD', 'UPI'] as PaymentMethod[]).map(method => {
                                    const Icon = method === 'CASH' ? Banknote : method === 'CARD' ? CardIcon : Smartphone;
                                    return (
                                        <button
                                            key={method}
                                            onClick={() => dispatch(setPaymentMethod(method))}
                                            className={`flex-1 py-1.5 rounded-md flex items-center justify-center transition-all ${activeSession.paymentMethod === method ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                                            title={method}
                                        >
                                            <Icon className="w-4 h-4" />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {isBranchAll && (
                    <div className="p-3 mb-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-3 text-yellow-200 text-xs">
                        <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>Select a specific branch from the top menu to enable checkout.</span>
                    </div>
                )}

                <div className="mt-auto space-y-3">
                    <div className="flex justify-between items-center text-sm border-t border-slate-700 pt-4">
                        <span className="text-slate-400">Subtotal</span>
                        <span className="text-slate-200 font-mono">${cartSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Tax {activeSession.taxMode === 'EXCLUSIVE' ? '(18%)' : '(0%)'}</span>
                        <span className="text-slate-200 font-mono">${taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-end pt-2">
                        <span className="text-slate-300 font-bold text-lg">Total Payable</span>
                        <span className="text-emerald-400 font-bold text-3xl font-mono tracking-tight">${cartTotal.toFixed(2)}</span>
                    </div>

                    <button 
                        onClick={handleCheckout}
                        disabled={cart.length === 0 || isBranchAll || isProcessing}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:border disabled:border-slate-700 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-900/20 mt-4 text-lg"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-6 h-6 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Check className="w-6 h-6" />
                                Finalize Bill
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default POSModule;