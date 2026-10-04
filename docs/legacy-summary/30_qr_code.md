# TextileSoft Module Documentation

**Source:** `TEXTILESOFT 17.07.2025`

This document describes the identified business module and its known source-level areas. It is intended as a working reference for the TextileSoft analysis and ERP migration.

> Note: TextileSoft is a legacy ASP.NET WebForms application. Some server-side business logic is compiled into `App_Web_*.dll` assemblies, so a page name alone does not prove the complete database or business logic behind that page. Exact SQL/table mappings should be validated against the application database and compiled code where required.

# QR Code

Bill QR codes, gift bill QR codes, gift token QR codes and QR generation/printing.

## Scope
QR code generation and printing.

## Identified areas
- Bill QR codes
- Gift bill QR codes
- Gift token QR codes
- QR code generation/printing

## Migration concern
Document QR payload format before replacing the QR implementation.


## Source Trace Status

This module has been identified from the TextileSoft application structure. Exact page-to-database mappings should be added during source/database tracing.
