
import { useState } from 'react';
import { Tenant } from "@/entities/session/model/core";
// Mock logic for form handling
export const useTenantForm = () => {
    const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
    const [newTenant, setNewTenant] = useState<Partial<Tenant>>({
        modules: []
    });
    const [activeTab, setFormTab] = useState('business');
    const [isSaving, setIsSaving] = useState(false);

    // Geography helpers
    const [tempCity, setTempCity] = useState('');
    const [tempBranch, setTempBranch] = useState<any>({});

    // Branding
    const [logoInput, setLogoInput] = useState('');

    const handleStartEdit = (tenant: Tenant) => {
        setEditingTenant(tenant);
        setNewTenant(tenant);
    };

    const handleCancelEdit = () => {
        setEditingTenant(null);
        setNewTenant({ modules: [] });
    };

    const handleSubmit = async () => {
        setIsSaving(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsSaving(false);
        return true;
    };

    const handleModuleToggle = (moduleName: string) => {
        setNewTenant(prev => {
            const modules = prev.modules || [];
            if (modules.includes(moduleName as any)) {
                return { ...prev, modules: modules.filter(m => m !== moduleName) };
            } else {
                return { ...prev, modules: [...modules, moduleName as any] };
            }
        });
    };

    const addCity = () => {
        if (!tempCity) return;
        setNewTenant(prev => ({
            ...prev,
            locations: [...(prev.locations || []), { city: tempCity, branches: [] }]
        }));
        setTempCity('');
    };

    const removeCity = (idx: number) => {
        setNewTenant(prev => ({
            ...prev,
            locations: (prev.locations || []).filter((_, i) => i !== idx)
        }));
    };
    const addBranch = (cityIdx: number) => {
        if (!tempBranch.name) return;
        setNewTenant(prev => {
            const locations = [...(prev.locations || [])];
            locations[cityIdx] = {
                ...locations[cityIdx],
                branches: [...locations[cityIdx].branches, { ...tempBranch, id: Math.random().toString(36).substr(2, 9) }]
            };
            return { ...prev, locations };
        });
        setTempBranch({ name: '', address: '' });
    };

    const removeBranch = (cityIdx: number, brIdx: number) => {
        setNewTenant(prev => {
            const locations = [...(prev.locations || [])];
            locations[cityIdx] = {
                ...locations[cityIdx],
                branches: locations[cityIdx].branches.filter((_, i) => i !== brIdx)
            };
            return { ...prev, locations };
        });
    };

    return {
        editingTenant,
        newTenant,
        setNewTenant,
        activeTab,
        setFormTab,
        isSaving,
        handleStartEdit,
        handleCancelEdit,
        handleSubmit,
        handleModuleToggle,
        tempCity,
        setTempCity,
        addCity,
        removeCity,
        tempBranch,
        setTempBranch,
        addBranch,
        removeBranch,
        logoInput,
        setLogoInput
    };
};
