import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getAllSuppliers, deleteSupplier, reset, Supplier, getSupplierAnalytics } from "../../../redux/slices/supplierSlice";
import { AppDispatch, RootState } from "../../../redux/store";
import Layout from "../../../components/shared/Layout";
import Modal from "../../../components/shared/Overlay/Modal";
import PageHeader from "../../../components/shared/Layout/PageHeader";
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
  ShieldCheck,
  Phone,
  Mail
} from 'lucide-react';

import SupplierSubNav from './SupplierSubNav';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';

const Suppliers: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  // Suppliers State
  const { suppliers, isLoading } = useSelector(
    (state: RootState) => state.suppliers
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const [viewMode, setViewMode] = useState<'list' | 'group'>('list');
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  useEffect(() => {
    dispatch(getSupplierAnalytics());

    return () => {
      // Optional: Reset logic if needed
    };
  }, [dispatch]);

  const handleDelete = async (id: string | null) => {
    if (!id) return;
    try {
      await dispatch(deleteSupplier(id)).unwrap();
      setDeleteConfirm(null);
      toast.success('Supplier record terminated successfully');
      dispatch(getSupplierAnalytics()); // Refresh analytics & list
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

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev =>
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    );
  };

  const filteredSuppliers = suppliers.filter(
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

    // Default string sorting
    return 0;
  });

  // Calculate Pending Dues from Supplier Analytics
  const pendingDues = suppliers.reduce((sum, s) => sum + (s.totalOutstanding || 0), 0);
  const overdueTotal = suppliers.reduce((sum, s) => sum + (s.overdueAmount || 0), 0);

  const metrics = [
    { label: 'Total Suppliers', value: suppliers.length, icon: Users, color: 'indigo', trend: `+${suppliers.filter(s => new Date(s.createdAt!).getMonth() === new Date().getMonth()).length} this month` },
    { label: 'Overdue Amount', value: `₹${(overdueTotal / 1000).toFixed(1)}k`, icon: ShieldCheck, color: 'red', trend: `${suppliers.filter(s => s.paymentStatus === 'Overdue').length} Suppliers` },
    { label: 'Total Outstanding', value: `₹${(pendingDues / 100000).toFixed(2)}L`, icon: TrendingUp, color: 'amber', trend: 'High' }
  ];

  // Grouping Logic
  const groupedSuppliers = React.useMemo(() => {
    const groups: { [key: string]: Supplier[] } = {};
    filteredSuppliers.forEach(s => {
      const groupName = s.supplierGroup || 'Unclassified';
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(s);
    });
    return groups;
  }, [filteredSuppliers]);

  return (
    <Layout>
      <PageHeader
        title="Supplier Directory"
        description="Manage your enterprise supply chain and procurement partners"
        breadcrumbs={[{ label: 'Dashboard', link: '/' }, { label: 'Suppliers', link: '/suppliers' }, { label: 'Directory' }]}
        actions={
          <>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mr-2">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('group')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === 'group' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                By Brand
              </button>
            </div>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all">
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button
              onClick={() => navigate('/suppliers/add')}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 active:scale-95 transition-all"
            >
              <UserPlus className="w-4 h-4" /> Add New Supplier
            </button>
          </>
        }
      />

      <SupplierSubNav />

      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {metrics.map((stat, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform`}>
                <stat.icon className={`w-24 h-24 text-${stat.color}-600`} />
              </div>
              <div className="relative z-10">
                <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-50 dark:bg-${stat.color}-900/20 flex items-center justify-center mb-4`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                    <p className="text-3xl font-black text-slate-800 dark:text-white mt-1">{stat.value}</p>
                  </div>
                  <span className={`text-xs font-black px-2 py-1 rounded-lg bg-${stat.color}-50 dark:bg-${stat.color}-900/30 text-${stat.color}-600`}>
                    {stat.trend}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Table Section */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50 dark:bg-slate-800/20">
            <div className="relative w-full sm:w-96 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Filter by name, contact or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="p-3 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                <RefreshCcw className="w-4 h-4" />
              </button>
              <button className="p-3 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/50 text-[10px] uppercase tracking-[0.15em] font-black text-slate-400">
                  <th className="px-8 py-5">Supplier Profile</th>
                  <th className="px-8 py-5">Contact Node</th>
                  <th className="px-8 py-5">Classification</th>
                  <th className="px-8 py-5">Outstanding Balance</th>
                  <th className="px-8 py-5">Payment Status</th>
                  <th
                    className="px-8 py-5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group"
                    onClick={() => handleSort('totalAmount')}
                  >
                    <div className="flex items-center gap-2">
                      Total Purchase
                      <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                        {sortConfig?.key === 'totalAmount' ? (
                          sortConfig.direction === 'asc' ? (
                            <span className="text-[8px] opacity-100">▲</span>
                          ) : (
                            <span className="text-[8px] opacity-100">▼</span>
                          )
                        ) : (
                          <>
                            <span className="text-[8px] leading-[0.5]">▲</span>
                            <span className="text-[8px] leading-[0.5]">▼</span>
                          </>
                        )}
                      </div>
                    </div>
                  </th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
                        <p className="text-sm font-bold text-slate-400">Synchronizing Supplier Data...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-50 grayscale">
                        <Users className="w-16 h-16 text-slate-300" />
                        <p className="text-base font-bold text-slate-500 uppercase tracking-widest">No Supplier Records Found</p>
                      </div>
                    </td>
                  </tr>
                ) : viewMode === 'group' ? (
                  Object.entries(groupedSuppliers).map(([groupName, groupSuppliers]) => {
                    const isExpanded = expandedGroups.includes(groupName);
                    const groupTotal = groupSuppliers.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
                    const groupPending = groupSuppliers.reduce((sum, s) => sum + (s.totalOutstanding || 0), 0);
                    const groupBillCount = groupSuppliers.reduce((sum, s) => sum + (s.billCount || 0), 0);

                    return (
                      <React.Fragment key={groupName}>
                        {/* Group Header Row */}
                        <tr
                          onClick={() => toggleGroup(groupName)}
                          className="bg-slate-50 dark:bg-slate-800/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border-l-4 border-l-indigo-500"
                        >
                          <td colSpan={5} className="px-8 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                              <div>
                                <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                                  {groupName}
                                  <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] text-slate-600 dark:text-slate-300">
                                    {groupSuppliers.length} Partners
                                  </span>
                                </h3>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-4">
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-slate-800 dark:text-white">₹{groupTotal.toLocaleString('en-IN')}</span>
                              <span className="text-[10px] text-slate-500 font-bold">Total Volume</span>
                            </div>
                          </td>
                          <td className="px-8 py-4 text-right">
                            {groupPending > 0 ? (
                              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                                <TrendingUp className="w-3 h-3" />
                                <span className="text-xs font-black">₹{groupPending.toLocaleString('en-IN')} Outstanding</span>
                              </div>
                            ) : (
                              <span className="text-xs font-bold text-emerald-500">No Dues</span>
                            )}
                          </td>
                        </tr>

                        {/* Child Rows */}
                        {isExpanded && groupSuppliers.map((supplier) => (
                          <tr key={supplier._id} className="group hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-all duration-300 border-l-4 border-l-transparent pl-8">
                            <td className="px-8 py-6 pl-16">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold text-sm">
                                  {supplier.businessName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-none mb-1">{supplier.businessName}</p>
                                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">{supplier.supplierId}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                  <Phone className="w-3 h-3" />
                                  <span className="text-xs">{supplier.contactNo}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                {supplier.supplierType}
                              </span>
                            </td>
                            <td className="px-8 py-6">
                              {/* Outstanding Balance */}
                              <span className={`text-xs font-bold ${supplier.totalOutstanding && supplier.totalOutstanding > 10000 ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>
                                ₹{(supplier.totalOutstanding || 0).toLocaleString('en-IN')}
                              </span>
                              {supplier.isCreditRisk && (
                                <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-600 text-[9px] rounded font-bold">Risk</span>
                              )}
                            </td>
                            <td className="px-8 py-6">
                              {(() => {
                                const status = supplier.paymentStatus || 'Good';
                                if (status === 'Overdue') return (
                                  <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-red-500">Overview</span>
                                    <span className="text-[9px] text-red-500 font-medium">₹{(supplier.overdueAmount || 0).toLocaleString()}</span>
                                  </div>
                                );
                                if (status === 'Due Soon') return <span className="text-[10px] font-bold text-amber-500">Due Soon</span>;
                                return <span className="text-[10px] font-bold text-emerald-500">Good</span>;
                              })()}
                            </td>
                            <td className="px-8 py-6">
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                ₹{(supplier.totalAmount || 0).toLocaleString('en-IN')}
                              </span>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100">
                                <button onClick={() => navigate(`/suppliers/${supplier._id}`)} className="p-2 hover:text-indigo-600"><Eye className="w-4 h-4" /></button>
                                <button onClick={() => setDeleteConfirm(supplier._id)} className="p-2 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })
                ) : (
                  filteredSuppliers.map((supplier) => (
                    <tr key={supplier._id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all duration-300">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-base shadow-lg shadow-indigo-200 dark:shadow-none group-hover:scale-110 transition-transform">
                            {supplier.businessName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800 dark:text-white leading-none mb-1">{supplier.businessName}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{supplier.supplierId}</p>
                              {supplier.supplierGroup && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 font-bold">
                                  {supplier.supplierGroup}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <Phone className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium">{supplier.contactNo}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-400">
                            <Mail className="w-3.5 h-3.5" />
                            <span className="text-[11px] truncate max-w-[150px]">{supplier.email || 'no-email'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-wider">
                          {supplier.supplierType}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className={`text-sm font-black ${supplier.totalOutstanding && supplier.totalOutstanding > 0 ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>
                            ₹{(supplier.totalOutstanding || 0).toLocaleString('en-IN')}
                          </span>
                          {supplier.isCreditRisk && (
                            <span className="text-[9px] font-bold text-red-500">Credit Limit Exceeded</span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        {(() => {
                          const status = supplier.paymentStatus || 'Good';
                          if (status === 'Overdue') return (
                            <div className="flex flex-col gap-1 text-red-500">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                <span className="text-[10px] font-black uppercase tracking-widest">Overdue</span>
                              </div>
                              <span className="text-[10px] font-bold ml-4">₹{(supplier.overdueAmount || 0).toLocaleString()}</span>
                            </div>
                          );
                          if (status === 'Due Soon') return (
                            <div className="flex flex-col gap-1 text-amber-500">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                <span className="text-[10px] font-black uppercase tracking-widest">Due Soon</span>
                              </div>
                              <span className="text-[10px] font-bold ml-4">₹{(supplier.dueNext7DaysAmount || 0).toLocaleString()}</span>
                            </div>
                          );
                          return (
                            <div className="flex items-center gap-2 text-emerald-500">
                              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                              <span className="text-[10px] font-black uppercase tracking-widest">Good</span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm font-black text-slate-800 dark:text-white">
                          ₹{(supplier.totalAmount || 0).toLocaleString('en-IN')}
                        </span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {(supplier.billCount || 0)} Bills
                        </p>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/suppliers/${supplier._id}`)}
                            className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                            title="View Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(supplier._id)}
                            className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                            title="Delete Record"
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
        title="System Authorization Required"
        size="sm"
      >
        <div className="space-y-6">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <p className="text-lg font-black text-slate-800 dark:text-white leading-tight">Decommission Supplier?</p>
              <p className="text-xs text-slate-500 font-medium mt-2">
                Terminating this supplier record will affect historical procurement data. This action is irreversible within the current session audit.
              </p>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all border border-transparent"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDelete(deleteConfirm)}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-700 shadow-lg shadow-red-200 dark:shadow-none transition-all"
            >
              Confirm Termination
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default Suppliers;
