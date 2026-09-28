import { useCallback, useState } from 'react';
import { formatReportDate } from '@/utils/formatters';

/**
 * Report period: one date range per report, from a preset or custom. Dates are local calendar dates
 * as 'yyyy-mm-dd' strings (what the report APIs take), never Date objects, so there is no timezone
 * drift between what the picker shows and what the server filters on.
 */

export type PeriodPreset =
    | 'today' | 'yesterday' | 'this-week' | 'this-month' | 'last-month'
    | 'last-3-months' | 'this-fy' | 'last-fy' | 'all' | 'custom';

export interface ReportPeriod {
    preset: PeriodPreset;
    /** Inclusive, 'yyyy-mm-dd'. Empty for 'all' (no date filter). */
    from: string;
    /** Inclusive, 'yyyy-mm-dd'. Empty for 'all' (no date filter). */
    to: string;
}

type RangePreset = Exclude<PeriodPreset, 'custom'>;

/** Offered only when the report opts in (useReportPeriod(…, { allowAllTime: true })). */
export const ALL_TIME_PRESET = { id: 'all' as const, label: 'All time' };

export const PERIOD_PRESETS: readonly { id: Exclude<RangePreset, 'all'>; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'this-week', label: 'This Week' },
    { id: 'this-month', label: 'This Month' },
    { id: 'last-month', label: 'Last Month' },
    { id: 'last-3-months', label: 'Last 3 Months' },
    { id: 'this-fy', label: 'This FY (Apr–Mar)' },
    { id: 'last-fy', label: 'Last FY' },
];

export const toIsoDate = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** 'yyyy-mm-dd' → local Date at midnight (new Date('yyyy-mm-dd') would be UTC midnight). */
export const parseIsoDate = (iso: string): Date | null => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!m) return null;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return d.getMonth() === Number(m[2]) - 1 ? d : null;
};

const day = (y: number, m: number, d: number) => new Date(y, m, d);

/** Indian financial year start (1 April) for the FY containing `d`. */
const fyStart = (d: Date): Date => day(d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1, 3, 1);

/** Date range for a preset, relative to `today` (injectable for tests). */
export function periodRange(preset: RangePreset, today: Date = new Date()): { from: string; to: string } {
    const y = today.getFullYear();
    const m = today.getMonth();
    const d = today.getDate();
    const t = day(y, m, d);
    switch (preset) {
        case 'all':
            return { from: '', to: '' };
        case 'today':
            return { from: toIsoDate(t), to: toIsoDate(t) };
        case 'yesterday': {
            const yd = day(y, m, d - 1);
            return { from: toIsoDate(yd), to: toIsoDate(yd) };
        }
        case 'this-week': {
            // Week starts Monday.
            const offset = (t.getDay() + 6) % 7;
            return { from: toIsoDate(day(y, m, d - offset)), to: toIsoDate(t) };
        }
        case 'this-month':
            return { from: toIsoDate(day(y, m, 1)), to: toIsoDate(t) };
        case 'last-month':
            return { from: toIsoDate(day(y, m - 1, 1)), to: toIsoDate(day(y, m, 0)) };
        case 'last-3-months':
            // Current month plus the two before it (whole calendar months, so it lines up with monthly books).
            return { from: toIsoDate(day(y, m - 2, 1)), to: toIsoDate(t) };
        case 'this-fy':
            return { from: toIsoDate(fyStart(t)), to: toIsoDate(t) };
        case 'last-fy': {
            const start = fyStart(t);
            return {
                from: toIsoDate(day(start.getFullYear() - 1, 3, 1)),
                to: toIsoDate(day(start.getFullYear(), 2, 31)),
            };
        }
    }
}

/** "1 Dec 2025 – 23 Sep 2026", or a single date when from === to. */
export const periodLabel = (period: Pick<ReportPeriod, 'from' | 'to'>): string => {
    if (!period.from && !period.to) return 'All time';
    const from = formatReportDate(parseIsoDate(period.from));
    if (period.from === period.to) return from;
    return `${from} – ${formatReportDate(parseIsoDate(period.to))}`;
};

export interface UseReportPeriod {
    period: ReportPeriod;
    label: string;
    /** Whether "All time" (no date filter) is offered. */
    allowAllTime: boolean;
    setPreset: (preset: RangePreset) => void;
    /** Ignored if either date is invalid; swaps them if from > to. */
    setCustom: (from: string, to: string) => void;
}

export function useReportPeriod(initial: RangePreset = 'this-month', options: { allowAllTime?: boolean } = {}): UseReportPeriod {
    const allowAllTime = options.allowAllTime ?? initial === 'all';
    const [period, setPeriod] = useState<ReportPeriod>(() => ({ preset: initial, ...periodRange(initial) }));

    const setPreset = useCallback((preset: RangePreset) => {
        setPeriod({ preset, ...periodRange(preset) });
    }, []);

    const setCustom = useCallback((from: string, to: string) => {
        if (!parseIsoDate(from) || !parseIsoDate(to)) return;
        const [a, b] = from <= to ? [from, to] : [to, from];
        setPeriod({ preset: 'custom', from: a, to: b });
    }, []);

    return { period, label: periodLabel(period), allowAllTime, setPreset, setCustom };
}
