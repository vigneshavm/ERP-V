import React, { FormEvent } from 'react';
import { useDispatch } from 'react-redux';
import { supabase } from '../lib/supabase';
import { APP_CONFIG } from '../config';
import { securePassword } from '../utils/auth';
import { updateTenantDetails, addTenant } from '../store';
import { Tenant, BranchConfig } from '../types/tenant';
import { mapDbTenantToTenant } from './useTenantForm';

interface UseTenantFormSubmissionProps {
    newTenant: any;
    logoInput: string;
    editingTenant: Tenant | null;
    setIsSaving: React.Dispatch<React.SetStateAction<boolean>>;
    handleCancelEdit: () => void;
    setActiveSection: React.Dispatch<React.SetStateAction<'provision' | 'list'>>;
}

export const useTenantFormSubmission = ({
    newTenant,
    logoInput,
    editingTenant,
    setIsSaving,
    handleCancelEdit,
    setActiveSection
}: UseTenantFormSubmissionProps) => {
    const dispatch = useDispatch();

    const handleSubmit = async (e?: FormEvent): Promise<boolean> => {
        if (e) e.preventDefault();

        if (!newTenant.name || !newTenant.subdomain) {
            alert("Name and Subdomain are required.");
            return;
        }

        const CURRENCIES = [
            { code: 'USD', symbol: '$', label: 'US Dollar ($)' },
            { code: 'EUR', symbol: '€', label: 'Euro (€)' },
            { code: 'GBP', symbol: '£', label: 'British Pound (£)' },
            { code: 'INR', symbol: '₹', label: 'Indian Rupee (₹)' },
            { code: 'JPY', symbol: '¥', label: 'Japanese Yen (¥)' },
        ];
        const currencyObj = CURRENCIES.find(c => c.code === newTenant.currency) || CURRENCIES[0];

        const hoBranch: BranchConfig = {
            id: editingTenant && newTenant.initialBranch.code === 'HO' ? 'keep-existing-id' : `BR-${Date.now()}`,
            name: newTenant.initialBranch.name,
            code: newTenant.initialBranch.code,
            city: newTenant.companyDetails.city || 'Head Office City',
            address: newTenant.initialBranch.address,
            warehouse: newTenant.initialBranch.warehouse,
            isHeadOffice: true,
            updatedAt: new Date().toISOString()
        };

        const hoCity = newTenant.companyDetails.city || 'Head Office City';
        const normalizedLocations = [...newTenant.locations];

        const existingLocIndex = normalizedLocations.findIndex(l => l.city.toLowerCase() === hoCity.toLowerCase());

        if (existingLocIndex >= 0) {
            const existingHoIndex = normalizedLocations[existingLocIndex].branches.findIndex(b => b.isHeadOffice || b.code === 'HO');
            if (existingHoIndex >= 0) {
                normalizedLocations[existingLocIndex].branches[existingHoIndex] = {
                    ...normalizedLocations[existingLocIndex].branches[existingHoIndex],
                    ...hoBranch,
                    id: normalizedLocations[existingLocIndex].branches[existingHoIndex].id
                };
            } else {
                normalizedLocations[existingLocIndex].branches.unshift(hoBranch);
            }
        } else {
            normalizedLocations.unshift({
                city: hoCity,
                branches: [hoBranch]
            });
        }

        const tenantData: Partial<Tenant> = {
            name: newTenant.name,
            subdomain: newTenant.subdomain,
            modules: newTenant.modules,
            region: {
                currency: newTenant.currency,
                currencySymbol: currencyObj.symbol,
                dateFormat: newTenant.dateFormat
            },
            sector: newTenant.sector,
            theme: newTenant.theme,
            layout: newTenant.layout,
            domain: newTenant.domain || `${newTenant.subdomain}.app.com`,
            locations: normalizedLocations,
            primaryColor: newTenant.primaryColor || '#4f46e5',
            loginLogoUrl: logoInput,
            loginBgUrl: newTenant.loginBgUrl,
            businessType: newTenant.businessType,
            natureOfBusiness: newTenant.natureOfBusiness as any,
            tradeDescription: newTenant.tradeDescription,
            companyDetails: newTenant.companyDetails,
            taxDetails: newTenant.taxDetails,
            bankingDetails: newTenant.bankingDetails,
            systemConfig: newTenant.systemConfig,
            integrations: newTenant.integrations
        };

        setIsSaving(true);

        try {
            if (APP_CONFIG.USE_SUPABASE && supabase) {
                const dbData = {
                    name: tenantData.name,
                    subdomain: tenantData.subdomain,
                    is_active: editingTenant ? editingTenant.isActive : true,
                    region: tenantData.region,
                    sector: tenantData.sector,
                    layout: tenantData.layout,
                    domain: tenantData.domain,
                    locations: tenantData.locations,
                    business_type: tenantData.businessType,
                    nature_of_business: tenantData.natureOfBusiness,
                    trade_description: tenantData.tradeDescription,
                    company_details: tenantData.companyDetails,
                    tax_details: tenantData.taxDetails,
                    banking_details: tenantData.bankingDetails,
                    system_config: tenantData.systemConfig,
                    integrations: tenantData.integrations
                };

                let data, error;
                if (editingTenant) {
                    const res = await supabase.from('tenants').update(dbData).eq('id', editingTenant.id).select().single();
                    data = res.data;
                    error = res.error;
                } else {
                    const res = await supabase.from('tenants').insert(dbData).select().single();
                    data = res.data;
                    error = res.error;
                }

                if (error) throw error;
                if (data) {
                    const tenantId = data.id;

                    const businessUpsert = supabase.from('tenant_business_info').upsert({
                        tenant_id: tenantId,
                        business_type: tenantData.businessType,
                        nature_of_business: tenantData.natureOfBusiness,
                        trade_description: tenantData.tradeDescription
                    });

                    const companyUpsert = supabase.from('tenant_company_details').upsert({
                        tenant_id: tenantId,
                        address_line1: tenantData.companyDetails?.addressLine1,
                        address_line2: tenantData.companyDetails?.addressLine2,
                        city: tenantData.companyDetails?.city,
                        state: tenantData.companyDetails?.state,
                        pincode: tenantData.companyDetails?.pincode,
                        phone: tenantData.companyDetails?.phone,
                        email: tenantData.companyDetails?.email,
                        website: tenantData.companyDetails?.website,
                        country: tenantData.companyDetails?.country
                    });

                    const taxUpsert = supabase.from('tenant_tax_details').upsert({
                        tenant_id: tenantId,
                        tax_system: tenantData.taxDetails?.taxSystem,
                        gstin: tenantData.taxDetails?.gstin,
                        pan: tenantData.taxDetails?.pan,
                        is_gst_enabled: tenantData.taxDetails?.isGstEnabled,
                        is_einvoice_enabled: tenantData.taxDetails?.isEInvoiceEnabled,
                        is_eway_bill_enabled: tenantData.taxDetails?.isEWayBillEnabled
                    });

                    const bankingUpsert = supabase.from('tenant_banking_details').upsert({
                        tenant_id: tenantId,
                        bank_name: tenantData.bankingDetails?.bankName,
                        account_number: tenantData.bankingDetails?.accountNumber,
                        account_holder_name: tenantData.bankingDetails?.accountHolderName,
                        ifsc: tenantData.bankingDetails?.ifsc,
                        books_start_date: tenantData.bankingDetails?.booksStartDate,
                        financial_year_closing: tenantData.bankingDetails?.financialYearClosing
                    });

                    const systemUpsert = supabase.from('tenant_system_config').upsert({
                        tenant_id: tenantId,
                        is_pos_enabled: tenantData.systemConfig?.isPosEnabled,
                        is_inventory_enabled: tenantData.systemConfig?.isInventoryEnabled,
                        is_loyalty_enabled: tenantData.systemConfig?.isLoyaltyEnabled,
                        is_multibranch_enabled: tenantData.systemConfig?.isMultiBranch,
                        is_ecommerce_enabled: tenantData.systemConfig?.isEcommerceEnabled,
                        pricing_mode: tenantData.systemConfig?.pricingMode
                    });

                    const integrationsUpsert = supabase.from('tenant_integrations').upsert({
                        tenant_id: tenantId,
                        payment_gateway_key: tenantData.integrations?.paymentGatewayKey,
                        sms_provider_key: tenantData.integrations?.smsProviderKey,
                        email_provider_key: tenantData.integrations?.emailProviderKey,
                        webhook_url: tenantData.integrations?.webhookUrl
                    });

                    const syncModules = async () => {
                        const { data: systemModules } = await supabase.from('system_modules').select('id, code');
                        if (systemModules) {
                            const activeModuleIds = tenantData.modules!
                                .map((code: string) => systemModules.find((m: any) => m.code === code)?.id)
                                .filter(Boolean);

                            await supabase.from('tenant_active_modules').delete().eq('tenant_id', tenantId);
                            if (activeModuleIds.length > 0) {
                                await supabase.from('tenant_active_modules').insert(
                                    activeModuleIds.map((mid: string) => ({
                                        tenant_id: tenantId,
                                        module_id: mid,
                                        status: 'ACTIVE'
                                    }))
                                );
                            }
                        }
                    };

                    await Promise.allSettled([
                        businessUpsert,
                        companyUpsert,
                        taxUpsert,
                        bankingUpsert,
                        systemUpsert,
                        integrationsUpsert,
                        syncModules()
                    ]);

                    if (newTenant.adminUser.mobile && newTenant.adminUser.password && !editingTenant) {
                        try {
                            const securedPassword = await securePassword(newTenant.adminUser.password);
                            const defaultBranchId = normalizedLocations[0]?.branches.find(b => b.isHeadOffice || b.code === 'HO')?.id || normalizedLocations[0]?.branches[0]?.id || 'unknown';

                            const { error: userError } = await supabase
                                .from('users')
                                .insert({
                                    id: `USER-${Date.now()}`,
                                    tenant_id: data.id,
                                    name: newTenant.adminUser.name || 'Super Admin',
                                    mobile: newTenant.adminUser.mobile,
                                    password: securedPassword,
                                    role: 'SUPER_USER',
                                    branch_id: defaultBranchId,
                                    is_active: true,
                                    created_at: new Date().toISOString()
                                });

                            if (userError) console.error('Error creating admin user:', userError);
                        } catch (err) {
                            console.error('Error in user provisioning:', err);
                        }
                    }

                    const mappedTenant = mapDbTenantToTenant(data);
                    dispatch(editingTenant ? updateTenantDetails({ id: mappedTenant.id, updates: mappedTenant }) : addTenant(mappedTenant));
                    handleCancelEdit();
                    setActiveSection('list');
                    return true;
                }
                return false;
            } else {
                const finalTenant = {
                    ...editingTenant,
                    ...tenantData,
                    id: editingTenant ? editingTenant.id : `TEN-${Date.now()}`,
                    isActive: editingTenant ? editingTenant.isActive : true
                } as Tenant;

                dispatch(editingTenant ? updateTenantDetails({ id: finalTenant.id, updates: finalTenant }) : addTenant(finalTenant));
                handleCancelEdit();
                setActiveSection('list');
                return true;
            }
        } catch (error: any) {
            console.error('Error saving tenant:', error);
            alert(`Failed to save tenant: ${error.message}`);
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    return { handleSubmit };
};
