import React, { FormEvent } from 'react';
import { useDispatch } from 'react-redux';
import api from "../services/api.js";
import { updateTenantDetails, addTenant } from "../redux/slices/tenantSlice";
import { Tenant } from "../types/tenant";
import { CURRENCIES } from '../constants/common';

// Local mapper function (kept for reference, mostly handling API response mapping now)
export const mapDbTenantToTenant = (dbTenant: any): Tenant => {
    return {
        id: dbTenant._id || dbTenant.id,
        name: dbTenant.businessName || dbTenant.name,
        sector: dbTenant.category, // Mapping category to sector
        subdomain: dbTenant.subdomain || 'app',
        modules: dbTenant.modules || [],
        isActive: true,
        region: {
            currency: 'INR',
            currencySymbol: '₹',
            dateFormat: 'DD/MM/YYYY'
        },
        // ... Default values for missing fields
    };
};

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

        if (!newTenant.name) {
            alert("Business Name is required.");
            return false;
        }

        // Map frontend form data to backend BusinessProfile structure
        const payload = {
            businessName: newTenant.name,
            category: newTenant.sector,
            phone: newTenant.companyDetails?.phone,
            email: newTenant.companyDetails?.email,
            address: newTenant.companyDetails?.addressLine1,
            // Add other fields if backend supports them or extended schema
        };

        setIsSaving(true);

        try {
            let data;

            if (editingTenant) {
                // Update Profile
                const res = await api.put('/business/profile', payload);
                data = res.data.data;
            } else {
                // Setup / Create
                // If creating a NEW tenant (as in multi-tenant SaaS admin), this endpoint might differ.
                // Assuming 'completeSetup' or similar for self-service or admin.
                const res = await api.post('/business/setup', payload);
                data = res.data.data;
            }

            if (data) {
                const mappedTenant = mapDbTenantToTenant(data);
                // Merge with local form data for fields backend doesn't return yet to keep UI state consistent
                const finalTenant = {
                    ...mappedTenant,
                    ...newTenant, // Overlay local data
                    id: mappedTenant.id // Keep ID from backend
                };

                dispatch(editingTenant ? updateTenantDetails({ id: finalTenant.id, updates: finalTenant }) : addTenant(finalTenant));
                handleCancelEdit();
                setActiveSection('list');
                return true;
            }
            return false;
        } catch (error: any) {
            console.error('Error saving tenant:', error);
            alert(`Failed to save tenant: ${error.message || 'Unknown API Error'}`);
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    return { handleSubmit };
};
