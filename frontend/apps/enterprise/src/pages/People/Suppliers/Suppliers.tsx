import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { deleteSupplier, getSupplierAnalytics } from "@/entities/contact/model/supplierSlice";
import { AppDispatch, RootState } from "@/app/store/store";
import Layout from '@/shared/ui/Layout/Layout';
import Modal from '@/shared/ui/Overlay/Modal';
import {
  Users,
  UserPlus,
  MoreVertical,
  Eye,
  Trash2,
  Download,
  RefreshCcw,
  Phone,
  Mail,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

import PageHeader from '@/shared/ui/Layout/PageHeader';
import SupplierSubNav from './SupplierSubNav';
import SupplierStatsCards from './components/SupplierStatsCards';
import SupplierFilterBar from './components/SupplierFilterBar';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';

// Sort indicator
const SortIcon = ({ column, sortConfig }: { column: string; sortConfig: { key: string; direction: 'asc' | 'desc' } | null }) => {
  if (!sortConfig || sortConfig.key !== column) {
    return <span className="text-muted dark:text-neutral-600 ml-1 inline-flex flex-col text-[8px] leading-none"><ChevronUp className="w-2.5 h-2.5" /><ChevronDown className="w-2.5 h-2.5 -mt-0.5" /></span>;
  }
  return sortConfig.direction === 'asc'
    ? <ChevronUp className="w-3 h-3 text-indigo-500 ml-1 inline" />
    : <ChevronDown className="w-3 h-3 text-indigo-500 ml-1 inline" />;
};

const Suppliers: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { suppliers, isLoading } = useSelector((state: RootState) => state.suppliers);

  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'overdue' | 'due_week'>('all');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(getSupplierAnalytics());
  }, [dispatch]);

  const handleDelete = async (id: string | null) => {
    if (!id) return;
    try {
      await dispatch(deleteSupplier(id)).unwrap();
      setDeleteConfirm(null);
      toast.success('Supplier record deleted successfully');
      dispatch(getSupplierAnalytics());
    } catch (err: any) {
      toast.error(err || 'Failed to delete supplier');
      setDeleteConfirm(null);
    }
  };

  const handleExportCSV = () => {
    const dataToExport = suppliers.map((s: any) => ({
      'Business Name': s.businessName,
      'Group': s.supplierGroup || 'N/A',
      'Contact Person': s.contactPersonName,
      'Supplier ID': s.supplierId,
      'Phone': s.contactNo,
      'Email': s.email || 'N/A',
      'Status': s.status,
      'Total Invoiced': s.totalAmount || 0,
      'Total Paid': s.totalPaid || 0,
      'Net Balance': s.netBalance || 0,
      'Last Payment': s.lastPaymentDate ? new Date(s.lastPaymentDate).toLocaleDateString() : 'N/A'
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    XLSX.utils.book_append_sheet(wb, ws, "Suppliers");
    XLSX.writeFile(wb, `Suppliers_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleRefresh = () => {
    dispatch(getSupplierAnalytics());
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(
      (supplier: any) => {
        const matchesSearch = supplier.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (supplier.supplierGroup && supplier.supplierGroup.toLowerCase().includes(searchTerm.toLowerCase())) ||
          supplier.contactPersonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          supplier.contactNo.includes(searchTerm) ||
          (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase()));

        if (!matchesSearch) return false;

        if (filterStatus === 'overdue') return (supplier.overdueCount || 0) > 0;
        if (filterStatus === 'due_week') return (supplier.dueSoonCount || 0) > 0;

        return true;
      }
    ).sort((a: any, b: any) => {
      if (!sortConfig) return 0;
      const valA = a[sortConfig.key] || 0;
      const valB = b[sortConfig.key] || 0;

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortConfig.direction === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });
  }, [suppliers, searchTerm, sortConfig, filterStatus]);

  // Calculate Metrics
  const totalToPay = suppliers.reduce((sum: number, s: any) => sum + (s.netBalance || 0), 0);
  const totalToCollect = suppliers.reduce((sum: number, s: any) => sum + (s.totalOutstanding || 0), 0);

  return (
    <Layout>
      <div className="page-shell">
      <div className="space-y-6 animate-in fade-in duration-700 pb-10 max-w-[1600px] mx-auto">

        {/* Header */}
        <PageHeader
          title="Suppliers"
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[var(--erp-card)] border border-default dark:border-default text-secondary dark:text-neutral-300 rounded-lg text-xs font-bold hover:bg-[var(--erp-bg-sunken)] dark:hover:bg-neutral-700 transition-all shadow-sm"
              >
                <Download className="w-3.5 h-3.5" /> Export
              </button>
              <button
                onClick={() => navigate('/suppliers/add')}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg text-xs font-bold hover:bg-indigo-600 transition-all shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5" /> Add Supplier
              </button>
            </div>
          }
        />

        <SupplierSubNav />

        {/* Summary Cards */}
        <SupplierStatsCards
          totalSuppliers={suppliers.length}
          totalToCollect={totalToCollect}
          totalToPay={totalToPay}
        />

        {/* Filter Bar */}
        <SupplierFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          showStatusFilter={true}
          filterStatus={filterStatus}
          onFilterChange={setFilterStatus}
          onRefresh={handleRefresh}
          isLoading={isLoading}
        />

        {/* Supplier Table — Clean reference style */}
        <div className="bg-white dark:bg-[var(--erp-card)] rounded-2xl border border-default dark:border-default shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-default dark:border-default">
                  <th
                    className="px-6 py-3.5 text-[11px] font-bold text-muted dark:text-neutral-400 uppercase tracking-wider cursor-pointer hover:text-indigo-500 transition-colors select-none whitespace-nowrap"
                    onClick={() => handleSort('businessName')}
                  >
                    // eslint-disable-next-line react-hooks/static-components -- TODO(TS-FIX): Phase 2/3 fix
                    Supplier Name <SortIcon column="businessName" sortConfig={sortConfig} />
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-muted dark:text-neutral-400 uppercase tracking-wider whitespace-nowrap">
                    Group
                  </th>

                  <th className="px-6 py-3.5 text-[11px] font-bold text-muted dark:text-neutral-400 uppercase tracking-wider whitespace-nowrap">
                    Mobile Number
                  </th>
                  <th
                    className="px-6 py-3.5 text-[11px] font-bold text-muted dark:text-neutral-400 uppercase tracking-wider cursor-pointer hover:text-indigo-500 transition-colors select-none whitespace-nowrap"
                    onClick={() => handleSort('totalAmount')}
                  >
                    // eslint-disable-next-line react-hooks/static-components -- TODO(TS-FIX): Phase 2/3 fix
                    Total Invoiced <SortIcon column="totalAmount" sortConfig={sortConfig} />
                  </th>
                  <th
                    className="px-6 py-3.5 text-[11px] font-bold text-muted dark:text-neutral-400 uppercase tracking-wider cursor-pointer hover:text-indigo-500 transition-colors select-none whitespace-nowrap"
                    onClick={() => handleSort('totalPaid')}
                  >
                    // eslint-disable-next-line react-hooks/static-components -- TODO(TS-FIX): Phase 2/3 fix
                    Total Paid <SortIcon column="totalPaid" sortConfig={sortConfig} />
                  </th>
                  <th
                    className="px-6 py-3.5 text-[11px] font-bold text-muted dark:text-neutral-400 uppercase tracking-wider cursor-pointer hover:text-indigo-500 transition-colors select-none whitespace-nowrap"
                    onClick={() => handleSort('netBalance')}
                  >
                    // eslint-disable-next-line react-hooks/static-components -- TODO(TS-FIX): Phase 2/3 fix
                    Balance <SortIcon column="netBalance" sortConfig={sortConfig} />
                  </th>
                  <th
                    className="px-6 py-3.5 text-[11px] font-bold text-muted dark:text-neutral-400 uppercase tracking-wider cursor-pointer hover:text-indigo-500 transition-colors select-none whitespace-nowrap"
                    onClick={() => handleSort('lastPaymentDate')}
                  >
                    // eslint-disable-next-line react-hooks/static-components -- TODO(TS-FIX): Phase 2/3 fix
                    Last Payment <SortIcon column="lastPaymentDate" sortConfig={sortConfig} />
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-muted dark:text-neutral-400 uppercase tracking-wider text-right w-16 whitespace-nowrap">
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-neutral-700/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <RefreshCcw className="w-6 h-6 text-indigo-500 animate-spin" />
                        <p className="text-xs font-bold text-muted dark:text-neutral-500 uppercase tracking-wider">Loading suppliers...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Users className="w-10 h-10 text-slate-200 dark:text-neutral-700" />
                        <p className="text-sm font-bold text-muted dark:text-neutral-500">No suppliers found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map((supplier) => (
                    <tr
                      key={supplier._id}
                      className="group hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 transition-colors cursor-pointer"
                      onClick={() => navigate(`/suppliers/${supplier._id}`)}
                    >
                      {/* Supplier Name */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-main dark:text-neutral-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {supplier.businessName}
                        </span>
                      </td>

                      {/* Group / Category */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-muted dark:text-neutral-400">
                          {supplier.supplierGroup || '-'}
                        </span>
                      </td>



                      {/* Mobile Number */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-secondary dark:text-neutral-400 font-medium">
                          {supplier.contactNo || '-'}
                        </span>
                      </td>

                      {/* Total Invoiced */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-main dark:text-neutral-200">
                          ₹ {(supplier.totalAmount || 0).toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* Total Paid */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                          ₹ {(supplier.totalPaid || 0).toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* Balance */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-bold flex items-center gap-1 ${(supplier.netBalance || 0) > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : (supplier.netBalance || 0) < 0
                            ? 'text-rose-500 dark:text-rose-400'
                            : 'text-muted dark:text-neutral-400'
                          }`}>
                          {(supplier.netBalance || 0) > 0 && <ArrowDownLeft className="w-3.5 h-3.5" />}
                          {(supplier.netBalance || 0) < 0 && <ArrowUpRight className="w-3.5 h-3.5" />}
                          ₹ {Math.abs(supplier.netBalance || 0).toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* Last Payment Date */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-muted dark:text-neutral-400">
                          {supplier.lastPaymentDate ? new Date(supplier.lastPaymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                        </span>
                      </td>

                      {/* Actions — Kebab menu */}
                      <td className="px-6 py-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === supplier._id ? null : supplier._id)}
                            className="p-1.5 text-muted dark:text-neutral-600 hover:text-muted dark:hover:text-neutral-400 hover:bg-[var(--erp-bg-sunken)] dark:hover:bg-neutral-700 rounded-lg transition-all"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {openMenuId === supplier._id && (
                            <div className="absolute right-0 top-8 w-40 bg-white dark:bg-[var(--erp-card)] border border-default dark:border-default rounded-xl shadow-lg z-20 py-1 animate-in fade-in zoom-in-95 duration-150">
                              <button
                                onClick={() => { navigate(`/suppliers/${supplier._id}`); setOpenMenuId(null); }}
                                className="w-full px-4 py-2.5 text-left text-sm text-secondary dark:text-neutral-300 hover:bg-[var(--erp-bg-sunken)] dark:hover:bg-neutral-700 flex items-center gap-2 font-medium"
                              >
                                <Eye className="w-3.5 h-3.5 text-muted" /> View Profile
                              </button>
                              <button
                                onClick={() => { setDeleteConfirm(supplier._id); setOpenMenuId(null); }}
                                className="w-full px-4 py-2.5 text-left text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2 font-medium"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Supplier"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center">
              <Trash2 className="w-7 h-7 text-rose-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-main">Confirm Deletion</p>
              <p className="text-sm text-muted mt-1">
                This action cannot be undone. All supplier data will be permanently removed.
              </p>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="flex-1 px-4 py-2.5 bg-[var(--erp-bg-sunken)] dark:bg-neutral-700 text-secondary dark:text-neutral-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-neutral-600 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDelete(deleteConfirm)}
              className="flex-1 px-4 py-2.5 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600 transition-all"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
              </div>

    </Layout>
  );
};

export default Suppliers;
