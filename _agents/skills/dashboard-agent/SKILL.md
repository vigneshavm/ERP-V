---
name: dashboard-agent
description: ERP dashboard and executive overview. Use this skill when working on KPIs, summary cards, growth metrics, sales dashboards, and operational overview screens.
---

# Dashboard Module Agent

This skill covers the ERP dashboard domain under `frontend/src/features/dashboard/` and related reporting views.

## Module Scope

Core work includes:
- KPI dashboards and operational summaries
- Growth and marketing metrics views
- Executive overview cards and charts
- Dashboard-specific module variants and mock UI views

## Key Files and Patterns

- `frontend/src/features/dashboard/`
- `frontend/src/features/reports/`
- `frontend/src/services/ModuleRegistry.ts`

## Typical Workflows

1. Review KPI cards and summary metrics.
2. Update dashboard widgets to reflect live business data.
3. Ensure performance and data refresh patterns remain stable.
4. Add or adjust new dashboard modules if needed.

## Business Rules to Respect

- Dashboard metrics must reflect actual ERP state and not stale mock values.
- Reuse the existing dashboard structure and widget conventions before adding new UI variants.
- Keep module registration current if a dashboard screen is renamed or moved.

## Validation Checklist

- Confirm summary values align with actual modules and data sources.
- Review filter, date-range, and refresh logic.
- Run targeted frontend validation after dashboard updates.
