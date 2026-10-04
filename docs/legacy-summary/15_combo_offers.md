# TextileSoft Module Documentation

**Source:** `TEXTILESOFT 17.07.2025`

This document describes the identified business module and its known source-level areas. It is intended as a working reference for the TextileSoft analysis and ERP migration.

> Note: TextileSoft is a legacy ASP.NET WebForms application. Some server-side business logic is compiled into `App_Web_*.dll` assemblies, so a page name alone does not prove the complete database or business logic behind that page. Exact SQL/table mappings should be validated against the application database and compiled code where required.

# Combo / Offers

Combo offer entry/edit/view, single-MRP combo, multi-MRP combo, super combo, GST combo, combo product naming and combo stock.

## Scope
Products composed or sold as combinations/offers.

## Identified areas
- Combo offer entry/edit/view
- Single-MRP combo
- Multi-MRP combo
- Super combo
- GST combo
- Combo product name
- Combo stock
- Combo barcode
- Combo material transfer

## Migration concern
Define whether a combo barcode represents the bundle or individual component items.


## Source Trace Status

This module has been identified from the TextileSoft application structure. Exact page-to-database mappings should be added during source/database tracing.
