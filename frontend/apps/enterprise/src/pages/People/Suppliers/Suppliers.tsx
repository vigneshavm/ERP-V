import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { deleteSupplier, getSupplierAnalytics } from "@/entities/contact/model/supplierSlice";
import { AppDispatch, RootState } from "@/app/store/store";
import Layout from '@/shared/ui/Layout/Layout';
import PageShell from '@/shared/ui/Layout/PageShell';
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
  ChevronDown,
  Sparkles,
  ShieldCheck,
  Building2,
  Database,
  Search
} from 'lucide-react';

import SupplierSubNav from './SupplierSubNav';
import SupplierStatsCards from './components/SupplierStatsCards';
import SupplierFilterBar from './components/SupplierFilterBar';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';

// Sort indicator
const SortIcon = ({ column, sortConfig }: { column: string; sortConfig: { key: string; direction: 'asc' | 'desc' } | null }) => {
  if (!sortConfig || sortConfig.key !== column) {
    return <span className="text-neutral-400 dark:text-neutral-600 ml-1 inline-flex flex-col text-[8px] leading-none opacity-30"><ChevronUp className="w-2.5 h-2.5" /><ChevronDown className="w-2.5 h-2.5 -mt-0.5" /></span>;
  }
  return sortConfig.direction === 'asc'
    ? <ChevronUp className="w-3 h-3 text-blue-500 ml-1 inline animate-in fade-in zoom-in duration-300" />
    : <ChevronDown className="w-3 h-3 text-blue-500 ml-1 inline animate-in fade-in zoom-in duration-300" />;
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
    XLSX.writeFile(wb, `Suppliers_Delta_${new Date().toISOString().split('T')[0]}.xlsx`);
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
      <PageShell className="bg-app flex-1 flex flex-col min-h-0 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Cinematic Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-md border border-blue-500/20">Entity Management</span>
              <span className="text-neutral-300 dark:text-neutral-700">/</span>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Supplier Intelligence</span>
            </div>
            <h2 className="text-4xl font-black text-neutral-900 dark:text-main tracking-tight leading-none flex items-center gap-3">
              Trading Partners <Users className="w-8 h-8 text-blue-500" />
            </h2>
            <p className="text-sm text-neutral-500 font-medium italic mt-3">
              Orchestrate vendor relationships and inbound fiscal flows with precision.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
                onClick={handleExportCSV}
                className="px-6 py-3.5 bg-white dark:bg-neutral-900 border border-default dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all flex items-center gap-2"
            >
                <Download className="w-4 h-4" /> Export Delta
            </button>
            <button
                onClick={() => navigate('/suppliers/add')}
                className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
                <UserPlus className="w-5 h-5" /> 
                <span>Onboard Supplier</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-8">
            {/* High-Fidelity Stats Grid */}
            <SupplierStatsCards
                totalSuppliers={suppliers.length}
                totalToCollect={totalToCollect}
                totalToPay={totalToPay}
            />

            <SupplierSubNav />

            {/* Entity Operations Island */}
            <div className="erp-card rounded-[3rem] p-4 shadow-sm border-none overflow-hidden relative group">
                <div className="p-4">
                    <div className="flex items-center gap-4 mb-8 px-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-sm">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-neutral-900 dark:text-main uppercase tracking-tighter italic leading-none">Registry Command</h3>
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1 italic leading-none">Filtering and Intercepting Vendor Protocols</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <SupplierFilterBar
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                            showStatusFilter={true}
                            filterStatus={filterStatus}
                            onFilterChange={setFilterStatus}
                            onRefresh={handleRefresh}
                            isLoading={isLoading}
                        />

                        {/* Interactive Table Matrix */}
                        <div className="overflow-x-auto px-2">
                             <table className="w-full text-left border-separate border-spacing-y-4">
                               <thead>
                                 <tr className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em]">
                                   <th
                                     className="px-8 py-2 cursor-pointer hover:text-blue-500 transition-colors select-none"
                                     onClick={() => handleSort('businessName')}
                                   >
                                     Entity Designation <SortIcon column="businessName" sortConfig={sortConfig} />
                                   </th>
                                   <th className="px-8 py-2">Brand Class</th>
                                   <th className="px-8 py-2">Comm-Link</th>
                                   <th
                                     className="px-8 py-2 text-right cursor-pointer hover:text-blue-500 transition-colors select-none"
                                     onClick={() => handleSort('totalAmount')}
                                   >
                                     Aggregate Yield <SortIcon column="totalAmount" sortConfig={sortConfig} />
                                   </th>
                                   <th
                                     className="px-8 py-2 text-right cursor-pointer hover:text-blue-500 transition-colors select-none"
                                     onClick={() => handleSort('totalPaid')}
                                   >
                                     Liquidated <SortIcon column="totalPaid" sortConfig={sortConfig} />
                                   </th>
                                   <th
                                     className="px-8 py-2 text-right cursor-pointer hover:text-blue-500 transition-colors select-none"
                                     onClick={() => handleSort('netBalance')}
                                   >
                                     Net Position <SortIcon column="netBalance" sortConfig={sortConfig} />
                                   </th>
                                   <th
                                     className="px-8 py-2 cursor-pointer hover:text-blue-500 transition-colors select-none whitespace-nowrap"
                                     onClick={() => handleSort('lastPaymentDate')}
                                   >
                                     Last Sync <SortIcon column="lastPaymentDate" sortConfig={sortConfig} />
                                   </th>
                                   <th className="px-8 py-2 text-right">Commands</th>
                                 </tr>
                               </thead>
                               <tbody>
                                 {isLoading ? (
                                   <tr>
                                     <td colSpan={8} className="px-8 py-32 text-center">
                                       <div className="flex flex-col items-center">
                                         <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin mb-6" />
                                         <p className="text-sm font-black uppercase tracking-widest text-neutral-400 animate-pulse italic">Synchronizing Supplier Matrix...</p>
                                       </div>
                                     </td>
                                   </tr>
                                 ) : filteredSuppliers.length === 0 ? (
                                   <tr>
                                     <td colSpan={8} className="px-8 py-32 text-center">
                                       <div className="flex flex-col items-center">
                                         <div className="p-8 bg-neutral-50 dark:bg-neutral-900 rounded-[3rem] text-neutral-200 mb-6">
                                           <Users className="w-16 h-16" />
                                         </div>
                                         <h3 className="text-xl font-black text-neutral-900 dark:text-main uppercase tracking-tighter italic">Vortex: Supplier Null</h3>
                                         <p className="text-sm font-bold text-neutral-500 mt-2 italic">No trading entities detected in current registry.</p>
                                       </div>
                                     </td>
                                   </tr>
                                 ) : (
                                   filteredSuppliers.map((supplier) => (
                                     <tr
                                       key={supplier._id}
                                       className="group/row hover:transform hover:-translate-y-1 transition-all duration-500 cursor-pointer"
                                       onClick={() => navigate(`/suppliers/${supplier._id}`)}
                                     >
                                       <td className="px-2 py-1">
                                         <div className="bg-white dark:bg-neutral-900 rounded-l-[1.5rem] p-6 border-y border-l border-default dark:border-neutral-800 group-hover/row:border-blue-500/20 transition-all">
                                            <div className="text-sm font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tighter italic leading-none mb-1 group-hover/row:text-blue-500">
                                              {supplier.businessName}
                                            </div>
                                            <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest italic leading-none">
                                              {supplier.supplierId || 'NODE-IDENTIFIED'}
                                            </span>
                                         </div>
                                       </td>
                                       <td className="px-0 py-1">
                                         <div className="bg-white dark:bg-neutral-900 p-6 border-y border-default dark:border-neutral-800 group-hover/row:border-blue-500/20 transition-all font-bold text-xs text-neutral-500 uppercase tracking-widest italic">
                                            {supplier.supplierGroup || 'INDEPENDENT'}
                                         </div>
                                       </td>
                                       <td className="px-0 py-1">
                                         <div className="bg-white dark:bg-neutral-900 p-6 border-y border-default dark:border-neutral-800 group-hover/row:border-blue-500/20 transition-all flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-[10px] font-black text-neutral-600 dark:text-neutral-300 italic">
                                                <Phone className="w-3 h-3 text-blue-500" /> {supplier.contactNo}
                                            </div>
                                            {supplier.email && (
                                                <div className="flex items-center gap-2 text-[8px] font-bold text-neutral-400 truncate max-w-[120px]">
                                                    <Mail className="w-2.5 h-2.5" /> {supplier.email}
                                                </div>
                                            )}
                                         </div>
                                       </td>
                                       <td className="px-0 py-1 text-right">
                                         <div className="bg-white dark:bg-neutral-900 p-6 border-y border-default dark:border-neutral-800 group-hover/row:border-blue-500/20 transition-all font-mono font-black text-neutral-900 dark:text-neutral-300 italic text-sm">
                                            ₹ {(supplier.totalAmount || 0).toLocaleString('en-IN')}
                                         </div>
                                       </td>
                                       <td className="px-0 py-1 text-right">
                                         <div className="bg-white dark:bg-neutral-900 p-6 border-y border-default dark:border-neutral-800 group-hover/row:border-blue-500/20 transition-all font-mono font-black text-emerald-600 dark:text-emerald-400 italic text-sm">
                                            ₹ {(supplier.totalPaid || 0).toLocaleString('en-IN')}
                                         </div>
                                       </td>
                                       <td className="px-0 py-1 text-right">
                                         <div className="bg-white dark:bg-neutral-900 p-6 border-y border-default dark:border-neutral-800 group-hover/row:border-blue-500/20 transition-all">
                                            <span className={`text-sm font-black italic font-mono flex items-center justify-end gap-1 ${(supplier.netBalance || 0) > 0
                                              ? 'text-emerald-600 dark:text-emerald-400'
                                              : (supplier.netBalance || 0) < 0
                                                ? 'text-rose-600 dark:text-rose-400'
                                                : 'text-neutral-400'
                                              }`}>
                                              {(supplier.netBalance || 0) > 0 && <ArrowDownLeft className="w-3.5 h-3.5" />}
                                              {(supplier.netBalance || 0) < 0 && <ArrowUpRight className="w-3.5 h-3.5" />}
                                              ₹ {Math.abs(supplier.netBalance || 0).toLocaleString('en-IN')}
                                            </span>
                                         </div>
                                       </td>
                                       <td className="px-0 py-1">
                                         <div className="bg-white dark:bg-neutral-900 p-6 border-y border-default dark:border-neutral-800 group-hover/row:border-blue-500/20 transition-all font-bold text-[10px] text-neutral-500 uppercase tracking-widest italic">
                                            {supplier.lastPaymentDate ? new Date(supplier.lastPaymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'NEVER'}
                                         </div>
                                       </td>
                                       <td className="px-0 py-1 text-right">
                                         <div className="bg-white dark:bg-neutral-900 rounded-r-[1.5rem] p-6 border-y border-r border-default dark:border-neutral-800 group-hover/row:border-blue-500/20 transition-all">
                                            <div className="flex justify-end gap-3" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={() => navigate(`/suppliers/${supplier._id}`)}
                                                    className="p-3 bg-blue-50 dark:bg-blue-950/30 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(supplier._id)}
                                                    className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-95"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
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
            </div>
        </div>

        {/* Global Verification Footprint */}
        <div className="mt-8 flex items-center justify-center gap-6 opacity-30 group pb-24">
            <div className="h-px w-20 bg-neutral-400 dark:bg-neutral-600" />
            <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em]">Vendor Protocol Shield Verified • BizzAI Intelligence Core</span>
            </div>
            <div className="h-px w-20 bg-neutral-400 dark:bg-neutral-600" />
        </div>

        {/* Delete Confirmation Modal */}
        <Modal
            isOpen={!!deleteConfirm}
            onClose={() => setDeleteConfirm(null)}
            title="Registry Purge Confirmation"
            size="sm"
        >
            <div className="space-y-6 pt-4">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-20 h-20 rounded-3xl bg-rose-500/10 flex items-center justify-center text-rose-500 shadow-sm border border-rose-500/20 animate-pulse">
                        <Trash2 className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-neutral-900 dark:text-main uppercase tracking-tighter italic">Confirm Registry Purge</h3>
                        <p className="text-sm font-bold text-neutral-500 mt-2 italic leading-relaxed">
                            This action will permanently terminate the supplier node and its historical metadata from the active matrix.
                        </p>
                    </div>
                </div>
                <div className="flex flex-col gap-3 pt-6">
                    <button
                        onClick={() => handleDelete(deleteConfirm)}
                        className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-rose-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        Execute Purge Protocol
                    </button>
                    <button
                        onClick={() => setDeleteConfirm(null)}
                        className="w-full py-4 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all italic"
                    >
                        Abort Operation
                    </button>
                </div>
            </div>
        </Modal>
      </PageShell>
    </Layout>
  );
};

export default Suppliers;
