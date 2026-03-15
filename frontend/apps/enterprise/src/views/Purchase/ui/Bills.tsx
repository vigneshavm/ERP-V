import React from 'react';
import { Plus } from 'lucide-react';
import Layout from "@/shared/ui/Layout/Layout";
import PageHeader from "@/shared/ui/Layout/PageHeader";
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
            <div className="space-y-6 animate-fade-in pb-10">
                <PageHeader
                    title="Supplier Bills"
                    description="Record and track bills from your vendors and suppliers"
                    actions={
                        <button
                            onClick={() => { setEditingBill(null); setShowForm(true); }}
                            className="btn btn-primary bg-brand-600 hover:bg-brand-700 shadow-brand-600/20"
                        >
                            <Plus className="w-4 h-4" />
                            New Bill
                        </button>
                    }
                />

                {showForm ? (
                    <BillForm
                        onBack={() => setShowForm(false)}
                        onSave={handleSaveBill}
                        initialData={editingBill as any}
                    />
                ) : (
                    <>
                        <BillsStats
                            billsCount={filteredBills.length}
                            totalAmount={totals.totalBillsAmount}
                            paidAmount={totals.totalPaidAmount}
                            outstandingAmount={totals.totalOutstanding}
                        />

                        <BillsFilters
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                            statusFilter={statusFilter}
                            onStatusFilterChange={setStatusFilter}
                        />

                        <BillsTable
                            bills={filteredBills}
                            isLoading={isLoading}
                            onMarkAsPaid={handleMarkAsPaid}
                            onDelete={(id) => setDeleteConfirm(id)}
                        />
                    </>
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
            </div>
        </Layout>
    );
};

export default Bills;


