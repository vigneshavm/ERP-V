import { useState, useMemo } from 'react';
import { Product } from "../types/product";

export const useInventoryFilters = (products: Product[]) => {
    const [searchTerm, setSearchTerm] = useState('');
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

    const filteredProducts = useMemo(() => {
        let result = products;

        if (filters.branch) {
            result = result.filter(p => p.branchId === filters.branch);
        }

        switch (currentView) {
            case 'RECENT':
                result = [...result].reverse();
                break;
            case 'LOW_STOCK':
                result = result.filter(p => p.stockQty > 0 && p.stockQty < 10);
                break;
            case 'OUT_OF_STOCK':
                result = result.filter(p => p.stockQty <= 0);
                break;
            case 'HIGH_VALUE':
                result = result.filter(p => (p.sellingPrice * p.stockQty) > 10000);
                break;
            case 'EXPIRING':
                // expiryDate not on BaseProduct - filter by very low stock as proxy
                result = result.filter(p => p.stockQty > 0 && p.stockQty < 5);
                break;
            default:
                break;
        }

        if (filters.category) result = result.filter(p => p.category === filters.category);
        if (filters.productType) result = result.filter(p => p.productType === filters.productType);
        if (filters.minPrice) result = result.filter(p => p.sellingPrice >= parseFloat(filters.minPrice));
        if (filters.maxPrice) result = result.filter(p => p.sellingPrice <= parseFloat(filters.maxPrice));

        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(p =>
                p.name.toLowerCase().includes(lower) ||
                p.sku.toLowerCase().includes(lower) ||
                (p.barcode && p.barcode.toLowerCase().includes(lower)) ||
                (p.productType && p.productType.toLowerCase().includes(lower))
            );
        }

        return result;
    }, [products, currentView, filters, searchTerm]);

    const totalPages = Math.ceil(filteredProducts.length / rowsPerPage);
    const displayedProducts = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        return filteredProducts.slice(start, start + rowsPerPage);
    }, [filteredProducts, page, rowsPerPage]);

    return {
        searchTerm, setSearchTerm,
        page, setPage,
        rowsPerPage, setRowsPerPage,
        currentView, setCurrentView,
        filters, setFilters,
        filteredProducts,
        displayedProducts,
        totalPages
    };
};
