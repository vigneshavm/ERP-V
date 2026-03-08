import { Product } from './product';
import { Sale } from './sales';
import { Customer } from './sales'; // Customer is in sales.ts
import { Transaction, Cheque } from './finance';
import { Employee, LaborPayment } from './hr';
import { PurchaseOrder } from './purchase';

export interface TenantData {
    products: Product[];
    customers: Customer[];
    employees: Employee[];
    transactions: Transaction[];
    cheques: Cheque[];
    salesHistory: Sale[];
    purchaseOrders: PurchaseOrder[];
    laborPayments: LaborPayment[];
}

export type MockDatabase = Record<string, TenantData>;
