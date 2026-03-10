import { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from "@/app/store/store";
import { getAllBills } from "@/entities/finance/model/billSlice";
import { getAllSuppliers } from "@/entities/contact/model/supplierSlice";
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

export interface AgedBill {
    id: string;
    vendorId: string;
    vendorName: string;
    billNumber: string;
    billDate: string;
    dueDate: string;
    amount: number;
    amountPaid: number;
    outstandingAmount: number;
    daysOverdue: number;
    status: string;
    isUrgent: boolean;
    hasDiscount: boolean;
    isDisputed: boolean;
}

export const useOutstandingPayables = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { bills, isLoading } = useSelector((state: RootState) => state.bill);
    const { suppliers } = useSelector((state: RootState) => state.suppliers);

    // Filter & Sort State
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Overdue' | 'Due Soon' | 'Future'>('All');
    const [vendorFilter, setVendorFilter] = useState('');
    const [sortBy, setSortBy] = useState<'dueDate' | 'amount' | 'daysOverdue' | 'vendorName'>('dueDate');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [viewMode, setViewMode] = useState<'bill-wise' | 'vendor-wise'>('bill-wise');

    useEffect(() => {
        dispatch(getAllBills({}));
        dispatch(getAllSuppliers());
    }, [dispatch]);

    // Process bills into aged format
    const processedBills = useMemo(() => {
        const today = new Date();
        return bills.map(bill => {
            const dueDate = new Date(bill.due_date);
            const diffTime = today.getTime() - dueDate.getTime();
            const daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            const amountPaid = bill.status === 'Paid' ? bill.total_amount : (bill.status === 'Partially Paid' ? bill.total_amount * 0.4 : 0);
            const outstandingAmount = bill.total_amount - amountPaid;

            return {
                id: bill._id || bill.id,
                vendorId: bill.vendor_id,
                vendorName: bill.vendor_name,
                billNumber: bill.bill_number,
                billDate: bill.bill_date,
                dueDate: bill.due_date,
                amount: bill.total_amount,
                amountPaid,
                outstandingAmount,
                daysOverdue: daysOverdue > 0 ? daysOverdue : 0,
                status: bill.status,
                isUrgent: daysOverdue > 5 && outstandingAmount > 0,
                hasDiscount: bill.payment_terms?.toLowerCase().includes('discount'),
                isDisputed: bill.status === 'Disputed'
            };
        }).filter(b => b.outstandingAmount > 0);
    }, [bills]);

    // Filtering logic
    const filteredBills = useMemo(() => {
        return processedBills.filter(bill => {
            const matchesSearch = bill.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                bill.billNumber.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesVendor = !vendorFilter || bill.vendorId === vendorFilter;

            const matchesStatus = statusFilter === 'All' ||
                (statusFilter === 'Overdue' && bill.daysOverdue > 0) ||
                (statusFilter === 'Due Soon' && bill.daysOverdue <= 0 && Math.abs(bill.daysOverdue) <= 7) ||
                (statusFilter === 'Future' && bill.daysOverdue <= 0 && Math.abs(bill.daysOverdue) > 7);

            return matchesSearch && matchesVendor && matchesStatus;
        }).sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case 'dueDate': comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(); break;
                case 'amount': comparison = a.outstandingAmount - b.outstandingAmount; break;
                case 'daysOverdue': comparison = a.daysOverdue - b.daysOverdue; break;
                case 'vendorName': comparison = a.vendorName.localeCompare(b.vendorName); break;
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });
    }, [processedBills, searchTerm, statusFilter, vendorFilter, sortBy, sortOrder]);

    // Vendor-wise summary
    const vendorSummary = useMemo(() => {
        const summary: Record<string, { vendorId: string, vendorName: string, total: number, overdue: number, count: number }> = {};
        processedBills.forEach(bill => {
            if (!summary[bill.vendorId]) {
                summary[bill.vendorId] = { vendorId: bill.vendorId, vendorName: bill.vendorName, total: 0, overdue: 0, count: 0 };
            }
            summary[bill.vendorId].total += bill.outstandingAmount;
            if (bill.daysOverdue > 0) summary[bill.vendorId].overdue += bill.outstandingAmount;
            summary[bill.vendorId].count += 1;
        });
        return Object.values(summary).sort((a, b) => b.total - a.total);
    }, [processedBills]);

    // Aging Buckets
    const agingAnalysis = useMemo(() => {
        const buckets = {
            current: 0,
            '1-30': 0,
            '31-60': 0,
            '61-90': 0,
            '90+': 0
        };
        processedBills.forEach(bill => {
            if (bill.daysOverdue <= 0) buckets.current += bill.outstandingAmount;
            else if (bill.daysOverdue <= 30) buckets['1-30'] += bill.outstandingAmount;
            else if (bill.daysOverdue <= 60) buckets['31-60'] += bill.outstandingAmount;
            else if (bill.daysOverdue <= 90) buckets['61-90'] += bill.outstandingAmount;
            else buckets['90+'] += bill.outstandingAmount;
        });
        return buckets;
    }, [processedBills]);

    const totalPayable = useMemo(() => processedBills.reduce((acc, b) => acc + b.outstandingAmount, 0), [processedBills]);
    const totalOverdue = useMemo(() => processedBills.filter(b => b.daysOverdue > 0).reduce((acc, b) => acc + b.outstandingAmount, 0), [processedBills]);

    // Export Functions
    const exportToExcel = () => {
        const data = filteredBills.map(b => ({
            'Vendor Name': b.vendorName,
            'Bill Number': b.billNumber,
            'Bill Date': b.billDate,
            'Due Date': b.dueDate,
            'Total Amount': b.amount,
            'Amount Paid': b.amountPaid,
            'Outstanding': b.outstandingAmount,
            'Days Overdue': b.daysOverdue,
            'Status': b.status
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Outstanding Payables');
        XLSX.writeFile(wb, `Outstanding_Payables_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.info("Excel report generated successfully");
    };

    const printReport = () => {
        const doc = new jsPDF() as any;
        doc.setFontSize(18);
        doc.text('Outstanding Payables Report', 14, 22);
        doc.setFontSize(11);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
        doc.text(`Total Payable: ${totalPayable.toFixed(2)} | Total Overdue: ${totalOverdue.toFixed(2)}`, 14, 38);

        const tableData = filteredBills.map(b => [
            b.vendorName,
            b.billNumber,
            b.dueDate,
            b.outstandingAmount.toFixed(2),
            b.daysOverdue
        ]);

        doc.autoTable({
            startY: 45,
            head: [['Vendor', 'Bill #', 'Due Date', 'Outstanding', 'Overdue Days']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillStyle: [16, 185, 129] }
        });

        doc.save(`Payables_Report_${new Date().getTime()}.pdf`);
        toast.info("PDF report generated successfully");
    };

    const handleQuickPayment = (vendorId: string) => {
        navigate(`/purchase/payments/${vendorId}`);
    };

    return {
        isLoading,
        searchTerm,
        setSearchTerm,
        statusFilter,
        setStatusFilter,
        vendorFilter,
        setVendorFilter,
        sortBy,
        setSortBy,
        sortOrder,
        setSortOrder,
        viewMode,
        setViewMode,
        processedBills,
        filteredBills,
        vendorSummary,
        agingAnalysis,
        totalPayable,
        totalOverdue,
        suppliers,
        exportToExcel,
        printReport,
        handleQuickPayment
    };
};
