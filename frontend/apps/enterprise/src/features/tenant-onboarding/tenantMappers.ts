import { Tenant, DbRoleCode, TenantLocation } from '@/entities/session/model/core';
import { Employee } from '@/entities/people/model/hr';
import { ModuleType, SystemRole } from '@repo/shared';
import { normalizeModules, DEFAULT_TENANT_MODULES } from './utils/entitlementUtil';

/** Map a raw DB tenant row → typed Tenant */
export const mapDbTenant = (t: any): Tenant => ({
    id: t._id || t.id,
    name: t.businessName || t.name,
    subdomain: t.subdomain || 'app',
    sector: t.sector || t.category,
    modules: (() => {
        const rawMods = (t.tenant_active_modules || t.modules || []).map((tam: any) =>
            Array.isArray(tam.system_modules)
                ? tam.system_modules[0]?.code
                : tam.system_modules?.code ?? tam
        ).filter(Boolean);

        let mods = normalizeModules(rawMods);
        if (mods.length === 0) mods = [...DEFAULT_TENANT_MODULES];
        if (!mods.includes('GROW' as ModuleType)) mods.push('GROW' as ModuleType);
        return mods as ModuleType[];
    })(),
    isActive: t.is_active ?? true,
    region: t.region || { currency: 'INR', currencySymbol: '₹', dateFormat: 'DD/MM/YYYY' },
    layout: t.layout || 'standard',
    domain: t.domain,
    locations: t.locations || [],
    businessType: Array.isArray(t.tenant_business_info)
        ? t.tenant_business_info[0]?.business_type
        : t.tenant_business_info?.business_type,
    natureOfBusiness: Array.isArray(t.tenant_business_info)
        ? t.tenant_business_info[0]?.nature_of_business
        : t.tenant_business_info?.nature_of_business,
    tradeDescription: Array.isArray(t.tenant_business_info)
        ? t.tenant_business_info[0]?.trade_description
        : t.tenant_business_info?.trade_description,
    companyDetails: (() => {
        const d = Array.isArray(t.tenant_company_details) ? t.tenant_company_details[0] : t.tenant_company_details;
        return d ? {
            addressLine1: d.address_line1, addressLine2: d.address_line2,
            city: d.city, state: d.state, stateCode: d.state_code,
            country: d.country, pincode: d.pincode, phone: d.phone,
            alternatePhone: d.alternate_phone, email: d.email, website: d.website,
        } : undefined;
    })(),
    taxDetails: (() => {
        const tax = Array.isArray(t.tenant_tax_details) ? t.tenant_tax_details[0] : t.tenant_tax_details;
        return tax ? {
            taxSystem: tax.tax_system, gstin: tax.gstin, pan: tax.pan,
            isGstEnabled: tax.is_gst_enabled, isEInvoiceEnabled: tax.is_einvoice_enabled,
            isEWayBillEnabled: tax.is_eway_bill_enabled,
        } : undefined;
    })(),
    bankingDetails: (() => {
        const bank = Array.isArray(t.tenant_banking_details) ? t.tenant_banking_details[0] : t.tenant_banking_details;
        return bank ? {
            bankName: bank.bank_name, accountNumber: bank.account_number,
            accountHolderName: bank.account_holder_name, ifsc: bank.ifsc,
            booksStartDate: bank.books_start_date, financialYearClosing: bank.financial_year_closing,
        } : undefined;
    })(),
    systemConfig: (() => {
        const cfg = Array.isArray(t.tenant_system_config) ? t.tenant_system_config[0] : t.tenant_system_config;
        return cfg ? {
            isPosEnabled: cfg.is_pos_enabled, isInventoryEnabled: cfg.is_inventory_enabled,
            isLoyaltyEnabled: cfg.is_loyalty_enabled, isMultiBranch: cfg.is_multibranch_enabled,
            isEcommerceEnabled: cfg.is_ecommerce_enabled, pricingMode: cfg.pricing_mode,
        } : undefined;
    })(),
    integrations: (() => {
        const int = Array.isArray(t.tenant_integrations) ? t.tenant_integrations[0] : t.tenant_integrations;
        return int ? {
            paymentGatewayKey: int.payment_gateway_key, smsProviderKey: int.sms_provider_key,
            emailProviderKey: int.email_provider_key, webhookUrl: int.webhook_url,
        } : undefined;
    })(),
    updatedAt: t.updated_at || t.updatedAt,
});

/** Map a raw DB branch row → typed branch object */
export const mapDbBranch = (b: any, tenants: Tenant[]) => {
    const tenant = tenants.find(t => t.id === b.tenant_id);
    return {
        id: b.id, tenantId: b.tenant_id, name: b.name,
        city: b.city, address: b.address,
        sector: tenant?.sector || 'General',
        updatedAt: b.updated_at || b.updatedAt,
    };
};

/** Map a raw DB employee row → typed Employee */
export const mapDbEmployee = (e: any): Employee => {
    const roleCode = (e.role?.code || e.role_id || 'staff').toLowerCase();
    let systemRole: SystemRole = SystemRole.STAFF;
    if (roleCode === DbRoleCode.OWNER || roleCode === 'owner') systemRole = SystemRole.OWNER;
    else if (roleCode === DbRoleCode.ADMIN || roleCode === 'admin') systemRole = SystemRole.ADMIN;
    else if (roleCode === DbRoleCode.MANAGER || roleCode === 'manager') systemRole = SystemRole.MANAGER;

    return {
        id: e.id, name: e.full_name,
        role: e.role?.description || e.role_id || roleCode,
        systemRole, pin: e.pin_hash || '',
        dailyRate: 0, sector: 'General',
        branchId: e.assigned_branch_id, tenantId: e.tenant_id,
        mobile: e.mobile, wageType: 'DAILY', isActive: true,
    };
};
