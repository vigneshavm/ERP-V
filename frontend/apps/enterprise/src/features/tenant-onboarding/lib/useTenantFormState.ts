import { useState } from 'react';
import { Tenant } from "@/entities/session/model/core";
import { Sector, ModuleType } from "@repo/shared";
import { TenantLocation } from "@/entities/session/model/core";

import { INITIAL_TENANT_STATE } from './constants';

export const useTenantFormState = () => {
    const [activeSection, setActiveSection] = useState<'provision' | 'list'>('provision');
    const [activeTab, setActiveTab] = useState<'business' | 'geography' | 'branding' | 'contact' | 'tax' | 'preference' | 'banking' | 'system' | 'user' | 'integrations'>('business');
    const [isSaving, setIsSaving] = useState(false);
    const [logoInput, setLogoInput] = useState('');
    const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
    const [tempCity, setTempCity] = useState('');
    const [tempBranch, setTempBranch] = useState<{ cityIndex: number, name: string, address: string }>({ cityIndex: -1, name: '', address: '' });
    const [newTenant, setNewTenant] = useState(INITIAL_TENANT_STATE);

    return {
        activeSection, setActiveSection,
        activeTab, setActiveTab,
        isSaving, setIsSaving,
        logoInput, setLogoInput,
        editingTenant, setEditingTenant,
        tempCity, setTempCity,
        tempBranch, setTempBranch,
        newTenant, setNewTenant
    };
};

