
// formatDate / formatCurrency now live in ./formatters (the canonical formatter module) and are
// re-exported here so existing `utils/helpers` imports keep working. New code should import
// from '@/utils/formatters' directly.
export { formatDate, formatCurrency } from './formatters';

export const formatDateISO = (dateOrYear: Date | number, month?: number, day?: number): string => {
  if (dateOrYear instanceof Date) {
    return dateOrYear.toISOString().split('T')[0];
  }
  if (typeof dateOrYear === 'number' && typeof month === 'number' && typeof day === 'number') {
    const d = new Date(Date.UTC(dateOrYear, month, day));
    return d.toISOString().split('T')[0];
  }
  return '';
};

export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

export const getFirstDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month, 1).getDay();
};
