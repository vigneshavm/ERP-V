import { formatCurrency, formatReportDate } from '@/utils/formatters';
import type { AlertLevel, LoanHealth } from './cashBankTypes';

export const rupees0 = (v: number) => formatCurrency(v, { fractionDigits: 0 });
export const dateText = (iso: string | null | undefined) => (iso ? formatReportDate(iso) : '—');

export const ALERT_STYLE: Record<AlertLevel, string> = {
    critical: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200',
    warning: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200',
    info: 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-200',
};

export const LOAN_HEALTH_LABEL: Record<LoanHealth, string> = { overdue: 'EMI overdue', 'due-soon': 'Due soon', 'on-track': 'On track', closed: 'Closed' };
export const LOAN_HEALTH_TONE = { 'EMI overdue': 'danger', 'Due soon': 'warning', 'On track': 'success', Closed: 'neutral' } as const;

/** Standard reducing-balance EMI: P·i·(1+i)^n / ((1+i)^n − 1), i = annual rate / 12 / 100. Zero rate: P / n. */
export function emiFor(principal: number, annualRatePct: number, months: number): number {
    if (!(principal > 0) || !(months > 0)) return 0;
    const i = annualRatePct / 1200;
    if (i <= 0) return Math.round(principal / months);
    const f = (1 + i) ** months;
    return Math.round((principal * i * f) / (f - 1));
}
