import { Schema, model, Document, Types } from 'mongoose';

// ─── User ────────────────────────────────────────────────────────────────────
export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  currency: string;
  totalWealth: number;
  pinHash?: string;
  isActive: boolean;
  settings: Record<string, unknown>;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  email:        { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  name:         { type: String, required: true },
  currency:     { type: String, default: 'INR', maxlength: 3 },
  totalWealth:  { type: Number, default: 0 },
  pinHash:      { type: String },
  isActive:     { type: Boolean, default: true },
  settings:     { type: Schema.Types.Mixed, default: {} },
  lastLoginAt:  { type: Date },
}, { timestamps: true });

export const User = model<IUser>('BudgetUser', UserSchema);

// ─── PasswordResetToken ───────────────────────────────────────────────────────
// tokenHandle: SHA-256(rawToken) — indexed for O(1) lookup, never emailed
// tokenHash:   bcrypt(rawToken)  — verified on reset to confirm authenticity
const PasswordResetSchema = new Schema({
  userId:      { type: Types.ObjectId, ref: 'BudgetUser', required: true, unique: true },
  tokenHandle: { type: String, required: true, unique: true, index: true },
  tokenHash:   { type: String, required: true },
  expiresAt:   { type: Date, required: true },
});

export const PasswordResetToken = model('BudgetPasswordReset', PasswordResetSchema);

// ─── Category ─────────────────────────────────────────────────────────────────
export interface ICategory extends Document {
  userId: Types.ObjectId;
  name: string;
  icon: string;
  emoji?: string;
  color: string;
  type: 'expense' | 'income';
  limitAmount: number;
}

const CategorySchema = new Schema<ICategory>({
  userId:      { type: Schema.Types.ObjectId, ref: 'BudgetUser', required: true },
  name:        { type: String, required: true },
  icon:        { type: String, required: true },
  emoji:       { type: String },
  color:       { type: String, required: true },
  type:        { type: String, enum: ['expense', 'income'], default: 'expense' },
  limitAmount: { type: Number, default: 0 },
}, { timestamps: true });

CategorySchema.index({ userId: 1 });

export const Category = model<ICategory>('BudgetCategory', CategorySchema);

// ─── Transaction ──────────────────────────────────────────────────────────────
// date is a native Date — supports native range queries, TTL indexes, and date
// arithmetic in aggregations without $dateFromString workarounds.
export interface ITransaction extends Document {
  userId: Types.ObjectId;
  categoryId?: Types.ObjectId;
  name: string;
  amount: number;
  type: 'expense' | 'income';
  date: Date;
  notes?: string;
  isAnomaly: boolean;
  anomalyReason?: string;
  paymentMethod?: string;
  accountId?: Types.ObjectId;
  disputed: boolean;
  createdAt: Date;
}

const TransactionSchema = new Schema<ITransaction>({
  userId:        { type: Schema.Types.ObjectId, ref: 'BudgetUser', required: true },
  categoryId:    { type: Schema.Types.ObjectId, ref: 'BudgetCategory' },
  name:          { type: String, required: true },
  amount:        { type: Number, required: true },
  type:          { type: String, enum: ['expense', 'income'], default: 'expense' },
  date:          { type: Date, required: true },
  notes:         { type: String },
  isAnomaly:     { type: Boolean, default: false },
  anomalyReason: { type: String },
  paymentMethod: { type: String },
  accountId:     { type: Schema.Types.ObjectId, ref: 'BudgetAccount' },
  disputed:      { type: Boolean, default: false },
}, { timestamps: true });

TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ userId: 1, categoryId: 1 });

export const Transaction = model<ITransaction>('BudgetTransaction', TransactionSchema);

// ─── MonthlySummary ───────────────────────────────────────────────────────────
const MonthlySummarySchema = new Schema({
  userId:       { type: Schema.Types.ObjectId, ref: 'BudgetUser', required: true },
  monthDate:    { type: String, required: true },   // 'YYYY-MM'
  totalIncome:  { type: Number, default: 0 },
  totalExpense: { type: Number, default: 0 },
  budgetTotal:  { type: Number, default: 0 },
}, { timestamps: true });

MonthlySummarySchema.index({ userId: 1, monthDate: 1 }, { unique: true });

export const MonthlySummary = model('BudgetMonthlySummary', MonthlySummarySchema);

// ─── Budget ───────────────────────────────────────────────────────────────────
export interface IBudgetItem {
  _id: Types.ObjectId;
  categoryId: Types.ObjectId;
  totalAmount: number;
  spent: number;
  overspent: boolean;
}

export interface IBudget extends Document {
  userId: Types.ObjectId;
  month: string;  // 'YYYY-MM'
  totalAmount: number;
  mode: 'zero-based' | 'flexible';
  items: IBudgetItem[];
}

const BudgetItemSchema = new Schema<IBudgetItem>({
  categoryId:  { type: Schema.Types.ObjectId, ref: 'BudgetCategory', required: true },
  totalAmount: { type: Number, default: 0 },
  spent:       { type: Number, default: 0 },
  overspent:   { type: Boolean, default: false },
});

const BudgetSchema = new Schema<IBudget>({
  userId:      { type: Schema.Types.ObjectId, ref: 'BudgetUser', required: true },
  month:       { type: String, required: true },
  totalAmount: { type: Number, default: 0 },
  mode:        { type: String, enum: ['zero-based', 'flexible'], default: 'flexible' },
  items:       [BudgetItemSchema],
}, { timestamps: true });

BudgetSchema.index({ userId: 1, month: 1 }, { unique: true });

export const Budget = model<IBudget>('BudgetPlan', BudgetSchema);

// ─── Goal ─────────────────────────────────────────────────────────────────────
const GoalSchema = new Schema({
  userId:     { type: Schema.Types.ObjectId, ref: 'BudgetUser', required: true },
  name:       { type: String, required: true },
  target:     { type: Number, required: true },
  current:    { type: Number, default: 0 },
  icon:       { type: String, required: true },
  color:      { type: String, required: true },
  deadline:   { type: String, required: true },
  dailyNudge: { type: Number, default: 0 },
}, { timestamps: true });

GoalSchema.index({ userId: 1 });

export const Goal = model('BudgetGoal', GoalSchema);

// ─── Loan ─────────────────────────────────────────────────────────────────────
export interface ILoan extends Document {
  userId: Types.ObjectId;
  name: string;
  bank: string;
  total: number;
  current: number;
  interestRate: number;
  tenureMonths: number;
  type: 'Borrowed' | 'Lent';
  deadline: string;
  icon: string;
  color: string;
}

const LoanSchema = new Schema<ILoan>({
  userId:        { type: Schema.Types.ObjectId, ref: 'BudgetUser', required: true },
  name:          { type: String, required: true },
  bank:          { type: String, required: true },
  total:         { type: Number, required: true },
  current:       { type: Number, default: 0 },
  interestRate:  { type: Number, required: true },
  tenureMonths:  { type: Number, required: true },
  type:          { type: String, enum: ['Borrowed', 'Lent'], required: true },
  deadline:      { type: String, required: true },
  icon:          { type: String, required: true },
  color:         { type: String, required: true },
}, { timestamps: true });

LoanSchema.index({ userId: 1 });

export const Loan = model<ILoan>('BudgetLoan', LoanSchema);

// ─── Account ──────────────────────────────────────────────────────────────────
const AccountSchema = new Schema({
  userId:   { type: Schema.Types.ObjectId, ref: 'BudgetUser', required: true },
  name:     { type: String, required: true },
  type:     { type: String, enum: ['Savings', 'Checking', 'Current', 'Wallet'], required: true },
  balance:  { type: Number, default: 0 },
  income:   { type: Number, default: 0 },
  expense:  { type: Number, default: 0 },
  color:    { type: String, required: true },
  selected: { type: Boolean, default: false },
}, { timestamps: true });

AccountSchema.index({ userId: 1 });

export const Account = model('BudgetAccount', AccountSchema);

// ─── CreditCard ───────────────────────────────────────────────────────────────
const CreditCardSchema = new Schema({
  userId:   { type: Schema.Types.ObjectId, ref: 'BudgetUser', required: true },
  bank:     { type: String, required: true },
  cardName: { type: String, required: true },
  last4:    { type: String, required: true, length: 4 },
  network:  { type: String, enum: ['Visa', 'Mastercard', 'RuPay', 'Amex', 'Discover'], required: true },
  limit:    { type: Number, required: true },
  spent:    { type: Number, default: 0 },
  dueDate:  { type: String, required: true },
  minDue:   { type: Number, default: 0 },
  color:    { type: String, required: true },
  gradient: { type: String, default: '' },
}, { timestamps: true });

CreditCardSchema.index({ userId: 1 });

export const CreditCard = model('BudgetCreditCard', CreditCardSchema);

// ─── DebitCard ────────────────────────────────────────────────────────────────
const DebitCardSchema = new Schema({
  userId:    { type: Schema.Types.ObjectId, ref: 'BudgetUser', required: true },
  bank:      { type: String, required: true },
  cardName:  { type: String, required: true },
  last4:     { type: String, required: true },
  network:   { type: String, required: true },
  accountId: { type: Schema.Types.ObjectId, ref: 'BudgetAccount', required: true },
  color:     { type: String, required: true },
  gradient:  { type: String, default: '' },
}, { timestamps: true });

export const DebitCard = model('BudgetDebitCard', DebitCardSchema);

// ─── Notification ─────────────────────────────────────────────────────────────
const NotificationSchema = new Schema({
  userId:  { type: Schema.Types.ObjectId, ref: 'BudgetUser', required: true },
  type:    { type: String, enum: ['warning', 'info', 'success', 'error'], required: true },
  title:   { type: String, required: true },
  message: { type: String, required: true },
  amount:  { type: Number },
  icon:    { type: String, required: true },
  color:   { type: String, required: true },
  read:    { type: Boolean, default: false },
}, { timestamps: true });

NotificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification = model('BudgetNotification', NotificationSchema);

// ─── SmsTransaction ───────────────────────────────────────────────────────────
const SmsTransactionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'BudgetUser', required: true },
  status: { type: String, enum: ['pending', 'processed', 'ignored'], default: 'pending' },
  raw:    { type: String },
  parsed: { type: Schema.Types.Mixed },
}, { timestamps: true });

export const SmsTransaction = model('BudgetSmsTransaction', SmsTransactionSchema);

// ─── RecurringBill ────────────────────────────────────────────────────────────
const RecurringBillSchema = new Schema({
  userId:      { type: Schema.Types.ObjectId, ref: 'BudgetUser', required: true },
  name:        { type: String, required: true },
  amount:      { type: Number, required: true },
  nextDueDate: { type: String, required: true },
  frequency:   { type: String, enum: ['monthly', 'weekly', 'yearly'], default: 'monthly' },
}, { timestamps: true });

export const RecurringBill = model('BudgetRecurringBill', RecurringBillSchema);

// ─── Contact ──────────────────────────────────────────────────────────────────
const ContactSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'BudgetUser', required: true },
  name:   { type: String, required: true },
  phone:  { type: String },
  upi:    { type: String },
}, { timestamps: true });

export const Contact = model('BudgetContact', ContactSchema);
