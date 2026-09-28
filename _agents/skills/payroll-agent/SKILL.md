---
name: payroll-agent
description: Payroll and compensation operations for ERP. Use this skill when working on salary structures, payroll runs, payslips, attendance summaries, and commission rules.
---

# Payroll Module Agent

This skill covers the ERP payroll domain under `frontend/src/features/payroll/` and its integration with employee records.

## Module Scope

Core work includes:
- Salary structures and compensation rules
- Payroll runs and pay processing
- Payslip views and reporting
- Attendance summary and payroll-related analytics
- Commission rules and incentives

## Key Files and Patterns

- `frontend/src/features/payroll/`
- `frontend/src/features/employees/`
- `frontend/src/services/ModuleRegistry.ts`

## Typical Workflows

1. Prepare salary structures and rule definitions.
2. Run payroll batch processing.
3. Review payslips and summary results.
4. Validate attendance-based calculations and commission logic.

## Business Rules to Respect

- Payroll calculations must stay consistent with employee data and attendance inputs.
- Reuse the existing payroll screens and logic rather than introducing duplicate calculations.
- Ensure any screen or route added is correctly registered in the module registry.

## Validation Checklist

- Check totals, deductions, and pay-cycle logic remain coherent.
- Validate commission or allowance rules against current ERP conventions.
- Run relevant type checks and targeted tests after updates.
