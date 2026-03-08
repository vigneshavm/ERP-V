// MIS (Management Information System) Configuration

export interface MISConfig {
    // Financial Controls
    allowNegativeStock: boolean;
    allowSaleBelowCost: boolean;
    enableCreditSales: boolean;
    enableVendorPayables: boolean;
    enableCustomerReceivables: boolean;

    // Billing Controls
    allowPriceOverride: boolean;
    allowDiscountOverride: boolean;
    maxDiscountPercent: number;
    allowBackdatedBills: boolean;
    allowCancelledBillsEdit: boolean;

    // Reporting & Audit Controls
    enableAuditTrail: boolean;
    lockFinancialYearAfterClose: boolean;
    requireApprovalForHighDiscount: boolean;
    requireApprovalForVoidBill: boolean;
    requireApprovalForPriceChange: boolean;

    // Inventory Controls
    autoDeductStockOnInvoice: boolean;
    allowManualStockAdjustments: boolean;
    enableBatchExpiryTracking: boolean;
    enableSerialNumberTracking: boolean;
}

// Default MIS settings for backward compatibility
export const DEFAULT_MIS_CONFIG: MISConfig = {
    allowNegativeStock: false,
    allowSaleBelowCost: false,
    enableCreditSales: true,
    enableVendorPayables: true,
    enableCustomerReceivables: true,
    allowPriceOverride: true,
    allowDiscountOverride: true,
    maxDiscountPercent: 10,
    allowBackdatedBills: false,
    allowCancelledBillsEdit: false,
    enableAuditTrail: true,
    lockFinancialYearAfterClose: true,
    requireApprovalForHighDiscount: false,
    requireApprovalForVoidBill: true,
    requireApprovalForPriceChange: false,
    autoDeductStockOnInvoice: true,
    allowManualStockAdjustments: true,
    enableBatchExpiryTracking: false,
    enableSerialNumberTracking: false
};
