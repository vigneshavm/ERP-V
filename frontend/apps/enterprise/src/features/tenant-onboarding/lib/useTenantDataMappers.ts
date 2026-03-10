import { Tenant, DbRoleCode } from "@/entities/session/model/core";
import { Employee } from "@/entities/people/model/laborSlice";
import { ModuleType, SystemRole } from "@repo/shared-kernel";
import { normalizeModules, DEFAULT_TENANT_MODULES } from "../utils/entitlementUtil";

export const useTenantDataMappers = () => {
    const mapTenant = (t: any): Tenant => ({
        id: t.id,
        name: t.name,
        subdomain: t.subdomain,
        modules: (() => {
            const rawMods = (t.tenant_active_modules || []).map((tam: any) =>
                Array.isArray(tam.system_modules) ? tam.system_modules[0]?.code : tam.system_modules?.code
            ).filter(Boolean);

            // Normalize modules (handles lowercase, marketing names, and missing keys)
            let mods = normalizeModules(rawMods);

            // Validation Guard: Fallback to defaults if no modules (prevents blank UI)
            if (mods.length === 0) {
                mods = [...DEFAULT_TENANT_MODULES];
            }

            // Force enable GROW_PLATFORM for demo/admin tenants
            if (!mods.includes('GROW' as any) && !mods.includes('GROW_PLATFORM' as any)) {
                mods.push('GROW' as any);
            }
            return mods as ModuleType[];
        })(),
        isActive: t.is_active ?? true,
        region: t.region || { currency: 'INR', currencySymbol: '₹', dateFormat: 'DD/MM/YYYY' },
        sector: t.sector,
        layout: t.layout || 'standard',
        domain: t.domain,
        locations: t.locations || [],
        businessType: Array.isArray(t.tenant_business_info) ? t.tenant_business_info[0]?.business_type : t.tenant_business_info?.business_type,
        natureOfBusiness: Array.isArray(t.tenant_business_info) ? t.tenant_business_info[0]?.nature_of_business : t.tenant_business_info?.nature_of_business,
        tradeDescription: Array.isArray(t.tenant_business_info) ? t.tenant_business_info[0]?.trade_description : t.tenant_business_info?.trade_description,
        companyDetails: (() => {
            const details = Array.isArray(t.tenant_company_details) ? t.tenant_company_details[0] : t.tenant_company_details;
            return details ? {
                addressLine1: details.address_line1,
                addressLine2: details.address_line2,
                city: details.city,
                state: details.state,
                stateCode: details.state_code,
                country: details.country,
                pincode: details.pincode,
                phone: details.phone,
                alternatePhone: details.alternate_phone,
                email: details.email,
                website: details.website
            } : undefined;
        })(),
        taxDetails: (() => {
            const tax = Array.isArray(t.tenant_tax_details) ? t.tenant_tax_details[0] : t.tenant_tax_details;
            return tax ? {
                taxSystem: tax.tax_system,
                gstin: tax.gstin,
                pan: tax.pan,
                isGstEnabled: tax.is_gst_enabled,
                isEInvoiceEnabled: tax.is_einvoice_enabled,
                isEWayBillEnabled: tax.is_eway_bill_enabled
            } : undefined;
        })(),
        bankingDetails: (() => {
            const bank = Array.isArray(t.tenant_banking_details) ? t.tenant_banking_details[0] : t.tenant_banking_details;
            return bank ? {
                bankName: bank.bank_name,
                accountNumber: bank.account_number,
                accountHolderName: bank.account_holder_name,
                ifsc: bank.ifsc,
                booksStartDate: bank.books_start_date,
                financialYearClosing: bank.financial_year_closing
            } : undefined;
        })(),
        systemConfig: (() => {
            const config = Array.isArray(t.tenant_system_config) ? t.tenant_system_config[0] : t.tenant_system_config;
            return config ? {
                isPosEnabled: config.is_pos_enabled,
                isInventoryEnabled: config.is_inventory_enabled,
                isLoyaltyEnabled: config.is_loyalty_enabled,
                isMultiBranch: config.is_multibranch_enabled,
                isEcommerceEnabled: config.is_ecommerce_enabled,
                pricingMode: config.pricing_mode
            } : undefined;
        })(),
        integrations: (() => {
            const integrations = Array.isArray(t.tenant_integrations) ? t.tenant_integrations[0] : t.tenant_integrations;
            return integrations ? {
                paymentGatewayKey: integrations.payment_gateway_key,
                smsProviderKey: integrations.sms_provider_key,
                emailProviderKey: integrations.email_provider_key,
                webhookUrl: integrations.webhook_url
            } : undefined;
        })(),
        updatedAt: t.updated_at || t.updatedAt
    });

    const mapBranch = (b: any, tenants: Tenant[]) => {
        const t = tenants.find(ten => ten.id === b.tenant_id);
        return {
            id: b.id,
            tenantId: b.tenant_id,
            name: b.name,
            city: b.city,
            address: b.address,
            sector: t?.sector || 'General',
            updatedAt: b.updated_at || b.updatedAt
        };
    };

    const mapEmployee = (e: any): Employee => {
        const roleCode = (e.role?.code || e.role_id || 'staff').toLowerCase();
        let derivedSystemRole: SystemRole = SystemRole.STAFF;
        if (roleCode === DbRoleCode.OWNER || roleCode === 'owner') derivedSystemRole = SystemRole.OWNER;
        else if (roleCode === DbRoleCode.ADMIN || roleCode === 'admin') derivedSystemRole = SystemRole.ADMIN;
        else if (roleCode === DbRoleCode.MANAGER || roleCode === 'manager') derivedSystemRole = SystemRole.MANAGER;
        return {
            id: e.id,
            name: e.full_name,
            role: e.role?.description || e.role_id || roleCode,
            systemRole: derivedSystemRole,
            pin: e.pin_hash || '',
            dailyRate: 0,
            sector: 'General',
            branchId: e.assigned_branch_id,
            tenantId: e.tenant_id,
            mobile: e.mobile,
            roleId: e.role_id,
            wageType: 'DAILY',
            isActive: true
        };
    };

    return { mapTenant, mapBranch, mapEmployee };
};
