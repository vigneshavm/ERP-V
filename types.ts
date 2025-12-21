export const Sector = {
  GENERAL: 'General',
  PHARMACY: 'Pharmacy',
  ELECTRONICS: 'Electronics',
  GROCERY: 'Grocery',
  SUPERMARKET: 'Supermarket',
  TEXTILE: 'Textile',
  MOBILE_SHOP: 'Mobile Shop'
} as const;

export type Sector = typeof Sector[keyof typeof Sector];

export enum TransactionType {
  SALE = 'Sale',
  EXPENSE = 'EXPENSE',
  PURCHASE = 'Purchase',
  SALARY = 'Salary',
  INCOME = 'INCOME'
}

export type ModuleType = 'POS' | 'INVENTORY' | 'HR' | 'FINANCE' | 'ANALYTICS';
export type Branch = string;
export type TaxMode = 'EXCLUSIVE' | 'INCLUSIVE';
export type PaymentMethod = 'CASH' | 'CARD' | 'UPI';
export type AppView = 'DASHBOARD' | 'POS' | 'INVENTORY' | 'PURCHASE' | 'FINANCE' | 'SALES' | 'DAILY' | 'LABOR' | 'STOREFRONT' | 'SETTINGS';
export type SystemRole = 'Owner' | 'Manager' | 'Staff';

export interface RegionConfig {
  currency: string;
  currencySymbol: string;
  dateFormat: string;
}

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  modules: ModuleType[];
  isActive: boolean;
  region: RegionConfig;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  sector: Sector;
  image?: string;
  branch?: string;
  productType?: string;
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

export interface Sale {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
  customerName?: string;
  customerId?: string;
  sector: Sector;
  branch?: string;
  taxMode?: TaxMode;
  paymentMethod?: PaymentMethod;
}

export interface PurchaseOrder {
  id: string;
  vendor: string;
  date: string;
  items: {
    name: string;
    qty: number;
    cost: number;
    sku?: string;
    productType?: string;
  }[];
  total: number;
  status: 'PENDING' | 'APPROVED';
  sector: Sector;
  branch: Branch;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string;
  sector: Sector;
}

export interface Employee {
  id: string;
  name: string;
  role: string; // Job Title (e.g. Cashier)
  systemRole: SystemRole; // App Permission Level
  pin: string;
  dailyRate: number;
  sector: Sector;
  branch: Branch;
}

export interface LaborPayment {
  id: string;
  employeeId: string;
  amount: number;
  date: string;
  type: 'SALARY' | 'ADVANCE';
  note?: string;
}

export type AttendanceStatus = 'PRESENT' | 'HALF' | 'QUARTER' | 'ABSENT';

export interface DailyLog {
  status: AttendanceStatus;
  inTime: string;
  outTime: string;
  duration: number;
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  status: AttendanceStatus;
  advanceTaken?: number;
  inTime?: string;
  outTime?: string;
}

export interface InvoiceItem {
  sku: string; // inferred or generated
  name: string;
  quantity: number;
  cost: number;
}

export interface InvoiceData {
  vendor: string;
  date: string;
  items: InvoiceItem[];
  totalCost: number;
}

export interface ScannedInvoiceItem {
  sku?: string;
  name: string;
  productType?: string;
  qty: number;
  cost?: number;
}

export interface ScannedInvoice {
  vendor?: string;
  date?: string;
  items: ScannedInvoiceItem[];
}

export interface SettingsState {
  appName: string;
  logoUrl?: string;
  primaryColor: string;
  enabledModules: Record<string, boolean>;
  rolePermissions: Record<SystemRole, AppView[]>;
}

export interface BillSession {
  id: number;
  label: string;
  cart: CartItem[];
  customerId: string | null;
  taxMode: TaxMode;
  paymentMethod: PaymentMethod;
}

export interface Cheque {
  id: string;
  number: string;
  bankName: string;
  payee: string;
  amount: number;
  date: string;
  status: 'PENDING' | 'CLEARED' | 'BOUNCED';
  type: 'ISSUED' | 'RECEIVED';
  sector: Sector;
}

export interface AppSettings {
  appName: string;
  logoUrl?: string;
  primaryColor: string;
  enabledModules: {
    pos: boolean;
    inventory: boolean;
    finance: boolean;
    labor: boolean;
    purchases: boolean;
    storefront: boolean;
    sales: boolean;
    daily: boolean;
  };
  rolePermissions: Record<SystemRole, AppView[]>;
}

// Redux State Interfaces
export interface InventoryState {
  products: Product[];
}

export interface Session {
  id: string;
  label: string;
  cart: CartItem[];
  customerId: string | null;
  taxMode: TaxMode;
  paymentMethod: PaymentMethod;
}

export interface POSState {
  sessions: Session[];
  activeSessionIndex: number;
  customers: Customer[];
  salesHistory: Sale[];
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  description: string;
  sector: Sector;
  category?: string;
  branch?: string;
}

export interface FinanceState {
  balance: number;
  transactions: Transaction[];
}

export interface LaborState {
  employees: Employee[];
  attendance: Attendance[];
  payments: LaborPayment[];
}

export interface PurchaseState {
  pendingInvoice: InvoiceData | null;
  isProcessing: boolean;
  orders: PurchaseOrder[];
}

export interface TenantState {
  tenants: Tenant[];
}

export interface AuthState {
  user: Employee | null;
  currentSector: Sector;
  currentBranch: string;
  role: SystemRole;
  theme: 'light' | 'dark';
}
