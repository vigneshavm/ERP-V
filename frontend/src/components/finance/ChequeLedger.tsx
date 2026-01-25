import React from 'react';
import { Clock, CheckCircle2, XCircle, ArrowDownLeft, ArrowUpRight, Search } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

interface ChequeLedgerProps {
    sectorCheques: any[];
    onUpdateStatus: (id: string, status: 'CLEARED' | 'BOUNCED') => void;
}

const ChequeLedger: React.FC<ChequeLedgerProps> = ({
    sectorCheques,
    onUpdateStatus
}) => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
                <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em]">Instrument Tracking Ledger</h4>
                <div className="flex gap-2 text-[10px] font-black uppercase italic">
                    <span className="text-warning">{sectorCheques.filter(c => c.status === 'PENDING').length} Pending</span>
                    <span className="text-success">{sectorCheques.filter(c => c.status === 'CLEARED').length} Cleared</span>
                </div>
            </div>

            {sectorCheques.length === 0 ? (
                <div className="py-24 text-center bg-neutral-50 dark:bg-neutral-900/50 rounded-[3rem] border border-dashed border-neutral-200 dark:border-neutral-800">
                    <Clock className="w-12 h-12 text-neutral-200 dark:text-neutral-800 mx-auto mb-4" />
                    <h5 className="text-xs font-black text-neutral-400 uppercase tracking-widest italic">No instruments located in this node</h5>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {sectorCheques.map((cheque) => (
                        <div
                            key={cheque.id}
                            className="bg-white dark:bg-neutral-800 rounded-[2.5rem] border border-neutral-100 dark:border-neutral-700 p-8 shadow-sm hover:shadow-2xl transition-all group"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className={`p-3 rounded-2xl ${cheque.type === 'RECEIVED' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'}`}>
                                    {cheque.type === 'RECEIVED' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                                </div>
                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest italic ${cheque.status === 'CLEARED' ? 'bg-success text-white' :
                                    cheque.status === 'BOUNCED' ? 'bg-error text-white' :
                                        'bg-warning/20 text-warning'
                                    }`}>
                                    {cheque.status}
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">Instrument Value</p>
                                    <h4 className="text-2xl font-black italic tracking-tighter">₹{formatCurrency(cheque.amount)}</h4>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">Payee/Entity</p>
                                        <p className="text-xs font-bold uppercase truncate">{cheque.payee}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">Clearing Date</p>
                                        <p className="text-xs font-bold uppercase italic">{new Date(cheque.date).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800 flex gap-3">
                                    {cheque.status === 'PENDING' ? (
                                        <>
                                            <button
                                                onClick={() => onUpdateStatus(cheque.id, 'CLEARED')}
                                                className="flex-1 py-3 bg-success text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-success/10 hover:scale-105 transition"
                                            >
                                                Commit
                                            </button>
                                            <button
                                                onClick={() => onUpdateStatus(cheque.id, 'BOUNCED')}
                                                className="flex-1 py-3 bg-error text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-error/10 hover:scale-105 transition"
                                            >
                                                Log Reject
                                            </button>
                                        </>
                                    ) : (
                                        <div className="w-full py-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl text-[9px] font-black uppercase tracking-widest text-neutral-400 text-center italic">
                                            Archived Instrument
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ChequeLedger;
