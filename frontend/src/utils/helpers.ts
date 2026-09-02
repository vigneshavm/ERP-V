
// Display-only date formatter, matching the browser/locale default `toLocaleDateString()` output
// with no arguments - the most common pattern that was previously duplicated inline across ~35
// files. Call sites using explicit Intl.DateTimeFormat options (a different visual format per
// call) were left alone rather than force-migrated to a single shape, since collapsing them would
// have silently changed what's on screen in each of those views.
export const formatDate = (date: string | number | Date): string => {
  return new Date(date).toLocaleDateString();
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
};

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
