import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product, InventoryState } from '../types/product';
import { Sector, Branch } from '../types/common';
import { APP_CONFIG } from '../config';

import { loadState, saveState } from './storage';

// Initial state logic: Use Mock if Demo and LS is empty
const initialInventoryState: InventoryState = {
  products: []
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState: loadState('inventory_v2', initialInventoryState),
  reducers: {
    addProduct: (state, action: PayloadAction<Product>) => {
      state.products.push(action.payload);
      saveState('inventory', state);
    },
    editProduct: (state, action: PayloadAction<Product>) => {
      const index = state.products.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.products[index] = action.payload;
        saveState('inventory', state);
      }
    },
    updateStock: (state, action: PayloadAction<{ id: string; qty: number }>) => {
      const p = state.products.find(p => p.id === action.payload.id);
      if (p) p.stock = action.payload.qty;
      saveState('inventory', state);
    },
    deductStock: (state, action: PayloadAction<{ id: string; qty: number }>) => {
      const p = state.products.find(p => p.id === action.payload.id);
      if (p) p.stock = Math.max(0, p.stock - action.payload.qty);
      saveState('inventory', state);
    },
    addStockBulk: (state, action: PayloadAction<{ sku: string; qty: number; cost: number; price?: number; name: string; sector: Sector; branch: Branch; category?: string; productType?: string; barcode?: string }[]>) => {
      action.payload.forEach(item => {
        const existing = state.products.find(p => p.sku === item.sku && p.sector === item.sector && p.branchId === item.branch);
        if (existing) {
          existing.stock += item.qty;
          existing.cost = item.cost;
          if (item.price) existing.price = item.price;
        } else {
          state.products.push({
            id: Math.random().toString(36).substr(2, 9),
            sku: item.sku || `SKU-${Math.random().toString(36).substr(2, 5)}`,
            name: item.name,
            productType: item.productType || 'General',
            category: item.category || 'Uncategorized',
            price: item.price || item.cost * 1.5,
            cost: item.cost,
            stock: item.qty,
            sector: item.sector,
            branchId: item.branch,
            barcode: item.barcode || Math.floor(100000000000 + Math.random() * 900000000000).toString()
          });
        }
      });
      saveState('inventory', state);
    },
    setProducts: (state, action: PayloadAction<Product[]>) => {
      state.products = action.payload;
    },
    upsertProduct: (state, action: PayloadAction<Product>) => {
      const index = state.products.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.products[index] = action.payload;
      } else {
        state.products.push(action.payload);
      }
      saveState('inventory', state);
    }
  },
});

export const { addProduct, editProduct, updateStock, deductStock, addStockBulk, setProducts, upsertProduct } = inventorySlice.actions;
export default inventorySlice.reducer;
