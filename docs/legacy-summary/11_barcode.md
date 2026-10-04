# TextileSoft Module Documentation

**Source:** `TEXTILESOFT 17.07.2025`

This document describes the identified business module and its known source-level areas. It is intended as a working reference for the TextileSoft analysis and ERP migration.

> Note: TextileSoft is a legacy ASP.NET WebForms application. Some server-side business logic is compiled into `App_Web_*.dll` assemblies, so a page name alone does not prove the complete database or business logic behind that page. Exact SQL/table mappings should be validated against the application database and compiled code where required.

# Barcode

Barcode generation, barcode taking, barcode viewing, barcode settings, custom barcode, garment barcode, gift barcode, WR/WS barcode and barcode lifecycle.

## Scope
Core barcode lifecycle.

## Identified areas
- Barcode generation
- Barcode taking
- Barcode view
- Barcode settings
- Custom barcode
- Garment barcode
- Gift barcode
- WR/WS barcode
- Barcode sales
- Barcode stock
- Barcode transfer

## Core flow
Purchase/Product data → barcode creation → barcode record → label printing → stock → barcode sale/return/transfer.

## Important
The exact barcode-number algorithm and SQL tables must be traced from the compiled application/database before migration.


## Source Trace Status

This module has been identified from the TextileSoft application structure. Exact page-to-database mappings should be added during source/database tracing.
