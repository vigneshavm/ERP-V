import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch, addProduct, editProduct } from '../store';
import { useConfig } from '../components/ConfigContext';
import { useBranchResolver } from './useBranchResolver'; // Assuming this exists or will be moved/kept
import { Sector, Branch } from '../types/common';
import { Product } from '../types/product';

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
}

export const defaultRow: ProductFormRow = {
    name: '', sku: '', price: '', cost: '', stock: '', category: '', productType: '', branch: 'Alpha', brand: '', unit: 'Piece',
    subCategory: '', size: '', color: '', material: '', location: '', discount: '', expiryDate: '', warrantyPeriod: ''
};

export const useInventoryLogic = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { products } = useSelector((state: RootState) => state.inventory);
    const { currentSector, currentBranch, role } = useSelector((state: RootState) => state.auth);
    const { tenantId } = useConfig();
    const { tenants } = useSelector((state: RootState) => state.tenant);
    const { getBranchName } = useBranchResolver();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Advanced Browsing State
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [currentView, setCurrentView] = useState<'ALL' | 'RECENT' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'HIGH_VALUE' | 'EXPIRING'>('ALL');
    const [filters, setFilters] = useState({
        minPrice: '',
        maxPrice: '',
        category: '',
        productType: '',
        branch: ''
    });

    const [bulkFormData, setBulkFormData] = useState<ProductFormRow[]>([defaultRow]);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
    const [isPrintMode, setIsPrintMode] = useState(false);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

    // Get valid branch IDs for the current tenant
    const currentTenant = tenants.find(t => t.id === tenantId);
    const tenantBranchIds = useMemo(() => currentTenant
        ? currentTenant.locations.flatMap(loc => loc.branches.map(b => b.id))
        : [], [currentTenant]);

    // Filter Logic
    // ------------------------------------------------------------------
    // Advanced Filter Pipeline
    // ------------------------------------------------------------------
    const filteredProducts = useMemo(() => {
        let result = products;

        // 1. Base Security (Tenant Scope) & Branch Logic
        if (currentBranch !== 'All') {
            result = result.filter(p => p.branchId === currentBranch);
        } else {
            // If Global Branch is ALL, restrict to Tenant's valid branches only
            // logic: Must be in tenant branch list OR have no branch assigned (Global)
            result = result.filter(p =>
                tenantBranchIds.includes(p.branchId || '') || !p.branchId
            );

            // Apply local sidebar filter on top if selected
            if (filters.branch) {
                result = result.filter(p => p.branchId === filters.branch);
            }
        }

        // 3. Smart Views
        switch (currentView) {
            case 'RECENT':
                result = [...result].reverse();
                break;
            case 'LOW_STOCK':
                result = result.filter(p => p.stock > 0 && p.stock < 10);
                break;
            case 'OUT_OF_STOCK':
                result = result.filter(p => p.stock <= 0);
                break;
            case 'HIGH_VALUE':
                result = result.filter(p => (p.price * p.stock) > 10000);
                break;
            case 'EXPIRING':
                // Placeholder for date logic
                result = result.filter(p => p.expiryDate);
                break;
            case 'ALL':
            default:
                break;
        }

        // 4. Attribute Filters
        if (filters.category) result = result.filter(p => p.category === filters.category);
        if (filters.productType) result = result.filter(p => p.productType === filters.productType);
        if (filters.minPrice) result = result.filter(p => p.price >= parseFloat(filters.minPrice));
        if (filters.maxPrice) result = result.filter(p => p.price <= parseFloat(filters.maxPrice));

        // 5. Search (Enhanced)
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(p =>
                p.name.toLowerCase().includes(lower) ||
                p.sku.toLowerCase().includes(lower) ||
                (p.barcode && p.barcode.toLowerCase().includes(lower)) ||
                p.productType.toLowerCase().includes(lower)
            );
        }

        return result;
    }, [products, currentSector, currentBranch, currentView, filters, searchTerm]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredProducts.length / rowsPerPage);
    const displayedProducts = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        return filteredProducts.slice(start, start + rowsPerPage);
    }, [filteredProducts, page, rowsPerPage]);


    // Handlers
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
        setEditingId(product.id);
        setBulkFormData([{
            id: product.id,
            name: product.name,
            sku: product.sku,
            price: product.price.toString(),
            cost: product.cost.toString(),
            stock: product.stock.toString(),
            category: product.category,
            subCategory: product.subCategory || '',
            size: product.size || '',
            color: product.color || '',
            material: product.material || '',
            location: product.location || '',
            discount: product.discount?.toString() || '',
            productType: product.productType || '',
            branch: product.branchId || '',
            brand: product.brand || '',
            unit: product.unit || 'Piece',
            image: product.image,
            expiryDate: product.expiryDate || '',
            // Cast or handle safely if warrantyPeriod is missing in type but present in runtime
            warrantyPeriod: (product as any).warrantyPeriod || ''
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

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        bulkFormData.forEach(row => {
            const productData = {
                name: row.name,
                sku: row.sku,
                price: parseFloat(row.price),
                cost: parseFloat(row.cost),
                stock: parseFloat(row.stock),
                category: row.category,
                unit: row.unit,
                productType: row.productType,
                brand: row.brand,
                sector: currentSector as Sector,
                branchId: (row.branch || currentBranch) as Branch,
                image: imagePreview || row.image || undefined,
                subCategory: row.subCategory,
                size: row.size,
                color: row.color,
                material: row.material,
                location: row.location,
                discount: row.discount ? parseFloat(row.discount) : 0,
                expiryDate: row.expiryDate,
                warrantyPeriod: row.warrantyPeriod,
                barcode: !row.id ? (row.sku || Math.random().toString().slice(2, 14)) : undefined
            };

            if (row.id) {
                dispatch(editProduct({
                    ...productData,
                    id: row.id,
                    barcode: products.find(p => p.id === row.id)?.barcode
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
        if (selectedProductIds.size === 0) return;
        setIsPrintModalOpen(true);
    };

    const selectAll = () => {
        if (selectedProductIds.size === displayedProducts.length) {
            setSelectedProductIds(new Set());
        } else {
            setSelectedProductIds(new Set(displayedProducts.map(p => p.id)));
        }
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
        selectAll,
        getBranchName,
        handlePrintLabels
    };
};
