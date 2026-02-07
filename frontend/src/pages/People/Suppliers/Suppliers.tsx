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
  Mail
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
      'Type': s.supplierType,
      'Status': s.status,
      'GST No': s.gstNo || 'N/A',
      'Total Purchase': s.totalAmount || 0,
      'Pending Amount': s.pendingAmount || 0
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
      (supplier) =>
        supplier.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (supplier.supplierGroup && supplier.supplierGroup.toLowerCase().includes(searchTerm.toLowerCase())) ||
        supplier.contactPersonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.contactNo.includes(searchTerm) ||
        (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a, b) => {
      if (!sortConfig) return 0;
      if (sortConfig.key === 'totalAmount') {
        const amountA = a.totalAmount || 0;
        const amountB = b.totalAmount || 0;
        return sortConfig.direction === 'asc' ? amountA - amountB : amountB - amountA;
      }
      return 0;
    });
  }, [suppliers, searchTerm, sortConfig]);

  // Calculate Metrics
  const pendingDues = suppliers.reduce((sum, s) => sum + (s.totalOutstanding || 0), 0);
  const overdueTotal = suppliers.reduce((sum, s) => sum + (s.overdueAmount || 0), 0);

  // -- UI Components (Dashboard Pattern) --
  const MetricCard = ({ title, value, subtext, icon: Icon, color, trend }: any) => (
    <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden group hover:border-primary/50 transition-all">
      <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-${color}-500/20 transition-all`}></div>
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm font-medium uppercase tracking-wide">{title}</p>
          <h3 className="text-3xl font-bold text-neutral-900 dark:text-white mt-1">{value}</h3>
          {subtext && <p className={`text-xs font-medium mt-2 flex items-center gap-1 ${trend === 'up' ? 'text-success' : trend === 'down' ? 'text-error' : 'text-neutral-400'}`}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : trend === 'down' ? <AlertTriangle className="w-3 h-3" /> : null}
            {subtext}
          </p>}
        </div>
        <div className={`p-3 rounded-xl bg-${color}-500/10 text-${color}-500`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in pb-10">
        {/* Header - Dashboard Pattern */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Supplier Directory
            </h2>
            <p className="text-neutral-500 text-sm mt-1">Manage your enterprise supply chain and procurement partners</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-sm font-medium shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-all">
              <Download className="w-4 h-4" /> Export
            </button>
            <button
              onClick={() => navigate('/suppliers/add')}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-all shadow-sm flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" /> Add Supplier
            </button>
          </div>
        </div>

        <SupplierSubNav />

        {/* Metrics - Dashboard Pattern */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Total Suppliers"
            value={suppliers.length}
            subtext={`+${suppliers.filter(s => new Date(s.createdAt!).getMonth() === new Date().getMonth()).length} this month`}
            icon={Users}
            color="primary"
            trend="up"
          />
          <MetricCard
            title="Overdue Amount"
            value={`₹${overdueTotal.toLocaleString()}`}
            subtext={`${suppliers.filter(s => s.paymentStatus === 'Overdue').length} suppliers overdue`}
            icon={AlertTriangle}
            color="error"
            trend="down"
          />
          <MetricCard
            title="Total Outstanding"
            value={`₹${pendingDues.toLocaleString()}`}
            subtext="Pending payments"
            icon={TrendingUp}
            color="warning"
            trend="flat"
          />
        </div>

        {/* Table Section - Dashboard Pattern */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-neutral-100 dark:border-neutral-700 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-96 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search by name, contact or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="p-2.5 text-neutral-400 hover:text-primary dark:hover:text-primary hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-all">
                <RefreshCcw className="w-4 h-4" />
              </button>
              <button className="p-2.5 text-neutral-400 hover:text-primary dark:hover:text-primary hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-all">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-900/50 text-[11px] uppercase tracking-wide font-semibold text-neutral-500 dark:text-neutral-400">
                  <th className="px-6 py-4">Supplier</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Outstanding</th>
                  <th className="px-6 py-4">Status</th>
                  <th
                    className="px-6 py-4 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    onClick={() => handleSort('totalAmount')}
                  >
                    <div className="flex items-center gap-1">
                      Total Purchase
                      {sortConfig?.key === 'totalAmount' && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        <p className="text-sm font-medium text-neutral-400">Loading suppliers...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Users className="w-12 h-12 text-neutral-300" />
                        <p className="text-sm font-medium text-neutral-500">No suppliers found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map((supplier) => (
                    <tr key={supplier._id} className="group hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                            {supplier.businessName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-neutral-900 dark:text-white">{supplier.businessName}</p>
                            <p className="text-xs text-neutral-400">{supplier.supplierId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                            <Phone className="w-3.5 h-3.5" />
                            <span className="text-xs">{supplier.contactNo}</span>
                          </div>
                          {supplier.email && (
                            <div className="flex items-center gap-2 text-neutral-400">
                              <Mail className="w-3.5 h-3.5" />
                              <span className="text-xs truncate max-w-[140px]">{supplier.email}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium">
                          {supplier.supplierType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-semibold ${(supplier.totalOutstanding || 0) > 0 ? 'text-neutral-900 dark:text-white' : 'text-neutral-400'}`}>
                          ₹{(supplier.totalOutstanding || 0).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          const status = supplier.paymentStatus || 'Good';
                          if (status === 'Overdue') return (
                            <span className="flex items-center gap-1.5 text-error text-xs font-medium">
                              <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
                              Overdue
                            </span>
                          );
                          if (status === 'Due Soon') return (
                            <span className="flex items-center gap-1.5 text-warning text-xs font-medium">
                              <span className="w-2 h-2 rounded-full bg-warning"></span>
                              Due Soon
                            </span>
                          );
                          return (
                            <span className="flex items-center gap-1.5 text-success text-xs font-medium">
                              <span className="w-2 h-2 rounded-full bg-success"></span>
                              Good
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                          ₹{(supplier.totalAmount || 0).toLocaleString('en-IN')}
                        </span>
                        <p className="text-xs text-neutral-400">{supplier.billCount || 0} bills</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => navigate(`/suppliers/${supplier._id}`)}
                            className="p-2 text-neutral-400 hover:text-primary hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-all"
                            title="View Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(supplier._id)}
                            className="p-2 text-neutral-400 hover:text-error hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
            <div className="w-14 h-14 rounded-xl bg-error/10 flex items-center justify-center">
              <Trash2 className="w-7 h-7 text-error" />
            </div>
            <div>
              <p className="text-lg font-bold text-neutral-900 dark:text-white">Confirm Deletion</p>
              <p className="text-sm text-neutral-500 mt-1">
                This action cannot be undone. All supplier data will be permanently removed.
              </p>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="flex-1 px-4 py-2.5 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-lg text-sm font-medium hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDelete(deleteConfirm)}
              className="flex-1 px-4 py-2.5 bg-error text-white rounded-lg text-sm font-medium hover:bg-error/90 transition-all"
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
