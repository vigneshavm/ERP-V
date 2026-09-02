import { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import api from '../../../services/api';
import { getAllBills, createBill, updateBill, deleteBill, reset, Bill } from '../../../redux/slices/billSlice';
import { getAllSuppliers } from '../../../redux/slices/supplierSlice';
import { RootState, AppDispatch } from '../../../redux/store';

export const useBills = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { bills, isLoading, message: _message } = useSelector((state: RootState) => state.bill);
    const { suppliers: _suppliers } = useSelector((state: RootState) => state.suppliers);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showForm, setShowForm] = useState(false);
    const [editingBill, setEditingBill] = useState<Bill | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [_bankAccounts, setBankAccounts] = useState<any[]>([]);
    const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean; bill: Bill | null }>({
        isOpen: false,
        bill: null
    });

    useEffect(() => {
        dispatch(getAllBills({}));
        dispatch(getAllSuppliers());
        fetchBankAccounts();
        return () => {
            dispatch(reset());
        };
    }, [dispatch]);

    const fetchBankAccounts = async () => {
        try {
            const userDataString = localStorage.getItem('user');
            if (!userDataString) return;
            const userData = JSON.parse(userDataString);
            const token = userData?.token;
            const response = await api.get(
                `/api/cashbank/accounts`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setBankAccounts(response.data);
        } catch (error) {
            console.error('Error fetching bank accounts:', error);
        }
    };

    const handleMarkAsPaid = useCallback((bill: Bill) => {
        setPaymentModal({
            isOpen: true,
            bill
        });
    }, []);

    const handlePaymentSubmit = useCallback(async (paymentData: any) => {
        if (!paymentModal.bill) return;
        try {
            const userDataString = localStorage.getItem('user');
            if (!userDataString) return;
            const userData = JSON.parse(userDataString);
            const token = userData?.token;
            await api.put(
                `/api/bills/${paymentModal.bill._id}/payment`,
                paymentData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success('Payment recorded successfully');
            setPaymentModal({ isOpen: false, bill: null });
            dispatch(getAllBills({}));
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Payment failed');
        }
    }, [paymentModal.bill, dispatch]);

    const handleSaveBill = useCallback(async (billData: any) => {
        try {
            if (editingBill) {
                await dispatch(updateBill({ id: editingBill?._id || editingBill?.id || '', billData }));
            } else {
                await dispatch(createBill(billData));
            }
            setShowForm(false);
            setEditingBill(null);
            dispatch(getAllBills({}));
        } catch (error) {
            console.error('Error saving bill:', error);
        }
    }, [editingBill, dispatch]);

    const handleEdit = useCallback((bill: Bill) => {
        setEditingBill(bill);
        setShowForm(true);
    }, []);

    const handleDelete = useCallback(async (id: string) => {
        try {
            await dispatch(deleteBill(id));
            setDeleteConfirm(null);
        } catch (error) {
            console.error('Error deleting bill:', error);
        }
    }, [dispatch]);

    const filteredBills = useMemo(() => {
        return bills.filter((bill: Bill) => {
            const matchesSearch = (bill.bill_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (bill.vendor_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                bill.amount?.toString().includes(searchTerm);
            const matchesStatus = statusFilter === 'all' || bill.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [bills, searchTerm, statusFilter]);

    const totals = useMemo(() => {
        const totalBillsAmount = bills.reduce((sum: number, bill: Bill) => sum + (bill.amount || 0), 0);
        const totalPaidAmount = bills.filter((bill: Bill) => bill.status === 'Paid').reduce((sum: number, bill: Bill) => sum + (bill.amount || 0), 0);
        const totalOutstanding = bills.filter((bill: Bill) => bill.status !== 'Paid' && bill.status !== 'Rejected').reduce((sum: number, bill: Bill) => sum + (bill.amount || 0), 0);

        return {
            totalBillsAmount,
            totalPaidAmount,
            totalOutstanding
        };
    }, [bills]);

    return {
        bills,
        filteredBills,
        isLoading,
        searchTerm,
        setSearchTerm,
        statusFilter,
        setStatusFilter,
        showForm,
        setShowForm,
        editingBill,
        setEditingBill,
        deleteConfirm,
        setDeleteConfirm,
        paymentModal,
        setPaymentModal,
        handleMarkAsPaid,
        handlePaymentSubmit,
        handleSaveBill,
        handleEdit,
        handleDelete,
        totals
    };
};
