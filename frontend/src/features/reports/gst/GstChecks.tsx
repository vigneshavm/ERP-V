import React from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import type { Finding } from './gstFindings';

const TONE = {
    warning: { icon: AlertTriangle, cls: 'text-amber-700 dark:text-amber-300', label: 'Check' },
    info: { icon: Info, cls: 'text-slate-500 dark:text-slate-400', label: 'Note' },
};

/** "Before you file" panel: the reconciliation findings behind the figures, each with an icon and label. */
export const GstChecks: React.FC<{ findings: Finding[] }> = ({ findings }) => (
    <section className="bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm p-5">
        <h3 className="font-bold text-slate-900 dark:text-white text-sm">Before you file</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Reconciliation checks on the data behind these figures.</p>
        {findings.length === 0 ? (
            <p className="mt-3 flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4" aria-hidden /> No issues found for this period.
            </p>
        ) : (
            <ul className="mt-3 space-y-2">
                {findings.map(f => {
                    const t = TONE[f.tone];
                    const Icon = t.icon;
                    return (
                        <li key={f.text} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                            <Icon className={`w-4 h-4 shrink-0 mt-px ${t.cls}`} aria-hidden />
                            <span><b className={t.cls}>{t.label}: </b>{f.text}</span>
                        </li>
                    );
                })}
            </ul>
        )}
    </section>
);
