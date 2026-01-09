import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Vendor, VendorTransaction, VendorState } from '../types/vendor';
import { supabase } from '../lib/supabase';
import { AppDispatch, RootState } from './index';

const initialState: VendorState = {
    vendors: [],
    transactions: [],
    selectedVendor: null,
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
        setSelectedVendor: (state, action: PayloadAction<Vendor | null>) => {
            state.selectedVendor = action.payload;
        },
        resetVendors: (state) => {
            state.vendors = [];
            state.transactions = [];
            state.selectedVendor = null;
            state.error = null;
        },
        deleteVendorLocal: (state, action: PayloadAction<string>) => {
            state.vendors = state.vendors.filter(v => v.id !== action.payload);
        },
    },
});

export const {
    setVendors, addVendor, updateVendor,
    setTransactions: setVendorTransactions, addVendorTransaction,
    setLoading: setVendorLoading, setError: setVendorError,
    setSelectedVendor, resetVendors, deleteVendorLocal
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
            supplierType: v.supplier_type,
            balanceType: v.balance_type,
            creditPeriod: v.credit_period || 0,
            status: v.status || 'Active',
            email: v.email,
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

export const fetchVendorById = (id: string) => async (dispatch: AppDispatch) => {
    dispatch(setVendorLoading(true));
    try {
        const { data, error } = await supabase
            .from('vendors')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        const mappedVendor: Vendor = {
            id: data.id,
            tenantId: data.tenant_id,
            name: data.name,
            phone: data.phone,
            gstin: data.gstin,
            address: data.address,
            contactPerson: data.contact_person,
            openingBalance: Number(data.opening_balance) || 0,
            currentBalance: Number(data.current_balance) || 0,
            isActive: data.is_active,
            supplierType: data.supplier_type,
            balanceType: data.balance_type,
            creditPeriod: data.credit_period || 0,
            status: data.status || 'Active',
            email: data.email,
            createdAt: data.created_at
        };

        dispatch(setSelectedVendor(mappedVendor));
        return mappedVendor;
    } catch (err: any) {
        dispatch(setVendorError(err.message));
        throw err;
    } finally {
        dispatch(setVendorLoading(false));
    }
};

export const fetchVendorHistory = (vendorId: string) => async (dispatch: AppDispatch) => {
    dispatch(setVendorLoading(true));
    try {
        const { data, error } = await supabase
            .from('vendor_transactions')
            .select('*')
            .eq('vendor_id', vendorId)
            .order('date', { ascending: false });

        if (error) throw error;

        const mappedTransactions: VendorTransaction[] = (data || []).map(tx => ({
            id: tx.id,
            tenantId: tx.tenant_id,
            vendorId: tx.vendor_id,
            type: tx.type,
            amount: Number(tx.amount) || 0,
            balanceAfter: Number(tx.balance_after) || 0,
            date: tx.date,
            description: tx.description,
            referenceId: tx.reference_id
        }));

        dispatch(setVendorTransactions(mappedTransactions));
        return mappedTransactions;
    } catch (err: any) {
        dispatch(setVendorError(err.message));
        throw err;
    } finally {
        dispatch(setVendorLoading(false));
    }
};

export const deleteVendor = (id: string) => async (dispatch: AppDispatch) => {
    dispatch(setVendorLoading(true));
    try {
        const { error } = await supabase
            .from('vendors')
            .delete()
            .eq('id', id);

        if (error) throw error;
        dispatch(deleteVendorLocal(id));
    } catch (err: any) {
        dispatch(setVendorError(err.message));
        throw err;
    } finally {
        dispatch(setVendorLoading(false));
    }
};

export default vendorSlice.reducer;
