# TextileSoft Module Documentation

**Source:** `TEXTILESOFT 17.07.2025`

This document describes the identified business module and its known source-level areas. It is intended as a working reference for the TextileSoft analysis and ERP migration.

> Note: TextileSoft is a legacy ASP.NET WebForms application. Some server-side business logic is compiled into `App_Web_*.dll` assemblies, so a page name alone does not prove the complete database or business logic behind that page. Exact SQL/table mappings should be validated against the application database and compiled code where required.

# Settings / Configuration

Barcode settings, barcode size/serial settings, print settings, purchase/sales settings, report options, system options, common settings, company and counter settings.

## Scope
System-wide configurable behaviour.

## Identified areas
- Barcode settings
- Barcode size/serial settings
- Print settings
- Purchase settings
- Sales settings
- Report options
- System options
- Common settings
- Company settings
- Counter settings
- Permission settings

## Migration concern
Separate true master/configuration data from obsolete UI-era settings.


## Source Trace Status

This module has been identified from the TextileSoft application structure. Exact page-to-database mappings should be added during source/database tracing.
