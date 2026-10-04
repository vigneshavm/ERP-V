// Legacy menu ownership; permissions inherit the existing section's access checks.
export const TEXTILESOFT_FEATURES = [
  {
    "id": "TS_MRP_RATE_CHANGE",
    "title": "MRP Rate Change",
    "section": "Purchase",
    "group": "Purchase Details",
    "path": "/purchase/textilesoft/mrp-rate-change",
    "permission": "PURCHASE_REGISTER",
    "report": "mrp-rate-change",
    "scope": "native-read"
  },
  {
    "id": "TS_NEW_STOCK_INVOICE_ENTRY",
    "title": "New Stock Invoice Entry",
    "section": "Purchase",
    "group": "Purchase Details",
    "path": "/purchase/textilesoft/new-stock-invoice-entry",
    "permission": "PURCHASE_REGISTER",
    "report": null,
    "scope": "unavailable"
  },
  {
    "id": "TS_NEW_STOCK_INVOICE_ADD_ENTRY",
    "title": "New Stock Invoice Add Entry",
    "section": "Purchase",
    "group": "Purchase Details",
    "path": "/purchase/textilesoft/new-stock-invoice-add-entry",
    "permission": "PURCHASE_REGISTER",
    "report": null,
    "scope": "unavailable"
  },
  {
    "id": "TS_NEW_STOCK_INVOICE_UPDATE",
    "title": "New Stock Invoice Update",
    "section": "Purchase",
    "group": "Purchase Details",
    "path": "/purchase/textilesoft/new-stock-invoice-update",
    "permission": "PURCHASE_REGISTER",
    "report": null,
    "scope": "unavailable"
  },
  {
    "id": "TS_PURCHASE_BARCODE",
    "title": "Purchase Barcode",
    "section": "Purchase",
    "group": "Barcode",
    "path": "/purchase/textilesoft/purchase-barcode",
    "permission": "PURCHASE_REGISTER",
    "report": null,
    "scope": "existing-screen"
  },
  {
    "id": "TS_BARCODE_CANCEL",
    "title": "Barcode Cancel",
    "section": "Purchase",
    "group": "Barcode",
    "path": "/purchase/textilesoft/barcode-cancel",
    "permission": "PURCHASE_REGISTER",
    "report": null,
    "scope": "existing-screen"
  },
  {
    "id": "TS_SALESMAN_STICKER_PRINT",
    "title": "Salesman Sticker Print",
    "section": "Purchase",
    "group": "Barcode",
    "path": "/purchase/textilesoft/salesman-sticker-print",
    "permission": "PURCHASE_REGISTER",
    "report": null,
    "scope": "existing-screen"
  },
  {
    "id": "TS_SALES_RATE_CHANGE_ENTRY",
    "title": "Sales Rate Change Entry",
    "section": "Purchase",
    "group": "Super Purchase Details",
    "path": "/purchase/textilesoft/sales-rate-change-entry",
    "permission": "PURCHASE_REGISTER",
    "report": "sales-rate-change-entry",
    "scope": "native-read"
  },
  {
    "id": "TS_NEW_STOCK_ENTRY",
    "title": "New Stock Entry",
    "section": "Purchase",
    "group": "Super Purchase Details",
    "path": "/purchase/textilesoft/new-stock-entry",
    "permission": "PURCHASE_REGISTER",
    "report": null,
    "scope": "unavailable"
  },
  {
    "id": "TS_NEW_STOCK_ADD_ENTRY",
    "title": "New Stock Add Entry",
    "section": "Purchase",
    "group": "Super Purchase Details",
    "path": "/purchase/textilesoft/new-stock-add-entry",
    "permission": "PURCHASE_REGISTER",
    "report": null,
    "scope": "unavailable"
  },
  {
    "id": "TS_NEW_STOCK_UPDATE",
    "title": "New Stock Update",
    "section": "Purchase",
    "group": "Super Purchase Details",
    "path": "/purchase/textilesoft/new-stock-update",
    "permission": "PURCHASE_REGISTER",
    "report": null,
    "scope": "unavailable"
  },
  {
    "id": "TS_BARCODE_WISE_DISCOUNT",
    "title": "Barcode Wise Discount",
    "section": "Purchase",
    "group": "Barcode-wise Rate Change",
    "path": "/purchase/textilesoft/barcode-wise-discount",
    "permission": "PURCHASE_REGISTER",
    "report": "barcode-wise-discount",
    "scope": "native-read"
  },
  {
    "id": "TS_BARCODE_RATE_CHANGE",
    "title": "Barcode Rate Change",
    "section": "Purchase",
    "group": "Barcode-wise Rate Change",
    "path": "/purchase/textilesoft/barcode-rate-change",
    "permission": "PURCHASE_REGISTER",
    "report": "barcode-rate-change",
    "scope": "native-read"
  },
  {
    "id": "TS_BARCODE_MTR_RATE_CHANGE",
    "title": "Barcode MTR Rate Change",
    "section": "Purchase",
    "group": "Barcode-wise Rate Change",
    "path": "/purchase/textilesoft/barcode-mtr-rate-change",
    "permission": "PURCHASE_REGISTER",
    "report": "barcode-mtr-rate-change",
    "scope": "native-read"
  },
  {
    "id": "TS_COMBO_DETAIL",
    "title": "Combo Detail",
    "section": "Purchase",
    "group": "",
    "path": "/purchase/textilesoft/combo-detail",
    "permission": "PURCHASE_REGISTER",
    "report": "combo-detail",
    "scope": "native-read"
  },
  {
    "id": "TS_PURCHASE_RETURN",
    "title": "Purchase Return",
    "section": "Purchase",
    "group": "",
    "path": "/purchase/textilesoft/purchase-return",
    "permission": "PURCHASE_REGISTER",
    "report": null,
    "scope": "existing-screen"
  },
  {
    "id": "TS_PURCHASE_SPLIT_ENTRY",
    "title": "Purchase Split Entry",
    "section": "Purchase",
    "group": "",
    "path": "/purchase/textilesoft/purchase-split-entry",
    "permission": "PURCHASE_REGISTER",
    "report": null,
    "scope": "unavailable"
  },
  {
    "id": "TS_NEW_EXPENSE_GROUP",
    "title": "New Expense Group",
    "section": "Master",
    "group": "Expenses Detail",
    "path": "/master/textilesoft/new-expense-group",
    "permission": "MASTER_DATA",
    "report": null,
    "scope": "existing-master"
  },
  {
    "id": "TS_NEW_EXPENSE_NAME",
    "title": "New Expense Name",
    "section": "Master",
    "group": "Expenses Detail",
    "path": "/master/textilesoft/new-expense-name",
    "permission": "MASTER_DATA",
    "report": null,
    "scope": "existing-master"
  },
  {
    "id": "TS_DATE_WISE",
    "title": "Date Wise",
    "section": "Report",
    "group": "Sales Report",
    "path": "/reports/textilesoft/date-wise",
    "permission": "REPORTS",
    "report": "date-wise",
    "scope": "native-read"
  },
  {
    "id": "TS_MODE_WISE",
    "title": "Mode Wise",
    "section": "Report",
    "group": "Sales Report",
    "path": "/reports/textilesoft/mode-wise",
    "permission": "REPORTS",
    "report": "mode-wise",
    "scope": "native-read"
  },
  {
    "id": "TS_COMPANY_WISE",
    "title": "Company Wise",
    "section": "Report",
    "group": "Sales Report",
    "path": "/reports/textilesoft/company-wise",
    "permission": "REPORTS",
    "report": "company-wise",
    "scope": "native-read"
  },
  {
    "id": "TS_SUPPLIER_WISE",
    "title": "Supplier Wise",
    "section": "Report",
    "group": "Sales Report",
    "path": "/reports/textilesoft/supplier-wise",
    "permission": "REPORTS",
    "report": null,
    "scope": "unavailable"
  },
  {
    "id": "TS_SALESMAN",
    "title": "Salesman",
    "section": "Report",
    "group": "Sales Report",
    "path": "/reports/textilesoft/salesman",
    "permission": "REPORTS",
    "report": "salesman",
    "scope": "native-read"
  },
  {
    "id": "TS_CUSTOMER",
    "title": "Customer",
    "section": "Report",
    "group": "Sales Report",
    "path": "/reports/textilesoft/customer",
    "permission": "REPORTS",
    "report": "customer",
    "scope": "native-read"
  },
  {
    "id": "TS_SALES_GST",
    "title": "Sales GST",
    "section": "Report",
    "group": "Sales Report",
    "path": "/reports/textilesoft/sales-gst",
    "permission": "REPORTS",
    "report": "sales-gst",
    "scope": "native-read"
  },
  {
    "id": "TS_MISSING_SALES",
    "title": "Missing Sales",
    "section": "Report",
    "group": "Sales Report",
    "path": "/reports/textilesoft/missing-sales",
    "permission": "REPORTS",
    "report": null,
    "scope": "existing-screen"
  },
  {
    "id": "TS_INVOICE_SALES",
    "title": "Invoice Sales",
    "section": "Report",
    "group": "Sales Report",
    "path": "/reports/textilesoft/invoice-sales",
    "permission": "REPORTS",
    "report": "invoice-sales",
    "scope": "native-read"
  },
  {
    "id": "TS_CUSTOMER_POINTS",
    "title": "Customer Points",
    "section": "Report",
    "group": "Sales Report",
    "path": "/reports/textilesoft/customer-points",
    "permission": "REPORTS",
    "report": "customer-points",
    "scope": "native-read"
  },
  {
    "id": "TS_PATTERN_SIZE_SALES",
    "title": "Pattern & Size Sales",
    "section": "Report",
    "group": "Sales Report",
    "path": "/reports/textilesoft/pattern-size-sales",
    "permission": "REPORTS",
    "report": "pattern-size-sales",
    "scope": "native-read"
  },
  {
    "id": "TS_STOCK_REPORT",
    "title": "Stock Report",
    "section": "Report",
    "group": "Stock Reports",
    "path": "/reports/textilesoft/stock-report",
    "permission": "REPORTS",
    "report": "stock-report",
    "scope": "native-read"
  },
  {
    "id": "TS_BRAND_PATTERNSIZEWISE_STOCK_REPORT",
    "title": "Brand PatternSizeWise Stock Report",
    "section": "Report",
    "group": "Stock Reports",
    "path": "/reports/textilesoft/brand-patternsizewise-stock-report",
    "permission": "REPORTS",
    "report": "brand-patternsizewise-stock-report",
    "scope": "native-read"
  },
  {
    "id": "TS_NEW_DATEWISE_STOCK_REPORT",
    "title": "New DateWise Stock Report",
    "section": "Report",
    "group": "Stock Reports",
    "path": "/reports/textilesoft/new-datewise-stock-report",
    "permission": "REPORTS",
    "report": "new-datewise-stock-report",
    "scope": "native-read"
  },
  {
    "id": "TS_PATTERNWISE_SUPPLIER_SIZEWISE_STOCK",
    "title": "PatternWise Supplier SizeWise Stock",
    "section": "Report",
    "group": "Stock Reports",
    "path": "/reports/textilesoft/patternwise-supplier-sizewise-stock",
    "permission": "REPORTS",
    "report": "patternwise-supplier-sizewise-stock",
    "scope": "native-read"
  },
  {
    "id": "TS_PATTERN_SUPPLIER_SIZEWISE_STOCK_REPORT",
    "title": "Pattern Supplier SizeWise Stock Report",
    "section": "Report",
    "group": "Stock Reports",
    "path": "/reports/textilesoft/pattern-supplier-sizewise-stock-report",
    "permission": "REPORTS",
    "report": "pattern-supplier-sizewise-stock-report",
    "scope": "native-read"
  },
  {
    "id": "TS_BARCODE_SALES_REPORT",
    "title": "Barcode Sales Report",
    "section": "Report",
    "group": "Barcode Report",
    "path": "/reports/textilesoft/barcode-sales-report",
    "permission": "REPORTS",
    "report": "barcode-sales-report",
    "scope": "native-read"
  },
  {
    "id": "TS_BARCODE_STOCK_CHECKING",
    "title": "Barcode Stock Checking",
    "section": "Report",
    "group": "Barcode Report",
    "path": "/reports/textilesoft/barcode-stock-checking",
    "permission": "REPORTS",
    "report": "barcode-stock-checking",
    "scope": "native-read"
  },
  {
    "id": "TS_PURCHASE_RETURN_REPORT",
    "title": "Purchase Return Report",
    "section": "Report",
    "group": "Purchase Report Info",
    "path": "/reports/textilesoft/purchase-return-report",
    "permission": "REPORTS",
    "report": "purchase-return-report",
    "scope": "native-read"
  },
  {
    "id": "TS_PURCHASE_SUPPLIER_RETURN",
    "title": "Purchase Supplier Return",
    "section": "Report",
    "group": "Purchase Report Info",
    "path": "/reports/textilesoft/purchase-supplier-return",
    "permission": "REPORTS",
    "report": "purchase-supplier-return",
    "scope": "native-read"
  },
  {
    "id": "TS_COMPANYWISE_PURCHASE_REPORT",
    "title": "CompanyWise Purchase Report",
    "section": "Report",
    "group": "Purchase Report Info",
    "path": "/reports/textilesoft/companywise-purchase-report",
    "permission": "REPORTS",
    "report": "companywise-purchase-report",
    "scope": "native-read"
  },
  {
    "id": "TS_INVOICE_PURCHASE_REPORT",
    "title": "Invoice Purchase Report",
    "section": "Report",
    "group": "Purchase Report Info",
    "path": "/reports/textilesoft/invoice-purchase-report",
    "permission": "REPORTS",
    "report": "invoice-purchase-report",
    "scope": "native-read"
  },
  {
    "id": "TS_PURCHASE_RATE_CHECK",
    "title": "Purchase Rate Check",
    "section": "Report",
    "group": "Purchase Report Info",
    "path": "/reports/textilesoft/purchase-rate-check",
    "permission": "REPORTS",
    "report": "purchase-rate-check",
    "scope": "native-read"
  },
  {
    "id": "TS_PURCHASE_REPORT",
    "title": "Purchase Report",
    "section": "Report",
    "group": "Purchase Report Info",
    "path": "/reports/textilesoft/purchase-report",
    "permission": "REPORTS",
    "report": "purchase-report",
    "scope": "native-read"
  },
  {
    "id": "TS_BARCODEWISE_DISCOUNT_REPORT",
    "title": "BarcodeWise Discount Report",
    "section": "Report",
    "group": "Purchase Report Info",
    "path": "/reports/textilesoft/barcodewise-discount-report",
    "permission": "REPORTS",
    "report": "barcodewise-discount-report",
    "scope": "native-read"
  },
  {
    "id": "TS_EXPENSES_INOUT_REPORT",
    "title": "Expenses InOut Report",
    "section": "Report",
    "group": "",
    "path": "/reports/textilesoft/expenses-inout-report",
    "permission": "REPORTS",
    "report": "expenses-inout-report",
    "scope": "native-read"
  },
  {
    "id": "TS_SUPPLIER_VIEW",
    "title": "Supplier View",
    "section": "Report",
    "group": "",
    "path": "/suppliers/supplier-view",
    "permission": "REPORTS",
    "report": "supplier-view",
    "scope": "native-read"
  },
  {
    "id": "TS_DATA_BACKUP",
    "title": "Data Backup",
    "section": "System",
    "group": "",
    "path": "/system/textilesoft/data-backup",
    "permission": "SETTINGS",
    "report": null,
    "scope": "backup"
  }
] as const;
export type TextilesoftView = typeof TEXTILESOFT_FEATURES[number]['id'];
export const textilesoftFeature = (id: string) => TEXTILESOFT_FEATURES.find(item => item.id === id);
