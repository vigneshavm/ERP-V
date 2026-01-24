import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import {
    fetchVendors,
    recordVendorTransaction,
    deleteVendor,
    resetVendors,
    setSelectedVendor
} from '../store/vendorSlice';
import { Vendor, VendorTransaction } from '../types/vendor';
import { Users, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { setActiveTab } from '../store/uiSlice';
import { supabase } from '../lib/supabase';

// Sub-components
import VendorKPIs from './vendor/VendorKPIs';
import VendorSearch from './vendor/VendorSearch';
import VendorTable from './vendor/VendorTable';
import VendorModals from './vendor/VendorModals';

const VendorManager: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { vendors, isLoading } = useSelector((state: RootState) => state.vendor);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedVendorForModal, setSelectedVendorForModal] = useState<Vendor | null>(null);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [vendorHistory, setVendorHistory] = useState<VendorTransaction[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    const [paymentData, setPaymentData] = useState({
        amount: 0,
        description: '',
        date: new Date().toISOString().split('T')[0]
    });

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [vendorToDelete, setVendorToDelete] = useState<Vendor | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        dispatch(fetchVendors());
        return () => {
            dispatch(resetVendors());
        };
    }, [dispatch]);

    const fetchHistory = async (vendorId: string) => {
        setIsLoadingHistory(true);
        try {
            const { data, error } = await supabase
                .from('vendor_transactions')
                .select('*')
                .eq('vendor_id', vendorId)
                .order('date', { ascending: false });
            if (error) throw error;
            setVendorHistory(data.map(tx => ({
                id: tx.id,
                tenantId: tx.tenant_id,
                vendorId: tx.vendor_id,
                type: tx.type,
                amount: tx.amount,
                balanceAfter: tx.balance_after,
                date: tx.date,
                description: tx.description,
                referenceId: tx.reference_id
            })));
            setIsHistoryOpen(true);
        } catch (err: any) {
            console.error('Failed to fetch history:', err);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const resetForm = () => {
        setPaymentData({ amount: 0, description: '', date: new Date().toISOString().split('T')[0] });
        setSelectedVendorForModal(null);
    };

    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedVendorForModal || paymentData.amount <= 0) return;

        try {
            await dispatch(recordVendorTransaction(
                selectedVendorForModal.id,
                'PAYMENT',
                paymentData.amount,
                paymentData.description || 'Vendor Payment',
                undefined
            ));
            setIsPaymentOpen(false);
            resetForm();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const filteredVendors = vendors.filter(v =>
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.phone?.includes(searchTerm) ||
        v.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.gstin?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeCount = vendors.filter(v => v.status === 'Active').length;
    const inactiveCount = vendors.filter(v => v.status === 'Inactive').length;

    const handleDeleteClick = (vendor: Vendor) => {
        setVendorToDelete(vendor);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!vendorToDelete) return;
        setIsDeleting(true);
        try {
            await dispatch(deleteVendor(vendorToDelete.id));
            setIsDeleteModalOpen(false);
            setVendorToDelete(null);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Users className="w-8 h-8 text-indigo-600" />
                        Vendor Management
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Track wholesalers, bills, and payables.</p>
                </div>
                <button
                    onClick={() => {
                        dispatch(setSelectedVendor(null));
                        dispatch(setActiveTab('VENDOR_FORM'));
                    }}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold transition-all shadow-lg shadow-indigo-600/20"
                >
                    <Plus className="w-5 h-5" /> Add New Vendor
                </button>
            </div>

            <VendorKPIs vendors={vendors} activeCount={activeCount} inactiveCount={inactiveCount} />

            <VendorSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />

            <VendorTable
                isLoading={isLoading}
                vendors={filteredVendors}
                onViewDetails={(id) => navigate(`/suppliers/${id}`)}
                onRecordPayment={(vendor) => { setSelectedVendorForModal(vendor); setIsPaymentOpen(true); }}
                onEditVendor={(vendor) => {
                    dispatch(setSelectedVendor(vendor));
                    dispatch(setActiveTab('VENDOR_FORM'));
                }}
                onViewHistory={fetchHistory}
                onDeleteVendor={handleDeleteClick}
            />

            <VendorModals
                isPaymentOpen={isPaymentOpen}
                setIsPaymentOpen={setIsPaymentOpen}
                selectedVendorForModal={selectedVendorForModal}
                paymentData={paymentData}
                setPaymentData={setPaymentData}
                onRecordPayment={handleRecordPayment}
                isHistoryOpen={isHistoryOpen}
                setIsHistoryOpen={setIsHistoryOpen}
                vendorHistory={vendorHistory}
                isDeleteModalOpen={isDeleteModalOpen}
                setIsDeleteModalOpen={setIsDeleteModalOpen}
                vendorToDelete={vendorToDelete}
                isDeleting={isDeleting}
                confirmDelete={confirmDelete}
            />
        </div>
    );
};

export default VendorManager;
