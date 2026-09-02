import { AppDispatch, RootState } from "../store";
import { Customer } from "../../types/sales";
// import { supabase } from '../../lib/supabase'; // Removed
import { setCustomer, addCustomer } from '../slices/posSlice';
import api from "../../services/api.js";

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
            const customer: Customer = {
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
            const customer: Customer = {
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
        console.error('Customer lookup/creation failed:', err);
    }

    // Fallback: Create local-only temp customer if Supabase fails or is disabled
    const tempCustomer: Customer = {
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
