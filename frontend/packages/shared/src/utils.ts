/**
 * Formats a number as a currency string.
 */
export const formatCurrency = (amount: number, currency?: string): string => {
  // Default to stored currency, or INR if nothing is stored
  const activeCurrency = currency || (typeof window !== 'undefined' ? localStorage.getItem('app-currency') : null) || 'INR';

  const currencySymbols: Record<string, string> = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'AED': 'د.إ'
  };

  const symbol = currencySymbols[activeCurrency] || activeCurrency;

  return `${symbol} ${new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)}`;
};

/**
 * Shared delay function for simulations
 */
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Period range utilities
 */
export const getPeriodRange = (date: Date, startDay: number) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth();
    const day = d.getDate();
    let start, end;
    if (day >= startDay) {
        start = new Date(year, month, startDay);
        end = new Date(year, month + 1, startDay - 1);
    } else {
        start = new Date(year, month - 1, startDay);
        end = new Date(year, month, startDay - 1);
    }
    return { start, end };
};

export const getNextPeriod = (currentStart: Date, startDay: number) => {
    const next = new Date(currentStart.getFullYear(), currentStart.getMonth() + 1, startDay);
    return getPeriodRange(next, startDay);
};

export const getPrevPeriod = (currentStart: Date, startDay: number) => {
    const prev = new Date(currentStart.getFullYear(), currentStart.getMonth() - 1, startDay);
    return getPeriodRange(prev, startDay);
};
