
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

    // Listen for global shortcut (Ctrl+K)
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                phoneInputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, []);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-lg shrink-0 transition-colors">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400 font-bold uppercase text-xs tracking-wider">
                    <User className="w-4 h-4" /> Customer Info
                </div>
                {activeCustomer.id !== 'c1' && (
                    <button onClick={() => dispatch(setCustomer('c1'))} className="text-xs text-red-500 dark:text-red-400 hover:underline">Reset</button>
                )}
            </div>

            <div className="relative mb-3">
                <input
                    ref={phoneInputRef}
                    type="text"
                    placeholder="Search Phone or Name (Ctrl+K)..."
                    className={`w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border ${activeCustomer.id !== 'c1' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-300 ring-1 ring-emerald-500/20' : 'border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                    value={phoneQuery}
                    onChange={e => setPhoneQuery(e.target.value)}
                    onKeyDown={handlePhoneKeyDown}
                />
                <Smartphone className={`absolute left-3 top-3 w-4 h-4 ${activeCustomer.id !== 'c1' ? 'text-emerald-500' : 'text-slate-400'}`} />

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

            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-500 dark:text-slate-400 text-xs">Customer Name</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold text-sm">{activeCustomer.name}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400 text-xs">Loyalty Points</span>
                    <span className="text-indigo-500 dark:text-indigo-400 font-bold text-sm">{activeCustomer.points} pts</span>
                </div>
            </div>
        </div>
    );
};
