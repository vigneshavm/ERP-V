
import React, { useState, useEffect, useRef } from 'react';
import { User, Smartphone } from 'lucide-react';
import { Customer } from '../../types/sales';
import { AppDispatch, setCustomer } from '../../store';

interface POSCustomerPanelProps {
    activeCustomer: Customer;
    customers: Customer[];
    dispatch: AppDispatch;
}

export const POSCustomerPanel: React.FC<POSCustomerPanelProps> = ({
    activeCustomer,
    customers,
    dispatch
}) => {
    const [phoneQuery, setPhoneQuery] = useState('');
    const [phoneSuggestions, setPhoneSuggestions] = useState<Customer[]>([]);
    const [selectedPhoneIndex, setSelectedPhoneIndex] = useState(-1);
    const phoneInputRef = useRef<HTMLInputElement>(null);

    // Filter Suggestions
    useEffect(() => {
        if (phoneQuery) {
            const matches = customers.filter(c => c.phone.includes(phoneQuery) || c.name.toLowerCase().includes(phoneQuery.toLowerCase())).slice(0, 5);
            setPhoneSuggestions(matches);
        } else {
            setPhoneSuggestions([]);
        }
    }, [phoneQuery, customers]);

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
                dispatch(setCustomer(cust.id));
                setPhoneQuery('');
                setPhoneSuggestions([]);
            }
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


            <div className="relative mb-2">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <input
                            ref={phoneInputRef}
                            type="text"
                            placeholder="Search Customer (Ctrl+K)"
                            className={`w-full pl-8 pr-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border ${activeCustomer.id !== 'c1' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-300 ring-1 ring-emerald-500/20' : 'border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200'} rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                            value={phoneQuery}
                            onChange={e => setPhoneQuery(e.target.value)}
                            onKeyDown={handlePhoneKeyDown}
                        />
                        <User className={`absolute left-2 top-1.5 w-3.5 h-3.5 ${activeCustomer.id !== 'c1' ? 'text-emerald-500' : 'text-slate-400'}`} />
                    </div>
                </div>

                {/* Customer Suggestions */}
                {phoneSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
                        {phoneSuggestions.map((cust, idx) => (
                            <button
                                key={cust.id}
                                onClick={() => {
                                    dispatch(setCustomer(cust.id));
                                    setPhoneQuery('');
                                    setPhoneSuggestions([]);
                                }}
                                className={`w-full text-left px-3 py-2.5 text-sm border-b border-slate-100 dark:border-slate-700/50 block ${idx === selectedPhoneIndex ? 'bg-indigo-600 text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                            >
                                <span className="font-bold">{cust.name}</span>
                                <span className={`block text-xs ${idx === selectedPhoneIndex ? 'text-indigo-200' : 'text-slate-500'}`}>{cust.phone} &bull; {cust.points} pts</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>



            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 rounded p-1.5 border border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center gap-2">
                    <span className="text-slate-800 dark:text-slate-200 font-bold text-xs truncate max-w-[120px]">{activeCustomer.name}</span>
                    {activeCustomer.points > 0 && (
                        <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded font-bold">{activeCustomer.points} pts</span>
                    )}
                </div>
                {activeCustomer.id !== 'c1' && (
                    <button onClick={() => dispatch(setCustomer('c1'))} className="text-[10px] text-red-500 hover:text-red-600 px-1">Reset</button>
                )}
            </div>
        </div >
    );
};
