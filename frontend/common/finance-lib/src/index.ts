import Decimal from 'decimal.js';

export class FinanceMath {
    /**
     * Adds two numbers with decimal precision.
     */
    static add(a: number | string, b: number | string): string {
        return new Decimal(a).add(new Decimal(b)).toString();
    }

    /**
     * Subtracts b from a with decimal precision.
     */
    static subtract(a: number | string, b: number | string): string {
        return new Decimal(a).sub(new Decimal(b)).toString();
    }

    /**
     * Multiplies two numbers with decimal precision.
     */
    static multiply(a: number | string, b: number | string): string {
        return new Decimal(a).mul(new Decimal(b)).toString();
    }

    /**
     * Formats an amount as currency.
     */
    static formatCurrency(amount: number | string, locale: string = 'en-IN', currency: string = 'INR'): string {
        const val = typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency,
            maximumFractionDigits: 2
        }).format(val);
    }
}
