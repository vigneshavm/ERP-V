# TextileSoft Module Documentation

**Source:** `TEXTILESOFT 17.07.2025`

This document describes the identified business module and its known source-level areas. It is intended as a working reference for the TextileSoft analysis and ERP migration.

> Note: TextileSoft is a legacy ASP.NET WebForms application. Some server-side business logic is compiled into `App_Web_*.dll` assemblies, so a page name alone does not prove the complete database or business logic behind that page. Exact SQL/table mappings should be validated against the application database and compiled code where required.

# Customer Loyalty / Points

Customer points, add/less points, redemption, product/brand point configuration, point reports and customer cards.

## Scope
Customer points and loyalty processing.

## Identified areas
- Point update
- Add points
- Less points
- Redeem points
- Product/brand point configuration
- Customer-wise point reports
- Customer cards

## Migration concern
Points should be transaction-backed so additions and deductions can be audited.


## Source Trace Status

This module has been identified from the TextileSoft application structure. Exact page-to-database mappings should be added during source/database tracing.
