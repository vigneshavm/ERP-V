import React, { useCallback, useState } from 'react';
import { Calendar, Check, ChevronDown } from 'lucide-react';
import { ALL_TIME_PRESET, PERIOD_PRESETS, UseReportPeriod } from '../hooks/useReportPeriod';
import { useDismiss } from './useDismiss';

const inputCls = 'w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.2)]';

/** The period control: always shows the selected range; presets plus a custom from/to. */
export const ReportPeriodPicker: React.FC<{ value: UseReportPeriod; disabled?: boolean }> = ({ value, disabled }) => {
    const { period, label, allowAllTime, setPreset, setCustom } = value;
    const presets = allowAllTime ? [ALL_TIME_PRESET, ...PERIOD_PRESETS] : PERIOD_PRESETS;
    const [open, setOpen] = useState(false);
    const [draftFrom, setDraftFrom] = useState(period.from);
    const [draftTo, setDraftTo] = useState(period.to);
    const close = useCallback(() => setOpen(false), []);
    const ref = useDismiss<HTMLDivElement>(open, close);

    const toggle = () => {
        if (!open) {
            setDraftFrom(period.from);
            setDraftTo(period.to);
        }
        setOpen(!open);
    };

    const customValid = Boolean(draftFrom && draftTo);

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={toggle}
                disabled={disabled}
                aria-haspopup="dialog"
                aria-expanded={open}
                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
            >
                <Calendar className="w-4 h-4 text-slate-400" aria-hidden />
                <span className="whitespace-nowrap">{label}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" aria-hidden />
            </button>

            {open && (
                <div role="dialog" aria-label="Report period" className="absolute left-0 z-30 mt-1 w-72 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl p-2">
                    <ul className="grid grid-cols-2 gap-1">
                        {presets.map(p => {
                            const active = period.preset === p.id;
                            return (
                                <li key={p.id}>
                                    <button
                                        type="button"
                                        onClick={() => { setPreset(p.id); close(); }}
                                        className={`w-full flex items-center justify-between gap-1 px-2.5 py-1.5 rounded-md text-xs font-bold text-left ${active ? 'bg-[rgb(var(--color-primary)/0.1)] text-primary' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                    >
                                        {p.label}
                                        {active && <Check className="w-3.5 h-3.5 shrink-0" aria-hidden />}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Custom range</p>
                        <div className="grid grid-cols-2 gap-2">
                            <label className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">From</span>
                                <input type="date" value={draftFrom} max={draftTo || undefined} onChange={e => setDraftFrom(e.target.value)} className={inputCls} />
                            </label>
                            <label className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">To</span>
                                <input type="date" value={draftTo} min={draftFrom || undefined} onChange={e => setDraftTo(e.target.value)} className={inputCls} />
                            </label>
                        </div>
                        <button
                            type="button"
                            disabled={!customValid}
                            onClick={() => { setCustom(draftFrom, draftTo); close(); }}
                            className="w-full py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-[rgb(var(--color-primary-hover))] disabled:opacity-50"
                        >
                            Apply range
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
