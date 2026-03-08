import React from 'react';
import { ConflictEntry, SyncStatus } from "../../../types/tenant";
import { CheckCircle2, AlertTriangle, Clock, GitMerge, Edit3 } from 'lucide-react';

interface ConflictsSectionProps {
    conflicts: ConflictEntry[];
    formatTimeAgo: (date: string) => string;
}

const ConflictsSection: React.FC<ConflictsSectionProps> = ({ conflicts, formatTimeAgo }) => {
    return (
        <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Conflict Resolution</h2>

            {conflicts.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-300">No Conflicts</p>
                    <p className="text-slate-500">All your data is perfectly synced across devices.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {conflicts.map((conflict) => (
                        <div key={conflict.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900/50 p-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertTriangle className="w-5 h-5 text-red-500" />
                                        <span className="font-black text-slate-900 dark:text-white">{conflict.entity} - {conflict.field}</span>
                                    </div>
                                    <p className="text-sm text-slate-500 mb-4">Conflict detected {formatTimeAgo(conflict.occurredAt)}</p>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Local Value</p>
                                            <p className="font-bold text-slate-900 dark:text-white">{conflict.localValue}</p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Remote Value</p>
                                            <p className="font-bold text-slate-900 dark:text-white">{conflict.remoteValue}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 flex items-center gap-2">
                                        <Clock className="w-3 h-3" /> Use Latest
                                    </button>
                                    <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200 flex items-center gap-2">
                                        <GitMerge className="w-3 h-3" /> Merge
                                    </button>
                                    <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200 flex items-center gap-2">
                                        <Edit3 className="w-3 h-3" /> Manual
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ConflictsSection;
