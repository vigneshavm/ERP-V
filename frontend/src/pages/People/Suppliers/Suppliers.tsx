import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { deleteSupplier, getSupplierAnalytics } from "../../../redux/slices/supplierSlice";
import { AppDispatch, RootState } from "../../../redux/store";
import Layout from "../../../components/shared/Layout";
import Modal from "../../../components/shared/Overlay/Modal";
import {
  Users,
  UserPlus,
  Search,
  MoreVertical,
  Eye,
  Trash2,
  Download,
  RefreshCcw,
  TrendingUp,
  AlertTriangle,
  Phone,
  Mail,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

import SupplierSubNav from './SupplierSubNav';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';

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
    const dataToExport = suppliers.map(s => ({
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
      (supplier) => {
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
    ).sort((a, b) => {
      if (!sortConfig) return 0;
      const valA = a[sortConfig.key] || 0;
      const valB = b[sortConfig.key] || 0;

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
    });
  }, [suppliers, searchTerm, sortConfig, filterStatus]);

  // Calculate Metrics
  const totalToPay = suppliers.reduce((sum, s) => sum + (s.netBalance || 0), 0);
  const totalToCollect = suppliers.reduce((sum, s) => sum + (s.totalOutstanding || 0), 0);

  // Sort indicator
  const SortIcon = ({ column }: { column: string }) => {
    if (!sortConfig || sortConfig.key !== column) {
      return <span className="text-slate-300 dark:text-neutral-600 ml-1 inline-flex flex-col text-[8px] leading-none"><ChevronUp className="w-2.5 h-2.5" /><ChevronDown className="w-2.5 h-2.5 -mt-0.5" /></span>;
    }
    return sortConfig.direction === 'asc'
      ? <ChevronUp className="w-3 h-3 text-indigo-500 ml-1 inline" />
      : <ChevronDown className="w-3 h-3 text-indigo-500 ml-1 inline" />;
  };

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-700 pb-10 max-w-[1600px] mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800 dark:text-neutral-100 tracking-tight">Suppliers</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-300 rounded-lg text-xs font-bold hover:bg-slate-50 dark:hover:bg-neutral-700 transition-all shadow-sm"
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
        </div>

        <SupplierSubNav />

        {/* Summary Cards — Reference style with colored left border */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* All Suppliers */}
          <div className="bg-white dark:bg-neutral-800 border-2 border-indigo-200 dark:border-indigo-500/30 rounded-xl p-5 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-bold text-indigo-500 dark:text-indigo-400">All Suppliers</span>
            </div>
            <span className="text-3xl font-black text-slate-900 dark:text-white">{suppliers.length}</span>
          </div>

          {/* To Collect */}
          <div className="bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl p-5 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                <ArrowDownLeft className="w-3 h-3 text-emerald-500" />
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">To Collect</span>
            </div>
            <span className="text-3xl font-black text-slate-900 dark:text-white">₹ {totalToCollect.toLocaleString('en-IN')}</span>
          </div>

          {/* To Pay */}
          <div className="bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl p-5 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center">
                <ArrowUpRight className="w-3 h-3 text-rose-500" />
              </div>
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400">To Pay</span>
            </div>
            <span className="text-3xl font-black text-slate-900 dark:text-white">₹ {totalToPay.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Filter Bar — Reference style */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Search suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-9 pr-4 py-2 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all text-sm text-slate-700 dark:text-neutral-200 placeholder:text-slate-400"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg overflow-hidden">
              {['all', 'overdue', 'due_week'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status as any)}
                  className={`px-3 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors ${filterStatus === status
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-400 dark:text-neutral-500 hover:text-slate-600 dark:hover:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-700'
                    }`}
                >
                  {status === 'all' ? 'All' : status === 'overdue' ? 'Overdue' : 'Due Soon'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className={`p-2 text-slate-400 hover:text-indigo-500 hover:bg-slate-50 dark:hover:bg-neutral-700 rounded-lg transition-all ${isLoading ? 'animate-spin' : ''}`}
              title="Refresh"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Supplier Table — Clean reference style */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-slate-100 dark:border-neutral-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-neutral-700">
                  <th
                    className="px-6 py-3.5 text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider cursor-pointer hover:text-indigo-500 transition-colors select-none whitespace-nowrap"
                    onClick={() => handleSort('businessName')}
                  >
                    Supplier Name <SortIcon column="businessName" />
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider whitespace-nowrap">
                    Group
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider whitespace-nowrap">
                    Type
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider whitespace-nowrap">
                    Mobile Number
                  </th>
                  <th
                    className="px-6 py-3.5 text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider cursor-pointer hover:text-indigo-500 transition-colors select-none whitespace-nowrap"
                    onClick={() => handleSort('totalAmount')}
                  >
                    Total Invoiced <SortIcon column="totalAmount" />
                  </th>
                  <th
                    className="px-6 py-3.5 text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider cursor-pointer hover:text-indigo-500 transition-colors select-none whitespace-nowrap"
                    onClick={() => handleSort('totalPaid')}
                  >
                    Total Paid <SortIcon column="totalPaid" />
                  </th>
                  <th
                    className="px-6 py-3.5 text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider cursor-pointer hover:text-indigo-500 transition-colors select-none whitespace-nowrap"
                    onClick={() => handleSort('netBalance')}
                  >
                    Balance <SortIcon column="netBalance" />
                  </th>
                  <th
                    className="px-6 py-3.5 text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider cursor-pointer hover:text-indigo-500 transition-colors select-none whitespace-nowrap"
                    onClick={() => handleSort('lastPaymentDate')}
                  >
                    Last Payment <SortIcon column="lastPaymentDate" />
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider text-right w-16 whitespace-nowrap">
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-neutral-700/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <RefreshCcw className="w-6 h-6 text-indigo-500 animate-spin" />
                        <p className="text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Loading suppliers...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Users className="w-10 h-10 text-slate-200 dark:text-neutral-700" />
                        <p className="text-sm font-bold text-slate-400 dark:text-neutral-500">No suppliers found</p>
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
                        <span className="text-sm font-semibold text-slate-800 dark:text-neutral-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {supplier.businessName}
                        </span>
                      </td>

                      {/* Group / Category */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-500 dark:text-neutral-400">
                          {supplier.supplierGroup || '-'}
                        </span>
                      </td>

                      {/* Type */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-neutral-700 text-slate-600 dark:text-neutral-300 uppercase tracking-wide border border-slate-200 dark:border-neutral-600">
                          {supplier.supplierType}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${supplier.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-slate-300 dark:bg-neutral-600'}`} />
                          <span className={`text-xs font-semibold uppercase tracking-wide ${supplier.status === 'active' ? 'text-slate-700 dark:text-neutral-200' : 'text-slate-400 dark:text-neutral-500'}`}>
                            {supplier.status}
                          </span>
                        </div>
                      </td>

                      {/* Mobile Number */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-600 dark:text-neutral-400 font-medium">
                          {supplier.contactNo || '-'}
                        </span>
                      </td>

                      {/* Total Invoiced */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-slate-800 dark:text-neutral-200">
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
                            : 'text-slate-500 dark:text-neutral-400'
                          }`}>
                          {(supplier.netBalance || 0) > 0 && <ArrowDownLeft className="w-3.5 h-3.5" />}
                          {(supplier.netBalance || 0) < 0 && <ArrowUpRight className="w-3.5 h-3.5" />}
                          ₹ {Math.abs(supplier.netBalance || 0).toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* Last Payment Date */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-500 dark:text-neutral-400">
                          {supplier.lastPaymentDate ? new Date(supplier.lastPaymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                        </span>
                      </td>

                      {/* Actions — Kebab menu */}
                      <td className="px-6 py-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === supplier._id ? null : supplier._id)}
                            className="p-1.5 text-slate-300 dark:text-neutral-600 hover:text-slate-500 dark:hover:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-700 rounded-lg transition-all"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {openMenuId === supplier._id && (
                            <div className="absolute right-0 top-8 w-40 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl shadow-lg z-20 py-1 animate-in fade-in zoom-in-95 duration-150">
                              <button
                                onClick={() => { navigate(`/suppliers/${supplier._id}`); setOpenMenuId(null); }}
                                className="w-full px-4 py-2.5 text-left text-sm text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-700 flex items-center gap-2 font-medium"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-400" /> View Profile
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
              <p className="text-lg font-bold text-slate-900 dark:text-white">Confirm Deletion</p>
              <p className="text-sm text-slate-500 mt-1">
                This action cannot be undone. All supplier data will be permanently removed.
              </p>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-neutral-700 text-slate-600 dark:text-neutral-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-neutral-600 transition-all"
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
    </Layout>
  );
};

export default Suppliers;
