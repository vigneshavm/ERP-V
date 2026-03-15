import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from "@/app/store/store";
import { addItem as addProduct, updateItem as editProduct } from "@/entities/inventory/model/inventorySlice";
import { useConfig } from '@/app/providers/ConfigProvider';
import { useBranchResolver } from '@/hooks/useBranchResolver';
import { Sector, BranchId } from "@repo/shared";
import { Product } from "@repo/shared";

export interface ProductFormRow {
    id?: string;
    name: string;
    sku: string;
    price: string;
    cost: string;
    stock: string;
    category: string;
    productType: string;
    branch: string;
    brand: string;
    unit: string;
    subCategory: string;
    size: string;
    color: string;
    material: string;
    location: string;
    discount: string;
    image?: string;
    expiryDate?: string;
    warrantyPeriod?: string;
    gstPercentage: string;
}

export const defaultRow: ProductFormRow = {
    name: '', sku: '', price: '', cost: '', stock: '', category: '', productType: '', branch: 'Alpha', brand: '', unit: 'Piece',
    subCategory: '', size: '', color: '', material: '', location: '', discount: '', expiryDate: '', warrantyPeriod: '',
    gstPercentage: '18'
};

import { useInventoryFilters } from './useInventoryFilters';
import { useInventoryForm } from './useInventoryForm';
import { useInventoryActions } from './useInventoryActions';

export const useInventoryLogic = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { items: products, categories } = useSelector((state: RootState) => state.inventory);
    const { currentSector, currentBranch, role } = useSelector((state: RootState) => state.auth);
    const { tenantId } = useConfig();
    const { tenants } = useSelector((state: RootState) => state.tenant);
    const { getBranchName } = useBranchResolver();

    const {
        searchTerm, setSearchTerm, page, setPage, rowsPerPage, setRowsPerPage,
        currentView, setCurrentView, filters, setFilters,
        filteredProducts, displayedProducts, totalPages
    } = useInventoryFilters(products);

    const {
        isFormOpen, setIsFormOpen, editingId, bulkFormData, imagePreview,
        handleImageUpload, handleEdit, resetForm, handleRowChange,
        addRow, copyRow, removeRow
    } = useInventoryForm(currentBranch || '');

    const {
        selectedProductIds, isPrintMode, setIsPrintMode, isPrintModalOpen, setIsPrintModalOpen,
        handleSave: handleSaveAction, toggleProductSelection, handlePrintLabels, selectAll, clearSelection
    } = useInventoryActions({
        products,
        currentSector: currentSector as Sector,
        currentBranch: currentBranch || '',
        imagePreview,
        resetForm,
        displayedProductsLength: displayedProducts.length
    });

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        handleSaveAction(bulkFormData);
    };

    return {
        // State
        products,
        displayedProducts,
        currentSector,
        currentBranch,
        role,
        isFormOpen,
        editingId,
        searchTerm,
        page,
        rowsPerPage,
        totalPages,
        currentView,
        filters,
        bulkFormData,
        imagePreview,
        selectedProductIds,
        isPrintMode,
        isPrintModalOpen,

        // Actions/Setters
        setIsFormOpen,
        setSearchTerm,
        setCurrentView,
        setPage,
        setRowsPerPage,
        setFilters,
        setIsPrintMode,
        setIsPrintModalOpen,

        // Handlers
        handleImageUpload,
        handleEdit,
        resetForm,
        handleRowChange,
        addRow,
        copyRow,
        removeRow,
        handleSave,
        toggleProductSelection,
        selectAll: () => selectAll(displayedProducts),
        getBranchName,
        handlePrintLabels,
        categories,
        clearSelection
    };
};


