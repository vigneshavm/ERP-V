import React, { useState } from 'react';
import { ConflictEntry } from "../../../types/tenant";
import {
    CheckCircle2, AlertTriangle, Clock, GitMerge, Edit3, Check,
    Shield, ArrowRight, ArrowLeft, Zap, Sparkles, ChevronDown, ChevronUp
} from 'lucide-react';

interface ConflictsSectionProps {
    conflicts: ConflictEntry[];
    formatTimeAgo: (date: string) => string;
}

/* ─── Visual Diff Line ─────────────────────────────────────── */
const FieldDiff: React.FC<{
    field: string; local: string; remote: string; onResolve: (choice: 'local' | 'remote') => void;
}> = ({ field, local, remote, onResolve }) => {
    // Compute char-level diff highlight
    const diffChars = (a: string, b: string) => {
        const maxLen = Math.max(a.length, b.length);
        const result: { char: string; changed: boolean }[] = [];
        for (let i = 0; i < maxLen; i++) {
            result.push({ char: b[i] || '', changed: a[i] !== b[i] });
        }
        return result;
    };

    const localDiff = diffChars(remote, local);
    const remoteDiff = diffChars(local, remote);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Local Value */}
            <div
                className="relative rounded-2xl p-5 bg-blue-50/50 dark:bg-blue-900/10 border-2 border-blue-200 dark:border-blue-800 cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition-all group"
                onClick={() => onResolve('local')}
            >
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">This Device</span>
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" /> Use This
                    </span>
                </div>
                <p className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                    {localDiff.map((c, i) => (
                        <span key={i} className={c.changed ? 'bg-blue-200 dark:bg-blue-800 rounded px-0.5' : ''}>{c.char}</span>
                    ))}
                </p>
            </div>

            {/* Remote Value */}
            <div
                className="relative rounded-2xl p-5 bg-violet-50/50 dark:bg-violet-900/10 border-2 border-violet-200 dark:border-violet-800 cursor-pointer hover:border-violet-400 dark:hover:border-violet-600 transition-all group"
                onClick={() => onResolve('remote')}
            >
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-violet-500" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-violet-600 dark:text-violet-400">Cloud / Remote</span>
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" /> Use This
                    </span>
                </div>
                <p className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                    {remoteDiff.map((c, i) => (
                        <span key={i} className={c.changed ? 'bg-violet-200 dark:bg-violet-800 rounded px-0.5' : ''}>{c.char}</span>
                    ))}
                </p>
            </div>
        </div>
    );
};

/* ─── Conflict Card ────────────────────────────────────────── */
const ConflictCard: React.FC<{
    conflict: ConflictEntry; formatTimeAgo: (d: string) => string;
}> = ({ conflict, formatTimeAgo }) => {
    const [expanded, setExpanded] = useState(true);
    const [resolved, setResolved] = useState<'local' | 'remote' | null>(null);

    const handleResolve = (choice: 'local' | 'remote') => {
        setResolved(choice);
    };

    return (
        <div className={`bg-white dark:bg-slate-900 rounded-3xl border overflow-hidden transition-all shadow-sm ${
            resolved ? 'border-emerald-200 dark:border-emerald-800' : 'border-red-200 dark:border-red-900/50'
        }`}>
            {/* Card Header */}
            <div
                className={`px-6 py-5 flex items-center justify-between cursor-pointer transition-colors ${
                    resolved ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : 'bg-red-50/30 dark:bg-red-900/10'
                }`}
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        resolved ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'
                    }`}>
                        {resolved ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="font-black text-slate-900 dark:text-white">{conflict.entity}</span>
                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-md font-mono">
                                .{conflict.field}
                            </span>
                            {resolved && (
                                <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Resolved — {resolved === 'local' ? 'Local' : 'Remote'}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                            <Clock className="w-3 h-3" /> Detected {formatTimeAgo(conflict.occurredAt)}
                            <span className="font-mono text-[10px] opacity-50">ID: {conflict.entityId?.substring(0, 8)}</span>
                        </p>
                    </div>
                </div>
                {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>

            {/* Card Body */}
            {expanded && !resolved && (
                <div className="p-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                    {/* Visual Diff */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Zap className="w-4 h-4 text-amber-500" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Field Comparison — Click to accept</span>
                        </div>
                        <FieldDiff
                            field={conflict.field}
                            local={String(conflict.localValue || '')}
                            remote={String(conflict.remoteValue || '')}
                            onResolve={handleResolve}
                        />
                    </div>

                    {/* Quick Actions */}
                    <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                            onClick={() => handleResolve('remote')}
                            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-200 dark:shadow-none"
                        >
                            <Clock className="w-3.5 h-3.5" /> Use Latest (Remote)
                        </button>
                        <button
                            onClick={() => handleResolve('local')}
                            className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black hover:bg-slate-50 flex items-center gap-2 transition-all"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" /> Keep Local
                        </button>
                        <button className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black hover:bg-slate-50 flex items-center gap-2 transition-all">
                            <GitMerge className="w-3.5 h-3.5" /> Smart Merge
                        </button>
                        <button className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black hover:bg-slate-50 flex items-center gap-2 transition-all">
                            <Edit3 className="w-3.5 h-3.5" /> Manual Edit
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

/* ─── Main Component ───────────────────────────────────────── */
const ConflictsSection: React.FC<ConflictsSectionProps> = ({ conflicts, formatTimeAgo }) => {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white">Conflict Resolution</h2>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">Review and resolve data discrepancies between devices</p>
                    </div>
                </div>
                {conflicts.length > 0 && (
                    <span className="px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                        {conflicts.length} Pending
                    </span>
                )}
            </div>

            {conflicts.length === 0 ? (
                <div className="text-center py-20 bg-emerald-50/30 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100 dark:border-emerald-800">
                    <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h3 className="text-lg font-black text-slate-800 dark:text-white mb-2">Perfect Harmony</h3>
                    <p className="text-sm text-slate-500 font-medium max-w-sm mx-auto">All your data is perfectly synchronized across every connected device. No conflicts detected.</p>
                    <div className="flex items-center justify-center gap-2 mt-4 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                        <Sparkles className="w-3.5 h-3.5" /> Zero Conflicts
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {conflicts.map((conflict) => (
                        <ConflictCard
                            key={conflict.id}
                            conflict={conflict}
                            formatTimeAgo={formatTimeAgo}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ConflictsSection;
