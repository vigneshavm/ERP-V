import { useState, FormEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { updateTenantDetails, addTenant } from '../store/tenantSlice';
import { Tenant, BranchConfig, TenantLocation } from '../types/tenant';
import { Sector, ModuleType } from '../types/common';
import { securePassword } from '../utils/auth';
import { APP_CONFIG } from '../config';
import { supabase } from '../lib/supabase';

// Helper to map DB tenant to FE Tenant object
// We export this or keep it internal if only used here.
export const mapDbTenantToTenant = (t: any): Tenant => {
    return {
        id: t.id,
        name: t.name,
        sector: t.sector,
        subdomain: t.subdomain,
        modules: t.modules || [],
        isActive: t.is_active,
        region: t.region || { currency: 'USD', currencySymbol: '$', dateFormat: 'MM/DD/YYYY' },
        theme: t.theme || 'light',
        layout: t.layout || 'standard',
        domain: t.domain,
        primaryColor: t.primary_color,
        loginLogoUrl: t.login_logo_url,
        loginBgUrl: t.login_bg_url,
        locations: t.locations || [],
        loyaltyConfig: t.loyalty_config,
        // Enhanced fields
        businessType: t.business_type,
        natureOfBusiness: t.nature_of_business,
        tradeDescription: t.trade_description,
        updatedAt: t.updated_at,
        companyDetails: t.company_details,
        taxDetails: t.tax_details,
        bankingDetails: t.banking_details,
        systemConfig: t.system_config,
        integrations: t.integrations
    };
};

export const useTenantForm = () => {
    const dispatch = useDispatch();
    const { tenants } = useSelector((state: RootState) => state.tenant);

    // UI State
    const [activeSection, setActiveSection] = useState<'provision' | 'list'>('provision');
    const [activeTab, setActiveTab] = useState<'business' | 'geography' | 'branding' | 'contact' | 'tax' | 'preference' | 'banking' | 'system' | 'user' | 'integrations'>('business');
    const [isSaving, setIsSaving] = useState(false);
    const [logoInput, setLogoInput] = useState('');

    // Form State
    const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

    // Helper state for list items
    const [tempCity, setTempCity] = useState('');
    const [tempBranch, setTempBranch] = useState<{ cityIndex: number, name: string, address: string }>({ cityIndex: -1, name: '', address: '' });

    const [newTenant, setNewTenant] = useState<{
        name: string;
        subdomain: string;
        modules: ModuleType[];
        currency: string;
        dateFormat: string;
        sector: Sector;
        theme: 'light' | 'dark';
        layout: 'standard' | 'compact';
        domain: string;
        primaryColor?: string;
        loginLogoUrl: string;
        loginBgUrl: string;
        locations: TenantLocation[];
        initialBranch: {
            code: string;
            name: string;
            address: string;
            warehouse: string;
        };
        adminUser: {
            name: string;
            mobile: string;
            password: string;
            role: string;
        };
        integrations: {
            paymentGatewayKey: string;
            smsProviderKey: string;
            emailProviderKey: string;
            webhookUrl: string;
        };
        businessType: string;
        natureOfBusiness: string;
        tradeDescription: string;
        companyDetails: {
            addressLine1: string;
            addressLine2: string;
            city: string;
            state: string;
            stateCode: string;
            country: string;
            pincode: string;
            phone: string;
            alternatePhone: string;
            email: string;
            website: string;
        };
        taxDetails: {
            taxSystem: 'GST' | 'VAT' | 'NONE';
            gstin: string;
            pan: string;
            isGstEnabled: boolean;
            isEInvoiceEnabled: boolean;
            isEWayBillEnabled: boolean;
        };
        bankingDetails: {
            bankName: string;
            accountNumber: string;
            accountHolderName: string;
            ifsc: string;
            booksStartDate: string;
            financialYearClosing: string;
        };
        systemConfig: {
            isPosEnabled: boolean;
            isInventoryEnabled: boolean;
            isLoyaltyEnabled: boolean;
            isMultiBranch: boolean;
            isEcommerceEnabled: boolean;
            pricingMode: 'INCLUSIVE' | 'EXCLUSIVE';
        };
    }>({
        name: '',
        subdomain: '',
        modules: [] as ModuleType[],
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        sector: Sector.GENERAL,
        theme: 'light',
        layout: 'standard',
        domain: '',
        loginLogoUrl: '',
        loginBgUrl: '',
        locations: [],
        initialBranch: {
            code: 'HO',
            name: 'Head Office',
            address: '',
            warehouse: 'Main Warehouse'
        },
        adminUser: {
            name: '',
            mobile: '',
            password: '',
            role: 'SUPER_USER'
        },
        integrations: {
            paymentGatewayKey: '',
            smsProviderKey: '',
            emailProviderKey: '',
            webhookUrl: ''
        },
        businessType: '',
        natureOfBusiness: '',
        tradeDescription: '',
        companyDetails: {
            addressLine1: '', addressLine2: '', city: '', state: '', stateCode: '',
            country: 'India', pincode: '', phone: '', alternatePhone: '', email: '', website: ''
        },
        taxDetails: { taxSystem: 'GST', gstin: '', pan: '', isGstEnabled: true, isEInvoiceEnabled: false, isEWayBillEnabled: false },
        bankingDetails: { bankName: '', accountNumber: '', accountHolderName: '', ifsc: '', booksStartDate: new Date().toISOString().split('T')[0], financialYearClosing: '03-31' },
        systemConfig: { isPosEnabled: true, isInventoryEnabled: true, isLoyaltyEnabled: false, isMultiBranch: false, isEcommerceEnabled: false, pricingMode: 'EXCLUSIVE' }
    });

    // Actions
    const handleModuleToggle = (mod: ModuleType) => {
        if (newTenant.modules.includes(mod)) {
            setNewTenant({ ...newTenant, modules: newTenant.modules.filter(m => m !== mod) });
        } else {
            setNewTenant({ ...newTenant, modules: [...newTenant.modules, mod] });
        }
    };

    const addCity = () => {
        if (!tempCity.trim()) return;
        if (newTenant.locations.find(l => l.city.toLowerCase() === tempCity.toLowerCase())) return;

        setNewTenant(prev => ({
            ...prev,
            locations: [...prev.locations, {
                city: tempCity,
                branches: [{
                    id: `temp-${Date.now()}`,
                    name: tempCity,
                    city: tempCity,
                    address: 'Main Office'
                }]
            }]
        }));
        setTempCity('');
    };

    const removeCity = (index: number) => {
        setNewTenant(prev => ({
            ...prev,
            locations: prev.locations.filter((_, i) => i !== index)
        }));
    };

    const addBranch = (cityIndex: number) => {
        if (!tempBranch.name || !tempBranch.address) return;

        const updatedLocations = [...newTenant.locations];
        const city = updatedLocations[cityIndex];

        updatedLocations[cityIndex] = {
            ...city,
            branches: [
                ...city.branches,
                {
                    id: `temp-${Date.now()}`,
                    name: tempBranch.name,
                    city: city.city,
                    address: tempBranch.address
                }
            ]
        };

        setNewTenant(prev => ({ ...prev, locations: updatedLocations }));
        setTempBranch({ cityIndex: -1, name: '', address: '' });
    };

    const removeBranch = (cityIndex: number, branchIndex: number) => {
        const updatedLocations = [...newTenant.locations];
        updatedLocations[cityIndex].branches = updatedLocations[cityIndex].branches.filter((_, i) => i !== branchIndex);
        setNewTenant(prev => ({ ...prev, locations: updatedLocations }));
    };

    const handleStartEdit = (tenant: Tenant) => {
        setEditingTenant(tenant);

        // Helper to find initial branch if it exists logically in data
        const hoLocation = tenant.locations?.find((l: any) => l.branches.some((b: any) => b.isHeadOffice || b.code === 'HO'));
        const hoBranchData = hoLocation?.branches?.find((b: any) => b.isHeadOffice || b.code === 'HO');

        setNewTenant({
            name: tenant.name,
            subdomain: tenant.subdomain || '',
            modules: tenant.modules || [],
            currency: tenant.region?.currency || 'USD',
            dateFormat: tenant.region?.dateFormat || 'MM/DD/YYYY',
            sector: tenant.sector,
            theme: tenant.theme || 'light',
            layout: tenant.layout || 'standard',
            domain: tenant.domain || '',
            primaryColor: tenant.primaryColor,
            loginLogoUrl: tenant.loginLogoUrl || '',
            loginBgUrl: tenant.loginBgUrl || '',
            locations: tenant.locations || [],
            initialBranch: {
                code: hoBranchData?.code || 'HO',
                name: hoBranchData?.name || 'Head Office',
                address: hoBranchData?.address || '',
                warehouse: hoBranchData?.warehouse || 'Main Warehouse'
            },
            adminUser: {
                name: '',
                mobile: '',
                password: '',
                role: 'SUPER_USER'
            },
            integrations: tenant.integrations || {
                paymentGatewayKey: '',
                smsProviderKey: '',
                emailProviderKey: '',
                webhookUrl: ''
            },
            businessType: tenant.businessType || '',
            natureOfBusiness: tenant.natureOfBusiness || '',
            tradeDescription: tenant.tradeDescription || '',
            companyDetails: tenant.companyDetails || {
                addressLine1: '', addressLine2: '', city: '', state: '', stateCode: '',
                country: 'India', pincode: '', phone: '', alternatePhone: '', email: '', website: ''
            },
            taxDetails: tenant.taxDetails || { taxSystem: 'GST', gstin: '', pan: '', isGstEnabled: true },
            bankingDetails: tenant.bankingDetails || { bankName: '', accountNumber: '', accountHolderName: '', ifsc: '', booksStartDate: '', financialYearClosing: '03-31' },
            systemConfig: tenant.systemConfig || { isPosEnabled: true, isInventoryEnabled: true, isLoyaltyEnabled: false, isMultiBranch: false, isEcommerceEnabled: false, pricingMode: 'EXCLUSIVE' }
        });

        setActiveSection('provision');
        setActiveTab('business');
        setLogoInput(tenant.loginLogoUrl || '');
    };

    const handleCancelEdit = () => {
        setEditingTenant(null);
        setNewTenant({
            name: '', subdomain: '', modules: [], currency: 'USD', dateFormat: 'MM/DD/YYYY',
            sector: Sector.GENERAL, theme: 'light', layout: 'standard', domain: '',
            loginLogoUrl: '', loginBgUrl: '', locations: [],
            initialBranch: { code: 'HO', name: 'Head Office', address: '', warehouse: 'Main Warehouse' },
            adminUser: { name: '', mobile: '', password: '', role: 'SUPER_USER' },
            integrations: { paymentGatewayKey: '', smsProviderKey: '', emailProviderKey: '', webhookUrl: '' },
            businessType: '', natureOfBusiness: '', tradeDescription: '',
            companyDetails: {
                addressLine1: '', addressLine2: '', city: '', state: '', stateCode: '',
                country: 'India', pincode: '', phone: '', alternatePhone: '', email: '', website: ''
            },
            taxDetails: { taxSystem: 'GST', gstin: '', pan: '', isGstEnabled: true, isEInvoiceEnabled: false, isEWayBillEnabled: false },
            bankingDetails: { bankName: '', accountNumber: '', accountHolderName: '', ifsc: '', booksStartDate: new Date().toISOString().split('T')[0], financialYearClosing: '03-31' },
            systemConfig: { isPosEnabled: true, isInventoryEnabled: true, isLoyaltyEnabled: false, isMultiBranch: false, isEcommerceEnabled: false, pricingMode: 'EXCLUSIVE' }
        });
        setLogoInput('');
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        // Basic Validation
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

        // Prepare initial branch object
        const hoBranch: BranchConfig = {
            id: editingTenant && newTenant.initialBranch.code === 'HO' ? 'keep-existing-id' : `BR-${Date.now()}`,
            // If editing, logic to find existing HO ID is complex, simplified here or handled via careful state mapping
            // Actually proper logic is below in handleStartEdit to map it.
            // For submit, we construct the object.
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

        // Check if HO city exists in locations
        const existingLocIndex = normalizedLocations.findIndex(l => l.city.toLowerCase() === hoCity.toLowerCase());

        if (existingLocIndex >= 0) {
            // Check if HO branch exists
            const existingHoIndex = normalizedLocations[existingLocIndex].branches.findIndex(b => b.isHeadOffice || b.code === 'HO');
            if (existingHoIndex >= 0) {
                // Update
                normalizedLocations[existingLocIndex].branches[existingHoIndex] = {
                    ...normalizedLocations[existingLocIndex].branches[existingHoIndex],
                    ...hoBranch,
                    id: normalizedLocations[existingLocIndex].branches[existingHoIndex].id // Preserve ID
                };
            } else {
                // Add HO
                normalizedLocations[existingLocIndex].branches.unshift(hoBranch);
            }
        } else {
            // Create new location
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
                    // Update Accessory Tables for Scalability (Consistent with SettingsManager)
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

                    // Module Sync Helper
                    const syncModules = async () => {
                        const { data: systemModules } = await supabase.from('system_modules').select('id, code');
                        if (systemModules) {
                            const activeModuleIds = tenantData.modules
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

                    // Execute all upserts but don't block the main flow if they take a while
                    // (though we should probably wait for them in a production app)
                    await Promise.allSettled([
                        businessUpsert,
                        companyUpsert,
                        taxUpsert,
                        bankingUpsert,
                        systemUpsert,
                        integrationsUpsert,
                        syncModules()
                    ]);

                    // Create Admin User if provided
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

                    dispatch(editingTenant ? updateTenantDetails(mapDbTenantToTenant(data)) : addTenant(mapDbTenantToTenant(data)));
                    handleCancelEdit();
                    setActiveSection('list');
                }
            } else {
                // Mock behavior
                const finalTenant = {
                    ...editingTenant,
                    ...tenantData,
                    id: editingTenant ? editingTenant.id : `TEN-${Date.now()}`,
                    isActive: editingTenant ? editingTenant.isActive : true
                } as Tenant;

                dispatch(editingTenant ? updateTenantDetails(finalTenant) : addTenant(finalTenant));
                handleCancelEdit();
                setActiveSection('list');
            }
        } catch (error: any) {
            console.error('Error saving tenant:', error);
            alert(`Failed to save tenant: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    return {
        // State
        activeSection, setActiveSection,
        activeTab, setActiveTab,
        isSaving,
        newTenant, setNewTenant,
        logoInput, setLogoInput,
        editingTenant,
        tempCity, setTempCity,
        tempBranch, setTempBranch,
        tenants,

        // Actions
        handleModuleToggle,
        addCity, removeCity,
        addBranch, removeBranch,
        handleStartEdit,
        handleCancelEdit,
        handleSubmit
    };
};
