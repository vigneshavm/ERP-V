import React from 'react';
import { Clock } from 'lucide-react';
import { formatCurrency } from "@/utils/helpers";

interface ChequeLedgerProps {
    sectorCheques: any[];
    onUpdateStatus: (id: string, status: 'CLEARED' | 'BOUNCED') => void;
}

const ChequeLedger: React.FC<ChequeLedgerProps> = ({ sectorCheques, onUpdateStatus }) => {
    return (
        <div className="bg-white dark:bg-neutral-800 p-8 rounded-[2.5rem] border border-neutral-100 dark:border-neutral-700 shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="text-left text-[10px] font-black uppercase tracking-widest text-neutral-400 border-b border-neutral-100 dark:border-neutral-700">
                            <th className="pb-4 pl-4">Date</th>
                            <th className="pb-4">Cheque No</th>
                            <th className="pb-4">Details</th>
                            <th className="pb-4">Amount</th>
                            <th className="pb-4">Status</th>
                            <th className="pb-4 pr-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm font-medium">
                        {sectorCheques.map((cheque: any) => (
                            <tr key={cheque.id} className="group hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                                <td className="py-4 pl-4 text-neutral-500 w-32">{new Date(cheque.date).toLocaleDateString()}</td>
                                <td className="py-4 font-mono text-xs">{cheque.number}</td>
                                <td className="py-4">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-neutral-800 dark:text-neutral-200">{cheque.payee}</span>
                                        <span className="text-[10px] text-neutral-400 uppercase tracking-wider">{cheque.bankName}</span>
                                    </div>
                                </td>
                                <td className="py-4 font-black">₹{formatCurrency(cheque.amount)}</td>
                                <td className="py-4">
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${cheque.status === 'CLEARED' ? 'bg-success/10 text-success' :
                                        cheque.status === 'BOUNCED' ? 'bg-error/10 text-error' :
                                            'bg-warning/10 text-warning'
                                        }`}>
                                        {cheque.status}
                                    </span>
                                </td>
                                <td className="py-4 pr-4 text-right">
                                    {cheque.status === 'PENDING' && (
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => onUpdateStatus(cheque.id || cheque._id, 'CLEARED')}
                                                className="px-3 py-1 bg-success text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:scale-105 transition"
                                            >
                                                Clear
                                            </button>
                                            <button
                                                onClick={() => onUpdateStatus(cheque.id || cheque._id, 'BOUNCED')}
                                                className="px-3 py-1 bg-error text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:scale-105 transition"
                                            >
                                                Bounce
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {sectorCheques.length === 0 && (
                    <div className="p-12 text-center opacity-50">
                        <Clock className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
                        <p className="text-xs font-black uppercase tracking-widest text-neutral-400">No Cheques Recorded</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChequeLedger;
