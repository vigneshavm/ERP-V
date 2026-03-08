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
