# TextileSoft Module Documentation

**Source:** `TEXTILESOFT 17.07.2025`

This document describes the identified business module and its known source-level areas. It is intended as a working reference for the TextileSoft analysis and ERP migration.

> Note: TextileSoft is a legacy ASP.NET WebForms application. Some server-side business logic is compiled into `App_Web_*.dll` assemblies, so a page name alone does not prove the complete database or business logic behind that page. Exact SQL/table mappings should be validated against the application database and compiled code where required.

# Accounts / Finance

Account master, account type/number, bank entry, bank transactions, day book, cash transactions, payments, expenses and financial reporting.

## Scope
Financial master and transaction processing.

## Identified areas
- Account master
- Account number/type
- Bank entry
- Bank transaction
- Day book
- Cash transactions
- Payments
- Expenses
- Financial reports

## Migration concern
Financial postings should be reconciled with sales, purchase, returns and cash operations.


## Source Trace Status

This module has been identified from the TextileSoft application structure. Exact page-to-database mappings should be added during source/database tracing.
