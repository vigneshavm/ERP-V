
export type Sector = 'General' | 'Textile' | 'Electronics';
export type Branch = 'All' | 'Alpha' | 'Beta' | 'Gamma';
export type UserRole = 'Owner' | 'Staff';
export type AppView = 'dashboard' | 'pos' | 'sales' | 'daily' | 'inventory' | 'purchases' | 'finance' | 'labor';

export interface Product {
  id: string;
  sku: string;
  name: string;
  productType: string; // e.g. "Gents Pant", "Shirt", "Mobile"
  category: string;    // e.g. "Men's Wear", "Electronics"
  price: number;
  cost: number;
  stock: number;
  sector: Sector;
  branch: Branch;
  barcode?: string;
}

export interface CartItem extends Product {
  qty: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  points: number;
}

export type PaymentMethod = 'CASH' | 'CARD' | 'UPI';
export type TaxMode = 'INCLUSIVE' | 'EXCLUSIVE';

export interface BillSession {
  id: number; // 0, 1, 2, 3
  label: string;
  cart: CartItem[];
  customerId: string | null;
  taxMode: TaxMode;
  paymentMethod: PaymentMethod;
}

export interface Sale {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
  customerId?: string;
  sector: Sector;
  branch: Branch;
  paymentMethod: PaymentMethod;
  taxMode: TaxMode;
}

export interface Transaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  amount: number;
  date: string;
  description: string;
  sector: Sector;
  branch: Branch;
}

export interface Cheque {
  id: string;
  number: string;
  bankName: string;
  payee: string; // To whom or From whom
  amount: number;
  date: string; // Issue/Due Date
  status: 'PENDING' | 'CLEARED' | 'BOUNCED';
  type: 'ISSUED' | 'RECEIVED';
  sector: Sector;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  dailyRate: number;
  sector: Sector;
  branch: Branch;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF' | 'QUARTER';

export interface DailyLog {
  status: AttendanceStatus;
  inTime?: string;
  outTime?: string;
  duration?: number; // in hours
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  status: AttendanceStatus;
  advanceTaken: number;
  inTime?: string;
  outTime?: string;
  duration?: number;
}

export interface LaborPayment {
  id: string;
  employeeId: string;
  amount: number;
  date: string;
  type: 'SALARY' | 'ADVANCE' | 'BONUS';
  note?: string;
}

export interface ScannedInvoiceItem {
  name: string;
  qty: number;
  cost: number;
  sku?: string;
}

export interface ScannedInvoice {
  vendor: string;
  date: string;
  items: ScannedInvoiceItem[];
  total: number;
}

export interface PurchaseOrder {
  id: string;
  vendor: string;
  date: string;
  items: ScannedInvoiceItem[];
  total: number;
  status: 'PENDING' | 'APPROVED';
  sector: Sector;
  branch: Branch;
}
