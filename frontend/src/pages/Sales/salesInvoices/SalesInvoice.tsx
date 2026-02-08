import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllSalesInvoices,
  getSalesInvoiceSummary,
  deleteSalesInvoice,
  reset,
} from "@/redux/slices/salesInvoiceSlice";
import Layout from "@/components/shared/Layout/Layout";
import PageHeader from "@/components/shared/Layout/PageHeader";
import MetricCard from "@/components/shared/UI/MetricCard";
import FormInput from "@/components/core/Form/Input";
import CustomerSelectionModal from "@/components/shared/Modals/CustomerSelectionModal";
import { AppDispatch, RootState } from "@/redux/store";
import { Customer, Invoice } from "@/types/sales";
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
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
      case "partial":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800";
      case "unpaid":
        return "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800";
      default:
        return "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700";
    }
  };

  // Get metrics from backend summary (source of truth)
  const totalInvoices = summary?.totalInvoices || 0;
  const totalPaid = summary?.totalPaid || 0;
  const totalDue = summary?.outstandingDues || 0;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto animate-fade-in pb-12 bg-app min-h-screen">
        <PageHeader
          title="Sales Invoices"
          description="Manage and track your customer invoicing"
          actions={
            <button
              onClick={() => navigate('/sales/new')}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all font-black uppercase tracking-widest text-xs btn-interactive"
            >
              <Plus className="w-4 h-4" />
              <span>Create Invoice</span>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard
            title="Total Invoices"
            value={totalInvoices}
            icon={FileText}
            color="primary"
            variant="default"
          />
          <MetricCard
            title="Amount Collected"
            value={`₹${totalPaid.toLocaleString()}`}
            icon={CheckCircle}
            color="emerald"
            variant="default"
            progress={totalInvoices > 0 ? (totalPaid / (totalPaid + totalDue)) * 100 : 0}
          />
          <MetricCard
            title="Outstanding Dues"
            value={`₹${totalDue.toLocaleString()}`}
            icon={AlertCircle}
            color="rose"
            variant="default"
            subtext="Action Required"
            trend="down"
          />
        </div>

        {/* Advanced Filters */}
        <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 flex flex-col gap-4 mb-8">
          <div className="flex flex-wrap gap-4 items-end">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">Search</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search invoice number, customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="w-48">
              <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>

            {/* Customer Filter */}
            <div className="w-auto">
              <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">Customer</label>
              {selectedCustomer ? (
                <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-3 py-2 rounded-lg text-sm font-medium animate-fade-in h-[38px]">
                  <span className="truncate max-w-[150px]">{selectedCustomer.name}</span>
                  <button onClick={() => setSelectedCustomer(null)} className="hover:text-primary-hover transition-colors">
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowCustomerModal(true)}
                  className="px-4 py-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-all text-sm font-medium flex items-center gap-2 h-[38px]"
                >
                  <Filter className="w-4 h-4" />
                  Filter Customer
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden flex flex-col shadow-sm">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
              <p className="text-neutral-500 text-sm font-medium">Loading invoices...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
              <div className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-full mb-4">
                <Search className="w-8 h-8 text-neutral-400" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">No Invoices Found</h3>
              <p className="text-neutral-500 mt-1 max-w-sm text-sm">No sales invoices match your current search or filter criteria.</p>
              <button
                onClick={() => { setSearchTerm(''); setStatusFilter('all'); setSelectedCustomer(null); }}
                className="mt-6 px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-medium rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-all shadow-sm"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Invoice #</th>
                      <th className="px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-right">Amount</th>
                      <th className="px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-right">Paid</th>
                      <th className="px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-center">Status</th>
                      <th className="px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                    {paginatedInvoices.map((invoice) => (
                      <tr key={invoice._id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-primary font-bold cursor-pointer hover:underline" onClick={() => navigate(`/sales/invoice/${invoice._id}`)}>
                          {invoice.invoiceNo}
                        </td>
                        <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400">
                          <div>{new Date(invoice.createdAt).toLocaleDateString("en-IN")}</div>
                          <div className="text-xs text-neutral-400 mt-0.5">{new Date(invoice.createdAt).toLocaleTimeString()}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-neutral-900 dark:text-neutral-100">
                            {isCustomer(invoice.customer) ? invoice.customer.name : "Walk-in Customer"}
                          </div>
                          {(isCustomer(invoice.customer) && invoice.customer.phone) && (
                            <div className="text-xs text-neutral-500 mt-0.5">{invoice.customer.phone}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-neutral-900 dark:text-neutral-100">
                          ₹{invoice.totalAmount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-emerald-600">
                          ₹{invoice.paidAmount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                                ${getStatusColor(invoice.paymentStatus)}`}>
                            {invoice.paymentStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => navigate(`/sales/invoice/${invoice._id}`)}
                              className="p-2 text-neutral-500 hover:text-primary hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-all"
                              title="View Invoice"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(invoice._id || null)}
                              className="p-2 text-neutral-500 hover:text-rose-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-all"
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
              <div className="md:hidden divide-y divide-neutral-200 dark:divide-neutral-700">
                {paginatedInvoices.map((invoice) => (
                  <div key={invoice._id} className="p-4 active:bg-neutral-50 dark:active:bg-neutral-800 transition-all" onClick={() => navigate(`/sales/invoice/${invoice._id}`)}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-bold text-neutral-900 dark:text-neutral-100">{invoice.invoiceNo}</div>
                        <div className="text-sm text-neutral-500 mt-0.5">
                          {isCustomer(invoice.customer) ? invoice.customer.name : "Walk-in Customer"}
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                                ${getStatusColor(invoice.paymentStatus)}`}>
                        {invoice.paymentStatus}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-3 text-xs text-neutral-500">
                      <span>{new Date(invoice.createdAt).toLocaleDateString()}</span>
                      <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                        ₹{invoice.totalAmount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between bg-neutral-50 dark:bg-neutral-900">
                  <div className="text-xs text-neutral-500">
                    Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(endIndex, filteredInvoices.length)}</span> of <span className="font-medium">{filteredInvoices.length}</span> results
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                              className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-all ${currentPage === page
                                ? "bg-primary text-white"
                                : "text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800"
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
                      className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
            <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-neutral-200 dark:border-neutral-700 animate-scale-in">
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
                  className="flex-1 px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-all"
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
    </Layout>
  );
};

export default SalesInvoice;

