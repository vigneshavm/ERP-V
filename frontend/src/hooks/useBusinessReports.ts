import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
// import { supabase } from '../lib/supabase'; // Removed

export type ReportType =
    | 'REPORT_SALES'
    | 'REPORT_PURCHASE'
    | 'REPORT_INVENTORY'
    | 'REPORT_CUSTOMER'
    | 'REPORT_SUPPLIER'
    | 'REPORT_TAX'
    | 'REPORT_FINANCIAL'
    | 'DAY_BOOK'
    | 'TRIAL_BALANCE'
    | 'PROFIT_LOSS'
    | 'BALANCE_SHEET'
    | 'REPORT_BRAND_WISE'
    | 'REPORT_CATEGORY_WISE'
    | 'REPORT_COUNTER_WISE'
    | 'REPORT_HOURLY_BILLING'
    | 'REPORT_CITY_WISE_STOCK'
    | 'REPORT_RACK_WISE_STOCK';

export interface BusinessReportData {
    sales?: {
        total_sales: number;
        net_sales: number;
        returns: number;
        gst_collected: number;
        payment_split: { cash: number; bank: number };
        top_categories: { name: string; sales: number }[];
        branch_performance: { branch: string; sales: number; growth: string }[];
    };
    purchase?: {
        total_purchase: number;
        input_tax_credit: number;
        top_vendors: { vendor: string; amount: number }[];
        alerts: string[];
    };
    inventory?: {
        closing_stock_value: number;
        dead_stock_value: number;
        low_stock_items: number;
        fast_moving_items: string[];
        alerts: string[];
    };
    customer?: {
        total_sales: number;
        outstanding_dues: number;
        credit_exposure: number;
        repeat_frequency: string;
        return_ratio: string;
        high_risk_debtors: { name: string; amount: number }[];
    };
    supplier?: {
        total_purchases: number;
        outstanding_payable: number;
        payment_delays: string;
        grn_mismatches: number;
        top_payables: { vendor: string; amount: number }[];
    };
    tax?: {
        output_tax: number;
        input_tax: number;
        net_payable: number;
        exempt_sales: number;
        taxable_sales: number;
        branch_liability: { branch: string; liability: number }[];
    };
    financial?: {
        revenue: number;
        expenses: number;
        profit: number;
        assets: number;
        liabilities: number;
        equity: number;
        receivables: number;
        payables: number;
        bank_balance: number;
        branch_breakdown: { branch: string; revenue: number; profit: number; margin: string }[];
    };
    day_book?: {
        entries: {
            id: string;
            timestamp: string;
            voucher_no: string;
            reference: string;
            party: string;
            debit_account: string;
            credit_account: string;
            amount: number;
            type: string;
        }[];
        opening_cash: number;
        closing_cash: number;
    };
    trial_balance?: {
        accounts: {
            id: string;
            name: string;
            opening: number;
            debit: number;
            credit: number;
            closing: number;
            type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE';
        }[];
        total_debit: number;
        total_credit: number;
    };
    profit_loss?: {
        net_sales: number;
        cogs: number;
        gross_profit: number;
        operating_expenses: number;
        other_income: number;
        net_profit: number;
        margin: string;
        branch_view: { branch: string; revenue: number; profit: number; margin: string }[];
    };
    balance_sheet?: {
        assets: {
            current: { name: string; amount: number }[];
            fixed: { name: string; amount: number }[];
            total: number;
        };
        liabilities: {
            current: { name: string; amount: number }[];
            long_term: { name: string; amount: number }[];
            total: number;
        };
        equity: {
            capital: number;
            retained_earnings: number;
            current_profit: number;
            total: number;
        };
        ratios: {
            current_ratio: string;
            debt_equity: string;
            working_capital: number;
        };
    };
    audit_flags: string[];
}

export const useBusinessReports = (type: ReportType, filters: { branch_id?: string; date_range: { from: string; to: string } }) => {
    const { user } = useSelector((state: RootState) => state.auth);
    const [data, setData] = useState<BusinessReportData | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchReport = useCallback(async () => {
        if (!user?.tenantId) return;
        setLoading(true);

        try {
            const reportData: BusinessReportData = {
                audit_flags: []
            };

            if (type === 'REPORT_SALES') {
                reportData.sales = {
                    total_sales: 3250000,
                    net_sales: 3100000,
                    returns: 150000,
                    gst_collected: 420000,
                    payment_split: { cash: 38, bank: 62 },
                    top_categories: [
                        { name: 'Textiles', sales: 1200000 },
                        { name: 'Electronics', sales: 950000 },
                        { name: 'Footwear', sales: 600000 },
                        { name: 'Home Decor', sales: 500000 },
                    ],
                    branch_performance: [
                        { branch: 'Chennai', sales: 1800000, growth: '+12%' },
                        { branch: 'Coimbatore', sales: 1300000, growth: '+5%' },
                    ],
                };
            } else if (type === 'REPORT_PURCHASE') {
                reportData.purchase = {
                    total_purchase: 1950000,
                    input_tax_credit: 260000,
                    top_vendors: [
                        { vendor: 'ABC Textiles', amount: 820000 },
                        { vendor: 'Global Electronics', amount: 450000 },
                        { vendor: 'Metro Footwear', amount: 380000 },
                    ],
                    alerts: [
                        'Purchase exceeded sales growth by 18% in Chennai',
                        'Vendor Global Electronics invoice mismatch detected for Order #PO-991',
                    ],
                };
            } else if (type === 'REPORT_INVENTORY') {
                reportData.inventory = {
                    closing_stock_value: 4800000,
                    dead_stock_value: 620000,
                    low_stock_items: 14,
                    fast_moving_items: ['Cotton Shirt XL', 'Smartphone Case', 'Leather Belt'],
                    alerts: [
                        'Negative stock detected for SKU TS-XL-RED in Coimbatore',
                        'Dead stock > 90 days exceeds threshold in Chennai (14.2%)',
                    ],
                };
            } else if (type === 'REPORT_CUSTOMER') {
                reportData.customer = {
                    total_sales: 8400000,
                    outstanding_dues: 1200000,
                    credit_exposure: 2500000,
                    repeat_frequency: '68%',
                    return_ratio: '4.2%',
                    high_risk_debtors: [
                        { name: 'Retail Hub Ltd', amount: 450000 },
                        { name: 'Chennai Traders', amount: 320000 }
                    ]
                };
                reportData.audit_flags.push("High-risk: 2 debtors exceeded credit limit by > ₹100k");
            } else if (type === 'REPORT_SUPPLIER') {
                reportData.supplier = {
                    total_purchases: 6200000,
                    outstanding_payable: 1800000,
                    payment_delays: 'Avg 8 days',
                    grn_mismatches: 12,
                    top_payables: [
                        { vendor: 'ABC Textiles', amount: 950000 },
                        { vendor: 'Sujatha Mill', amount: 420000 }
                    ]
                };
                reportData.audit_flags.push("Supplier payment overdue > 45 days for SUJ-001");
            } else if (type === 'REPORT_TAX') {
                reportData.tax = {
                    output_tax: 1512000,
                    input_tax: 1116000,
                    net_payable: 396000,
                    exempt_sales: 450000,
                    taxable_sales: 7950000,
                    branch_liability: [
                        { branch: 'Chennai', liability: 240000 },
                        { branch: 'Coimbatore', liability: 156000 }
                    ]
                };
                reportData.audit_flags.push("ITC mismatch detected: ₹42,000 in Coimbatore branch");
            } else if (type === 'REPORT_FINANCIAL') {
                reportData.financial = {
                    revenue: 8400000,
                    expenses: 6100000,
                    profit: 2300000,
                    assets: 14500000,
                    liabilities: 4500000,
                    equity: 10000000,
                    receivables: 1200000,
                    payables: 1800000,
                    bank_balance: 3200000,
                    branch_breakdown: [
                        { branch: 'Chennai', revenue: 4200000, profit: 1500000, margin: '35.7%' },
                        { branch: 'Coimbatore', revenue: 4200000, profit: 800000, margin: '19.0%' }
                    ]
                };
            } else if (type === 'DAY_BOOK') {
                reportData.day_book = {
                    entries: [
                        { id: 'v1', timestamp: '2026-01-11 10:30', voucher_no: 'INV-4412', reference: 'POS Sale', party: 'Cash Customer', debit_account: 'Cash-in-hand', credit_account: 'Sales A/c', amount: 4500, type: 'INCOME' },
                        { id: 'v2', timestamp: '2026-01-11 11:15', voucher_no: 'EXP-881', reference: 'Electricity', party: 'TNEB', debit_account: 'Utility Expenses', credit_account: 'HDFC Bank', amount: 12400, type: 'EXPENSE' },
                        { id: 'v3', timestamp: '2026-01-11 14:20', voucher_no: 'REC-221', reference: 'Invoice #998', party: 'Mahesh Kumar', debit_account: 'Sbi Bank', credit_account: 'Sundry Debtors', amount: 25000, type: 'PAYMENT' },
                        { id: 'v4', timestamp: '2026-01-11 16:45', voucher_no: 'BILL-102', reference: 'Stock Purchase', party: 'ABC Textiles', debit_account: 'Purchase A/c', credit_account: 'Sundry Creditors', amount: 85000, type: 'PURCHASE' }
                    ],
                    opening_cash: 25000,
                    closing_cash: 29500
                };
            } else if (type === 'TRIAL_BALANCE') {
                reportData.trial_balance = {
                    accounts: [
                        { id: '1', name: 'Cash-in-hand', opening: 15000, debit: 45000, credit: 32000, closing: 28000, type: 'ASSET' },
                        { id: '2', name: 'HDFC Bank', opening: 450000, debit: 120000, credit: 85000, closing: 485000, type: 'ASSET' },
                        { id: '3', name: 'Sundry Debtors', opening: 85000, debit: 125000, credit: 95000, closing: 115000, type: 'ASSET' },
                        { id: '4', name: 'Sundry Creditors', opening: 42000, debit: 15000, credit: 68000, closing: 95000, type: 'LIABILITY' },
                        { id: '5', name: 'Sales Account', opening: 0, debit: 0, credit: 325000, closing: 325000, type: 'INCOME' },
                        { id: '6', name: 'Purchase Account', opening: 0, debit: 195000, credit: 0, closing: 195000, type: 'EXPENSE' }
                    ],
                    total_debit: 500000,
                    total_credit: 500000
                };
            } else if (type === 'PROFIT_LOSS') {
                reportData.profit_loss = {
                    net_sales: 3250000,
                    cogs: 1850000,
                    gross_profit: 1400000,
                    operating_expenses: 650000,
                    other_income: 45000,
                    net_profit: 795000,
                    margin: '24.4%',
                    branch_view: [
                        { branch: 'Chennai', revenue: 1850000, profit: 520000, margin: '28.1%' },
                        { branch: 'Coimbatore', revenue: 1400000, profit: 275000, margin: '19.6%' }
                    ]
                };
                reportData.audit_flags.push("Coimbatore branch margin dropped 12% below average");
            } else if (type === 'BALANCE_SHEET') {
                reportData.balance_sheet = {
                    assets: {
                        current: [
                            { name: 'Cash & Bank', amount: 3250000 },
                            { name: 'Accounts Receivable', amount: 1200000 },
                            { name: 'Inventory', amount: 4800000 }
                        ],
                        fixed: [
                            { name: 'Furniture & Fixtures', amount: 850000 },
                            { name: 'IT Infrastructure', amount: 1200000 }
                        ],
                        total: 11300000
                    },
                    liabilities: {
                        current: [
                            { name: 'Accounts Payable', amount: 1800000 },
                            { name: 'Tax Payable', amount: 396000 }
                        ],
                        long_term: [
                            { name: 'Bank Loans', amount: 2000000 }
                        ],
                        total: 4196000
                    },
                    equity: {
                        capital: 5000000,
                        retained_earnings: 1309000,
                        current_profit: 795000,
                        total: 7104000
                    },
                    ratios: {
                        current_ratio: '4.2',
                        debt_equity: '0.28',
                        working_capital: 7454000
                    }
                };
            }

            // Simulate network delay
            await new Promise((resolve) => setTimeout(resolve, 800));
            setData(reportData);
        } catch (err) {
            console.error('Error fetching business report:', err);
        } finally {
            setLoading(false);
        }
    }, [user?.tenantId, type, filters.branch_id, filters.date_range.from, filters.date_range.to]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    return { data, loading, refresh: fetchReport };
};
