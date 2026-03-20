import { useState, FormEvent } from 'react';
import { useDispatch } from 'react-redux';
import { ModuleType, Sector } from '@repo/shared';
import { Tenant, TenantLocation } from '@/entities/session/model/core';
import { updateTenantDetails, addTenant } from '@/entities/session/model/tenantSlice';
import { logger } from '@/shared/lib/logger';
import api from '@/shared/api/api';
import { mapDbTenant } from '../tenantMappers';

import { INITIAL_TENANT_STATE } from './constants';

type TenantFormTab = 'business' | 'geography' | 'branding' | 'contact' | 'tax' | 'preference' | 'banking' | 'system' | 'user' | 'integrations';

export const useTenantForm = () => {
    const dispatch = useDispatch();

    const [newTenant, setNewTenant] = useState(INITIAL_TENANT_STATE);
    const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
    const [activeSection, setActiveSection] = useState<'provision' | 'list'>('provision');
    const [activeTab, setActiveTab] = useState<TenantFormTab>('business');
    const [isSaving, setIsSaving] = useState(false);
    const [logoInput, setLogoInput] = useState('');
    const [tempCity, setTempCity] = useState('');
    const [tempBranch, setTempBranch] = useState({ cityIndex: -1, name: '', address: '' });

    const startEdit = (tenant: Tenant) => {
        setEditingTenant(tenant);
        const hoLoc = tenant.locations?.find(l => l.branches?.some((b: any) => b.isHeadOffice || b.code === 'HO'));
        const hoBranch = hoLoc?.branches?.find((b: any) => b.isHeadOffice || b.code === 'HO') as any;
        setNewTenant({
            ...INITIAL_TENANT_STATE,
            name: tenant.name, subdomain: tenant.subdomain || '', modules: tenant.modules || [],
            currency: tenant.region?.currency || 'USD', dateFormat: tenant.region?.dateFormat || 'MM/DD/YYYY',
            sector: tenant.sector, layout: tenant.layout || 'standard', domain: tenant.domain || '',
            loginLogoUrl: tenant.loginLogoUrl || '', loginBgUrl: tenant.loginBgUrl || '',
            locations: tenant.locations || [],
            initialBranch: { code: hoBranch?.code || 'HO', name: hoBranch?.name || 'Head Office', address: hoBranch?.address || '', warehouse: hoBranch?.warehouse || 'Main Warehouse' },
            integrations: tenant.integrations || INITIAL_TENANT_STATE.integrations,
            businessType: tenant.businessType || '', natureOfBusiness: tenant.natureOfBusiness || '', tradeDescription: tenant.tradeDescription || '',
            companyDetails: tenant.companyDetails || INITIAL_TENANT_STATE.companyDetails,
            taxDetails: tenant.taxDetails || INITIAL_TENANT_STATE.taxDetails,
            bankingDetails: tenant.bankingDetails || INITIAL_TENANT_STATE.bankingDetails,
            systemConfig: tenant.systemConfig || INITIAL_TENANT_STATE.systemConfig,
        });
        setLogoInput(tenant.loginLogoUrl || '');
        setActiveSection('provision');
        setActiveTab('business');
    };

    const cancelEdit = () => {
        setEditingTenant(null);
        setNewTenant(INITIAL_TENANT_STATE);
        setLogoInput('');
    };

    const toggleModule = (mod: ModuleType) => {
        setNewTenant(prev => ({
            ...prev,
            modules: prev.modules.includes(mod) ? prev.modules.filter(m => m !== mod) : [...prev.modules, mod],
        }));
    };

    const addCity = () => {
        if (!tempCity.trim() || newTenant.locations.find(l => l.city.toLowerCase() === tempCity.toLowerCase())) return;
        setNewTenant(prev => ({ ...prev, locations: [...prev.locations, { city: tempCity, branches: [{ id: `temp-${Date.now()}`, name: tempCity, city: tempCity, address: 'Main Office' } as any] }] }));
        setTempCity('');
    };

    const removeCity = (index: number) => setNewTenant(prev => ({ ...prev, locations: prev.locations.filter((_, i) => i !== index) }));

    const addBranch = (cityIndex: number) => {
        if (!tempBranch.name || !tempBranch.address) return;
        setNewTenant(prev => {
            const locs = [...prev.locations];
            locs[cityIndex] = { ...locs[cityIndex], branches: [...(locs[cityIndex].branches || []), { id: `temp-${Date.now()}`, name: tempBranch.name, city: locs[cityIndex].city, address: tempBranch.address } as any] };
            return { ...prev, locations: locs };
        });
        setTempBranch({ cityIndex: -1, name: '', address: '' });
    };

    const removeBranch = (cityIndex: number, branchIndex: number) => {
        setNewTenant(prev => {
            const locs = [...prev.locations];
            locs[cityIndex] = { ...locs[cityIndex], branches: locs[cityIndex].branches.filter((_, i) => i !== branchIndex) };
            return { ...prev, locations: locs };
        });
    };

    const submit = async (e?: FormEvent): Promise<boolean> => {
        if (e) e.preventDefault();
        if (!newTenant.name) { alert('Business Name is required.'); return false; }
        const payload = { businessName: newTenant.name, category: newTenant.sector, phone: newTenant.companyDetails?.phone, email: newTenant.companyDetails?.email, address: newTenant.companyDetails?.addressLine1 };
        setIsSaving(true);
        try {
            const res = editingTenant ? await api.put('/business/profile', payload) : await api.post('/business/setup', payload);
            const data = res.data?.data;
            if (!data) return false;
            const mapped = mapDbTenant(data);
            dispatch(editingTenant ? updateTenantDetails({ id: mapped.id, updates: { ...mapped, ...newTenant, id: mapped.id } }) : addTenant({ ...mapped, ...newTenant, id: mapped.id }));
            cancelEdit();
            setActiveSection('list');
            return true;
        } catch (err: any) {
            logger.error('Error saving tenant:', err);
            alert(`Failed to save: ${err.message || 'Unknown error'}`);
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    return {
        newTenant, setNewTenant, editingTenant,
        activeSection, setActiveSection, activeTab, setActiveTab,
        isSaving, logoInput, setLogoInput,
        tempCity, setTempCity, tempBranch, setTempBranch,
        startEdit, cancelEdit, toggleModule,
        addCity, removeCity, addBranch, removeBranch, submit,
    };
};
