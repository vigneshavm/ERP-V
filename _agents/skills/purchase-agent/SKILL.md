---
name: purchase-agent
description: Purchase operations for ERP. Use this skill when working on purchase orders, goods received, supplier bills, debit notes, vendor payments, and payables tracking.
---

# Purchase Module Agent

This skill covers the ERP purchase domain under `frontend/src/features/purchase/` and the supplier/payables flow across `frontend/src/features/suppliers/`.

## Module Scope

Core work includes:
- Purchase orders and purchase register
- Goods received notes and GRN workflows
- Supplier bills and bill forms
- Debit notes and vendor adjustments
- Supplier payment entries and outstanding payables
- Vendor inflow/outflow and ageing views

## Key Files and Patterns

- `frontend/src/features/purchase/`
- `frontend/src/features/suppliers/`
- `frontend/src/services/ModuleRegistry.ts`

## Typical Workflows

1. Create or revise purchase order.
2. Receive goods and update inventory state.
3. Match received stock with supplier bill.
4. Record supplier payment and handle uncleared cheques.
5. Track outstanding payables and ageing.

## Business Rules to Respect

- Validate supplier terms, rates, and tax logic before saving purchase data.
- Keep purchase, GRN, bill, and payment states aligned.
- Reuse current purchase-related hooks and table patterns instead of duplicating screen logic.
- Ensure vendor balance updates remain consistent with payment and invoice entries.

## Data and State Guidance

- Prefer existing purchase services and shared types over ad hoc fetch logic.
- Respect the feature-first organization already used under `frontend/src/features/purchase/`.
- If a purchase screen is newly added or moved, update `ModuleRegistry.ts` to keep route access working.

## Validation Checklist

- Check that item quantity, rate, and supplier balance logic remain consistent.
- Verify all purchase forms still match the current ERP flow.
- Run the relevant frontend tests and type checks after any modifications.

## Good Starting Points

- Inspect `PurchaseOrderForm.tsx`, `GoodsReceived.tsx`, `Bills.tsx`, and payment-related components before creating a new flow.
- Reuse supplier and payable patterns already implemented in the purchase feature.
