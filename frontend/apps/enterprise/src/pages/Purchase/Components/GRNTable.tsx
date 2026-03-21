import React from 'react';
import { 
    Eye, 
    FileText, 
    MoreVertical, 
    Truck, 
    CheckCircle, 
    Clock, 
    AlertTriangle, 
    ChevronRight,
    ArrowUpRight,
    Box,
    Building2,
    Database,
    ShieldCheck
} from 'lucide-react';

interface GRNTableProps {
    records: any[];
    onView: (id: string) => void;
    onCreateBill?: (id: string) => void;
}

const GRNTable: React.FC<GRNTableProps> = ({ records, onView, onCreateBill }) => {
    
    const getStatusBadge = (status: string) => {
        const s = status.toUpperCase();
        const configs: any = {
            'RECEIVED': { color: 'emerald', icon: CheckCircle, label: 'Fulfilled' },
            'PENDING': { color: 'amber', icon: Clock, label: 'In-Transit' },
            'VERIFIED': { color: 'blue', icon: ShieldCheck, label: 'Audited' },
            'DISPUTED': { color: 'rose', icon: AlertTriangle, label: 'Variance' },
        };
        const config = configs[s] || { color: 'neutral', icon: FileText, label: status };
        
        return (
            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 bg-${config.color}-500/10 text-${config.color}-600 dark:text-${config.color}-400 border border-${config.color}-500/20`}>
                <config.icon className="w-3 h-3" /> {config.label}
            </span>
        );
    };

    return (
        <div className="erp-card rounded-[3rem] p-4 shadow-sm border-none overflow-hidden relative group">
            <div className="overflow-x-auto px-2">
                <table className="w-full text-left border-separate border-spacing-y-4">
                    <thead>
                        <tr className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em]">
                            <th className="px-8 py-2">Receipt Identity</th>
                            <th className="px-8 py-2">Vendor / PO Reference</th>
                            <th className="px-8 py-2 text-center">Manifest Scope</th>
                            <th className="px-8 py-2 text-right">Aggregate Value</th>
                            <th className="px-8 py-2 text-center">Protocol State</th>
                            <th className="px-8 py-2 text-right">Commands</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-8 py-32 text-center">
                                    <div className="flex flex-col items-center">
                                        <div className="p-8 bg-neutral-50 dark:bg-neutral-900 rounded-[3rem] text-neutral-200 mb-6">
                                            <Box className="w-16 h-16" />
                                        </div>
                                        <h3 className="text-xl font-black text-neutral-900 dark:text-main uppercase tracking-tighter italic">Vortex: Receipt Null</h3>
                                        <p className="text-sm font-bold text-neutral-500 mt-2 italic">No inbound manifestations detected in current cycle.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            records.map((r) => (
                                <tr
                                    key={r._id}
                                    className="group/row hover:transform hover:-translate-y-1 transition-all duration-500 cursor-pointer"
                                    onClick={() => onView(r._id)}
                                >
                                    <td className="px-2 py-1">
                                        <div className="bg-white dark:bg-neutral-900 rounded-l-[1.5rem] p-6 border-y border-l border-default dark:border-neutral-800 group-hover/row:border-emerald-500/20 transition-all">
                                            <div className="text-sm font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tighter italic leading-none mb-1 group-hover/row:text-emerald-500">
                                                #{r.grnNumber}
                                            </div>
                                            <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest italic leading-none">
                                                Logged {new Date(r.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-0 py-1">
                                        <div className="bg-white dark:bg-neutral-900 p-6 border-y border-default dark:border-neutral-800 group-hover/row:border-emerald-500/20 transition-all">
                                            <div className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-widest italic truncate max-w-[180px]">
                                                {r.vendorId?.businessName || r.vendorName}
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <FileText className="w-3 h-3 text-blue-500" />
                                                <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">PO: {r.poNumber || 'CASHREC'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-0 py-1 text-center">
                                        <div className="bg-white dark:bg-neutral-900 p-6 border-y border-default dark:border-neutral-800 group-hover/row:border-emerald-500/20 transition-all">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] font-black text-neutral-700 dark:text-neutral-300 italic tracking-widest uppercase">Items</span>
                                                    <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest italic">Inventory Units</span>
                                                </div>
                                                <span className="text-2xl font-black text-neutral-900 dark:text-main italic tracking-tighter">{r.items?.length || 0}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-0 py-1 text-right">
                                        <div className="bg-white dark:bg-neutral-900 p-6 border-y border-default dark:border-neutral-800 group-hover/row:border-emerald-500/20 transition-all font-mono font-black text-neutral-900 dark:text-neutral-300 italic text-sm">
                                            ₹ {(r.totalAmount || 0).toLocaleString('en-IN')}
                                        </div>
                                    </td>
                                    <td className="px-0 py-1 text-center">
                                        <div className="bg-white dark:bg-neutral-900 p-6 border-y border-default dark:border-neutral-800 group-hover/row:border-emerald-500/20 transition-all flex justify-center">
                                            {getStatusBadge(r.status || 'PENDING')}
                                        </div>
                                    </td>
                                    <td className="px-0 py-1 text-right">
                                        <div className="bg-white dark:bg-neutral-900 rounded-r-[1.5rem] p-6 border-y border-r border-default dark:border-neutral-800 group-hover/row:border-emerald-500/20 transition-all">
                                            <div className="flex justify-end gap-3" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={() => onView(r._id)}
                                                    className="p-3 bg-neutral-50 dark:bg-neutral-800 text-neutral-400 group-hover:bg-blue-600 group-hover:text-white rounded-xl transition-all shadow-sm active:scale-95"
                                                    title="Registry View"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                {onCreateBill && r.status === 'RECEIVED' && (
                                                    <button
                                                        onClick={() => onCreateBill(r._id)}
                                                        className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-95"
                                                        title="Liquidate to Bill"
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default GRNTable;
