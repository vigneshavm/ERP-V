---
name: customer-engagement-agent
description: Customer engagement and messaging workflows for ERP. Use this skill when working on email, WhatsApp, loyalty, feedback, and customer communication tools.
---

# Customer Engagement Module Agent

This skill covers the ERP customer engagement domain under `frontend/src/features/customer-engagement/` and related marketing or customer flows.

## Module Scope

Core work includes:
- Email engagement workflows
- WhatsApp engagement and messaging
- Loyalty and feedback automation
- Customer communication and relationship tools

## Key Files and Patterns

- `frontend/src/features/customer-engagement/`
- `frontend/src/features/marketing/`
- `frontend/src/services/ModuleRegistry.ts`

## Typical Workflows

1. Review engagement tools or communication flows.
2. Update customer messaging templates or automation logic.
3. Ensure loyalty and feedback flows remain aligned with customer data.
4. Connect engagement outcomes to broader customer records.

## Business Rules to Respect

- Customer communications should stay consistent with customer records and campaign logic.
- Reuse the active engagement screen patterns instead of creating parallel versions.
- Keep view registration current if engagement screens move or are added.

## Validation Checklist

- Check messaging and engagement data order remains correct.
- Review customer-facing outputs against actual CRM and marketing state.
- Run relevant checks after changes.
