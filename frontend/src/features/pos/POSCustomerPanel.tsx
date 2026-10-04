import React from 'react';
import { Customer } from "../../types/sales";

interface POSCustomerPanelProps {
    activeCustomer: Customer;
    customers: Customer[];
    onSetCustomer: (id: string) => void;
    onLookupOrCreateCustomer: (phone: string, name?: string) => void;
}

export const POSCustomerPanel: React.FC<POSCustomerPanelProps> = (_props) => (
    <div className="shrink-0 border-b border-warning/30 bg-warning/5 px-3 py-2 text-xs text-secondary" role="status">
        Customer-linked billing and loyalty are unavailable in SQL-only checkout. This sale will be anonymous; no customer balance or points are recorded.
    </div>
);
