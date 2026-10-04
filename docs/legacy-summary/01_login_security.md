# TextileSoft Module Documentation

**Source:** `TEXTILESOFT 17.07.2025`

This document describes the identified business module and its known source-level areas. It is intended as a working reference for the TextileSoft analysis and ERP migration.

> Note: TextileSoft is a legacy ASP.NET WebForms application. Some server-side business logic is compiled into `App_Web_*.dll` assemblies, so a page name alone does not prove the complete database or business logic behind that page. Exact SQL/table mappings should be validated against the application database and compiled code where required.

# Login, User & Security

Login, Super Admin Login, user management, rights, permissions, discount permissions, system options, company settings, account date settings.

## Scope
Covers authentication, user creation, rights, permissions and system-level access controls.

## Identified areas
- Login and Super Admin Login
- New User / Delete User
- User rights and permissions
- Discount permissions
- System options
- Common settings
- Company settings
- Account-date controls
- Employee/user-level access

## Migration questions
- Which roles exist?
- Which tables store users and permissions?
- Are permissions page-based, action-based, or both?
- Which settings affect billing and stock behaviour?


## Source Trace Status

This module has been identified from the TextileSoft application structure. Exact page-to-database mappings should be added during source/database tracing.
