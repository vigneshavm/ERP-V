# TextileSoft Module Documentation

**Source:** `TEXTILESOFT 17.07.2025`

This document describes the identified business module and its known source-level areas. It is intended as a working reference for the TextileSoft analysis and ERP migration.

> Note: TextileSoft is a legacy ASP.NET WebForms application. Some server-side business logic is compiled into `App_Web_*.dll` assemblies, so a page name alone does not prove the complete database or business logic behind that page. Exact SQL/table mappings should be validated against the application database and compiled code where required.

# Supplier / Vendor

Supplier master, supplier bank/account details, credit days, supplier payments, transactions, stickers, supplier stock, purchases, returns and minimum quantities.

## Scope
Supplier/vendor master and supplier transactions.

## Identified areas
- Supplier master
- Bank/account details
- Credit days
- Supplier payment
- Supplier transactions
- Supplier stock
- Supplier purchase
- Supplier return
- Minimum quantity
- Supplier sticker

## Migration dependency
Supplier identity is shared by purchase, returns, payments and stock reporting.


## Source Trace Status

This module has been identified from the TextileSoft application structure. Exact page-to-database mappings should be added during source/database tracing.
