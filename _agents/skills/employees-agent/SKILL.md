---
name: employees-agent
description: Employee and HR operations for ERP. Use this skill when working on staff profiles, attendance, labor management, and employee-related workflows.
---

# Employees Module Agent

This skill covers the ERP employee and HR domain under `frontend/src/features/employees/`.

## Module Scope

Core work includes:
- Staff and labor management
- Attendance dashboards
- Employee detail and operational screens
- HR workflows and daily board views

## Key Files and Patterns

- `frontend/src/features/employees/`
- `frontend/src/features/payroll/`
- `frontend/src/services/ModuleRegistry.ts`

## Typical Workflows

1. Review employee or labor records.
2. Manage attendance and staffing operations.
3. Coordinate with payroll-related reports and wage calculations.
4. Maintain employee-specific operational views.

## Business Rules to Respect

- Keep HR and payroll data consistent across employee records and payroll outputs.
- Reuse current employee management components and screens before adding parallel ones.
- Make sure any new employee pages are exposed through the app registry when needed.

## Validation Checklist

- Confirm employee data remains consistent with payroll and attendance sources.
- Review attendance and labor logic against the existing feature implementation.
- Run relevant validation checks after adjusting employee flows.
