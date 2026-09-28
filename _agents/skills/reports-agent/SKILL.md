---
name: reports-agent
description: Reporting and analytics for ERP. Use this skill when working on operational reports, summaries, and data exports across sales, inventory, finance, and business views.
---

# Reports Module Agent

This skill covers the ERP reporting domain under `frontend/src/features/reports/` and related summary modules.

## Module Scope

Core work includes:
- Sales and operational reporting
- Inventory and stock reports
- Financial and business summaries
- Export and analytics views

## Key Files and Patterns

- `frontend/src/features/reports/`
- `frontend/src/features/dashboard/`
- `frontend/src/services/ModuleRegistry.ts`

## Typical Workflows

1. Build or adjust a report view.
2. Validate filters, date ranges, and totals.
3. Align report output with the actual ERP domain source data.
4. Review analytics screens for dashboard integration.

## Business Rules to Respect

- Reporting logic must use real, consistent source data and not a mismatched mock dataset.
- Reuse the established report structure and summary patterns instead of creating ad hoc pages.
- Check registry wiring for any moved or newly added report screens.

## Validation Checklist

- Verify totals, filters, and grouping remain coherent.
- Match report data to the underlying module logic.
- Run targeted validation and type checks after edits.
