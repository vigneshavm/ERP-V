import React from 'react';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Cheque } from '../../types/finance';

interface ChequeLedgerProps {
    sectorCheques: Cheque[];
    onUpdateStatus: (id: string, status: 'CLEARED' | 'BOUNCED') => void;
}

const ChequeLedger: React.FC<ChequeLedgerProps> = ({
    sectorCheques, onUpdateStatus
}) => {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in transition-colors">
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 dark:text-white">Cheque Ledger</h3>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                    Pending: <span className="text-yellow-500 dark:text-yellow-400 font-bold">{sectorCheques.filter(c => c.status === 'PENDING').length}</span>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase font-medium">
                        <tr>
                            <th className="p-4">Issue Date</th>
                            <th className="p-4">Cheque No</th>
                            <th className="p-4">Bank</th>
                            <th className="p-4">Type</th>
                            <th className="p-4">Party</th>
                            <th className="p-4 text-right">Amount</th>
                            <th className="p-4 text-center">Status</th>
                            <th className="p-4 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {sectorCheques.map(c => (
                            <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                <td className="p-4 text-slate-500 dark:text-slate-400">{new Date(c.date).toLocaleDateString()}</td>
                                <td className="p-4 font-mono text-slate-700 dark:text-slate-300">{c.number}</td>
                                <td className="p-4 text-slate-700 dark:text-slate-300">{c.bankName}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${c.type === 'RECEIVED' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                                        {c.type}
                                    </span>
                                </td>
                                <td className="p-4 text-slate-900 dark:text-white font-medium">{c.payee}</td>
                                <td className="p-4 text-right font-bold text-slate-900 dark:text-white">₹{c.amount.toLocaleString()}</td>
                                <td className="p-4 text-center">
                                    {c.status === 'PENDING' && <span className="flex items-center justify-center gap-1 text-yellow-600 dark:text-yellow-400 text-xs font-bold"><Clock className="w-3 h-3" /> Pending</span>}
                                    {c.status === 'CLEARED' && <span className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold"><CheckCircle2 className="w-3 h-3" /> Cleared</span>}
                                    {c.status === 'BOUNCED' && <span className="flex items-center justify-center gap-1 text-red-600 dark:text-red-400 text-xs font-bold"><AlertCircle className="w-3 h-3" /> Bounced</span>}
                                </td>
                                <td className="p-4 text-center">
                                    {c.status === 'PENDING' && (
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => onUpdateStatus(c.id, 'CLEARED')} className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded" title="Mark Cleared"><CheckCircle2 className="w-4 h-4" /></button>
                                            <button onClick={() => onUpdateStatus(c.id, 'BOUNCED')} className="p-1 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded" title="Mark Bounced"><AlertCircle className="w-4 h-4" /></button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ChequeLedger;
