import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Vendor, VendorTransaction, VendorState } from '../types/vendor';
import { supabase } from '../lib/supabase';
import { AppDispatch, RootState } from './index';

const initialState: VendorState = {
    vendors: [],
    transactions: [],
    isLoading: false,
    error: null,
};

const vendorSlice = createSlice({
    name: 'vendor',
    initialState,
    reducers: {
        setVendors: (state, action: PayloadAction<Vendor[]>) => {
            state.vendors = action.payload;
        },
        addVendor: (state, action: PayloadAction<Vendor>) => {
            state.vendors.push(action.payload);
        },
        updateVendor: (state, action: PayloadAction<Vendor>) => {
            const index = state.vendors.findIndex(v => v.id === action.payload.id);
            if (index !== -1) {
                state.vendors[index] = action.payload;
            }
        },
        setTransactions: (state, action: PayloadAction<VendorTransaction[]>) => {
            state.transactions = action.payload;
        },
        addVendorTransaction: (state, action: PayloadAction<VendorTransaction>) => {
            state.transactions.push(action.payload);
            // Update the vendor current balance locally
            const vendor = state.vendors.find(v => v.id === action.payload.vendorId);
            if (vendor) {
                // For Purchases (Credit), balance increases. For Payments (Debit), balance decreases.
                // However, we'll rely on the transaction's amount and balanceAfter for correctness.
                vendor.currentBalance = action.payload.balanceAfter;
            }
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
    },
});

export const {
    setVendors, addVendor, updateVendor,
    setTransactions: setVendorTransactions, addVendorTransaction,
    setLoading: setVendorLoading, setError: setVendorError
} = vendorSlice.actions;

// --- Thunks ---

export const fetchVendors = () => async (dispatch: AppDispatch, getState: () => RootState) => {
    const { user } = getState().auth;
    if (!user?.tenantId) return;

    dispatch(setVendorLoading(true));
    try {
        const { data, error } = await supabase
            .from('vendors')
            .select('*')
            .eq('tenant_id', user.tenantId);

        if (error) throw error;

        const mappedVendors: Vendor[] = (data || []).map(v => ({
            id: v.id,
            tenantId: v.tenant_id,
            name: v.name,
            phone: v.phone,
            gstin: v.gstin,
            address: v.address,
            contactPerson: v.contact_person,
            openingBalance: Number(v.opening_balance) || 0,
            currentBalance: Number(v.current_balance) || 0,
            isActive: v.is_active,
            createdAt: v.created_at
        }));

        dispatch(setVendors(mappedVendors));
    } catch (err: any) {
        dispatch(setVendorError(err.message));
    } finally {
        dispatch(setVendorLoading(false));
    }
};

export const recordVendorTransaction = (
    vendorId: string,
    type: VendorTransaction['type'],
    amount: number,
    description: string,
    referenceId?: string
) => async (dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState();
    const { user } = state.auth;
    const vendor = state.vendor.vendors.find(v => v.id === vendorId);

    if (!user?.tenantId || !vendor) return;

    // Logic: 
    // - PURCHASE: Increases Payable (Positive)
    // - PAYMENT: Decreases Payable (Negative)
    // - RETURN: Decreases Payable (Negative)
    // - ADJUSTMENT: Can be either

    let signedAmount = amount;
    if (type === 'PAYMENT' || type === 'RETURN') {
        signedAmount = -amount;
    }

    const newBalance = vendor.currentBalance + signedAmount;

    try {
        const { data, error } = await supabase
            .from('vendor_transactions')
            .insert([{
                tenant_id: user.tenantId,
                vendor_id: vendorId,
                type,
                amount: signedAmount,
                balance_after: newBalance,
                description,
                reference_id: referenceId
            }])
            .select()
            .single();

        if (error) throw error;

        // Update vendor balance in DB
        await supabase
            .from('vendors')
            .update({ current_balance: newBalance })
            .eq('id', vendorId);

        const mappedTx: VendorTransaction = {
            id: data.id,
            tenantId: data.tenant_id,
            vendorId: data.vendor_id,
            type: data.type,
            amount: data.amount,
            balanceAfter: data.balance_after,
            date: data.date,
            description: data.description,
            referenceId: data.reference_id
        };

        dispatch(addVendorTransaction(mappedTx));
    } catch (err: any) {
        console.error('Failed to record vendor transaction:', err);
    }
};

export default vendorSlice.reducer;
