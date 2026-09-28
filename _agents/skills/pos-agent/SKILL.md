---
name: pos-agent
description: POS operations for ERP. Use this skill when working on POS screens, shifts, cash drawers, returns, and order workflows.
---

# POS Module Agent

This skill covers the ERP POS domain under `frontend/src/features/pos/` and related retail workflows.

## Module Scope

Core work includes:
- POS order and counter flows
- Shift management and cash drawers
- POS returns and operational reporting
- Cash handling and retail transactions

## Key Files and Patterns

- `frontend/src/features/pos/`
- `frontend/src/features/sales/`
- `frontend/src/services/ModuleRegistry.ts`

## Typical Workflows

1. Process retail sales and order entries.
2. Manage shift and drawer state.
3. Handle customer returns and sales adjustments.
4. Review POS intelligence and cash summary screens.

## Business Rules to Respect

- Keep POS sales, returns, and cash drawer logic consistent with the broader sales flow.
- Prefer existing POS intelligence screens and patterns before adding alternative implementations.
- Ensure module access is still wired through the app registry for POS pages.

## Validation Checklist

- Check sales totals, returns, and drawer balances remain consistent.
- Validate shift and cash close logic against expected retail operations.
- Run the relevant frontend checks after changes.
