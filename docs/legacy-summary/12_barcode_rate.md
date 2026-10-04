# TextileSoft Module Documentation

**Source:** `TEXTILESOFT 17.07.2025`

This document describes the identified business module and its known source-level areas. It is intended as a working reference for the TextileSoft analysis and ERP migration.

> Note: TextileSoft is a legacy ASP.NET WebForms application. Some server-side business logic is compiled into `App_Web_*.dll` assemblies, so a page name alone does not prove the complete database or business logic behind that page. Exact SQL/table mappings should be validated against the application database and compiled code where required.

# Barcode Rate

Barcode rate changes, meter-based rate changes, commission rate changes, invoice barcode rate changes and related rate-maintenance functions.

## Scope
Changing commercial values attached to barcode records.

## Identified areas
- Barcode rate change
- Meter-based rate change
- Commission rate change
- Invoice barcode rate change
- WS/WR barcode rate changes
- Fancy barcode rate changes

## Migration concern
Rate changes must preserve historical sales/purchase values and should not unintentionally rewrite transaction history.


## Source Trace Status

This module has been identified from the TextileSoft application structure. Exact page-to-database mappings should be added during source/database tracing.
