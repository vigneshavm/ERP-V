import { ModuleType } from "@repo/shared-kernel";

/**
 * CANONICAL_MODULE_MAP
 * Maps various input strings to canonical ModuleType keys.
 * Recreated from git history to restore functionality lost during FSD migration.
 */
export const CANONICAL_MODULE_MAP: Record<string, ModuleType> = {
    "pos": "POS",
    "point_of_sale": "POS",
    "billing": "POS",
    "sales": "POS",
    "Point of Sale": "POS",
    "inventory": "INVENTORY",
    "stock": "INVENTORY",
    "inventory_management": "INVENTORY",
    "Inventory Management": "INVENTORY",
    "crm": "CUSTOMERS",
    "customers": "CUSTOMERS",
    "customer_management": "CUSTOMERS",
    "Customer Management": "CUSTOMERS",
    "purchase": "PURCHASE",
    "purchasing": "PURCHASE",
    "suppliers": "SUPPLIERS",
    "vendors": "SUPPLIERS",
    "finance": "FINANCE",
    "accounting": "FINANCE",
    "cash_bank": "FINANCE",
    "Accounting & GST": "FINANCE",
    "expenses": "EXPENSES",
    "expense_management": "EXPENSES",
    "hr": "HR",
    "hrms": "HR",
    "staff": "HR",
    "labor": "HR",
    "Staff Management": "HR",
    "reports": "REPORTS",
    "analytics": "REPORTS",
    "Advanced Analytics": "REPORTS",
    "ecommerce": "ECOMMERCE",
    "online_store": "ECOMMERCE",
    "Online Store": "ECOMMERCE",
    "multi_branch": "MULTI_BRANCH",
    "Multi-Branch": "MULTI_BRANCH",
    "grow": "GROW",
    "grow_platform": "GROW"
};

export const normalizeModules = (modules: string[] = []): ModuleType[] => {
    if (!modules || modules.length === 0) return [];
    const normalized = modules.map(m => {
        const key = m.toLowerCase().replace(/\s+/g, '_');
        return CANONICAL_MODULE_MAP[m] ||
            CANONICAL_MODULE_MAP[key] ||
            CANONICAL_MODULE_MAP[m.toLowerCase()] ||
            (m.toUpperCase() as ModuleType);
    });
    return Array.from(new Set(normalized)).filter(Boolean) as ModuleType[];
};

export const DEFAULT_TENANT_MODULES: ModuleType[] = ['DASHBOARD', 'POS', 'INVENTORY'];
