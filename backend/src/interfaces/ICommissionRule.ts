import { Document, Types } from "mongoose";

// Textilesoft's commission subsystem (salesman commission, product/PCS/range-wise commission,
// floor/section commission reporting) has no counterpart anywhere in this codebase -- the only
// "commission" concept that exists is a flat `commissionPercent` on the Agent master (a supplier
// -side concept, not a staff-incentive rule engine). This is a genuine, minimal-but-real slice:
// a rule table plus a report that resolves rules against actual Invoices.
//
// Scope, deliberately narrow (disclosed rather than silently expanded):
// - Attribution is by the invoice's `createdBy` (the cashier/user who rang up the sale) since
//   this codebase has no separate "salesman" field on Invoice/InvoiceItem.
// - A rule can be scoped to a specific employee (User) or apply to all employees (employeeId
//   unset), and further scoped to a specific item, a free-text item category, or all items.
// - The most specific active rule wins for a given (employee, item) pair; see
//   CommissionController.resolveRule for the precedence order.
// - Commission is computed live from Invoices for reporting -- it is not persisted per invoice
//   line. A "mark as paid out" ledger is out of scope for this pass.
export type CommissionRuleScope = 'ITEM' | 'CATEGORY' | 'ALL';
export type CommissionRateType = 'PERCENT' | 'FLAT';

export interface ICommissionRule extends Document {
    tenantId: string;
    name: string;
    // Unset = applies to every employee (a tenant-wide default for the given item/category scope).
    employeeId?: Types.ObjectId;
    scope: CommissionRuleScope;
    itemId?: Types.ObjectId;   // required when scope === 'ITEM'
    category?: string;        // required when scope === 'CATEGORY' (matches Item.category)
    rateType: CommissionRateType;
    rateValue: number;        // percent (0-100) when PERCENT, currency amount per matched line when FLAT
    status: 'active' | 'inactive';
    createdAt: Date;
    updatedAt: Date;
}
