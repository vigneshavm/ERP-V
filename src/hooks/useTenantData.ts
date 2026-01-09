import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { supabase } from '../lib/supabase';
import { APP_CONFIG } from '../config';
import { setTenants, setBranches, setEmployees, setUser } from '../store';
import { Tenant, DbRoleCode, TenantUser } from '../types/tenant';
import { Employee } from '../types/hr';

export const useTenantData = (user: any) => {
    const dispatch = useDispatch();

    useEffect(() => {
        if (!APP_CONFIG.USE_SUPABASE) return;

        const fetchTenants = async () => {
            if (!supabase) return;
            try {
                const { data, error } = await supabase.from('tenants').select(`
                    *,
                    tenant_business_info (*),
                    tenant_company_details (*),
                    tenant_tax_details (*),
                    tenant_banking_details (*),
                    tenant_system_config (*),
                    tenant_integrations (*),
                    tenant_active_modules (
                        system_modules (
                            code
                        )
                    )
                `);

                if (error) throw error;

                if (data) {
                    const allTenants = data.map((t: any) => ({
                        id: t.id,
                        name: t.name,
                        subdomain: t.subdomain,
                        modules: (t.tenant_active_modules || []).map((tam: any) =>
                            Array.isArray(tam.system_modules) ? tam.system_modules[0]?.code : tam.system_modules?.code
                        ).filter(Boolean),
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
                    })) as Tenant[];

                    let isolatedTenantId: string | null = null;
                    if (APP_CONFIG.REQUIRE_TENANT_ID && APP_CONFIG.DEPLOY_TENANT_ID) {
                        const exists = allTenants.find(t => t.id === APP_CONFIG.DEPLOY_TENANT_ID);
                        if (exists) isolatedTenantId = APP_CONFIG.DEPLOY_TENANT_ID;
                    }

                    let bQuery = supabase.from('branches').select('*');
                    if (isolatedTenantId) bQuery = bQuery.eq('tenant_id', isolatedTenantId);
                    const { data: branchData, error: bErr } = await bQuery;
                    if (bErr) throw bErr;

                    const mappedBranches = branchData ? branchData.map((b: any) => {
                        const t = allTenants.find(ten => ten.id === b.tenant_id);
                        return {
                            id: b.id,
                            tenantId: b.tenant_id,
                            name: b.name,
                            city: b.city,
                            address: b.address,
                            sector: t?.sector || 'General',
                            updatedAt: b.updated_at || b.updatedAt
                        };
                    }) : [];

                    const reconciledTenants = allTenants.map(t => {
                        const tenantBranches = branchData?.filter((b: any) => b.tenant_id === t.id) || [];
                        const updatedLocations = (t.locations || []).map((loc: any) => ({
                            ...loc,
                            branches: (loc.branches || []).map((b: any) => {
                                if (b.id && b.id.toString().startsWith('BR-')) {
                                    const realBranch = tenantBranches.find((rb: any) => rb.name === b.name);
                                    if (realBranch) return { ...b, id: realBranch.id };
                                }
                                return b;
                            })
                        }));
                        return { ...t, locations: updatedLocations };
                    });

                    const finalTenants = isolatedTenantId
                        ? reconciledTenants.filter(t => t.id === isolatedTenantId)
                        : reconciledTenants;

                    dispatch(setTenants(finalTenants));
                    dispatch(setBranches(mappedBranches));

                    // Employees
                    let eQuery = supabase.from('tenant_users').select('*, role:roles(code, description)');
                    if (isolatedTenantId) eQuery = eQuery.eq('tenant_id', isolatedTenantId);
                    const { data: empData, error: empErr } = await eQuery;
                    if (!empErr && empData) {
                        const mappedEmployees = empData.map((e: any) => {
                            const roleCode = e.role?.code?.toLowerCase() || 'staff';
                            const derivedSystemRole = (roleCode === DbRoleCode.OWNER || roleCode === DbRoleCode.ADMIN) ? 'Owner' : 'Staff';
                            return {
                                id: e.id,
                                name: e.full_name,
                                role: e.role?.description || roleCode,
                                systemRole: derivedSystemRole,
                                pin: e.pin_hash || '',
                                dailyRate: 0,
                                sector: 'General',
                                branchId: e.assigned_branch_id,
                                tenantId: e.tenant_id,
                                mobile: e.mobile,
                                roleId: e.role_id
                            };
                        }) as Employee[];

                        dispatch(setEmployees(mappedEmployees));

                        if (user && user.id) {
                            const currentUserInList = mappedEmployees.find(me => me.id === user.id);
                            if (currentUserInList && currentUserInList.branchId !== user.branchId) {
                                const updatedUser: TenantUser = {
                                    ...user,
                                    id: currentUserInList.id,
                                    fullName: currentUserInList.name,
                                    name: currentUserInList.name,
                                    mobile: currentUserInList.mobile,
                                    role: currentUserInList.role,
                                    systemRole: currentUserInList.systemRole as any,
                                    branchId: currentUserInList.branchId as any,
                                    roleId: currentUserInList.roleId
                                };
                                dispatch(setUser(updatedUser));
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching tenants:', error);
            }
        };

        fetchTenants();
    }, [dispatch, user?.id]);
};
