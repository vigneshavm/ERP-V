import { useState, FormEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { updateTenantDetails, addTenant } from '../store';
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

import { useTenantFormState, INITIAL_TENANT_STATE } from './useTenantFormState';
import { useTenantFormActions } from './useTenantFormActions';
import { useTenantFormSubmission } from './useTenantFormSubmission';

export const useTenantForm = () => {
    const { tenants } = useSelector((state: RootState) => state.tenant);

    const {
        activeSection, setActiveSection,
        activeTab, setActiveTab,
        isSaving, setIsSaving,
        logoInput, setLogoInput,
        editingTenant, setEditingTenant,
        tempCity, setTempCity,
        tempBranch, setTempBranch,
        newTenant, setNewTenant
    } = useTenantFormState();

    const {
        handleModuleToggle,
        addCity, removeCity,
        addBranch, removeBranch,
        handleStartEdit,
        handleCancelEdit
    } = useTenantFormActions({
        newTenant, setNewTenant,
        tempCity, setTempCity,
        tempBranch, setTempBranch,
        setEditingTenant,
        setActiveSection,
        setActiveTab,
        setLogoInput,
        INITIAL_TENANT_STATE
    });

    const { handleSubmit } = useTenantFormSubmission({
        newTenant,
        logoInput,
        editingTenant,
        setIsSaving,
        handleCancelEdit,
        setActiveSection
    });

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
