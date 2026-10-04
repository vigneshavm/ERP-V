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
import CustomerSelectionModal from "@/components/shared/Modals/CustomerSelectionModal";
import { Button, Input, Select, Card } from "@/components/shared";
import { AppDispatch, RootState } from "@/redux/store";
import { Customer, Invoice } from "@/types/sales";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Trash2,
  Eye,
  CheckCircle,
  AlertCircle,
  XCircle,
  AlertTriangle
} from "lucide-react";
import { formatDate } from '../../../utils/helpers';
import StatusBadge from '@/components/shared/UI/StatusBadge';

const SalesInvoice = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const {
    invoices = [],
    summary = null,
    pagination = null,
    isLoading,
    isError,
    message,
  } = useSelector((state: RootState) => state.salesInvoice);



  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Debounce free-text search so every keystroke doesn't hit the server.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Back to page 1 whenever a filter (not the page itself) changes; adjusted during render
  // (tracking the previous filters) instead of setState in an effect.
  const [prevFilters, setPrevFilters] = useState({ debouncedSearch, statusFilter, selectedCustomer });
  if (prevFilters.debouncedSearch !== debouncedSearch || prevFilters.statusFilter !== statusFilter || prevFilters.selectedCustomer !== selectedCustomer) {
    setPrevFilters({ debouncedSearch, statusFilter, selectedCustomer });
    setCurrentPage(1);
  }

  const fetchInvoices = () => dispatch(getAllSalesInvoices({
    search: debouncedSearch || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    customerId: selectedCustomer?._id,
    page: currentPage,
    pageSize: itemsPerPage,
  }));

  useEffect(() => {
    dispatch(getSalesInvoiceSummary());
    return () => {
      dispatch(reset());
    };
  }, [dispatch]);

  // Server-side search/filter/pagination -- the shop's Textilesoft-backed invoice set can run
  // into the hundreds of thousands, so only the current page (matching current filters) is loaded.
  useEffect(() => {
    fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, statusFilter, selectedCustomer, currentPage, dispatch]);

  const handleDelete = async (id: string) => {
    await dispatch(deleteSalesInvoice(id));
    setDeleteConfirm(null);
    fetchInvoices();
    dispatch(getSalesInvoiceSummary());
  };

  const isCustomer = (cust: any): cust is Customer => {
    return cust && typeof cust === 'object' && 'name' in cust;
  };

  // Filtering/search/status/customer are already applied server-side; this page just renders
  // whichever page of results came back.
  const paginatedInvoices = Array.isArray(invoices) ? (invoices as Invoice[]) : [];
  const totalResults = pagination?.total ?? paginatedInvoices.length;
  const totalPages = pagination?.totalPages ?? 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + paginatedInvoices.length;


  // Get metrics from backend summary (source of truth)
  const totalInvoices = summary?.totalInvoices || 0;
  const totalPaid = summary?.totalPaid || 0;
  const totalDue = Number.isFinite(summary?.outstandingDues) ? Number(summary.outstandingDues) : undefined;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto animate-fade-in pb-12 bg-app min-h-screen">
        <PageHeader
          title="Sales Invoices"
          description="Manage and track your customer invoicing"
          actions={
            <Button
              variant="primary"
              size="md"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => navigate('/sales/new')}
            >
              Create Invoice
            </Button>
          }
        />

        {/* Error Feedback */}
        {isError && (
          <div className="mb-6 p-4 bg-danger/10 border border-danger/30 rounded-xl flex items-center gap-3 animate-slide-down">
            <AlertTriangle className="w-5 h-5 text-danger" />
            <p className="text-danger font-black text-sm font-bold italic">{message}</p>
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
            progress={totalDue !== undefined && totalInvoices > 0 ? (totalPaid / (totalPaid + totalDue)) * 100 : undefined}
          />
          <MetricCard
            title="Outstanding Dues"
            value={totalDue === undefined ? "Not available" : `₹${totalDue.toLocaleString()}`}
            icon={AlertCircle}
            color="rose"
            variant="default"
            subtext={totalDue === undefined ? "Customer dues are not included in SQL bill summary" : "Action Required"}
            trend={totalDue === undefined ? undefined : "down"}
          />
        </div>

        {/* Advanced Filters */}
        <Card variant="default" size="lg">
          <Card.Body className="flex flex-col gap-4 p-4">
            <div className="flex flex-wrap gap-4 items-end">
              {/* Search */}
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs font-bold text-muted uppercase mb-1 block">Search</label>
                <Input
                  type="text"
                  placeholder="Search invoice number, customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={<Search className="w-4 h-4" />}
                />
              </div>

              {/* Status Filter */}
              <div className="w-48">
                <label className="text-xs font-bold text-muted uppercase mb-1 block">Status</label>
                <Select
                  value={statusFilter}
                  onChange={(value) => setStatusFilter(typeof value === 'string' ? value : value[0])}
                  options={[
                    { label: 'All Status', value: 'all' },
                    { label: 'Paid', value: 'paid' },
                    { label: 'Partial', value: 'partial' },
                    { label: 'Unpaid', value: 'unpaid' }
                  ]}
                  size="md"
                />
              </div>

              {/* Customer Filter */}
              <div className="w-auto">
                <label className="text-xs font-bold text-muted uppercase mb-1 block">Customer</label>
                {selectedCustomer ? (
                  <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-3 py-2 rounded-lg text-sm font-medium animate-fade-in h-[42px]">
                    <span className="truncate max-w-[150px]">{selectedCustomer.name}</span>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<XCircle className="w-4 h-4" />}
                      onClick={() => setSelectedCustomer(null)}
                    />
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    size="md"
                    icon={<Filter className="w-4 h-4" />}
                    onClick={() => setShowCustomerModal(true)}
                  >
                    Filter Customer
                  </Button>
                )}
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Data Table */}
        <Card variant="default" size="lg" className="overflow-hidden flex flex-col shadow-sm">
          <Card.Body className="p-0">
            {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
              <p className="text-muted text-sm font-medium">Loading invoices...</p>
            </div>
          ) : paginatedInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
              <div className="bg-surface/30 p-4 rounded-full mb-4">
                <Search className="w-8 h-8 text-secondary opacity-50" />
              </div>
              <h3 className="text-lg font-bold text-main">No Invoices Found</h3>
              <p className="text-muted mt-1 max-w-sm text-sm">No sales invoices match your current search or filter criteria.</p>
              <Button
                variant="secondary"
                size="md"
                onClick={() => { setSearchTerm(''); setStatusFilter('all'); setSelectedCustomer(null); }}
                className="mt-6"
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface/40 border-b border-default/30">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider">Invoice #</th>
                      <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider text-right">Amount</th>
                      <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider text-right">Paid</th>
                      <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider text-center">Status</th>
                      <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-default/30">
                    {paginatedInvoices.map((invoice) => (
                      <tr key={invoice._id} className="hover:bg-surface/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-primary font-bold cursor-pointer hover:underline" onClick={() => navigate(`/sales/invoice/${invoice._id}`)}>
                          {invoice.invoiceNo}
                        </td>
                        <td className="px-6 py-4 text-secondary">
                          <div>{new Date(invoice.createdAt).toLocaleDateString("en-IN")}</div>
                          <div className="text-xs text-muted mt-0.5">{new Date(invoice.createdAt).toLocaleTimeString()}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-main">
                            {isCustomer(invoice.customer) ? invoice.customer.name : "Walk-in Customer"}
                          </div>
                          {(isCustomer(invoice.customer) && invoice.customer.phone) && (
                            <div className="text-xs text-muted mt-0.5">{invoice.customer.phone}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-main">
                          ₹{invoice.totalAmount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-success">
                          ₹{invoice.paidAmount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <StatusBadge status={invoice.paymentStatus} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<Eye className="w-4 h-4" />}
                              onClick={() => navigate(`/sales/invoice/${invoice._id}`)}
                              title="View Invoice"
                            />
                            <Button
                              variant="danger"
                              size="sm"
                              icon={<Trash2 className="w-4 h-4" />}
                              onClick={() => setDeleteConfirm(invoice._id || null)}
                              title={String(invoice._id || '').startsWith('sql:') ? 'Deletion unavailable for SQL bills' : 'Delete Invoice'}
                              disabled={String(invoice._id || '').startsWith('sql:')}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Stack */}
              <div className="md:hidden divide-y divide-default/30">
                {paginatedInvoices.map((invoice) => (
                  <div key={invoice._id} className="p-4 active:bg-surface/40 transition-all" onClick={() => navigate(`/sales/invoice/${invoice._id}`)}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-bold text-main">{invoice.invoiceNo}</div>
                        <div className="text-sm text-muted mt-0.5">
                          {isCustomer(invoice.customer) ? invoice.customer.name : "Walk-in Customer"}
                        </div>
                      </div>
                      <StatusBadge status={invoice.paymentStatus} />
                    </div>
                    <div className="flex justify-between items-center mt-3 text-xs text-muted ">
                      <span>{formatDate(invoice.createdAt)}</span>
                      <div className="text-sm font-bold text-main">
                        ₹{invoice.totalAmount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-default/30 flex items-center justify-between bg-surface/40">
                  <div className="text-xs text-muted ">
                    Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(endIndex, totalResults)}</span> of <span className="font-medium">{totalResults}</span> results
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                          return (
                            <Button
                              key={page}
                              variant={currentPage === page ? "primary" : "secondary"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </Button>
                          );
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                          return <span key={page} className="px-1 text-muted">...</span>;
                        }
                        return null;
                      })}
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
          </Card.Body>
        </Card>

        {/* Delete Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in duration-300">
            <Card variant="default" size="md" className="max-w-sm w-full animate-scale-in">
              <Card.Body className="text-center space-y-4">
                <div className="w-12 h-12 bg-danger/10 dark:bg-danger/10 rounded-full flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-6 h-6 text-danger" />
                </div>
                <h3 className="text-lg font-bold text-main">Delete Invoice?</h3>
                <p className="text-sm text-muted">
                  Are you sure you want to delete this invoice? This action cannot be undone.
                </p>
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    size="md"
                    onClick={() => handleDelete(deleteConfirm)}
                    className="flex-1"
                  >
                    Delete
                  </Button>
                </div>
              </Card.Body>
            </Card>
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

