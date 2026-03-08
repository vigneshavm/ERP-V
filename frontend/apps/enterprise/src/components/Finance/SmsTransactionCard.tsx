import React, { useState } from 'react';
import { MessageSquare, Calendar, CreditCard, ArrowRight, Ban, CheckCircle2, ChevronDown, ChevronUp, Zap } from 'lucide-react';

const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).format(new Date(date));
};

interface SmsTransactionCardProps {
    transaction: any;
    onConvert: (id: string, data: any) => void;
    onIgnore: (id: string) => void;
}

const SmsTransactionCard: React.FC<SmsTransactionCardProps> = ({ transaction, onConvert, onIgnore }) => {
    const { parsedData, rawText, status, _id } = transaction;
    const [isExpanded, setIsExpanded] = useState(false);
    const [category, setCategory] = useState(parsedData.suggestedCategory || 'Miscellaneous');
    const [description, setDescription] = useState('');

    const categories = [
        'Rent', 'Utilities', 'Salaries', 'Transportation', 'Marketing',
        'Office Supplies', 'Maintenance', 'Insurance', 'Professional Fees',
        'Miscellaneous', 'Travel', 'Electricity', 'Food & Refreshments'
    ];

    const getStatusColor = () => {
        switch (status) {
            case 'pending': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
            case 'converted': return 'text-success bg-success/10 border-success/20';
            case 'ignored': return 'text-neutral-500 bg-neutral-500/10 border-neutral-500/20';
            default: return 'text-neutral-400 bg-neutral-400/10 border-neutral-400/20';
        }
    };

    return (
        <div className={`glass-panel rounded-2xl overflow-hidden border transition-all duration-300 ${isExpanded ? 'border-primary/30 ring-1 ring-primary/20' : 'border-white/10 hover:border-white/20'}`}>
            <div className="p-4 lg:p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${parsedData.type === 'debit' ? 'bg-error/10 text-error' : 'bg-success/10 text-success'}`}>
                            <MessageSquare className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-display font-bold text-lg text-main">
                                    {parsedData.merchant || 'Unknown Transaction'}
                                </h3>
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${getStatusColor()}`}>
                                    {status}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-sm text-secondary">
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {parsedData.date ? formatDate(parsedData.date) : 'Unknown Date'}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <CreditCard className="w-3.5 h-3.5" />
                                    Account: {parsedData.accountNumber || '****'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className={`text-2xl font-display font-black ${parsedData.type === 'debit' ? 'text-error' : 'text-success'}`}>
                            {parsedData.type === 'debit' ? '-' : '+'} ₹{parsedData.amount?.toLocaleString() || '0'}
                        </div>
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-primary hover:text-primary-hover text-sm font-bold flex items-center gap-1 ml-auto mt-2 transition-colors"
                        >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            {isExpanded ? 'Hide Details' : 'Resolve'}
                        </button>
                    </div>
                </div>

                {isExpanded && (
                    <div className="mt-6 pt-6 border-t border-white/5 animate-in slide-in-from-top-2">
                        <div className="grid lg:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-secondary mb-2">Original Message</label>
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-sm italic text-secondary leading-relaxed">
                                    "{rawText}"
                                </div>
                            </div>

                            <div className="space-y-4">
                                {status === 'pending' && (
                                    <>
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-secondary">Expense Category</label>
                                                {parsedData.suggestedCategory && (
                                                    <span className="text-[9px] font-black text-primary uppercase tracking-tighter bg-primary/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                        <Zap className="w-2.5 h-2.5" />
                                                        AI Suggestion
                                                    </span>
                                                )}
                                            </div>
                                            <select
                                                value={category}
                                                onChange={(e) => setCategory(e.target.value)}
                                                className="w-full bg-surface border border-default rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                                            >
                                                {categories.map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-secondary mb-2">Internal Note</label>
                                            <input
                                                type="text"
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder="Add a description for this expense..."
                                                className="w-full bg-surface border border-default rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                                            />
                                        </div>
                                        <div className="flex gap-3 pt-2">
                                            <button
                                                onClick={() => onIgnore(_id)}
                                                className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-secondary hover:bg-error/10 hover:text-error hover:border-error/20 font-bold text-sm transition-all flex items-center justify-center gap-2"
                                            >
                                                <Ban className="w-4 h-4" />
                                                Ignore
                                            </button>
                                            <button
                                                onClick={() => onConvert(_id, { category, description })}
                                                className="flex-[2] btn-cyber-primary py-3 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                                Confirm Expense
                                            </button>
                                        </div>
                                    </>
                                )}

                                {status === 'converted' && (
                                    <div className="p-4 rounded-xl bg-success/5 border border-success/20 flex items-center gap-3 text-success font-medium">
                                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                                        <span>This transaction has been converted to an expense record.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SmsTransactionCard;
