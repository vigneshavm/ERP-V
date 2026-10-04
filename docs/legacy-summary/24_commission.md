# TextileSoft Module Documentation

**Source:** `TEXTILESOFT 17.07.2025`

This document describes the identified business module and its known source-level areas. It is intended as a working reference for the TextileSoft analysis and ERP migration.

> Note: TextileSoft is a legacy ASP.NET WebForms application. Some server-side business logic is compiled into `App_Web_*.dll` assemblies, so a page name alone does not prove the complete database or business logic behind that page. Exact SQL/table mappings should be validated against the application database and compiled code where required.

# Commission

Product-wise, barcode-wise, range-wise, salesman and age-wise commission calculations and reports.

## Scope
Commission calculation and reporting.

## Identified areas
- Product-wise commission
- Barcode-wise commission
- Range-wise commission
- Salesman commission
- Age-wise/product commission

## Migration concern
Commission rules need effective dates and historical transaction preservation.


## Source Trace Status

This module has been identified from the TextileSoft application structure. Exact page-to-database mappings should be added during source/database tracing.
