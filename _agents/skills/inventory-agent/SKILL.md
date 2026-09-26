---
name: inventory-agent
description: Inventory management for ERP. Use this skill when working on stock levels, items, categories, batch tracking, stock transfers, write-offs, valuation, and inventory intelligence.
---

# Inventory Module Agent

This skill covers the ERP inventory domain under `frontend/src/features/inventory/` and related stock flows used across sales, purchase, and reports.

## Module Scope

Core work includes:
- Item and variant management
- Category and master data management
- Batch and expiry tracking
- Stock transfers and write-offs
- Reprint queue and stock intelligence views
- Inventory summary and stock movement reporting

## Key Files and Patterns

- `frontend/src/features/inventory/`
- `frontend/src/features/system/MasterDataManager.tsx`
- `frontend/src/services/ModuleRegistry.ts`

## Typical Workflows

1. Maintain item and category master data.
2. Track stock movement across purchase and sales entry.
3. Record stock transfer, write-off, and batch adjustments.
4. Review low-stock, aged-stock, and expiry-related intelligence.

## Business Rules to Respect

- Preserve correct stock balances across purchase, sales, and adjustments.
- Check the real data-backed manager before using mock inventory screens.
- Keep categories, units, and HSN logic aligned with the master-data manager.
- Avoid creating duplicate inventory helpers when a feature-level component already solves the need.

## Data and State Guidance

- Reuse existing inventory screens and services rather than introducing duplicate filters or adapters.
- Prefer real inventory managers and validated endpoints over generic mock UIs when a real flow exists.
- If changing module registration, update `ModuleRegistry.ts` to reflect the actual screen path.

## Validation Checklist

- Confirm stock movement logic and totals remain consistent.
- Review category/item naming and master-data linkages.
- Run target tests and a TypeScript check when features are modified.

## Good Starting Points

- Check `InventoryManager.tsx`, `CategoryManager.tsx`, and `StockTransfer` flows for existing patterns.
- Reuse current inventory UI structures before creating another stock management screen.
