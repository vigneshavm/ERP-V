import { AppDispatch, RootState } from '../index';
import { Customer } from '../../types/sales';
import { APP_CONFIG } from '../../config';
import { supabase } from '../../lib/supabase';
import { setCustomer, addCustomer } from '../posSlice';

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
    const existingLocal = customers.find(c => c.phone === phone);
    if (existingLocal) {
        const updatedLocal = { ...existingLocal, tier: calculateTier(existingLocal.points) };
        alert(`Existing customer found for ${phone}: ${existingLocal.name}. Selecting profile.`);
        dispatch(setCustomer(updatedLocal.id));
        return updatedLocal;
    }

    // 2. Check Supabase
    if (APP_CONFIG.USE_SUPABASE && supabase) {
        try {
            const { data: dbCust, error: fetchErr } = await supabase
                .from('customers')
                .select('*')
                .eq('tenant_id', user.tenantId)
                .eq('phone', phone)
                .single();

            if (dbCust) {
                const customer: Customer = {
                    id: dbCust.id,
                    name: dbCust.name,
                    phone: dbCust.phone,
                    points: dbCust.points || 0,
                    tier: calculateTier(dbCust.points || 0),
                    tenantId: dbCust.tenant_id
                };
                alert(`Existing customer found in database for ${phone}: ${customer.name}. Selecting profile.`);
                dispatch(addCustomer(customer));
                dispatch(setCustomer(customer.id));
                return customer;
            }

            // 3. Create new if not found (Lite-weight creation)
            const newCustData = {
                tenant_id: user.tenantId,
                phone: phone,
                name: name || 'Walk-in Customer',
                points: 0
            };

            alert(`Creating new profile for ${phone}: ${newCustData.name}`);

            const { data: createdCust, error: createErr } = await supabase
                .from('customers')
                .insert([newCustData])
                .select()
                .single();

            if (createErr) {
                // Handle Duplicate (Race condition or existing but fetch failed)
                if (createErr.code === '23505') {
                    const { data: retryCust } = await supabase
                        .from('customers')
                        .select('*')
                        .eq('tenant_id', user.tenantId)
                        .eq('phone', phone)
                        .single();

                    if (retryCust) {
                        alert(`A customer with phone ${phone} already exists (${retryCust.name}). Selecting existing profile.`);
                        const customer: Customer = {
                            id: retryCust.id,
                            name: retryCust.name,
                            phone: retryCust.phone,
                            points: retryCust.points || 0,
                            tier: calculateTier(retryCust.points || 0),
                            tenantId: retryCust.tenant_id
                        };
                        dispatch(addCustomer(customer));
                        dispatch(setCustomer(customer.id));
                        return customer;
                    }
                }
                throw createErr;
            }

            if (createdCust) {
                const customer: Customer = {
                    id: createdCust.id,
                    name: createdCust.name,
                    phone: createdCust.phone,
                    points: createdCust.points || 0,
                    tier: 'General',
                    tenantId: createdCust.tenant_id
                };
                dispatch(addCustomer(customer));
                dispatch(setCustomer(customer.id));
                return customer;
            }
        } catch (err) {
            console.error('Customer lookup/creation failed:', err);
        }
    }

    // Fallback: Create local-only temp customer if Supabase fails or is disabled
    const tempCustomer: Customer = {
        id: `temp-${Date.now()}`,
        name: name || 'Walk-in Customer',
        phone: phone,
        points: 0,
        tier: 'General',
        tenantId: user.tenantId
    };
    dispatch(addCustomer(tempCustomer));
    dispatch(setCustomer(tempCustomer.id));
    return tempCustomer;
};
