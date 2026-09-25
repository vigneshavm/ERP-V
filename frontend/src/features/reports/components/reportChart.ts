/**
 * One chart style for every report (Recharts). Colors are CSS variables set on ReportAnalysisCard, so light and
 * dark mode each get their own validated steps instead of an automatic flip.
 *
 * - Single-measure charts use the app's primary color.
 * - Multi-series charts take CHART_SERIES in fixed order (never cycled; a 9th series folds into "Other").
 *   The palette is colour-blind checked for adjacent series (bars, stacks, lines).
 * - One y-axis per chart. Two measures of different scale go in two charts, never a dual axis.
 */

export const CHART_PRIMARY = 'rgb(var(--color-primary))';

export const CHART_SERIES = [
    'var(--chart-series-1)', 'var(--chart-series-2)', 'var(--chart-series-3)', 'var(--chart-series-4)',
    'var(--chart-series-5)', 'var(--chart-series-6)', 'var(--chart-series-7)', 'var(--chart-series-8)',
] as const;

/**
 * Tailwind arbitrary properties for ReportAnalysisCard: series colors (light / dark steps), grid and axis ink.
 * Written out in full so Tailwind picks them up.
 */
export const CHART_VARS_CLASS = [
    '[--chart-series-1:#2a78d6] [--chart-series-2:#eb6834] [--chart-series-3:#1baf7a] [--chart-series-4:#eda100]',
    '[--chart-series-5:#e87ba4] [--chart-series-6:#008300] [--chart-series-7:#4a3aa7] [--chart-series-8:#e34948]',
    'dark:[--chart-series-1:#3987e5] dark:[--chart-series-2:#d95926] dark:[--chart-series-3:#199e70] dark:[--chart-series-4:#c98500]',
    'dark:[--chart-series-5:#d55181] dark:[--chart-series-6:#008300] dark:[--chart-series-7:#9085e9] dark:[--chart-series-8:#e66767]',
    '[--chart-grid:#e2e8f0] [--chart-axis:#64748b] [--chart-cursor:rgb(148_163_184/0.12)]',
    'dark:[--chart-grid:#334155] dark:[--chart-axis:#94a3b8] dark:[--chart-cursor:rgb(148_163_184/0.12)]',
].join(' ');

/** Recessive grid: horizontal lines only. Spread onto <CartesianGrid>. */
export const gridProps = { vertical: false, stroke: 'var(--chart-grid)' } as const;

/** Axis styling. Spread onto <XAxis>/<YAxis>. */
export const axisProps = {
    axisLine: false,
    tickLine: false,
    tick: { fill: 'var(--chart-axis)', fontSize: 11 },
} as const;

/** Bar hover highlight. Pass as <Tooltip cursor={…}>. */
export const cursorFill = { fill: 'var(--chart-cursor)' } as const;

/** 4px rounded data-end, square at the baseline. Vertical bars. */
export const BAR_RADIUS: [number, number, number, number] = [4, 4, 0, 0];
/** Same, for horizontal bars (layout="vertical"). */
export const HBAR_RADIUS: [number, number, number, number] = [0, 4, 4, 0];

/** Axis ticks in Indian units: ₹950, ₹12K, ₹4.2L, ₹1.3Cr. Tooltips show exact values. */
export function compactRupees(value: number): string {
    const v = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    if (v >= 1e7) return `${sign}₹${trim(v / 1e7)}Cr`;
    if (v >= 1e5) return `${sign}₹${trim(v / 1e5)}L`;
    if (v >= 1e3) return `${sign}₹${trim(v / 1e3)}K`;
    return `${sign}₹${Math.round(v)}`;
}

/** Compact counts for axis ticks: 950, 12K, 4.2L. */
export function compactNumber(value: number): string {
    const v = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    if (v >= 1e7) return `${sign}${trim(v / 1e7)}Cr`;
    if (v >= 1e5) return `${sign}${trim(v / 1e5)}L`;
    if (v >= 1e3) return `${sign}${trim(v / 1e3)}K`;
    return `${sign}${Math.round(v)}`;
}

const trim = (n: number): string => (n >= 100 ? String(Math.round(n)) : n.toFixed(1).replace(/\.0$/, ''));
