---
name: auth-agent
description: Authentication and access control for ERP. Use this skill when working on login, tenant access, authorization flows, user sessions, and security-related app entry points.
---

# Auth Module Agent

This skill covers ERP authentication and access workflows, especially the app shell under `frontend/src/features/auth/` and related tenant/session state.

## Module Scope

Core work includes:
- Login and logout flows
- Role-based access patterns
- Tenant-aware navigation and session state
- Security and app entry flow validation

## Key Files and Patterns

- `frontend/src/features/auth/`
- `frontend/src/components/shared/Layout/`
- `frontend/src/services/ModuleRegistry.ts`

## Typical Workflows

1. Validate login or account access.
2. Check tenant/session state around protected views.
3. Ensure navigation respects auth and role conditions.
4. Update route or module access when app entry changes.

## Business Rules to Respect

- Never bypass auth checks or silently expose protected content.
- Keep tenant awareness intact for multi-tenant access patterns.
- Reuse existing login and access components rather than duplicating flow logic.

## Validation Checklist

- Confirm protected modules are still gated correctly.
- Validate session and view transitions remain consistent.
- Run relevant frontend validation after auth changes.
