import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from "../../services/api.js";
import { RootState } from '../store';

const API_URL = "/api/combo-offers";

export interface ComboOfferItemLine {
    itemId: string;
    quantity: number;
}

export interface ComboOfferItemLinePopulated {
    itemId: { _id: string; name: string; sku: string; sellingPrice: number; barcode?: string };
    quantity: number;
}

export interface ComboOffer {
    _id: string;
    name: string;
    comboCode: string;
    description?: string;
    items: ComboOfferItemLinePopulated[];
    offerPrice: number;
    regularPrice: number;
    discountPercent: number;
    barcode?: string;
    validFrom?: string;
    validTo?: string;
    isActive: boolean;
    createdAt: string;
}

export interface ComboOfferInput {
    name: string;
    comboCode?: string;
    description?: string;
    items: ComboOfferItemLine[];
    offerPrice: number;
    validFrom?: string;
    validTo?: string;
    isActive?: boolean;
}

interface ComboOfferState {
    combos: ComboOffer[];
    combo: ComboOffer | null;
    total: number;
    page: number;
    pages: number;
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    message: string;
}

const initialState: ComboOfferState = {
    combos: [],
    combo: null,
    total: 0,
    page: 1,
    pages: 1,
    isLoading: false,
    isSuccess: false,
    isError: false,
    message: '',
};

function authHeader(thunkAPI: any) {
    const token = (thunkAPI.getState() as RootState).auth.user?.token;
    return { headers: { Authorization: `Bearer ${token}` } };
}

function extractError(error: any): string {
    return (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
}

export const getAllComboOffers = createAsyncThunk<
    { combos: ComboOffer[]; total: number; page: number; pages: number },
    { search?: string; isActive?: boolean } | void,
    { state: RootState }
>(
    'comboOffer/getAll',
    async (params, thunkAPI) => {
        try {
            const response = await api.get(API_URL, { ...authHeader(thunkAPI), params: params || {} });
            return response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(extractError(error));
        }
    }
);

export const getComboOfferById = createAsyncThunk<ComboOffer, string, { state: RootState }>(
    'comboOffer/getById',
    async (id, thunkAPI) => {
        try {
            const response = await api.get(`${API_URL}/${id}`, authHeader(thunkAPI));
            return response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(extractError(error));
        }
    }
);

export const createComboOffer = createAsyncThunk<ComboOffer, ComboOfferInput, { state: RootState }>(
    'comboOffer/create',
    async (comboData, thunkAPI) => {
        try {
            const response = await api.post(API_URL, comboData, authHeader(thunkAPI));
            return response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(extractError(error));
        }
    }
);

export const updateComboOffer = createAsyncThunk<ComboOffer, { id: string; comboData: Partial<ComboOfferInput> }, { state: RootState }>(
    'comboOffer/update',
    async ({ id, comboData }, thunkAPI) => {
        try {
            const response = await api.put(`${API_URL}/${id}`, comboData, authHeader(thunkAPI));
            return response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(extractError(error));
        }
    }
);

export const deleteComboOffer = createAsyncThunk<string, string, { state: RootState }>(
    'comboOffer/delete',
    async (id, thunkAPI) => {
        try {
            await api.delete(`${API_URL}/${id}`, authHeader(thunkAPI));
            return id;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(extractError(error));
        }
    }
);

export const comboOfferSlice = createSlice({
    name: 'comboOffer',
    initialState,
    reducers: {
        reset: (state) => {
            state.isLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = '';
        },
        clearCombo: (state) => {
            state.combo = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getAllComboOffers.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getAllComboOffers.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.combos = action.payload.combos;
                state.total = action.payload.total;
                state.page = action.payload.page;
                state.pages = action.payload.pages;
            })
            .addCase(getAllComboOffers.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(getComboOfferById.fulfilled, (state, action) => {
                state.combo = action.payload;
            })
            .addCase(createComboOffer.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(createComboOffer.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.combos.unshift(action.payload);
            })
            .addCase(createComboOffer.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(updateComboOffer.fulfilled, (state, action) => {
                state.isSuccess = true;
                const index = state.combos.findIndex(c => c._id === action.payload._id);
                if (index !== -1) {
                    state.combos[index] = action.payload;
                }
            })
            .addCase(updateComboOffer.rejected, (state, action) => {
                state.isError = true;
                state.message = action.payload as string;
            })
            .addCase(deleteComboOffer.fulfilled, (state, action) => {
                state.combos = state.combos.filter(c => c._id !== action.payload);
            })
            .addCase(deleteComboOffer.rejected, (state, action) => {
                state.isError = true;
                state.message = action.payload as string;
            });
    },
});

export const { reset, clearCombo } = comboOfferSlice.actions;
export default comboOfferSlice.reducer;
