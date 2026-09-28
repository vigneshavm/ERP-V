---
name: suppliers-agent
description: Supplier management for ERP. Use this skill when working on suppliers, payable ledgers, statements, groups, aging, and vendor payment workflows.
---

# Suppliers Module Agent

This skill covers the ERP supplier domain under `frontend/src/features/suppliers/` and the purchase/payables flow that depends on it.

## Module Scope

Core work includes:
- Supplier profiles and detail pages
- Supplier ledger and statement views
- Supplier groups and ageing screens
- Vendor payment and payables workflows
- Agent and supplier relationship management

## Key Files and Patterns

- `frontend/src/features/suppliers/`
- `frontend/src/features/purchase/`
- `frontend/src/services/ModuleRegistry.ts`

## Typical Workflows

1. Add or edit supplier records.
2. Review vendor statements, balances, and liabilities.
3. Link supplier activity to purchase orders, bills, and payments.
4. Track ageing and unresolved payable items.

## Business Rules to Respect

- Keep supplier ledgers aligned with GRN, bill, and payment activity.
- Reuse the established supplier detail and statement screens before adding a new shorthand view.
- Maintain payable accuracy across all vendor-facing flows.

## Data and State Guidance

- Follow existing supplier service/client patterns and type definitions.
- Prefer existing feature-level components and list/detail structures over bespoke mock implementations.
- If a supplier screen is moved or renamed, update `ModuleRegistry.ts`.

## Validation Checklist

- Confirm balances, age buckets, and statement data reconcile.
- Check the supplier list/detail screens still match current ERP requirements.
- Run targeted checks after modifications.
