# TextileSoft Module Documentation

**Source:** `TEXTILESOFT 17.07.2025`

This document describes the identified business module and its known source-level areas. It is intended as a working reference for the TextileSoft analysis and ERP migration.

> Note: TextileSoft is a legacy ASP.NET WebForms application. Some server-side business logic is compiled into `App_Web_*.dll` assemblies, so a page name alone does not prove the complete database or business logic behind that page. Exact SQL/table mappings should be validated against the application database and compiled code where required.

# Purchase Return

Normal purchase return, barcode-wise return, GRN-wise return, negative-quantity return and supplier return processing.

## Scope
Returning purchased goods to suppliers.

## Identified areas
- Purchase return
- Barcode-wise purchase return
- GRN-wise purchase return
- Negative quantity return

## Barcode dependency
If the returned item is barcode-tracked, the return must preserve the original barcode identity and correctly reverse stock.


## Source Trace Status

This module has been identified from the TextileSoft application structure. Exact page-to-database mappings should be added during source/database tracing.
