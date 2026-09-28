import React, { useState } from 'react';

/** Filter controls for the shell's Filters panel, so every report's filters look and behave the same. */

const fieldCls = 'px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.2)]';

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{children}</span>
);

export interface FilterOption {
    value: string;
    label?: string;
}

/** Dropdown. The first option is the "no filter" choice (value ''). */
export const FilterSelect: React.FC<{
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: FilterOption[];
    /** Label of the empty "no filter" option; omit when the report always has a value (e.g. Customers/Suppliers). */
    allLabel?: string;
}> = ({ label, value, onChange, options, allLabel }) => {
    // Keep a selected value visible even if the options list no longer contains it.
    const list = value && !options.some(o => o.value === value) ? [{ value }, ...options] : options;
    return (
        <label className="flex flex-col gap-1 min-w-[10rem]">
            <Label>{label}</Label>
            <select value={value} onChange={e => onChange(e.target.value)} className={fieldCls}>
                {allLabel !== undefined && <option value="">{allLabel}</option>}
                {list.map(o => <option key={o.value} value={o.value}>{o.label ?? o.value}</option>)}
            </select>
        </label>
    );
};

/**
 * Type-ahead over a long list (brands, suppliers). Only a value that is in the list (or empty) is applied,
 * so half-typed text never filters the report.
 */
export const FilterSearchList: React.FC<{
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: FilterOption[];
    placeholder?: string;
}> = ({ id, label, value, onChange, options, placeholder }) => {
    const [draft, setDraft] = useState(value);
    // Follow outside changes (e.g. "Clear all"), adjusted during render.
    const [seen, setSeen] = useState(value);
    if (seen !== value) {
        setSeen(value);
        setDraft(value);
    }
    const match = (v: string) => options.find(o => o.value.toLowerCase() === v.trim().toLowerCase());
    return (
        <label className="flex flex-col gap-1 min-w-[12rem] flex-1">
            <Label>{label}</Label>
            <input
                list={id}
                value={draft}
                placeholder={placeholder ?? `All ${label.toLowerCase()}s`}
                onChange={e => {
                    const v = e.target.value;
                    setDraft(v);
                    if (!v.trim()) onChange('');
                    else {
                        const m = match(v);
                        if (m) onChange(m.value);
                    }
                }}
                onBlur={() => { if (draft.trim() && !match(draft)) setDraft(value); }}
                className={fieldCls}
            />
            <datalist id={id}>
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </datalist>
        </label>
    );
};

/** A from/to date pair, for dates other than the report period (e.g. purchase date on stock reports). */
export const FilterDateRange: React.FC<{
    label: string;
    from: string;
    to: string;
    onChange: (from: string, to: string) => void;
    min?: string;
    max?: string;
}> = ({ label, from, to, onChange, min, max }) => (
    <>
        <label className="flex flex-col gap-1">
            <Label>{label} from</Label>
            <input type="date" value={from} min={min} max={to || max} onChange={e => onChange(e.target.value, to)} className={fieldCls} />
        </label>
        <label className="flex flex-col gap-1">
            <Label>To</Label>
            <input type="date" value={to} min={from || min} max={max} onChange={e => onChange(from, e.target.value)} className={fieldCls} />
        </label>
    </>
);

/** Pick any number of values from a long list (with its own search box). Empty selection = no filter. */
export const FilterMultiSelect: React.FC<{
    label: string;
    values: string[];
    onChange: (values: string[]) => void;
    options: string[];
}> = ({ label, values, onChange, options }) => {
    const [query, setQuery] = useState('');
    const q = query.trim().toLowerCase();
    const shown = q ? options.filter(o => o.toLowerCase().includes(q)) : options;
    const toggle = (v: string) => onChange(values.includes(v) ? values.filter(x => x !== v) : [...values, v]);
    return (
        <div className="flex flex-col gap-1 min-w-[16rem] flex-1">
            <div className="flex items-center justify-between">
                <Label>{label}{values.length ? ` · ${values.length} selected` : ''}</Label>
                {values.length > 0 && (
                    <button type="button" onClick={() => onChange([])} className="text-[11px] font-bold text-primary hover:underline">Clear</button>
                )}
            </div>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder={`Search ${label.toLowerCase()}s…`} className={fieldCls} aria-label={`Search ${label.toLowerCase()}s`} />
            <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg divide-y divide-slate-100 dark:divide-slate-700">
                {shown.length === 0 && <p className="px-3 py-2 text-xs text-slate-400">No match</p>}
                {shown.map(o => (
                    <label key={o} className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer">
                        <input type="checkbox" checked={values.includes(o)} onChange={() => toggle(o)} className="accent-[rgb(var(--color-primary))]" />
                        {o}
                    </label>
                ))}
            </div>
        </div>
    );
};
