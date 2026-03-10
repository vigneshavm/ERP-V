import React from 'react';
import { ModuleType, Sector } from "@repo/shared-kernel";
import { Tenant } from "@/entities/session/model/core";

interface UseTenantFormActionsProps {
    newTenant: any;
    setNewTenant: React.Dispatch<React.SetStateAction<any>>;
    tempCity: string;
    setTempCity: React.Dispatch<React.SetStateAction<string>>;
    tempBranch: any;
    setTempBranch: React.Dispatch<React.SetStateAction<any>>;
    setEditingTenant: React.Dispatch<React.SetStateAction<Tenant | null>>;
    setActiveSection: React.Dispatch<React.SetStateAction<'provision' | 'list'>>;
    setActiveTab: React.Dispatch<React.SetStateAction<any>>;
    setLogoInput: React.Dispatch<React.SetStateAction<string>>;
    INITIAL_TENANT_STATE: any;
}

export const useTenantFormActions = ({
    newTenant, setNewTenant,
    tempCity, setTempCity,
    tempBranch, setTempBranch,
    setEditingTenant,
    setActiveSection,
    setActiveTab,
    setLogoInput,
    INITIAL_TENANT_STATE
}: UseTenantFormActionsProps) => {

    const handleModuleToggle = (mod: ModuleType) => {
        if (newTenant.modules.includes(mod)) {
            setNewTenant({ ...newTenant, modules: newTenant.modules.filter((m: any) => m !== mod) });
        } else {
            setNewTenant({ ...newTenant, modules: [...newTenant.modules, mod] });
        }
    };

    const addCity = () => {
        if (!tempCity.trim()) return;
        if (newTenant.locations.find((l: any) => l.city.toLowerCase() === tempCity.toLowerCase())) return;

        setNewTenant((prev: any) => ({
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
        setNewTenant((prev: any) => ({
            ...prev,
            locations: prev.locations.filter((_: any, i: any) => i !== index)
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

        setNewTenant((prev: any) => ({ ...prev, locations: updatedLocations }));
        setTempBranch({ cityIndex: -1, name: '', address: '' });
    };

    const removeBranch = (cityIndex: number, branchIndex: number) => {
        const updatedLocations = [...newTenant.locations];
        updatedLocations[cityIndex].branches = updatedLocations[cityIndex].branches.filter((_: any, i: any) => i !== branchIndex);
        setNewTenant((prev: any) => ({ ...prev, locations: updatedLocations }));
    };

    const handleStartEdit = (tenant: Tenant) => {
        setEditingTenant(tenant);

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
        setNewTenant(INITIAL_TENANT_STATE);
        setLogoInput('');
    };

    return {
        handleModuleToggle,
        addCity, removeCity,
        addBranch, removeBranch,
        handleStartEdit,
        handleCancelEdit
    };
};
