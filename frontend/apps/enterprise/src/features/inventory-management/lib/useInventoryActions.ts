import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from "@/app/store/store";
import { addItem as addProduct, updateItem as editProduct } from "@/entities/inventory/model/inventorySlice";
import { Product } from "@repo/shared-kernel";
import { ProductFormRow } from './useInventoryForm';
import { Sector, BranchId } from "@repo/shared-kernel";

interface UseInventoryActionsProps {
    products: Product[];
    currentSector: Sector;
    currentBranch: string;
    imagePreview: string | null;
    resetForm: () => void;
    displayedProductsLength: number;
}

export const useInventoryActions = ({
    products,
    currentSector,
    currentBranch,
    imagePreview,
    resetForm,
    displayedProductsLength
}: UseInventoryActionsProps) => {
    const dispatch = useDispatch<AppDispatch>();
    const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
    const [isPrintMode, setIsPrintMode] = useState(false);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

    const handleSave = (bulkFormData: ProductFormRow[]) => {
        const validRows = bulkFormData.filter(row => row.name && row.cost);

        validRows.forEach(row => {
            const cost = parseFloat(row.cost) || 0;
            const price = parseFloat(row.price) || (cost * 1.25);
            const stock = parseFloat(row.stock) || 0;

            const productData = {
                name: row.name,
                sku: row.sku,
                price: price,
                cost: cost,
                stock: stock,
                category: row.category || 'General',
                unit: row.unit || 'Piece',
                productType: row.productType || 'Standard',
                brand: row.brand || 'Generic',
                sector: currentSector,
                branchId: (row.branch || currentBranch) as BranchId,
                image: imagePreview || row.image || undefined,
                subCategory: row.subCategory,
                size: row.size,
                color: row.color,
                material: row.material,
                location: row.location,
                discount: row.discount ? parseFloat(row.discount) : 0,
                expiryDate: row.expiryDate,
                warrantyPeriod: row.warrantyPeriod,
                gstPercentage: parseFloat(row.gstPercentage || '0'),
                barcode: !row.id ? (row.sku || Math.random().toString().slice(2, 14)) : undefined
            };

            if (row.id) {
                dispatch(editProduct({
                    id: row.id,
                    itemData: {
                        ...productData,
                        barcode: products.find(p => p.id === row.id)?.barcode
                    }
                }));
            } else {
                dispatch(addProduct({
                    ...productData,
                    id: Math.random().toString(36).substr(2, 9),
                }));
            }
        });
        resetForm();
    };

    const toggleProductSelection = (id: string) => {
        const newSet = new Set(selectedProductIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedProductIds(newSet);
    };

    const handlePrintLabels = () => {
        if (selectedProductIds.size === 0) {
            alert("Please select at least one product to print labels.");
            return;
        }
        setIsPrintModalOpen(true);
    };

    const selectAll = (displayedProducts: Product[]) => {
        if (selectedProductIds.size === displayedProducts.length) {
            setSelectedProductIds(new Set());
        } else {
            setSelectedProductIds(new Set(displayedProducts.map(p => p.id)));
        }
    };

    const clearSelection = () => {
        setSelectedProductIds(new Set());
    };

    return {
        selectedProductIds,
        isPrintMode, setIsPrintMode,
        isPrintModalOpen, setIsPrintModalOpen,
        handleSave,
        toggleProductSelection,
        handlePrintLabels,
        selectAll,
        clearSelection
    };
};
