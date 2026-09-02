
import React, { useState, useEffect, useRef } from 'react';
import { User, Smartphone, Mail, Send, RotateCcw, Crown, Zap, History, Gift, MessageSquare, Smile } from 'lucide-react';
import { Customer } from "../../types/sales";
import Customer360Modal from '../customers/Customer360Modal';

interface POSCustomerPanelProps {
    activeCustomer: Customer;
    customers: Customer[];
    onSetCustomer: (id: string) => void;
    onLookupOrCreateCustomer: (phone: string, name?: string) => void;
}

export const POSCustomerPanel: React.FC<POSCustomerPanelProps> = ({
    activeCustomer,
    customers,
    onSetCustomer,
    onLookupOrCreateCustomer
}) => {
    const [phoneQuery, setPhoneQuery] = useState('');
    const [nameQuery, setNameQuery] = useState('');
    const [phoneSuggestions, setPhoneSuggestions] = useState<Customer[]>([]);
    const [selectedPhoneIndex, setSelectedPhoneIndex] = useState(-1);
    const phoneInputRef = useRef<HTMLInputElement>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const [is360ModalOpen, setIs360ModalOpen] = useState(false);

    // Filter Suggestions and Auto-select
    useEffect(() => {
        if (phoneQuery) {
            const matches = customers.filter(c => c.phone.includes(phoneQuery) || c.name.toLowerCase().includes(phoneQuery.toLowerCase())).slice(0, 5);
            setPhoneSuggestions(matches);

            // Auto-select if exact phone match and length is 10 (standard mobile)
            if (phoneQuery.length === 10) {
                const exactMatch = customers.find(c => c.phone === phoneQuery);
                if (exactMatch) {
                    onSetCustomer(exactMatch.id);
                    setPhoneQuery('');
                    setNameQuery('');
                    setPhoneSuggestions([]);
                    // Optional: Blur input or move to next step?
                    phoneInputRef.current?.blur();
                }
            }
        } else {
            setPhoneSuggestions([]);
        }
    }, [phoneQuery, customers, onSetCustomer]);

    // Keyboard Navigation
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
                onSetCustomer(cust.id);
                setPhoneQuery('');
                setNameQuery('');
                setPhoneSuggestions([]);
            } else if (phoneQuery.length >= 10) {
                // If no suggestion selected, move to name or submit
                if (nameInputRef.current) {
                    nameInputRef.current.focus();
                } else {
                    onLookupOrCreateCustomer(phoneQuery, nameQuery || undefined);
                    setPhoneQuery('');
                    setNameQuery('');
                    setPhoneSuggestions([]);
                }
            }
        }
    };

    const handleNameKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (phoneQuery.length >= 10) {
                onLookupOrCreateCustomer(phoneQuery, nameQuery || undefined);
                setPhoneQuery('');
                setNameQuery('');
                setPhoneSuggestions([]);
                phoneInputRef.current?.focus();
            }
        } else if (e.key === 'Escape') {
            phoneInputRef.current?.focus();
        }
    };

    // Listen for global shortcut
    useEffect(() => {
        const handleFocus = () => {
            phoneInputRef.current?.focus();
            phoneInputRef.current?.select();
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setPhoneQuery('');
                setPhoneSuggestions([]);
            }
        };

        window.addEventListener('pos-focus-customer', handleFocus);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('pos-focus-customer', handleFocus);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    return (
        <div className="bg-white dark:bg-neutral-800 p-2 border-b border-neutral-200 dark:border-neutral-700 shadow-sm shrink-0 transition-colors">


            <div className="relative mb-2 flex flex-col gap-2">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <input
                            ref={phoneInputRef}
                            type="text"
                            placeholder="Identify Customer (Mobile No.)"
                            className={`w-full pl-8 pr-2 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-900 border ${activeCustomer.id !== 'c1' ? 'border-success text-success dark:text-success/90 ring-2 ring-success/10' : 'border-primary/30 dark:border-primary/60 animate-pulse-subtle'} rounded focus:outline-none focus:ring-2 focus:ring-primary transition-all`}
                            value={phoneQuery}
                            onChange={e => setPhoneQuery(e.target.value)}
                            onKeyDown={handlePhoneKeyDown}
                        />
                        <Smartphone className={`absolute left-2 top-1.5 w-3.5 h-3.5 ${activeCustomer.id !== 'c1' ? 'text-success' : 'text-primary/70'}`} />
                    </div>
                </div>

                {phoneQuery.length >= 10 && phoneSuggestions.length === 0 && (
                    <div className="flex gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="relative flex-1">
                            <input
                                ref={nameInputRef}
                                type="text"
                                placeholder="Customer Name (Optional)"
                                className="w-full pl-8 pr-2 py-1.5 text-xs bg-primary/5 dark:bg-neutral-900 border border-primary/20 dark:border-primary/40 rounded focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                                value={nameQuery}
                                onChange={e => setNameQuery(e.target.value)}
                                onKeyDown={handleNameKeyDown}
                            />
                            <User className="absolute left-2 top-1.5 w-3.5 h-3.5 text-primary/70" />
                        </div>
                        <button
                            onClick={() => {
                                onLookupOrCreateCustomer(phoneQuery, nameQuery || undefined);
                                setPhoneQuery('');
                                setNameQuery('');
                                setPhoneSuggestions([]);
                            }}
                            className="bg-primary text-white px-3 py-1 text-[10px] font-bold rounded hover:bg-primary/90 transition-colors"
                        >
                            CREATE
                        </button>
                    </div>
                )}

                {/* Customer Suggestions */}
                {phoneSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
                        {phoneSuggestions.map((cust, idx) => (
                            <button
                                key={cust.id}
                                onClick={() => {
                                    onSetCustomer(cust.id);
                                    setPhoneQuery('');
                                    setNameQuery('');
                                    setPhoneSuggestions([]);
                                }}
                                className={`w-full text-left px-3 py-2.5 text-sm border-b border-neutral-100 dark:border-neutral-700/50 block ${idx === selectedPhoneIndex ? 'bg-primary text-white' : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'}`}
                            >
                                <span className="font-bold">{cust.name}</span>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`text-xs ${idx === selectedPhoneIndex ? 'text-white/70' : 'text-neutral-500'}`}>{cust.phone}</span>
                                    <span className={`text-[10px] px-1 rounded font-bold ${idx === selectedPhoneIndex ? 'bg-white/20 text-white' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'}`}>
                                        {cust.tier || 'General'}
                                    </span>
                                    <span className={`text-xs ${idx === selectedPhoneIndex ? 'text-white/70' : 'text-neutral-500'}`}>&bull; {cust.points} pts</span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>



            <div className="flex flex-col gap-2 bg-white dark:bg-slate-900 rounded-sm p-4 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
                <div className="flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[10px] ${activeCustomer.id !== 'c1' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                            {activeCustomer.name.charAt(0)}
                        </div>
                        <div>
                            <span
                                onClick={() => setIs360ModalOpen(true)}
                                className={`text-xs font-black truncate max-w-[120px] italic block leading-none cursor-pointer hover:underline ${activeCustomer.id !== 'c1' ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}
                            >
                                {activeCustomer.id !== 'c1' ? activeCustomer.name : 'Unidentified Customer'}
                            </span>
                            {activeCustomer.id !== 'c1' && (
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{activeCustomer.phone}</p>
                            )}
                        </div>
                    </div>
                    {activeCustomer.id !== 'c1' && (
                        <button onClick={() => onSetCustomer('c1')} className="p-1.5 bg-rose-50 dark:bg-rose-900/20 text-danger hover:bg-rose-500 hover:text-white rounded-lg transition-all">
                            <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Loyalty Tier & Points */}
                {activeCustomer.id !== 'c1' && (
                    <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-100 dark:border-slate-800 relative z-10">
                        <div className="flex items-center gap-2">
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Customer Tier</span>
                                <div className="flex items-center gap-1.5">
                                    <Crown className="w-3 h-3 text-warning" />
                                    <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                                        {activeCustomer.tier || 'BRONZE'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-[8px] font-black text-primary dark:text-primary uppercase tracking-widest block">Wallet Points</span>
                            <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{activeCustomer.points.toLocaleString()} <span className="text-[10px] text-slate-400 uppercase ml-0.5">Pts</span></p>
                        </div>
                    </div>
                )}

                {/* Points Earned Preview */}
                {activeCustomer.id !== 'c1' && (
                    <div className="mt-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5 text-primary dark:text-primary animate-pulse" />
                            <span className="text-[9px] font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-widest">Points for this order</span>
                        </div>
                        <p className="text-xs font-black text-primary dark:text-primary">+ 184</p>
                    </div>
                )}

                {/* Engagement Quick Actions */}
                {activeCustomer.id !== 'c1' && (
                    <div className="flex items-center gap-4 pt-3 mt-1 border-t border-slate-100 dark:border-slate-800 relative z-10">
                        {/* Email Actions */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-1">Reach:</span>
                            <button
                                onClick={() => alert("Invoice emailed!")}
                                className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white rounded-xl transition-all shadow-sm border border-slate-200 dark:border-slate-700"
                                title="Email Invoice"
                            >
                                <Mail className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => alert("Invoice sent via WhatsApp!")}
                                className="p-2 bg-emerald-50 dark:bg-emerald-900/10 hover:bg-emerald-600 hover:text-white rounded-xl text-emerald-600 transition-all shadow-sm border border-emerald-100 dark:border-emerald-900/30"
                                title="WhatsApp Invoice"
                            >
                                <Send className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Loyalty Actions */}
                        <div className="flex items-center gap-1.5 ml-auto">
                            <button
                                onClick={() => alert("Opening Loyalty Ledger...")}
                                className="p-2 bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-500 hover:text-white rounded-xl text-amber-600 transition-all shadow-sm border border-amber-100 dark:border-amber-900/30"
                                title="Loyalty History"
                            >
                                <History className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => alert("Redeeming points...")}
                                className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-600/20"
                                title="Redeem Points"
                            >
                                <Gift className="w-3.5 h-3.5" /> Redeem
                            </button>
                        </div>

                        {/* CX Feedback Trigger */}
                        <div className="flex items-center gap-1.5 ml-2 border-l border-slate-100 dark:border-slate-800 pl-4">
                            <button
                                onClick={() => alert("Feedback request sent to customer!")}
                                className="p-2 bg-emerald-50 dark:bg-emerald-900/10 hover:bg-emerald-600 hover:text-white rounded-xl text-emerald-600 transition-all shadow-sm border border-emerald-100 dark:border-emerald-900/30"
                                title="Trigger Feedback Request"
                            >
                                <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                            <div className="flex flex-col items-center">
                                <Smile className="w-3.5 h-3.5 text-success" />
                                <span className="text-[7px] font-black text-slate-400">92% CSAT</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {is360ModalOpen && activeCustomer.id !== 'c1' && (
                <Customer360Modal
                    isOpen={is360ModalOpen}
                    onClose={() => setIs360ModalOpen(false)}
                    customer={activeCustomer}
                />
            )}
        </div>
    );
};
