/**
 * The report page identifiers the registry (reportRegistry.ts `hubView`) and the router (reportPages.ts) share.
 * Every value except the COMING_SOON ones has a real page in REPORT_PAGES; the compiler enforces it.
 */
export type ReportType =
    // Transactions
    | 'REPORT_SALES' | 'REPORT_PURCHASE' | 'DAY_BOOK' | 'REPORT_ALL_TRANSACTIONS' | 'PROFIT_LOSS' | 'REPORT_BILL_PROFIT'
    | 'REPORT_CASH_FLOW' | 'TRIAL_BALANCE' | 'BALANCE_SHEET' | 'REPORT_RETURNS_AUDIT' | 'REPORT_EXPENSE_ANALYSIS'
    // Parties
    | 'REPORT_PARTY_STATEMENT' | 'REPORT_PARTY_PNL' | 'REPORT_ALL_PARTIES' | 'REPORT_PARTY_ITEMS' | 'REPORT_SALES_BY_PARTY'
    | 'REPORT_PURCHASE_BY_PARTY' | 'REPORT_SALES_BY_PARTY_GROUP' | 'REPORT_PURCHASE_BY_PARTY_GROUP'
    // Inventory
    | 'REPORT_STOCK_STATUS' | 'REPORT_LOW_STOCK' | 'REPORT_DEAD_STOCK' | 'REPORT_CITY_WISE_STOCK' | 'REPORT_RACK_WISE_STOCK'
    // GST
    | 'REPORT_GSTR1' | 'REPORT_GSTR3B' | 'REPORT_GSTR9' | 'REPORT_PURCHASE_GST_REGISTER'
    // Detailed analytics
    | 'REPORT_BRAND_WISE' | 'REPORT_CATEGORY_WISE' | 'REPORT_COUNTER_WISE' | 'REPORT_SALES_COUNTER_WISE'
    | 'REPORT_HOURLY_BILLING' | 'REPORT_DAILY_SALES' | 'REPORT_PRODUCT_WISE';

/** Reports with no page yet: the registry marks them 'coming-soon', so they never reach the router. */
export type ComingSoonReportType = 'REPORT_PURCHASE' | 'TRIAL_BALANCE' | 'BALANCE_SHEET';
