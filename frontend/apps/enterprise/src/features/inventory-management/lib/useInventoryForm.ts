import React, { useState } from 'react';
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

export const useInventoryForm = (currentBranch: string) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [bulkFormData, setBulkFormData] = useState<ProductFormRow[]>([defaultRow]);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleEdit = (product: Product) => {
        const p = product as any;
        setBulkFormData([{
            id: p.id,
            name: p.name,
            sku: p.sku,
            price: p.price.toString(),
            cost: p.cost.toString(),
            stock: p.stock.toString(),
            category: p.category,
            subCategory: p.subCategory || '',
            size: p.size || '',
            color: p.color || '',
            material: p.material || '',
            location: p.location || '',
            discount: p.discount?.toString() || '',
            productType: p.productType || '',
            branch: p.branchId || '',
            brand: p.brand || '',
            unit: p.unit || 'Piece',
            image: p.image,
            expiryDate: p.expiryDate || '',
            gstPercentage: p.gstPercentage?.toString() || '18',
            warrantyPeriod: p.warrantyPeriod || ''
        }]);
        setImagePreview(product.image || null);
        setIsFormOpen(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setEditingId(null);
        setBulkFormData([{
            ...defaultRow,
            branch: currentBranch === 'All' ? '' : currentBranch,
        }]);
        setImagePreview(null);
        setIsFormOpen(false);
    };

    const handleRowChange = (index: number, field: keyof ProductFormRow, value: string) => {
        const updated = [...bulkFormData];
        updated[index] = { ...updated[index], [field]: value };

        if (!updated[index].id && field === 'brand' && value) {
            const prefix = value.substring(0, 3).toUpperCase();
            const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
            updated[index].sku = `${prefix}-${timestamp}-${index}`;
        }

        setBulkFormData(updated);

        const isLastRow = index === updated.length - 1;
        if (isLastRow) {
            const row = updated[index];
            const isComplete = row.name && row.brand && row.category && row.productType && row.stock && row.cost && row.price;
            if (isComplete) {
                setBulkFormData(prev => [...prev, { ...defaultRow, branch: currentBranch === 'All' ? '' : currentBranch }]);
            }
        }
    };

    const addRow = () => {
        setBulkFormData([...bulkFormData, { ...defaultRow, branch: currentBranch === 'All' ? '' : currentBranch }]);
    };

    const copyRow = (index: number) => {
        const rowToCopy = { ...bulkFormData[index] };
        if (!rowToCopy.id && rowToCopy.brand) {
            const prefix = rowToCopy.brand.substring(0, 3).toUpperCase();
            const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
            rowToCopy.sku = `${prefix}-${timestamp}-${bulkFormData.length}`;
        } else {
            rowToCopy.sku = '';
        }
        delete rowToCopy.id;
        setBulkFormData([...bulkFormData, rowToCopy]);
    };

    const removeRow = (index: number) => {
        if (bulkFormData.length === 1) return;
        const updated = [...bulkFormData];
        updated.splice(index, 1);
        setBulkFormData(updated);
    };

    return {
        isFormOpen, setIsFormOpen,
        editingId, setEditingId,
        bulkFormData, setBulkFormData,
        imagePreview, setImagePreview,
        handleImageUpload,
        handleEdit,
        resetForm,
        handleRowChange,
        addRow,
        copyRow,
        removeRow
    };
};

