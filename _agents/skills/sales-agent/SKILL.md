---
name: sales-agent
description: Sales operations for ERP. Use this skill when working on estimates, sales orders, invoices, delivery challans, payments, returns, credits, or customer dues across the sales domain.
---

# Sales Module Agent

This skill covers the ERP sales domain under `frontend/src/features/sales/` and the related registry entries in `frontend/src/services/ModuleRegistry.ts`.

## Module Scope

Core work includes:
- Estimates and quotations
- Sales orders and order tracking
- Sales invoices and invoice detail views
- Delivery challans and dispatch workflows
- Sales returns and returned-item handling
- Payment-in flows and outstanding dues
- Customer credits and account-level receivables

## Key Files and Patterns

- `frontend/src/features/sales/`
- `frontend/src/features/customers/`
- `frontend/src/features/financial/`
- `frontend/src/services/ModuleRegistry.ts`

## Typical Workflows

1. Create or edit an estimate.
2. Convert estimate into sales order.
3. Generate invoice from accepted order.
4. Dispatch via delivery challan if needed.
5. Record payment-in and reconcile customer dues.
6. Handle return/credit adjustments and outstanding balances.

## Business Rules to Respect

- Check stock and pricing before creating or modifying a sales document.
- Preserve customer credit limits and due aging logic.
- Keep invoice, order, delivery, and return state transitions consistent.
- Reuse the existing sales hooks and components instead of creating parallel logic.
- Ensure route registration is updated if a sales screen is moved or renamed.

## Data and State Guidance

- Prefer the existing Redux slices and feature-level services before introducing new state.
- Reuse established API wrappers and types for invoice, order, returns, and payment flows.
- Match the current project naming conventions used in `salesInvoices`, `salesOrders`, `deliveryChallans`, and `payments` folders.

## Validation Checklist

- Confirm the updated document is registered in `ModuleRegistry.ts` if it is a navigable screen.
- Verify that related customer balances still reconcile.
- Check the item/quantity/price logic for return and payment adjustments.
- Run the relevant frontend tests and type checks after a change.

## Good Starting Points

- Search for existing sales invoice/order forms and list screens before creating a new component.
- Reuse the domain-specific hooks in `frontend/src/features/sales/hooks/` or shared patterns in `frontend/src/hooks/`.
- Follow the established naming and UI conventions already used in the sales feature folder.
