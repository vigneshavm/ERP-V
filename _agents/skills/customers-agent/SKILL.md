---
name: customers-agent
description: Customer management for ERP. Use this skill when working on customer profiles, ledgers, statements, groups, loyalty, and receivables tracking.
---

# Customers Module Agent

This skill covers the ERP customer domain under `frontend/src/features/customers/` and the related sales receivables flows.

## Module Scope

Core work includes:
- Customer list and detail pages
- Customer ledgers and statements
- Customer groups and segmentation
- Loyalty points and engagement logic
- Dues and receivable monitoring

## Key Files and Patterns

- `frontend/src/features/customers/`
- `frontend/src/features/sales/`
- `frontend/src/services/ModuleRegistry.ts`

## Typical Workflows

1. Create or update customer profiles.
2. Review open balances and ledger statements.
3. Track customer due aging and payment history.
4. Apply loyalty, credits, or account-level adjustments.
5. Connect customer activity to sales and payment flows.

## Business Rules to Respect

- Customer balances should reconcile with sales, payment-in, and credit actions.
- Reuse existing customer list/detail components before introducing a new view.
- Keep ledger statements and customer groups aligned with the current business structure.

## Data and State Guidance

- Prefer shared customer types and existing service calls.
- Use domain-level patterns already established in customer views instead of creating parallel logic.
- Ensure any new customer route or screen is registered in the app registry.

## Validation Checklist

- Verify ledger, dues, and payment totals still match.
- Confirm group and detail pages remain consistent with the current customer data model.
- Run relevant frontend tests and checks after the change.
