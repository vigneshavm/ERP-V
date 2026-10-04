# TextileSoft Module Documentation

**Source:** `TEXTILESOFT 17.07.2025`

This document describes the identified business module and its known source-level areas. It is intended as a working reference for the TextileSoft analysis and ERP migration.

> Note: TextileSoft is a legacy ASP.NET WebForms application. Some server-side business logic is compiled into `App_Web_*.dll` assemblies, so a page name alone does not prove the complete database or business logic behind that page. Exact SQL/table mappings should be validated against the application database and compiled code where required.

# Printer Integrations

Printer-specific barcode and label implementations for GODEX, TSC, Zebra and TVS printer families.

## Scope
Printer-specific barcode label implementations.

## Identified printer families
- GODEX
- TSC
- Zebra TLP2844
- Zebra ZD220
- Zebra ZD230T
- TVS LP44
- TVS LP45 Lite
- TVS LP46 Neo

## Migration concern
Printer-specific implementations should be separated from business barcode logic in the new ERP.


## Source Trace Status

This module has been identified from the TextileSoft application structure. Exact page-to-database mappings should be added during source/database tracing.
