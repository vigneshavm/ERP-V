import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllSalesInvoices,
  getSalesInvoiceSummary,
  deleteSalesInvoice,
  reset,
} from "../../../redux/slices/salesInvoiceSlice";
import Layout from "../../../components/Layout";
import PageHeader from "../../../components/PageHeader";
import FormInput from "../../../components/FormInput";
import CustomerSelectionModal from "../../../components/CustomerSelectionModal";

const SalesInvoice = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {
    invoices = [],
    summary = null,
    isLoading,
    isError,
    message,
  } = useSelector((state) => state.salesInvoice);

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
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
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

  const handleDelete = async (id) => {
    await dispatch(deleteSalesInvoice(id));
    setDeleteConfirm(null);
    dispatch(getAllSalesInvoices());
  };

  const filteredInvoices = Array.isArray(invoices)
    ? invoices.filter((invoice) => {
      const matchesSearch =
        invoice.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.customer?.name || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || invoice.paymentStatus === statusFilter;
      const matchesCustomer =
        !selectedCustomer || invoice.customer?._id === selectedCustomer._id;
      return matchesSearch && matchesStatus && matchesCustomer;
    })
    : [];

  // Pagination calculations
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);

  const getStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "partial":
        return "bg-yellow-100 text-yellow-800";
      case "unpaid":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get metrics from backend summary (source of truth)
  const totalInvoices = summary?.totalInvoices || 0;
  const totalPaid = summary?.totalPaid || 0;
  const totalDue = summary?.outstandingDues || 0;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto animate-fade-in pb-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Sales Invoices</h1>
            <p className="text-sm text-slate-500 mt-1">Manage and track your customer invoicing</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/sales/invoice/create')}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition-all font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Invoice</span>
            </button>
          </div>
        </div>

        {/* Error Feedback */}
        {isError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-red-700 text-sm font-medium">{message}</p>
          </div>
        )}

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Invoices */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Invoices</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1 group-hover:text-indigo-600 transition-colors">{totalInvoices}</h3>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
            </div>
            <div className="mt-4 h-1 w-full bg-slate-50 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full w-full"></div>
            </div>
          </div>

          {/* Amount Collected */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Amount Collected</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1 group-hover:text-emerald-600 transition-colors">₹{totalPaid.toFixed(0)}</h3>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
            </div>
            <div className="mt-4 h-1 w-full bg-slate-50 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${totalInvoices > 0 ? (totalPaid / (totalPaid + totalDue)) * 100 : 0}%` }}></div>
            </div>
          </div>

          {/* Outstanding Dues */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Outstanding Dues</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1 group-hover:text-rose-600 transition-colors">₹{totalDue.toFixed(0)}</h3>
              </div>
              <div className="p-2 bg-rose-50 rounded-lg text-rose-600 group-hover:bg-rose-100 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            </div>
            <div className="mt-4 text-xs text-rose-600 font-medium bg-rose-50 inline-block px-2 py-1 rounded">
              Action needed
            </div>
          </div>
        </div>

        {/* Filter Island */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
            {/* Search */}
            <div className="relative w-full lg:max-w-md group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <input
                type="text"
                placeholder="Search invoice number, customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:placeholder-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-shadow shadow-sm"
              />
            </div>

            {/* Filters Group */}
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 border border-slate-300 bg-white text-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-sm"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="unpaid">Unpaid</option>
              </select>

              {/* Customer Filter Toggle */}
              {selectedCustomer ? (
                <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-2 rounded-lg text-sm font-medium animate-fade-in">
                  <span className="truncate max-w-[150px]">{selectedCustomer.name}</span>
                  <button onClick={() => setSelectedCustomer(null)} className="hover:text-indigo-900">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowCustomerModal(true)}
                  className="px-4 py-2.5 border border-slate-300 bg-white text-slate-600 rounded-lg hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-300 transition-colors shadow-sm text-sm font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                  Filter Customer
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
              <p className="text-slate-500 font-medium">Loading invoices...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="bg-slate-100 p-4 rounded-full mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <h3 className="text-lg font-bold text-slate-800">No invoices found</h3>
              <p className="text-slate-500 mt-1 max-w-sm">No sales invoices match your current search or filter criteria.</p>
              <button
                onClick={() => { setSearchTerm(''); setStatusFilter('all'); setSelectedCustomer(null); }}
                className="mt-4 px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-200">
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice No</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Total</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Paid</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedInvoices.map((invoice) => (
                      <tr key={invoice._id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4">
                          <span className="font-bold text-indigo-600 hover:underline cursor-pointer" onClick={() => navigate(`/sales/invoice/${invoice._id}`)}>
                            {invoice.invoiceNo}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-slate-700">{new Date(invoice.createdAt).toLocaleDateString("en-IN")}</div>
                          <div className="text-xs text-slate-400">{new Date(invoice.createdAt).toLocaleTimeString()}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">{invoice.customer?.name || "Walk-in"}</div>
                          {invoice.customer?.phone && <div className="text-xs text-slate-500">{invoice.customer.phone}</div>}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-slate-800">
                          ₹{invoice.totalAmount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-emerald-600">
                          ₹{invoice.paidAmount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide
                                ${invoice.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                              invoice.paymentStatus === 'partial' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                'bg-red-100 text-red-800 border border-red-200'}`}>
                            {invoice.paymentStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => navigate(`/sales/invoice/${invoice._id}`)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="View Information"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(invoice._id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Information"
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
              <div className="md:hidden divide-y divide-slate-100">
                {paginatedInvoices.map((invoice) => (
                  <div key={invoice._id} className="p-4 active:bg-slate-50 transition-colors" onClick={() => navigate(`/sales/invoice/${invoice._id}`)}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-bold text-indigo-600 text-sm">{invoice.invoiceNo}</div>
                        <div className="text-sm font-medium text-slate-800 mt-1">{invoice.customer?.name || "Walk-in"}</div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide
                                ${invoice.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                          invoice.paymentStatus === 'partial' ? 'bg-amber-100 text-amber-800' :
                            'bg-red-100 text-red-800'}`}>
                        {invoice.paymentStatus}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-3 text-sm">
                      <span className="text-slate-500">{new Date(invoice.createdAt).toLocaleDateString()}</span>
                      <div className="font-bold text-slate-800">
                        ₹{invoice.totalAmount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
                  <div className="text-sm text-slate-500">
                    Showing <span className="font-medium text-slate-700">{startIndex + 1}</span> to <span className="font-medium text-slate-700">{Math.min(endIndex, filteredInvoices.length)}</span> of <span className="font-medium text-slate-700">{filteredInvoices.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
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
                              className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${currentPage === page
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "bg-white border border-slate-300 text-slate-600 hover:bg-slate-50"
                                }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                          return <span key={page} className="px-1 text-slate-400">...</span>;
                        }
                        return null;
                      })}
                    </div>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
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
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 border border-slate-100 animate-scale-in">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h3 className="text-lg font-bold text-slate-800 text-center mb-2">Delete Invoice?</h3>
              <p className="text-sm text-slate-500 text-center mb-6">
                Are you sure you want to delete this invoice? This action cannot be undone and may affect inventory stock.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 shadow-sm transition-colors"
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
        onSelect={(customer) => {
          setSelectedCustomer(customer);
          setShowCustomerModal(false);
        }}
      />
    </Layout>
  );
};

export default SalesInvoice;
