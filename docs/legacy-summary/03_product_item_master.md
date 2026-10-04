# TextileSoft Module Documentation

**Source:** `TEXTILESOFT 17.07.2025`

This document describes the identified business module and its known source-level areas. It is intended as a working reference for the TextileSoft analysis and ERP migration.

> Note: TextileSoft is a legacy ASP.NET WebForms application. Some server-side business logic is compiled into `App_Web_*.dll` assemblies, so a page name alone does not prove the complete database or business logic behind that page. Exact SQL/table mappings should be validated against the application database and compiled code where required.

# Product / Item Master

Product creation and maintenance, product rates, product groups, subgroups, units, brands, colors, patterns, designs, sizes, models and product pictures.

## Scope
Central product/item master and commercial attributes.

## Identified areas
- New product
- Product rate
- Product group/subgroup
- Unit
- Brand
- Color
- Pattern
- Design
- Size
- Model
- Product picture
- Group/subgroup pictures

## Migration dependency
Product master is a major dependency for purchase, barcode, stock, sales, discount and reporting.


## Source Trace Status

This module has been identified from the TextileSoft application structure. Exact page-to-database mappings should be added during source/database tracing.
