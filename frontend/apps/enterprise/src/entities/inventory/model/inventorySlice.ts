import { useAuthStore } from '@repo/shared';
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from "@/shared/api/api";
import { Product } from "@repo/shared";

const API_URL = "/inventory";

// Get token from state
const getConfig = (token: string) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

export interface AgingReportItem {
  _id: string;
  name: string;
  sku?: string;
  stock: number;
  lastSoldDate?: string;
  daysSinceLastSold: number;
  value: number;
  status: 'active' | 'dead' | 'slow';
  [key: string]: any;
}

interface Pagination {
  page: number;
  pages: number;
  total: number;
  limit: number;
}

interface InventoryState {
  items: Product[];
  item: Product | null;
  lowStockItems: Product[];
  agingReport: AgingReportItem[];
  alerts: any[]; // Define Alert type if available
  pagination: Pagination | null;
  categories: string[];
  isHydrating: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  message: string | any;
  stockHistory: any[];
  inventoryStats: {
    totalItems: number;
    totalValuation: number;
    lowStockCount: number;
  } | null;
}

const initialState: InventoryState = {
  items: [],
  item: null,
  lowStockItems: [],
  agingReport: [],
  alerts: [],
  pagination: null,
  categories: [],
  isHydrating: true,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
  stockHistory: [],
  inventoryStats: null,
};

// Get all items
export const getAllItems = createAsyncThunk(
  'inventory/getAll',
  async (params: { page?: number; limit?: number; search?: string; category?: string } | void, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as any;
      const { token } = useAuthStore.getState();
      if (!token) return thunkAPI.rejectWithValue("Not authenticated");

      let queryParams = "";
      if (params) {
        const { page, limit, search, category } = params;
        const parts = [];
        if (page) parts.push(`page=${page}`);
        if (limit) parts.push(`limit=${limit}`);
        if (search) parts.push(`search=${encodeURIComponent(search)}`);
        if (category && category !== 'ALL') parts.push(`category=${encodeURIComponent(category)}`);
        if (parts.length > 0) queryParams = `?${parts.join('&')}`;
      }

      const response = await api.get(`${API_URL}${queryParams}`, getConfig(token));
      return response.data.data || response.data;
    } catch (error: any) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get inventory stats
export const getInventoryStats = createAsyncThunk(
  'inventory/getStats',
  async (_, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as any;
      const { token } = useAuthStore.getState();
      if (!token) return thunkAPI.rejectWithValue("Not authenticated");

      const response = await api.get(`${API_URL}/inventory-stats`, getConfig(token));
      return response.data.data || response.data;
    } catch (error: any) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get item by ID
export const getItemById = createAsyncThunk(
  'inventory/getById',
  async (id: string, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as any;
      const { token } = useAuthStore.getState();
      if (!token) return thunkAPI.rejectWithValue("Not authenticated");
      const response = await api.get(`${API_URL}/${id}`, getConfig(token));
      return response.data.data || response.data;
    } catch (error: any) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Add item
export const addItem = createAsyncThunk(
  'inventory/add',
  async (itemData: Partial<Product>, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as any;
      const { token } = useAuthStore.getState();
      if (!token) return thunkAPI.rejectWithValue("Not authenticated");
      const response = await api.post(API_URL, itemData, getConfig(token));
      return response.data.data || response.data;
    } catch (error: any) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Update item
export const updateItem = createAsyncThunk(
  'inventory/update',
  async ({ id, itemData }: { id: string; itemData: Partial<Product> }, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as any;
      const { token } = useAuthStore.getState();
      if (!token) return thunkAPI.rejectWithValue("Not authenticated");
      const response = await api.put(
        `${API_URL}/${id}`,
        itemData,
        getConfig(token)
      );
      return response.data.data || response.data;
    } catch (error: any) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Delete item
export const deleteItem = createAsyncThunk(
  'inventory/delete',
  async (id: string, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as any;
      const { token } = useAuthStore.getState();
      if (!token) return thunkAPI.rejectWithValue("Not authenticated");
      await api.delete(`${API_URL}/${id}`, getConfig(token));
      return id;
    } catch (error: any) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Delete items batch
export const deleteItemsBatch = createAsyncThunk(
  'inventory/deleteBatch',
  async (ids: string[], thunkAPI) => {
    try {
      const state = thunkAPI.getState() as any;
      const { token } = useAuthStore.getState();
      if (!token) return thunkAPI.rejectWithValue("Not authenticated");
      await api.delete(`${API_URL}/batch`, {
        ...getConfig(token),
        data: { ids }
      });
      return ids;
    } catch (error: any) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get low stock items
export const getLowStockItems = createAsyncThunk(
  'inventory/getLowStock',
  async (_, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as any;
      const { token } = useAuthStore.getState();
      if (!token) return thunkAPI.rejectWithValue("Not authenticated");
      const response = await api.get(`${API_URL}/low-stock`, getConfig(token));
      return response.data.data || response.data;
    } catch (error: any) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);


// Get aging report
export const getAgingReport = createAsyncThunk(
  'inventory/getAgingReport',
  async (_, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as any;
      const { token } = useAuthStore.getState();
      if (!token) return thunkAPI.rejectWithValue("Not authenticated");
      const response = await api.get(`${API_URL}/aging-report`, getConfig(token));
      return response.data.data || response.data;
    } catch (error: any) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Apply aging action
export const applyAgingAction = createAsyncThunk(
  'inventory/applyAgingAction',
  async ({ itemId, action, value }: { itemId: string; action: string; value?: number }, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as any;
      const { token } = useAuthStore.getState();
      if (!token) return thunkAPI.rejectWithValue("Not authenticated");
      const response = await api.post(`${API_URL}/aging-action`, { itemId, action, value }, getConfig(token));
      return response.data.data || response.data;
    } catch (error: any) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Bulk update category
export const bulkUpdateCategory = createAsyncThunk(
  'inventory/bulkUpdateCategory',
  async (params: { ids: string[]; category: string }, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as any;
      const { token } = useAuthStore.getState();
      if (!token) return thunkAPI.rejectWithValue("Not authenticated");

      const response = await api.put(`${API_URL}/bulk/category`, params, getConfig(token));
      return response.data.data || response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to update categories");
    }
  }
);

// Bulk adjust stock
export const bulkAdjustStock = createAsyncThunk(
  'inventory/bulkAdjustStock',
  async (params: { ids: string[]; adjustment: number; type: 'ADD' | 'SUBTRACT' | 'SET' }, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as any;
      const { token } = useAuthStore.getState();
      if (!token) return thunkAPI.rejectWithValue("Not authenticated");

      const response = await api.put(`${API_URL}/bulk/stock`, params, getConfig(token));
      return response.data.data || response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to adjust stock");
    }
  }
);

// Duplicate item
export const duplicateItem = createAsyncThunk(
  'inventory/duplicateItem',
  async (id: string, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as any;
      const { token } = useAuthStore.getState();
      if (!token) return thunkAPI.rejectWithValue("Not authenticated");

      const response = await api.post(`${API_URL}/${id}/duplicate`, {}, getConfig(token));
      return response.data.data || response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to duplicate item");
    }
  }
);

// Toggle item status
export const toggleItemStatus = createAsyncThunk(
  'inventory/toggleItemStatus',
  async (id: string, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as any;
      const { token } = useAuthStore.getState();
      if (!token) return thunkAPI.rejectWithValue("Not authenticated");

      const response = await api.patch(`${API_URL}/${id}/toggle-status`, {}, getConfig(token));
      return response.data.data || response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to toggle status");
    }
  }
);

// Get item stock history
export const getStockHistory = createAsyncThunk(
  'inventory/getStockHistory',
  async (id: string, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as any;
      const { token } = useAuthStore.getState();
      if (!token) return thunkAPI.rejectWithValue("Not authenticated");

      const response = await api.get(`${API_URL}/${id}/history`, getConfig(token));
      return response.data.data || response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch stock history");
    }
  }
);

export const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    resetInventoryState: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
    clearItem: (state) => {
      state.item = null;
    },
    addStockBulk: (state, action: PayloadAction<any[]>) => {
      // action.payload is array of { sku, qty, ... } or similar. Match logic in purchaseThunks
      const newItems = action.payload;
      if (!Array.isArray(state.items)) state.items = [];

      newItems.forEach(newItem => {
        const existing = state.items.find(i => i.sku === newItem.sku || i._id === newItem.id);
        if (existing) {
          existing.stockQty = (existing.stockQty || 0) + (newItem.qty || 0);
        } else {
          // Ideally add new item, but shape might differ. For now, ignore or simple add.
          // state.items.push(newItem); // formats might mismatch
        }
      });
    },
    deductStock: (state, action: PayloadAction<{ id: string; qty: number }>) => {
      const { id, qty } = action.payload;
      if (state.items) {
        const item = state.items.find(i => i._id === id || i.id === id);
        if (item) {
          item.stockQty = (item.stockQty || 0) - qty;
        }
      }
    },
    // Sync actions for useProductSync
    setProducts: (state, action: PayloadAction<Product[]>) => {
      state.items = action.payload;
    },
    setCategories: (state, action: PayloadAction<string[]>) => {
      state.categories = action.payload;
    },
    setHydrating: (state, action: PayloadAction<boolean>) => {
      state.isHydrating = action.payload;
    },
    upsertProduct: (state, action: PayloadAction<Product>) => {
      const idx = state.items.findIndex(i => i.id === action.payload.id || i._id === action.payload._id);
      if (idx !== -1) {
        state.items[idx] = action.payload;
      } else {
        state.items.push(action.payload);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all items
      .addCase(getAllItems.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllItems.fulfilled, (state, action: PayloadAction<{ items: Product[], pagination?: Pagination } | Product[]>) => {
        state.isLoading = false;
        state.isSuccess = true;
        if (Array.isArray(action.payload)) {
          state.items = action.payload;
          state.pagination = null;
        } else {
          state.items = (action.payload as any).items || [];
          state.pagination = (action.payload as any).pagination || null;
        }
      })
      .addCase(getAllItems.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get item by ID
      .addCase(getItemById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getItemById.fulfilled, (state, action: PayloadAction<Product>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.item = action.payload;
      })
      .addCase(getItemById.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get inventory stats
      .addCase(getInventoryStats.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getInventoryStats.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.inventoryStats = action.payload;
      })
      .addCase(getInventoryStats.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Add item
      .addCase(addItem.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addItem.fulfilled, (state, action: PayloadAction<{ item: Product, alerts?: any[] }>) => {
        state.isLoading = false;
        state.isSuccess = true;
        if (!Array.isArray(state.items)) state.items = [];
        state.items.push(action.payload.item);
        state.alerts = action.payload.alerts || [];
      })
      .addCase(addItem.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Update item
      .addCase(updateItem.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateItem.fulfilled, (state, action: PayloadAction<{ updated: Product, alerts?: any[] }>) => {
        state.isLoading = false;
        state.isSuccess = true;
        if (!Array.isArray(state.items)) state.items = [];
        state.items = state.items.map((item) =>
          item._id === action.payload.updated._id ? action.payload.updated : item
        );
        state.item = action.payload.updated;
        state.alerts = action.payload.alerts || [];
      })
      .addCase(updateItem.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Delete item
      .addCase(deleteItem.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteItem.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.isSuccess = true;
        if (!Array.isArray(state.items)) state.items = [];
        state.items = state.items.filter((item) => item._id !== action.payload);
        if (state.pagination) {
          state.pagination.total -= 1;
        }
      })
      .addCase(deleteItem.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Delete items batch
      .addCase(deleteItemsBatch.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteItemsBatch.fulfilled, (state, action: PayloadAction<string[]>) => {
        state.isLoading = false;
        state.isSuccess = true;
        if (!Array.isArray(state.items)) state.items = [];
        state.items = state.items.filter((item) => !action.payload.includes(item._id as string));
        state.pagination = state.pagination ? {
          ...state.pagination,
          total: state.pagination.total - action.payload.length
        } : null;
      })
      .addCase(deleteItemsBatch.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get low stock items
      .addCase(getLowStockItems.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getLowStockItems.fulfilled, (state, action: PayloadAction<Product[]>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.lowStockItems = action.payload;
      })
      .addCase(getLowStockItems.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get aging report
      .addCase(getAgingReport.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAgingReport.fulfilled, (state, action: PayloadAction<AgingReportItem[]>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.agingReport = action.payload;
      })
      .addCase(getAgingReport.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Apply aging action
      .addCase(applyAgingAction.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(applyAgingAction.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        // Optionally update the item in the report
        // action.payload.result is the updated item
        if (state.agingReport) {
          // Remove from report if resolved? Or update status?
          // Since "Clearance" action moves category, it technically might still be in report as dead stock until sold, 
          // but user sees it in Clearance.
          // If price reduced, remains in report.
          // Let's just re-fetch or let user manually refresh.
        }
      })
      .addCase(applyAgingAction.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Bulk Update Category
      .addCase(bulkUpdateCategory.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(bulkUpdateCategory.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
      })
      .addCase(bulkUpdateCategory.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Bulk Adjust Stock
      .addCase(bulkAdjustStock.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(bulkAdjustStock.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
      })
      .addCase(bulkAdjustStock.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Duplicate Item
      .addCase(duplicateItem.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(duplicateItem.fulfilled, (state, action: PayloadAction<Product>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.items.unshift(action.payload);
      })
      .addCase(duplicateItem.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Toggle Status
      .addCase(toggleItemStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(toggleItemStatus.fulfilled, (state, action: PayloadAction<Product>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.items = state.items.map(item =>
          item._id === action.payload._id ? action.payload : item
        );
      })
      .addCase(toggleItemStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get Stock History
      .addCase(getStockHistory.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getStockHistory.fulfilled, (state, action: PayloadAction<any[]>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.stockHistory = action.payload;
      })
      .addCase(getStockHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { resetInventoryState, clearItem, addStockBulk, deductStock, setProducts, setCategories, setHydrating, upsertProduct } = inventorySlice.actions;
export default inventorySlice.reducer;
