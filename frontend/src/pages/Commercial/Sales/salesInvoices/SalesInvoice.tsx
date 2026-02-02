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
import FormInput from "@/components/core/Form/Input";
import CustomerSelectionModal from "@/components/shared/Modals/CustomerSelectionModal";
import { AppDispatch, RootState } from "@/redux/store";
import { Customer, Invoice } from "@/types/sales";

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

  const [formData, setFormData] = useState({
    invoiceNo: "INV-" + Date.now(),
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    customer: null,
    items: [{ name: "", quantity: 1, rate: 0, tax: 18, amount: 0 }],
    discount: 0,
    shippingCharges: 0,
    notes: "",
    termsAndConditions: "",
  });

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
        return "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30";
      case "partial":
        return "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30";
      case "unpaid":
        return "bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30";
      default:
        return "bg-surface text-secondary border border-default";
    }
  };

  // Get metrics from backend summary (source of truth)
  const totalInvoices = summary?.totalInvoices || 0;
  const totalPaid = summary?.totalPaid || 0;
  const totalDue = summary?.outstandingDues || 0;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto animate-fade-in pb-12 bg-app min-h-screen">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-main tracking-tight uppercase">Sales Invoices</h1>
            <p className="text-sm text-secondary mt-1 font-medium italic">Manage and track your customer invoicing</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/sales/invoice/create')}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all font-black uppercase tracking-widest text-xs btn-interactive"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Invoice</span>
            </button>
          </div>
        </div>

        {/* Error Feedback */}
        {isError && (
          <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/20 rounded-xl flex items-center gap-3 animate-slide-down">
            <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-rose-700 dark:text-rose-400 text-sm font-bold italic">{message}</p>
          </div>
        )}

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Invoices */}
          <div className="bg-card p-6 rounded-2xl shadow-sm border border-default flex flex-col justify-between hover:shadow-md transition-all group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Total Invoices</p>
                <h3 className="text-3xl font-black text-main mt-2 tracking-tight group-hover:text-primary transition-colors italic">{totalInvoices}</h3>
              </div>
              <div className="p-3 bg-primary-soft rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
            </div>
            <div className="mt-6 h-1 w-full bg-surface rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full w-full"></div>
            </div>
          </div>

          {/* Amount Collected */}
          <div className="bg-card p-6 rounded-2xl shadow-sm border border-default flex flex-col justify-between hover:shadow-md transition-all group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Amount Collected</p>
                <h3 className="text-3xl font-black text-main mt-2 tracking-tight group-hover:text-emerald-600 transition-colors italic">₹{totalPaid.toLocaleString()}</h3>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-inner">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
            </div>
            <div className="mt-6 h-1 w-full bg-surface rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${totalInvoices > 0 ? (totalPaid / (totalPaid + totalDue)) * 100 : 0}%` }}></div>
            </div>
          </div>

          {/* Outstanding Dues */}
          <div className="bg-card p-6 rounded-2xl shadow-sm border border-default flex flex-col justify-between hover:shadow-md transition-all group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Outstanding Dues</p>
                <h3 className="text-3xl font-black text-main mt-2 tracking-tight group-hover:text-rose-600 transition-colors italic">₹{totalDue.toLocaleString()}</h3>
              </div>
              <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-all shadow-inner">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            </div>
            <div className="mt-6 text-[10px] text-rose-600 font-black bg-rose-50 dark:bg-rose-900/20 inline-block px-3 py-1.5 rounded-lg uppercase tracking-wider border border-rose-100 dark:border-rose-900/30">
              Action Required
            </div>
          </div>
        </div>

        {/* Filter Island */}
        <div className="bg-card rounded-[2rem] shadow-sm border border-default p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-6 justify-between items-center">
            {/* Search */}
            <div className="relative w-full lg:max-w-xl group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-muted group-focus-within:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <input
                type="text"
                placeholder="Search invoice number, customer..."
                value={searchTerm}
                onChange={(e: any) => setSearchTerm(e.target.value)}
                className="block w-full pl-12 pr-4 py-3.5 bg-input border border-default rounded-2xl text-sm font-bold text-main placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-inner"
              />
            </div>

            {/* Filters Group */}
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="px-6 py-3.5 bg-surface border border-default text-main rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary shadow-sm text-xs font-black uppercase tracking-widest outline-none cursor-pointer hover:border-primary transition-all"
              >
                <option value="all">Analysis: All Status</option>
                <option value="paid">Filter: Paid</option>
                <option value="partial">Filter: Partial</option>
                <option value="unpaid">Filter: Unpaid</option>
              </select>

              {/* Customer Filter Toggle */}
              {selectedCustomer ? (
                <div className="flex items-center gap-3 bg-primary-soft border border-primary/20 text-primary px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest animate-fade-in shadow-sm">
                  <span className="truncate max-w-[150px] italic">{selectedCustomer.name}</span>
                  <button onClick={() => setSelectedCustomer(null)} className="hover:text-primary-hover transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowCustomerModal(true)}
                  className="px-6 py-3.5 bg-card border border-default text-main rounded-2xl hover:bg-surface hover:text-primary hover:border-primary transition-all shadow-sm text-xs font-black uppercase tracking-widest flex items-center gap-3 btn-interactive"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                  Filter Customer
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-card rounded-[2.5rem] shadow-xl border border-default overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mb-6"></div>
              <p className="text-muted font-black uppercase tracking-[0.25em] text-xs">Accessing Ledger...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 px-4 text-center group">
              <div className="bg-surface p-6 rounded-full mb-6 border border-default group-hover:scale-110 transition-transform">
                <svg className="w-12 h-12 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <h3 className="text-xl font-black text-main italic">Empty Ledger Result</h3>
              <p className="text-secondary mt-2 max-w-sm font-medium italic opacity-70">No sales invoices match your current search or filter criteria in the system node.</p>
              <button
                onClick={() => { setSearchTerm(''); setStatusFilter('all'); setSelectedCustomer(null); }}
                className="mt-8 px-8 py-3 bg-card border border-default text-main font-black uppercase tracking-widest text-xs rounded-xl hover:bg-surface transition-all shadow-sm active:scale-95 btn-interactive"
              >
                Reset System State
              </button>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse tabular-nums">
                  <thead>
                    <tr className="bg-surface border-b border-default">
                      <th className="px-8 py-5 text-[10px] font-black text-muted uppercase tracking-[0.25em]">Invoice Master</th>
                      <th className="px-8 py-5 text-[10px] font-black text-muted uppercase tracking-[0.25em]">Temporal Authority</th>
                      <th className="px-8 py-5 text-[10px] font-black text-muted uppercase tracking-[0.25em]">Customer Node</th>
                      <th className="px-8 py-5 text-[10px] font-black text-muted uppercase tracking-[0.25em] text-right">Fiscal Total</th>
                      <th className="px-8 py-5 text-[10px] font-black text-muted uppercase tracking-[0.25em] text-right">Settled Amount</th>
                      <th className="px-8 py-5 text-[10px] font-black text-muted uppercase tracking-[0.25em] text-center">Protocol</th>
                      <th className="px-8 py-5 text-[10px] font-black text-muted uppercase tracking-[0.25em] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-default">
                    {paginatedInvoices.map((invoice) => (
                      <tr key={invoice._id} className="hover:bg-surface transition-all group cursor-default">
                        <td className="px-8 py-6">
                          <span className="font-black text-primary hover:underline cursor-pointer tracking-tight text-base" onClick={() => navigate(`/sales/invoice/${invoice._id}`)}>
                            {invoice.invoiceNo}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="text-sm font-bold text-main italic tracking-tight">{new Date(invoice.createdAt).toLocaleDateString("en-IN")}</div>
                          <div className="text-[10px] text-muted font-black uppercase tracking-widest mt-1 opacity-70">{new Date(invoice.createdAt).toLocaleTimeString()}</div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="font-black text-main uppercase tracking-tighter text-base group-hover:text-primary transition-colors">
                            {isCustomer(invoice.customer) ? invoice.customer.name : "Walk-in Master"}
                          </div>
                          {(isCustomer(invoice.customer) && invoice.customer.phone) && (
                            <div className="text-[10px] text-muted font-black tracking-[0.15em] mt-1 italic">{invoice.customer.phone}</div>
                          )}
                        </td>
                        <td className="px-8 py-6 text-right font-black text-main text-lg italic tracking-tight">
                          ₹{invoice.totalAmount.toLocaleString()}
                        </td>
                        <td className="px-8 py-6 text-right font-black text-emerald-600 text-lg italic tracking-tight">
                          ₹{invoice.paidAmount.toLocaleString()}
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className={`inline-flex items-center px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm
                                ${getStatusColor(invoice.paymentStatus)}`}>
                            {invoice.paymentStatus}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                            <button
                              onClick={() => navigate(`/sales/invoice/${invoice._id}`)}
                              className="p-3 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl transition-all shadow-sm"
                              title="Audit Information"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(invoice._id || null)}
                              className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all shadow-sm"
                              title="Purge Entry"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Stack */}
              <div className="md:hidden divide-y divide-default">
                {paginatedInvoices.map((invoice) => (
                  <div key={invoice._id} className="p-6 active:bg-surface transition-all" onClick={() => navigate(`/sales/invoice/${invoice._id}`)}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-black text-primary text-base italic tracking-tight">{invoice.invoiceNo}</div>
                        <div className="text-sm font-black text-main uppercase tracking-tighter mt-1">
                          {isCustomer(invoice.customer) ? invoice.customer.name : "Walk-in Master"}
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] shadow-sm border
                                ${getStatusColor(invoice.paymentStatus)}`}>
                        {invoice.paymentStatus}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-5 text-[10px] font-black text-muted uppercase tracking-widest">
                      <span className="italic">{new Date(invoice.createdAt).toLocaleDateString()}</span>
                      <div className="text-lg text-main italic tracking-tight">
                        ₹{invoice.totalAmount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-8 py-6 border-t border-default bg-surface/30 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="text-[10px] font-black text-muted uppercase tracking-[0.25em]">
                    Displaying <span className="text-main italic">{startIndex + 1}</span> - <span className="text-main italic">{Math.min(endIndex, filteredInvoices.length)}</span> of <span className="text-primary">{filteredInvoices.length}</span> Invoices
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-5 py-2.5 bg-card border border-default rounded-xl text-xs font-black uppercase tracking-widest text-muted hover:text-primary hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm btn-interactive"
                    >
                      Previous
                    </button>
                    <div className="flex gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`w-10 h-10 flex items-center justify-center rounded-xl text-xs font-black transition-all ${currentPage === page
                                ? "bg-primary text-white shadow-xl shadow-primary/20 scale-110"
                                : "bg-card border border-default text-muted hover:border-primary hover:text-primary"
                                }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                          return <span key={page} className="px-1 text-muted opacity-50 font-black">...</span>;
                        }
                        return null;
                      })}
                    </div>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-5 py-2.5 bg-card border border-default rounded-xl text-xs font-black uppercase tracking-widest text-muted hover:text-primary hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm btn-interactive"
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in duration-300">
            <div className="bg-card rounded-[2.5rem] shadow-2xl max-w-md w-full p-10 border border-default animate-scale-in">
              <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mb-8 mx-auto border border-rose-100 dark:border-rose-900/30">
                <svg className="w-10 h-10 text-rose-600 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h3 className="text-2xl font-black text-main text-center mb-3 italic tracking-tight">Purge Invoice Record?</h3>
              <p className="text-sm text-secondary text-center mb-10 font-medium italic opacity-80 leading-relaxed">
                Are you sure you want to delete this invoice? This action cannot be undone and may affect inventory stock levels and historical reports.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-6 py-4 bg-surface border border-default rounded-2xl text-main font-black uppercase tracking-widest text-xs hover:bg-card transition-all btn-interactive"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 px-6 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-rose-700 shadow-xl shadow-rose-600/30 transition-all btn-interactive"
                >
                  Confirm Purge
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

