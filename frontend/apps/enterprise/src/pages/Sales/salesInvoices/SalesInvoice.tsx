import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllSalesInvoices,
  getSalesInvoiceSummary,
  deleteSalesInvoice,
  reset,
} from "@/entities/sales/model/salesInvoiceSlice";
import Layout from "@/shared/ui/Layout/Layout";
import PageHeader from "@/shared/ui/Layout/PageHeader";
import MetricCard from "@/shared/ui/Feedback/MetricCard";
import FormInput from "@/shared/ui/Form/Input";
import CustomerSelectionModal from "@/shared/ui/Modals/CustomerSelectionModal";
import { AppDispatch, RootState } from "@/app/store/store";
import { Customer, Invoice } from '@repo/shared';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Trash2,
  Eye,
  MoreVertical,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  DollarSign,
  TrendingUp,
  AlertTriangle
} from "lucide-react";

const SalesInvoice = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const {
    invoices = [],
    summary = null,
    isLoading,
    isError,
    message,
  } = useSelector((state: RootState) => state.salesInvoice);



  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    dispatch(getAllSalesInvoices());
    dispatch(getSalesInvoiceSummary());
    return () => {
      dispatch(reset());
    };
  }, [dispatch]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- TODO(TS-FIX): Phase 2/3 fix
    setCurrentPage(1);
  }, [searchTerm, statusFilter, selectedCustomer]);

  const handleDelete = async (id: string) => {
    await dispatch(deleteSalesInvoice(id));
    setDeleteConfirm(null);
    dispatch(getAllSalesInvoices());
  };

  const isCustomer = (cust: any): cust is Customer => {
    return cust && typeof cust === 'object' && 'name' in cust;
  };

  const filteredInvoices = Array.isArray(invoices)
    ? (invoices as Invoice[]).filter((invoice) => {
      const customer = invoice.customer;
      const customerName = isCustomer(customer) ? customer.name : '';
      const matchesSearch =
        invoice.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customerName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || invoice.paymentStatus === statusFilter;
      const matchesCustomer =
        !selectedCustomer || (isCustomer(customer) && customer._id === selectedCustomer._id);
      return matchesSearch && matchesStatus && matchesCustomer;
    })
    : [];

  // Pagination calculations
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "partial":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "unpaid":
        return "bg-rose-500/20 text-rose-400 border-rose-500/30";
      default:
        return "bg-white/10 text-muted border-default";
    }
  };

  // Get metrics from backend summary (source of truth)
  const totalInvoices = summary?.totalInvoices || 0;
  const totalPaid = summary?.totalPaid || 0;
  const totalDue = summary?.outstandingDues || 0;

  return (
    <Layout>
      <div className="page-shell">
      <div className="max-w-7xl mx-auto animate-fade-in pb-12 premium-bg min-h-screen px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <PageHeader
          title="Sales Invoices"
          description="Manage and track your customer invoicing"
          actions={
            <button
              onClick={() => navigate('/sales/new')}
              className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all font-black uppercase tracking-widest text-[10px] sm:text-xs whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Create Invoice</span>
              <span className="sm:hidden">New</span>
            </button>
          }
        />

        {/* Error Feedback */}
        {isError && (
          <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/20 rounded-xl flex items-center gap-3 animate-slide-down">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <p className="text-rose-700 dark:text-rose-400 text-sm font-bold italic">{message}</p>
          </div>
        )}

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <MetricCard
            title="Total Invoices"
            value={totalInvoices}
            icon={FileText}
          />
          <MetricCard
            title="Amount Collected"
            value={`₹${totalPaid.toLocaleString()}`}
            icon={CheckCircle}
            progress={totalInvoices > 0 ? (totalPaid / (totalPaid + totalDue)) * 100 : 0}
          />
          <MetricCard
            title="Outstanding Dues"
            value={`₹${totalDue.toLocaleString()}`}
            icon={AlertCircle}
            subtext="Action Required"
            trend="down"
          />
        </div>

        {/* Advanced Filters */}
        <div className="erp-card p-4 flex flex-col gap-4 mb-8">
          <div className="flex flex-wrap gap-4 items-end">
            {/* Search */}
            <div className="flex-1 w-full sm:w-auto min-w-0 sm:min-w-[200px]">
              <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">Search</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search invoice number, customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[var(--erp-bg-sunken)] border border-default rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-48">
              <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--erp-bg-sunken)] border border-default rounded-lg text-sm text-muted focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all appearance-none"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>

            {/* Customer Filter */}
            <div className="w-full sm:w-auto">
              <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">Customer</label>
              {selectedCustomer ? (
                <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-2 rounded-lg text-sm font-black uppercase tracking-tighter animate-fade-in h-[38px]">
                  <span className="truncate max-w-[150px]">{selectedCustomer.name}</span>
                  <button onClick={() => setSelectedCustomer(null)} className="hover:text-main transition-colors">
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowCustomerModal(true)}
                  className="w-full sm:w-auto px-4 py-2 bg-[var(--erp-bg-sunken)] border border-default text-muted rounded-lg hover:bg-white/10 transition-all text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 h-[38px]"
                >
                  <Filter className="w-4 h-4" />
                  Filter Customer
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="erp-card overflow-hidden flex flex-col shadow-2xl">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mb-4"></div>
              <p className="text-muted text-xs font-black uppercase tracking-widest">Loading invoices...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
              <div className="bg-[var(--erp-bg-sunken)] p-4 rounded-full mb-4">
                <Search className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-lg font-black text-muted uppercase tracking-tight">No Invoices Found</h3>
              <p className="text-muted mt-1 max-w-sm text-xs font-medium">No sales invoices match your current search or filter criteria.</p>
              <button
                onClick={() => { setSearchTerm(''); setStatusFilter('all'); setSelectedCustomer(null); }}
                className="mt-6 px-6 py-2 bg-[var(--erp-bg-sunken)] border border-default text-muted text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all shadow-lg"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[var(--erp-bg-sunken)] border-b border-default">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest">Invoice #</th>
                      <th className="px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest">Date</th>
                      <th className="px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest">Customer</th>
                      <th className="px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest text-right">Amount</th>
                      <th className="px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest text-right">Paid</th>
                      <th className="px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest text-center">Status</th>
                      <th className="px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {paginatedInvoices.map((invoice) => (
                      <tr key={invoice._id} className="hover:bg-[var(--erp-bg-sunken)] transition-colors">
                        <td className="px-6 py-4 font-mono text-indigo-400 font-black cursor-pointer hover:text-indigo-300 transition-colors" onClick={() => navigate(`/sales/invoice/${invoice._id}`)}>
                          {invoice.invoiceNo}
                        </td>
                        <td className="px-6 py-4 text-muted">
                          <div className="font-bold">{new Date(invoice.createdAt).toLocaleDateString("en-IN")}</div>
                          <div className="text-[10px] text-muted uppercase tracking-tighter mt-0.5">{new Date(invoice.createdAt).toLocaleTimeString()}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-black text-muted uppercase tracking-tight">
                            {isCustomer(invoice.customer) ? invoice.customer.name : "Walk-in Customer"}
                          </div>
                          {(isCustomer(invoice.customer) && invoice.customer.phone) && (
                            <div className="text-[10px] text-secondary font-mono tracking-tighter mt-0.5">{invoice.customer.phone}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-black text-muted font-mono">
                          ₹{invoice.totalAmount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right font-black text-emerald-400 font-mono">
                          ₹{invoice.paidAmount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusColor(invoice.paymentStatus)}`}>
                            {invoice.paymentStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 text-muted">
                            <button
                              onClick={() => navigate(`/sales/invoice/${invoice._id}`)}
                              className="p-2 hover:text-indigo-400 hover:bg-[var(--erp-bg-sunken)] rounded-lg transition-all"
                              title="View Invoice"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(invoice._id || null)}
                              className="p-2 hover:text-rose-400 hover:bg-[var(--erp-bg-sunken)] rounded-lg transition-all"
                              title="Delete Invoice"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Stack */}
              <div className="md:hidden divide-y divide-white/5">
                {paginatedInvoices.map((invoice) => (
                  <div key={invoice._id} className="p-4 active:bg-[var(--erp-bg-sunken)] transition-all" onClick={() => navigate(`/sales/invoice/${invoice._id}`)}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-black text-indigo-400 uppercase tracking-tight">{invoice.invoiceNo}</div>
                        <div className="text-[10px] text-muted font-bold uppercase tracking-widest mt-0.5 text-xs">
                          {isCustomer(invoice.customer) ? invoice.customer.name : "Walk-in Customer"}
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusColor(invoice.paymentStatus)}`}>
                        {invoice.paymentStatus}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-3 text-[10px] text-muted font-mono tracking-tighter">
                      <span>{new Date(invoice.createdAt).toLocaleDateString()}</span>
                      <div className="text-xs font-black text-muted">
                        ₹{invoice.totalAmount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-4 sm:px-6 py-4 border-t border-default flex flex-col sm:flex-row items-center justify-between gap-4 bg-[var(--erp-bg-sunken)]">
                  <div className="text-[10px] font-black text-secondary uppercase tracking-widest">
                    Showing <span className="text-muted font-black">{startIndex + 1}</span> to <span className="text-muted font-black">{Math.min(endIndex, filteredInvoices.length)}</span> of <span className="text-muted font-black">{filteredInvoices.length}</span> results
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 erp-card rounded-lg text-[10px] font-black uppercase tracking-widest text-muted hover:text-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      Previous
                    </button>
                    <div className="flex gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`w-8 h-8 flex items-center justify-center rounded-lg text-[10px] font-black tracking-widest transition-all ${currentPage === page
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                                : "text-muted hover:bg-[var(--erp-bg-sunken)]"
                                }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                          return <span key={page} className="px-1 text-neutral-400">...</span>;
                        }
                        return null;
                      })}
                    </div>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 erp-card rounded-lg text-[10px] font-black uppercase tracking-widest text-muted hover:text-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Delete Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in duration-300">
            <div className="bg-white dark:bg-[var(--erp-card)] rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-default dark:border-default animate-scale-in">
              <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mb-4 mx-auto">
                <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 text-center mb-2">Delete Invoice?</h3>
              <p className="text-sm text-neutral-500 text-center mb-6">
                Are you sure you want to delete this invoice? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 bg-white dark:bg-[var(--erp-card)] border border-default dark:border-default rounded-lg text-neutral-700 dark:text-neutral-300 font-medium hover:bg-[var(--erp-bg-sunken)] dark:hover:bg-neutral-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700 transition-all shadow-md shadow-rose-600/20"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <CustomerSelectionModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onSelect={(customer: any) => {
          setSelectedCustomer(customer);
          setShowCustomerModal(false);
        }}
      />
              </div>

    </Layout>
  );
};

export default SalesInvoice;


