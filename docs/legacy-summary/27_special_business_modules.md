# TextileSoft Module Documentation

**Source:** `TEXTILESOFT 17.07.2025`

This document describes the identified business module and its known source-level areas. It is intended as a working reference for the TextileSoft analysis and ERP migration.

> Note: TextileSoft is a legacy ASP.NET WebForms application. Some server-side business logic is compiled into `App_Web_*.dll` assemblies, so a page name alone does not prove the complete database or business logic behind that page. Exact SQL/table mappings should be validated against the application database and compiled code where required.

# Grocery / Electrical / Appliance / Special Modules

Grocery product and sales, electrical sales, appliance category/model/rate processing, fancy purchase and other specialized business flows.

## Scope
Specialized business flows present in the legacy system.

## Identified areas
- Grocery products/sales
- Electrical sales
- Appliance category/model/rate
- Fancy purchase
- Tea-shop sales
- Other specialized billing/reporting variants

## Migration concern
These should be retained only where the business still uses the corresponding workflow.


## Source Trace Status

This module has been identified from the TextileSoft application structure. Exact page-to-database mappings should be added during source/database tracing.
