const fs = require('fs');
const path = require('path');

const registryPath = path.join(__dirname, 'frontend/src/services/ModuleRegistry.ts');
let content = fs.readFileSync(registryPath, 'utf8');

const MOCK_PATHS = {
    Dashboard: "../pages/Dashboard/DashboardMockUI",
    Grow: "../pages/Dashboard/GrowMockUI",
    Finance: "../pages/Financial/FinanceMockUI",
    Inventory: "../pages/Inventory/InventoryMockUI",
    POS: "../pages/Pos/POSMockUI",
    Purchase: "../pages/Purchase/PurchaseMockUI",
    Sales: "../pages/Sales/SalesMockUI", // Fallback for Sales
    Expenses: "../pages/Expenses/ExpensesMockUI",
    Marketing: "../pages/Marketing/MarketingMockUI",
    CustomerEngagement: "../pages/CustomerEngagement/CustomerEngagementMockUI",
    Suppliers: "../pages/People/Suppliers/SuppliersMockUI",
    Customers: "../pages/People/Customers/CustomerMockUI",
    HR: "../pages/People/Employees/HRMockUI",
    Reports: "../pages/Reports/ReportsMockUI",
    System: "../pages/System/SystemMockUI",
    Settings: "../pages/System/Settings/SettingsMockUI",
    Login: "../pages/auth/Login"
};

const SALES_PATHS = {
    SalesInvoiceRegister: "../pages/Sales/salesInvoices/SalesInvoiceRegisterMockUI",
    EstimateCreator: "../pages/Sales/estimates/EstimateCreatorMockUI",
    SalesOrderCreator: "../pages/Sales/salesOrders/SalesOrderCreatorMockUI",
    DeliveryChallanCreator: "../pages/Sales/deliveryChallans/DeliveryChallanCreatorMockUI",
    SalesReturn: "../pages/Sales/returns/SalesReturnMockUI",
    PaymentInCreator: "../pages/Sales/payments/PaymentInCreatorMockUI",
    PaymentInList: "../pages/Sales/payments/PaymentInListMockUI",
    ReturnedItemsManager: "../pages/Sales/returns/ReturnedItemsManagerMockUI",
    CustomerCredits: "../pages/Sales/payments/CustomerCreditsMockUI",
    OutstandingDues: "../pages/Sales/payments/OutstandingDuesMockUI",
    SalesModulePlaceholder: "../pages/Sales/SalesModulePlaceholderMockUI",
    SalesInvoiceForm: "../pages/Sales/salesInvoices/SalesInvoiceFormMockUI",
    SalesInvoiceDetail: "../pages/Sales/salesInvoices/SalesInvoiceDetailMockUI"
};

const HR_PATHS = {
    LaborManager: "../pages/People/Employees/LaborManagerMockUI",
    StaffManager: "../pages/People/Employees/StaffManagerMockUI",
    AllowanceManager: "../pages/People/Employees/AllowanceManagerMockUI",
    PayrollDashboard: "../pages/People/Payroll/PayrollDashboardMockUI",
    SalaryStructureManager: "../pages/People/Payroll/SalaryStructureManagerMockUI",
    PayrollRuns: "../pages/People/Payroll/PayrollRunsMockUI",
    AttendanceSummaryManager: "../pages/People/Payroll/AttendanceSummaryManagerMockUI",
    DailyAttendanceBoard: "../pages/People/Employees/DailyAttendanceBoardMockUI",
    PayslipView: "../pages/People/Payroll/PayslipViewMockUI"
};

const POS_PATHS = {
    POSOrdersIntelligence: "../pages/Pos/POSOrdersIntelligenceMockUI",
    POSReturnsIntelligence: "../pages/Pos/POSReturnsIntelligenceMockUI",
    ShiftManagementIntelligence: "../pages/Pos/ShiftManagementIntelligenceMockUI",
    CashDrawerIntelligence: "../pages/Pos/CashDrawerIntelligenceMockUI"
};

function resolveParentMock(key) {
    if (SALES_PATHS[key]) return SALES_PATHS[key];
    if (HR_PATHS[key]) return HR_PATHS[key];
    if (POS_PATHS[key]) return POS_PATHS[key];
    if (MOCK_PATHS[key]) return MOCK_PATHS[key]; // exact matches like DashboardMockUI

    if (key.match(/Dashboard|Performance/i)) return MOCK_PATHS.Dashboard;
    if (key.match(/Grow|Storefront|Hub/i)) return MOCK_PATHS.Grow;
    if (key.match(/Finance|Bank|Cash|Journal|Budget|Fund|Ledger|SmsTracker|Account/i)) return MOCK_PATHS.Finance;
    if (key.match(/Inventory|Stock|Warehouse|Batch|ItemCategories|Units|Reprint|AgedStockManager/i)) return MOCK_PATHS.Inventory;
    if (key.match(/POS|Shift|Drawer|OrdersIntelligence/i)) return MOCK_PATHS.POS;
    if (key.match(/Purchase|GRN|Debit|Vendor|Bill|Payable|PaymentOut/i)) return MOCK_PATHS.Purchase;
    if (key.match(/Expense/i)) return MOCK_PATHS.Expenses;
    if (key.match(/Marketing/i)) return MOCK_PATHS.Marketing;
    if (key.match(/Engagement/i)) return MOCK_PATHS.CustomerEngagement;
    if (key.match(/Supplier|VendorManager/i)) return MOCK_PATHS.Suppliers;
    if (key.match(/Customer|Loyalty/i)) return MOCK_PATHS.Customers;
    if (key.match(/HR|Labor|Staff|Allowance|Payroll|Salary|Attendance|Payslip/i)) return MOCK_PATHS.HR;
    if (key.match(/Report/i)) return MOCK_PATHS.Reports;
    if (key.match(/System|Architecture|Sync|Data|Tenant|Audit|GST/i)) return MOCK_PATHS.System;
    if (key.match(/Settings/i)) return MOCK_PATHS.Settings;
    if (key.match(/Login/i)) return MOCK_PATHS.Login;

    if (key.match(/Sales|Estimate|Challan|PaymentIn/i)) return MOCK_PATHS.Sales;

    return null;
}

// 1. Rewrite Modules object
const modulesMatch = content.match(/export const Modules = {([\s\S]*?)};\s*\/\*\*/);
if (!modulesMatch) {
    console.error("Could not find Modules object");
    process.exit(1);
}

const modulesString = modulesMatch[1];
const moduleRegex = /([A-Za-z0-9_]+):\s*\(\)\s*=>\s*import\(['"]([^'"]+)['"]\)/g;

let match;
let newModulesContent = 'export const Modules = {\n';
const pathMap = {}; // mapping from importPath -> Array of keys
const keyToPath = {}; // mapping from key -> importPath

while ((match = moduleRegex.exec(modulesString)) !== null) {
    const key = match[1];
    
    // Core mocks stay identical if they are in MOCK_PATHS as exact paths
    let importPath = match[2];
    
    const parentMock = resolveParentMock(key);
    if (parentMock) {
        importPath = parentMock;
    }
    
    newModulesContent += `    ${key}: () => import("${importPath}"),\n`;
    
    if (!pathMap[importPath]) {
        pathMap[importPath] = [];
    }
    pathMap[importPath].push(key);
    keyToPath[key] = importPath;
}
newModulesContent += '};\n\n';

// 2. Generate the shared instances block
let sharedInstancesCode = `/**
 * Shared lazy instances for aliased modules.
 * Ensures the same React.lazy component is reused across all keys
 * that point to the same underlying file — prevents unnecessary
 * unmount/remount when navigating between aliased routes.
 */\n`;

const pathToSharedVar = {};
let varCounter = 1;

for (const importPath in pathMap) {
    let varName = '_lazy' + varCounter;
    const keys = pathMap[importPath];
    const coreKey = keys.find(k => k.endsWith('MockUI')) || keys[0];
    if (coreKey) {
        varName = '_lazy' + coreKey;
    }
    
    pathToSharedVar[importPath] = varName;
    sharedInstancesCode += `const ${varName} = lazy(Modules.${coreKey});\n`;
    varCounter++;
}

// 3. Generate the LazyModules object
let lazyModulesCode = `export const LazyModules = {\n`;
for (const key in keyToPath) {
    const importPath = keyToPath[key];
    const varName = pathToSharedVar[importPath];
    lazyModulesCode += `    ${key}: ${varName},\n`;
}
lazyModulesCode += `};\n`;

// 4. Assemble final file
const parts = content.split(/export const Modules = {[\s\S]*?};\s*\/\*\*[\s\S]*?export const preloadModule =/);

if (parts.length < 2) {
    console.error("Could not parse file boundaries properly");
    process.exit(1);
}

const beforeModules = content.substring(0, content.indexOf('export const Modules = {'));
const afterLazy = content.substring(content.indexOf('export const preloadModule ='));

const finalContent = beforeModules + newModulesContent + sharedInstancesCode + '\n' + lazyModulesCode + '\n\n/**\n * ' + afterLazy.substring(afterLazy.indexOf('export const preloadModule ='));

fs.writeFileSync(registryPath, finalContent, 'utf8');
console.log("Successfully rebuilt ModuleRegistry!");
