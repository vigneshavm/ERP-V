# TextileSoft Module Documentation

**Source:** `TEXTILESOFT 17.07.2025`

This document describes the identified business module and its known source-level areas. It is intended as a working reference for the TextileSoft analysis and ERP migration.

> Note: TextileSoft is a legacy ASP.NET WebForms application. Some server-side business logic is compiled into `App_Web_*.dll` assemblies, so a page name alone does not prove the complete database or business logic behind that page. Exact SQL/table mappings should be validated against the application database and compiled code where required.

# Employee / Salesman

Employee categories/groups/sections, salesman management, salesman-wise sales, salesman stickers and employee-related controls.

## Scope
Employee and salesman master/functions.

## Identified areas
- Employee category
- Employee group
- Employee section
- Salesman
- Salesman-wise sales
- Salesman stickers
- Employee-related controls

## Dependency
Salesman identity may affect commission, billing and reports.


## Source Trace Status

This module has been identified from the TextileSoft application structure. Exact page-to-database mappings should be added during source/database tracing.
