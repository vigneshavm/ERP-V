import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from "@/app/store/store";
import { Search, RotateCcw } from 'lucide-react';
import { Sale, Invoice } from "@repo/shared";

interface ReturnInvoiceSelectorProps {
    onSelectInvoice: (sale: Sale) => void;
}

export const ReturnInvoiceSelector: React.FC<ReturnInvoiceSelectorProps> = ({ onSelectInvoice }) => {
    const { salesHistory, customers } = useSelector((state: RootState) => state.pos);
    const [searchTerm, setSearchTerm] = useState('');

    const getCustomerName = (id?: string) => {
        if (!id) return 'Unknown';
        return customers.find(c => c.id === id)?.name || 'Walk-in';
    };

    const getCustomerPhone = (id?: string) => {
        if (!id) return '';
        return customers.find(c => c.id === id)?.phone || '';
    };

    const filteredSales = (salesHistory as unknown as Invoice[]).filter(sale => {
        if (!searchTerm) return false; // Show nothing initially or maybe recent 10?

        const term = searchTerm.toLowerCase();
        const customerId = typeof sale.customer === 'string' ? sale.customer : sale.customer?._id || sale.customer?.id;
        const customerName = getCustomerName(customerId).toLowerCase();
        const customerPhone = getCustomerPhone(customerId);

        const saleId = sale._id || sale.id;

        return (
            saleId.toLowerCase().includes(term) ||
            customerName.includes(term) ||
            customerPhone.includes(term)
        );
    });

    return (
        <div className="bg-white dark:bg-[var(--erp-card)] rounded-xl border border-default dark:border-default shadow-sm overflow-hidden h-full flex flex-col">
            <div className="p-6 border-b border-default dark:border-default">
                <h3 className="text-lg font-bold text-main mb-2 flex items-center gap-2">
                    <RotateCcw className="w-5 h-5 text-indigo-500" />
                    Select Invoice to Return
                </h3>
                <p className="text-sm text-muted mb-4">Search by Invoice Number, Customer Name, or Phone</p>

                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search invoice #, customer, phone..."
                        className="w-full pl-10 pr-4 py-3 bg-[var(--erp-bg-sunken)] dark:bg-slate-700 border border-default dark:border-slate-600 rounded-xl text-main focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                    />
                    <Search className="w-5 h-5 text-muted absolute left-3 top-3.5" />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                {searchTerm && filteredSales.length === 0 && (
                    <div className="text-center py-12 text-muted">
                        No invoices found matching "{searchTerm}"
                    </div>
                )}

                {!searchTerm && (
                    <div className="text-center py-12 text-muted">
                        Start typing to search for an invoice...
                    </div>
                )}

                <div className="space-y-2">
                    {(filteredSales as unknown as Invoice[]).slice(0, 50).map(sale => {
                        const saleId = sale._id || sale.id;
                        const customerId = typeof sale.customer === 'string' ? sale.customer : sale.customer?._id || sale.customer?.id;

                        return (
                            <button
                                key={saleId}
                                onClick={() => onSelectInvoice(sale as unknown as Sale)}
                                className="w-full text-left p-4 bg-white dark:bg-[var(--erp-card)] hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-default dark:border-default rounded-lg group transition-colors flex justify-between items-center"
                            >
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-mono font-bold text-secondary dark:text-muted">#{saleId.substring(0, 8)}</span>
                                        <span className="text-xs text-muted">• {new Date(sale.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="text-sm font-medium text-main">
                                        {getCustomerName(customerId)} <span className="text-muted font-normal">({getCustomerPhone(customerId)})</span>
                                    </div>
                                    <div className="text-xs text-muted mt-1">
                                        {sale.items.length} Items • <span className={sale.status === 'COMPLETED' ? 'text-emerald-600' : 'text-amber-600'}>{sale.status || 'PAID'}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-bold text-main">₹{sale.totalAmount.toFixed(2)}</div>
                                    <div className="text-xs text-indigo-600 opacity-0 group-hover:opacity-100 font-bold transition-opacity">
                                        Select
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
