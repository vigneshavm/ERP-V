import { logger } from '@/shared/lib/logger';
import { AppDispatch, RootState } from "@/app/store";
import { Customer } from "@repo/shared";
import { APP_CONFIG } from "@/app/config";
// import { supabase } from '../../lib/supabase'; // Removed
import { setCustomer, addCustomer } from '@/entities/sales/model/posSlice';
import api from "@/shared/api/api";

const calculateTier = (points: number): 'Silver' | 'Gold' | 'Platinum' | 'General' => {
    if (points >= 5000) return 'Platinum';
    if (points >= 2000) return 'Gold';
    if (points >= 500) return 'Silver';
    return 'General';
};

export const lookupOrCreateCustomer = (phone: string, name?: string) => async (dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState();
    const { user } = state.auth;
    const { customers } = state.pos;

    if (!user?.tenantId) return;

    // 1. Check local state first
    const existingLocal = customers.find((c: Customer) => c.phone === phone);
    if (existingLocal) {
        const updatedLocal = { ...existingLocal, tier: calculateTier(existingLocal.points) };
        alert(`Existing customer found for ${phone}: ${existingLocal.name}. Selecting profile.`);
        dispatch(setCustomer(updatedLocal.id));
        return updatedLocal;
    }


    // 2. Check Backend API
    // Always check API if not found locally
    try {
        const { data: searchResult } = await api.get(`/customers/search?phone=${phone}`);
        const dbCust = searchResult?.data;

        if (dbCust) {
            const customer: any = {
                id: dbCust.id,
                name: dbCust.name,
                phone: dbCust.phone,
                points: dbCust.points || 0,
                tier: calculateTier(dbCust.points || 0),
                tenantId: dbCust.tenantId,
                dues: dbCust.dues || 0 // Fix missing property
            };
            alert(`Existing customer found in database for ${phone}: ${customer.name}. Selecting profile.`);
            dispatch(addCustomer(customer));
            dispatch(setCustomer(customer.id));
            return customer;
        }

        // 3. Create new if not found (Lite-weight creation)
        const newCustData = {
            phone: phone,
            name: name || 'Walk-in Customer',
            points: 0
        };

        alert(`Creating new profile for ${phone}: ${newCustData.name}`);

        const { data: createResult } = await api.post('/customers', newCustData);
        const createdCust = createResult?.data;

        if (createdCust) {
            const customer: any = {
                id: createdCust.id,
                name: createdCust.name,
                phone: createdCust.phone,
                points: createdCust.points || 0,
                tier: 'General',
                tenantId: createdCust.tenantId,
                dues: 0 // Fix missing property
            };
            dispatch(addCustomer(customer));
            dispatch(setCustomer(customer.id));
            return customer;
        }
    } catch (err) {
        logger.error('Customer lookup/creation failed:', err as any);
    }

    // Fallback: Create local-only temp customer if Supabase fails or is disabled
    const tempCustomer: any = {
        id: `temp-${Date.now()}`,
        name: name || 'Walk-in Customer',
        phone: phone,
        points: 0,
        tier: 'General',
        tenantId: user.tenantId,
        dues: 0
    };
    dispatch(addCustomer(tempCustomer));
    dispatch(setCustomer(tempCustomer.id));
    return tempCustomer;
};

