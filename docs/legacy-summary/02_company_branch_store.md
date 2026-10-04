# TextileSoft Module Documentation

**Source:** `TEXTILESOFT 17.07.2025`

This document describes the identified business module and its known source-level areas. It is intended as a working reference for the TextileSoft analysis and ERP migration.

> Note: TextileSoft is a legacy ASP.NET WebForms application. Some server-side business logic is compiled into `App_Web_*.dll` assemblies, so a page name alone does not prove the complete database or business logic behind that page. Exact SQL/table mappings should be validated against the application database and compiled code where required.

# Company / Branch / Store

Company, branch, warehouse, counter, floor, rack, section, incharge, store received and store transfer functions.

## Scope
Defines the organizational structure used by the application.

## Identified areas
- Company
- Branch
- Warehouse
- Counter
- Floor
- Rack
- Section
- Incharge
- Store transfer
- Store received

## Migration questions
- Is stock maintained separately by branch/store/counter?
- Which master is the parent of rack/floor/section?
- How are transfers recorded?


## Source Trace Status

This module has been identified from the TextileSoft application structure. Exact page-to-database mappings should be added during source/database tracing.
