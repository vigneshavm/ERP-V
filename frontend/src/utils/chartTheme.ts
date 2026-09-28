/**
 * Chart colours. Series use their own palette (never status colours), in
 * this fixed order, checked for colour blindness in light and dark mode.
 * Recharts needs real colour values (SVG attributes can't read CSS vars),
 * so these are hex and switch with the theme.
 */

export const CHART_SERIES_LIGHT = ['#4F46E5', '#0D9488', '#D97706', '#7C3AED', '#0284C7', '#DB2777'];
export const CHART_SERIES_DARK = ['#6366F1', '#0D9488', '#D97706', '#8B5CF6', '#0284C7', '#EC4899'];

export const chartSeries = (isDark: boolean): string[] => (isDark ? CHART_SERIES_DARK : CHART_SERIES_LIGHT);

/** Axis, grid and tooltip colours that match the slate tokens in index.css. */
export const chartChrome = (isDark: boolean) => ({
    grid: isDark ? '#30363D' : '#E2E8F0',
    axis: isDark ? '#8A94A3' : '#64748B',
    tooltipBg: isDark ? '#101418' : '#FFFFFF',
    tooltipBorder: isDark ? '#30363D' : '#E2E8F0',
    tooltipText: isDark ? '#E6EDF3' : '#0F172A'
});

/** True when the app is currently showing dark mode (covers the "system" setting). */
export const isDarkMode = (): boolean =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
