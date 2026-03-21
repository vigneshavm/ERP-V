import React from 'react';
import { Plus, FileText, Sparkles, Filter, ChevronRight, Calculator } from 'lucide-react';
import Layout from "@/shared/ui/Layout/Layout";
import PageShell from "@/shared/ui/Layout/PageShell";
import BillForm from "./BillForm";
import BillsStats from '../Components/BillsStats';
import BillsFilters from '../Components/BillsFilters';
import BillsTable from '../Components/BillsTable';
import DeleteBillModal from '../Components/DeleteBillModal';
import PaymentModal from "@/shared/ui/Modals/PaymentModal";
import { useBills } from '../hooks/useBills';

const Bills: React.FC = () => {
    const {
        filteredBills,
        isLoading,
        searchTerm,
        setSearchTerm,
        statusFilter,
        setStatusFilter,
        showForm,
        setShowForm,
        editingBill,
        setEditingBill,
        deleteConfirm,
        setDeleteConfirm,
        paymentModal,
        setPaymentModal,
        handleMarkAsPaid,
        handlePaymentSubmit,
        handleSaveBill,
        handleEdit,
        handleDelete,
        totals
    } = useBills();

    return (
        <Layout>
            <PageShell className="bg-app flex-1 flex flex-col min-h-0 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Cinematic Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-md border border-blue-500/20">Fiscal Protocol</span>
                            <span className="text-neutral-300 dark:text-neutral-700">/</span>
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Inbound Liability Matrix</span>
                        </div>
                        <h2 className="text-4xl font-black text-neutral-900 dark:text-main tracking-tight leading-none flex items-center gap-3">
                            Supplier Bills <FileText className="w-8 h-8 text-blue-500" />
                        </h2>
                        <p className="text-sm text-neutral-500 font-medium italic mt-3">
                            Monitor and liquidate inbound fiscal obligations with strategic precision.
                        </p>
                    </div>
                    
                    {!showForm && (
                        <button
                            onClick={() => { setEditingBill(null); setShowForm(true); }}
                            className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                        >
                            <Plus className="w-5 h-5" /> 
                            <span>Register Bill</span>
                        </button>
                    )}
                </div>

                {showForm ? (
                    <div className="erp-card rounded-[3rem] p-4 shadow-sm border-none overflow-hidden relative group">
                        <BillForm
                            onBack={() => setShowForm(false)}
                            onSave={handleSaveBill}
                            initialData={editingBill as any}
                        />
                    </div>
                ) : (
                    <div className="flex flex-col gap-8">
                        {/* High-Fidelity Stats Grid */}
                        <BillsStats
                            billsCount={filteredBills.length}
                            totalAmount={totals.totalBillsAmount}
                            paidAmount={totals.totalPaidAmount}
                            outstandingAmount={totals.totalOutstanding}
                        />

                        {/* Inbound Operations Island */}
                        <div className="erp-card rounded-[3rem] p-4 shadow-sm border-none overflow-hidden relative group">
                            <div className="p-4">
                                <div className="flex items-center gap-4 mb-8 px-4">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-sm">
                                        <Filter className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-neutral-900 dark:text-main uppercase tracking-tighter italic leading-none">Intelligence Command</h3>
                                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1 italic leading-none">Filter and Intercept manifests</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <BillsFilters
                                        searchTerm={searchTerm}
                                        onSearchChange={setSearchTerm}
                                        statusFilter={statusFilter}
                                        onStatusFilterChange={setStatusFilter}
                                    />

                                    <div className="flex items-center gap-3 px-6 py-3 bg-blue-500/5 dark:bg-blue-500/5 rounded-2xl border border-blue-500/10">
                                        <Calculator className="w-4 h-4 text-blue-500 animate-pulse" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Dynamic Valuation Matrix Enabled</span>
                                    </div>

                                    <BillsTable
                                        bills={filteredBills}
                                        isLoading={isLoading}
                                        onMarkAsPaid={handleMarkAsPaid}
                                        onDelete={(id) => setDeleteConfirm(id)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                 {/* Branded verification footprint */}
                 {!showForm && (
                     <div className="mt-8 flex items-center justify-center gap-6 opacity-30 group pb-24">
                        <div className="h-px w-20 bg-neutral-400 dark:bg-neutral-600" />
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            <span className="text-[9px] font-black uppercase tracking-[0.3em]">Fiscal Integrity Shield Verified • BizzAI Enterprise Core</span>
                        </div>
                        <div className="h-px w-20 bg-neutral-400 dark:bg-neutral-600" />
                    </div>
                 )}

                {/* Delete Confirm */}
                <DeleteBillModal
                    isOpen={!!deleteConfirm}
                    onClose={() => setDeleteConfirm(null)}
                    onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
                />

                {/* Payment Modal */}
                {paymentModal.isOpen && paymentModal.bill && (
                    <PaymentModal
                        isOpen={paymentModal.isOpen}
                        onClose={() => setPaymentModal({ isOpen: false, bill: null })}
                        onSubmit={handlePaymentSubmit}
                        documentType="Bill"
                        totalAmount={paymentModal.bill.amount}
                        paidAmount={paymentModal.bill.paidAmount || 0}
                    />
                )}
            </PageShell>
        </Layout>
    );
};

export default Bills;
