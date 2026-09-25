import React from 'react';
import { X, Crown, History, Zap, Phone, Mail, MapPin, Wallet } from 'lucide-react';
import { formatDate } from '../../utils/helpers';
import { Customer } from "../../types/sales";

interface Customer360ModalProps {
    isOpen: boolean;
    onClose: () => void;
    customer: Customer & { totalPurchases?: number; purchaseCount?: number; lastPurchase?: string | null };
}

const Customer360Modal: React.FC<Customer360ModalProps> = ({ isOpen, onClose, customer }) => {
    if (!isOpen) return null;


    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-sm bg-indigo-600 text-white flex items-center justify-center text-3xl font-black shadow-xl shadow-indigo-600/20">
                            {customer.name.charAt(0)}
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white italic uppercase tracking-tight">{customer.name}</h2>
                            </div>
                            <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 font-medium text-sm">
                                <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {customer.phone}</span>
                                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {customer.email || 'No Email'}</span>
                                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {customer.address || 'No address'}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-sm transition-all">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                <div className="p-8 grid grid-cols-12 gap-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Customer Intelligence Layer */}
                    <div className="col-span-12 lg:col-span-4 space-y-6">
                        {/* Loyalty Card */}
                        <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/30">
                            <div className="flex justify-between items-start mb-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Loyalty Status</p>
                                <Crown className="w-5 h-5 text-warning" />
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-1">{customer.tier || 'BRONZE'}</h3>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{customer.points.toLocaleString()} Points Balance</p>
                        </div>

                        {/* Revenue Card */}
                        <div className="bg-slate-900 dark:bg-slate-800 p-6 rounded-[2.5rem] text-white">
                            <div className="flex justify-between items-start mb-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Lifetime Value</p>
                                <Zap className="w-5 h-5 text-primary" />
                            </div>
                            <h3 className="text-3xl font-black mb-1">₹{(customer.totalPurchases || 0).toLocaleString()}</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Across {customer.purchaseCount || 0} Invoices</p>
                        </div>
                    </div>

                    {/* Account facts from the customer record */}
                    <div className="col-span-12 lg:col-span-8 space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <History className="w-4 h-4" /> Account
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-sm border border-slate-100 dark:border-slate-700">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Wallet className="w-3.5 h-3.5" /> Outstanding</p>
                                <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">₹{(customer.dues || 0).toLocaleString('en-IN')}</p>
                            </div>
                            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-sm border border-slate-100 dark:border-slate-700">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Last purchase</p>
                                <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{customer.lastPurchase ? formatDate(customer.lastPurchase) : 'None recorded'}</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500">
                            Satisfaction scores and feedback aren't shown because the ERP doesn't record customer feedback yet.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Customer360Modal;
