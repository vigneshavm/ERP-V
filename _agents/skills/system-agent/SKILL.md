---
name: system-agent
description: System configuration and platform management for ERP. Use this skill when working on settings, master data, audit logs, permissions, sync, and system administration.
---

# System Module Agent

This skill covers the ERP system administration domain under `frontend/src/features/system/` and its central platform management screens.

## Module Scope

Core work includes:
- Settings and configuration screens
- Master data manager
- Audit log review
- Permission and discount settings
- Sync and platform administration tasks

## Key Files and Patterns

- `frontend/src/features/system/`
- `frontend/src/services/ModuleRegistry.ts`

## Typical Workflows

1. Update admin settings or platform-level configuration.
2. Manage master data records such as units, HSN, or categories.
3. Review audit logs and system syncing activities.
4. Maintain permissions and control logic for ERP operations.

## Business Rules to Respect

- System configuration changes should be tightly scoped and not affect unrelated modules.
- Reuse the existing settings and master-data patterns before creating new admin screens.
- Keep route and module registration accurate for system pages.

## Validation Checklist

- Verify no configuration regression was introduced in adjacent features.
- Check audit and master-data updates stay consistent with the underlying data models.
- Run relevant frontend validation after system changes.
