import { tenants } from './tenants';
import { branches } from './branches';
import { customers } from './customers';
import { suppliers } from './suppliers';
import { inventory } from './inventory';
import { salesInvoices } from './sales_invoices';
import { salesItems } from './sales_items';
import { purchases } from './purchases';
import { expenses } from './expenses';
import { payments } from './payments';
import { employees } from './employees';
import { transactions } from './transactions';
import { daily_finance } from './daily_finance';
import { estimates } from './estimates';
import { productTypes } from './productTypes';

export const demoDB: Record<string, any[]> = {
    tenants,
    branches,
    customers,
    suppliers,
    inventory,
    salesInvoices,
    salesItems,
    purchases,
    expenses,
    payments,
    employees,
    transactions,
    daily_finance,
    estimates,
    productTypes
};
