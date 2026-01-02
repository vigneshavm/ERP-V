
import React, { useState, useEffect, useRef } from 'react';
import { User, Smartphone } from 'lucide-react';
import { Customer } from '../../types/sales';

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
        <div className="bg-white dark:bg-slate-800 p-2 border-b border-slate-200 dark:border-slate-700 shadow-sm shrink-0 transition-colors">


            <div className="relative mb-2 flex flex-col gap-2">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <input
                            ref={phoneInputRef}
                            type="text"
                            placeholder="Identify Customer (Mobile No.)"
                            className={`w-full pl-8 pr-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border ${activeCustomer.id !== 'c1' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-300 ring-2 ring-emerald-500/10' : 'border-indigo-300 dark:border-indigo-600 animate-pulse-subtle'} rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                            value={phoneQuery}
                            onChange={e => setPhoneQuery(e.target.value)}
                            onKeyDown={handlePhoneKeyDown}
                        />
                        <Smartphone className={`absolute left-2 top-1.5 w-3.5 h-3.5 ${activeCustomer.id !== 'c1' ? 'text-emerald-500' : 'text-indigo-400'}`} />
                    </div>
                </div>

                {phoneQuery.length >= 10 && phoneSuggestions.length === 0 && (
                    <div className="flex gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="relative flex-1">
                            <input
                                ref={nameInputRef}
                                type="text"
                                placeholder="Customer Name (Optional)"
                                className="w-full pl-8 pr-2 py-1.5 text-xs bg-indigo-50 dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                value={nameQuery}
                                onChange={e => setNameQuery(e.target.value)}
                                onKeyDown={handleNameKeyDown}
                            />
                            <User className="absolute left-2 top-1.5 w-3.5 h-3.5 text-indigo-400" />
                        </div>
                        <button
                            onClick={() => {
                                onLookupOrCreateCustomer(phoneQuery, nameQuery || undefined);
                                setPhoneQuery('');
                                setNameQuery('');
                                setPhoneSuggestions([]);
                            }}
                            className="bg-indigo-600 text-white px-3 py-1 text-[10px] font-bold rounded hover:bg-indigo-700 transition-colors"
                        >
                            CREATE
                        </button>
                    </div>
                )}

                {/* Customer Suggestions */}
                {phoneSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
                        {phoneSuggestions.map((cust, idx) => (
                            <button
                                key={cust.id}
                                onClick={() => {
                                    onSetCustomer(cust.id);
                                    setPhoneQuery('');
                                    setNameQuery('');
                                    setPhoneSuggestions([]);
                                }}
                                className={`w-full text-left px-3 py-2.5 text-sm border-b border-slate-100 dark:border-slate-700/50 block ${idx === selectedPhoneIndex ? 'bg-indigo-600 text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                            >
                                <span className="font-bold">{cust.name}</span>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`text-xs ${idx === selectedPhoneIndex ? 'text-indigo-200' : 'text-slate-500'}`}>{cust.phone}</span>
                                    <span className={`text-[10px] px-1 rounded font-bold ${idx === selectedPhoneIndex ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                                        {cust.tier || 'General'}
                                    </span>
                                    <span className={`text-xs ${idx === selectedPhoneIndex ? 'text-indigo-200' : 'text-slate-500'}`}>&bull; {cust.points} pts</span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>



            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 rounded p-1.5 border border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold truncate max-w-[120px] ${activeCustomer.id !== 'c1' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                        {activeCustomer.id !== 'c1' ? activeCustomer.name : 'Unidentified Customer'}
                    </span>
                    {activeCustomer.points > 0 && (
                        <div className="flex items-center gap-1">
                            <span className="text-[10px] bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold border border-emerald-100 dark:border-emerald-800/50">
                                {activeCustomer.tier || 'General'}
                            </span>
                            <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded font-bold border border-indigo-100 dark:border-indigo-800/50">
                                {activeCustomer.points} pts
                            </span>
                        </div>
                    )}
                </div>
                {activeCustomer.id !== 'c1' && (
                    <button onClick={() => onSetCustomer('c1')} className="text-[10px] text-red-500 hover:text-red-600 px-1">Reset</button>
                )}
            </div>
        </div >
    );
};
