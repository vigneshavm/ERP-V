---
name: expenses-agent
description: Expense tracking and policy management for ERP. Use this skill when working on daily expenses, recurring expenses, categories, reimbursement logic, and expense reporting.
---

# Expenses Module Agent

This skill covers the ERP expenses domain under `frontend/src/features/expenses/` and related financial reporting.

## Module Scope

Core work includes:
- Expense entries and tracking
- Expense categories management
- Recurring expenses
- Daily finance and expense reports
- Intelligence views and summaries

## Key Files and Patterns

- `frontend/src/features/expenses/`
- `frontend/src/features/financial/`
- `frontend/src/services/ModuleRegistry.ts`

## Typical Workflows

1. Capture or edit expense records.
2. Review category-level spending and recurring expenses.
3. Validate against budget or cash positions.
4. Produce reporting summaries for management review.

## Business Rules to Respect

- Keep category mapping and totals aligned with accounting and budget data.
- Reuse existing expense components and report patterns before creating duplicate flows.
- Ensure any new reporting screens are registered if they are navigable modules.

## Validation Checklist

- Check totals and category allocations remain accurate.
- Confirm report filters and summaries match current ERP behavior.
- Run targeted frontend validation after modifications.
