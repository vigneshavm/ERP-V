# TextileSoft Module Documentation

**Source:** `TEXTILESOFT 17.07.2025`

This document describes the identified business module and its known source-level areas. It is intended as a working reference for the TextileSoft analysis and ERP migration.

> Note: TextileSoft is a legacy ASP.NET WebForms application. Some server-side business logic is compiled into `App_Web_*.dll` assemblies, so a page name alone does not prove the complete database or business logic behind that page. Exact SQL/table mappings should be validated against the application database and compiled code where required.

# Customer

Customer master, new customer, name/mobile updates, customer group, relationship, company, city, category, card and customer transactions.

## Scope
Customer master and customer transaction identity.

## Identified areas
- Customer creation
- Name/mobile update
- Customer group
- Relationship
- Company
- City
- Category
- Card number
- Customer transactions

## Migration dependency
Customer identity connects sales, credit, points, payments and reports.


## Source Trace Status

This module has been identified from the TextileSoft application structure. Exact page-to-database mappings should be added during source/database tracing.
