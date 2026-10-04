# TextileSoft Module Documentation

**Source:** `TEXTILESOFT 17.07.2025`

This document describes the identified business module and its known source-level areas. It is intended as a working reference for the TextileSoft analysis and ERP migration.

> Note: TextileSoft is a legacy ASP.NET WebForms application. Some server-side business logic is compiled into `App_Web_*.dll` assemblies, so a page name alone does not prove the complete database or business logic behind that page. Exact SQL/table mappings should be validated against the application database and compiled code where required.

# Sales Return

Sales return entry, return bill viewing and related sales-return reporting.

## Scope
Customer sales return processing.

## Identified areas
- Sales return entry
- Sales return bill view
- Related return reports

## Migration questions
- Does return use original barcode?
- Can a returned barcode be resold immediately?
- How is stock status restored?


## Source Trace Status

This module has been identified from the TextileSoft application structure. Exact page-to-database mappings should be added during source/database tracing.
