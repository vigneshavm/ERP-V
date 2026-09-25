---
name: marketing-agent
description: Marketing operations for ERP. Use this skill when working on campaigns, templates, offers, coupons, WhatsApp, email, and social marketing workflows.
---

# Marketing Module Agent

This skill covers the ERP marketing domain under `frontend/src/features/marketing/` and related customer-engagement channels.

## Module Scope

Core work includes:
- Marketing campaigns and templates
- Coupons and promotional offers
- Email and WhatsApp marketing flows
- Social media and engagement workflows
- Customer engagement and campaign reporting

## Key Files and Patterns

- `frontend/src/features/marketing/`
- `frontend/src/features/customer-engagement/`
- `frontend/src/services/ModuleRegistry.ts`

## Typical Workflows

1. Create or maintain a campaign or template.
2. Design coupon or offer logic for customers.
3. Review engagement and channel-specific marketing screens.
4. Connect campaign outputs to customer engagement workflows.

## Business Rules to Respect

- Keep campaign logic aligned with the customer-engagement platform and business rules.
- Reuse existing channel-specific UI and components before creating duplicate campaign code.
- Update module wiring if a dashboard or marketing screen is moved or renamed.

## Validation Checklist

- Verify campaign data and templates still map correctly to their output channels.
- Ensure channel-specific logic matches the current ERP behavior.
- Run relevant UI validation and type checks after changes.
