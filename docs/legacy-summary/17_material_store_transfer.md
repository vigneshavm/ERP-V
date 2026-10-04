# TextileSoft Module Documentation

**Source:** `TEXTILESOFT 17.07.2025`

This document describes the identified business module and its known source-level areas. It is intended as a working reference for the TextileSoft analysis and ERP migration.

> Note: TextileSoft is a legacy ASP.NET WebForms application. Some server-side business logic is compiled into `App_Web_*.dll` assemblies, so a page name alone does not prove the complete database or business logic behind that page. Exact SQL/table mappings should be validated against the application database and compiled code where required.

# Material / Store Transfer

Material transfer, barcode-wise transfer, combo transfer, GRN-wise transfer, store transfer, store receiving and stock movement.

## Scope
Physical movement of stock between locations.

## Identified areas
- Material transfer
- Barcode-wise material transfer
- Combo material transfer
- GRN-wise material transfer
- Store transfer
- Store received

## Migration concern
A transfer should normally create an auditable source and destination movement while preserving barcode identity.


## Source Trace Status

This module has been identified from the TextileSoft application structure. Exact page-to-database mappings should be added during source/database tracing.
