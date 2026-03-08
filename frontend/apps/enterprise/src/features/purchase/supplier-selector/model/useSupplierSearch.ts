import { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/app/store/store';
import { Supplier } from "@vignesh-erp/shared-kernel";
import { getAllSuppliers } from '@/entities/contact/model/supplierSlice';

export const useSupplierSearch = (initialSupplierId: string = '') => {
    const dispatch = useDispatch<any>();
    const { suppliers, isLoading } = useSelector((state: RootState) => state.suppliers);
    
    useEffect(() => {
        if (!suppliers || suppliers.length === 0) {
            dispatch(getAllSuppliers());
        }
    }, [dispatch, suppliers]);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSupplierId, setSelectedSupplierId] = useState(initialSupplierId);
    const [showDropdown, setShowDropdown] = useState(false);

    const filteredSuppliers = useMemo(() => {
        if (!searchQuery) return suppliers;
        return suppliers.filter(s => 
            s.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.contactNo.includes(searchQuery) ||
            s.supplierId?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [suppliers, searchQuery]);

    const selectedSupplier = useMemo(() => 
        suppliers.find(s => s._id === selectedSupplierId),
    [suppliers, selectedSupplierId]);

    const handleSelect = (supplier: Supplier) => {
        setSelectedSupplierId(supplier._id);
        setSearchQuery(supplier.businessName);
        setShowDropdown(false);
    };

    const handleClear = () => {
        setSelectedSupplierId('');
        setSearchQuery('');
        setShowDropdown(false);
    };

    return {
        searchQuery,
        setSearchQuery,
        filteredSuppliers,
        selectedSupplier,
        selectedSupplierId,
        showDropdown,
        setShowDropdown,
        handleSelect,
        handleClear
    };
};
