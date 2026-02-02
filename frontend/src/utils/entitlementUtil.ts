import { ModuleType } from "../types/common";

/**
 * CANONICAL_MODULE_MAP
 * Maps various input strings (lowercase, marketing names, legacy names)
 * to the system's canonical ModuleType keys.
 */
export const CANONICAL_MODULE_MAP: Record<string, ModuleType> = {
    // POS
    "pos": "POS",
    "point_of_sale": "POS",
    "billing": "POS",
    "sales": "POS",
    "Point of Sale": "POS",

    // Inventory
    "inventory": "INVENTORY",
    "stock": "INVENTORY",
    "inventory_management": "INVENTORY",
    "Inventory Management": "INVENTORY",

    // CRM / Customers
    "crm": "CUSTOMERS",
    "customers": "CUSTOMERS",
    "customer_management": "CUSTOMERS",
    "Customer Management": "CUSTOMERS",

    // Purchase
    "purchase": "PURCHASE",
    "purchasing": "PURCHASE",

    // Suppliers
    "suppliers": "SUPPLIERS",
    "vendors": "SUPPLIERS",

    // Finance / Accounting
    "finance": "FINANCE",
    "accounting": "FINANCE",
    "cash_bank": "FINANCE",
    "Accounting & GST": "FINANCE",

    // Expenses
    "expenses": "EXPENSES",
    "expense_management": "EXPENSES",

    // HR
    "hr": "HR",
    "hrms": "HR",
    "staff": "HR",
    "labor": "HR",
    "Staff Management": "HR",

    // Reports
    "reports": "REPORTS",
    "analytics": "REPORTS",
    "Advanced Analytics": "REPORTS",

    // Ecommerce
    "ecommerce": "ECOMMERCE",
    "online_store": "ECOMMERCE",
    "Online Store": "ECOMMERCE",

    // Multi-Branch
    "multi_branch": "MULTI_BRANCH",
    "Multi-Branch": "MULTI_BRANCH",

    // Grow
    "grow": "GROW",
    "grow_platform": "GROW"
};

/**
 * Normalizes an array of module strings into canonical ModuleType keys.
 * Includes backward compatibility for existing data.
 */
export const normalizeModules = (modules: string[] = []): ModuleType[] => {
    if (!modules || modules.length === 0) return [];

    const normalized = modules.map(m => {
        const key = m.toLowerCase().replace(/\s+/g, '_');
        // Try direct map, then lowercase key map, then fallback to uppercase if it matches a valid key
        return CANONICAL_MODULE_MAP[m] ||
            CANONICAL_MODULE_MAP[key] ||
            CANONICAL_MODULE_MAP[m.toLowerCase()] ||
            (m.toUpperCase() as ModuleType);
    });

    // Filter unique values and ensure they are valid (optional, but good for safety)
    return Array.from(new Set(normalized)).filter(Boolean) as ModuleType[];
};

/**
 * Fallback modules for tenants with no selected modules to prevent blank UI.
 */
export const DEFAULT_TENANT_MODULES: ModuleType[] = ['DASHBOARD', 'POS', 'INVENTORY'];
