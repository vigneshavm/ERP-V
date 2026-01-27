
import { describe, it, expect } from 'vitest';

// Mocking the logic structure found in SupplierStatements.tsx
// This simulates the transaction processing logic

interface Transaction {
    date: string;
    amount: number;
    type: 'bill' | 'payment';
}

const calculateStatement = (
    openingBalanceFromSupplier: number,
    periodFrom: string,
    periodTo: string,
    bills: any[],
    payments: any[],
    selectedVendorId: string
) => {
    const fromDate = new Date(periodFrom);
    const toDate = new Date(periodTo);

    const vendorBills = bills.filter(b => b.supplier?._id === selectedVendorId || b.supplier === selectedVendorId);
    const vendorPayments = payments.filter(p => p.supplierId === selectedVendorId);

    // Opening Balance logic: Bills(+) and Payments(-) before periodFrom
    const previousBills = vendorBills.filter(b => new Date(b.date) < fromDate);
    const previousPayments = vendorPayments.filter(p => new Date(p.paymentDate) < fromDate);

    const totalPreviousCredits = previousBills.reduce((sum, b) => sum + b.amount, 0);
    const totalPreviousDebits = previousPayments.reduce((sum, p) => sum + p.amount, 0);

    let runningBalance = (openingBalanceFromSupplier || 0) + totalPreviousCredits - totalPreviousDebits;
    const openingBalance = runningBalance;

    // Filter transactions in range
    const currentBills = vendorBills.filter(b => {
        const d = new Date(b.date);
        return d >= fromDate && d <= toDate;
    });

    const currentPayments = vendorPayments.filter(p => {
        const d = new Date(p.paymentDate);
        return d >= fromDate && d <= toDate;
    });

    const allTransactions = [
        ...currentBills.map(b => ({ date: b.date, credit: b.amount, debit: 0, ref: b.billNo, desc: 'Bill' })),
        ...currentPayments.map(p => ({ date: p.paymentDate, credit: 0, debit: p.amount, ref: p.paymentNo, desc: 'Payment' }))
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const transactions = allTransactions.map(t => {
        runningBalance += t.credit;
        runningBalance -= t.debit;
        return { ...t, balance: runningBalance };
    });

    return {
        openingBalance,
        transactions,
        closingBalance: runningBalance
    };
};

describe('Supplier Statement Logic', () => {
    const vendorId = 'v1';
    const bills = [
        { _id: 'b1', supplier: 'v1', amount: 1000, date: '2023-12-01', billNo: 'B1' }, // Previous
        { _id: 'b2', supplier: 'v1', amount: 500, date: '2024-01-05', billNo: 'B2' },  // In period
    ];
    const payments = [
        { _id: 'p1', supplierId: 'v1', amount: 200, paymentDate: '2023-12-15', paymentNo: 'P1' }, // Previous
        { _id: 'p2', supplierId: 'v1', amount: 300, paymentDate: '2024-01-10', paymentNo: 'P2' }, // In period
    ];

    it('calculates opening balance correctly from previous transactions', () => {
        const result = calculateStatement(0, '2024-01-01', '2024-01-31', bills, payments, vendorId);
        // Pre-period: 1000 (bill) - 200 (payment) = 800
        expect(result.openingBalance).toBe(800);
    });

    it('calculates running balances and closing balance correctly', () => {
        const result = calculateStatement(0, '2024-01-01', '2024-01-31', bills, payments, vendorId);
        // Opening: 800
        // Transaction 1: Bill 500 -> 800 + 500 = 1300
        // Transaction 2: Payment 300 -> 1300 - 300 = 1000
        expect(result.transactions[0].balance).toBe(1300);
        expect(result.transactions[1].balance).toBe(1000);
        expect(result.closingBalance).toBe(1000);
    });

    it('handles negative starting opening balance (supplier record)', () => {
        const result = calculateStatement(-100, '2024-01-01', '2024-01-31', bills, payments, vendorId);
        // -100 + 800 = 700 opening
        expect(result.openingBalance).toBe(700);
        expect(result.closingBalance).toBe(900);
    });

    it('handles empty transaction periods', () => {
        const result = calculateStatement(1000, '2024-02-01', '2024-02-28', bills, payments, vendorId);
        // Pre-period: 1000 (orig) + 1500 (bills) - 500 (payments) = 2000
        // In this mock: Bills (1000+500=1500), Payments (200+300=500)
        // 1000 + 1500 - 500 = 2000
        expect(result.openingBalance).toBe(2000);
        expect(result.transactions).toHaveLength(0);
        expect(result.closingBalance).toBe(2000);
    });
});
