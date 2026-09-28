# Route File Consolidation & Naming Standard

## Current Status ✅

The codebase **already uses consistent route file naming**:
- All route files follow the pattern: `{domain}.routes.ts`
- Examples: `purchase.routes.ts`, `sales.routes.ts`, `inventory.routes.ts`
- **No duplicate files found** (assessment reference to `pos.routes.ts + posRoutes.ts` is not present in current codebase)

## Naming Convention (ENFORCED)

### Pattern
```
{domain}/{feature}.routes.ts    (for domain-specific features)
{domain}.routes.ts               (for module-level routes)
```

### Examples
```
backend/src/modules/
├── purchase/
│   └── routes/
│       ├── purchase.routes.ts         ✅ Main domain routes
│       ├── purchasePaymentRoutes.ts   ⚠️  Should be: purchasePayment.routes.ts
│       ├── purchaseReturnRoutes.ts    ⚠️  Should be: purchaseReturn.routes.ts
│       ├── debitNoteRoutes.ts         ⚠️  Should be: debitNote.routes.ts
│       └── agentRoutes.ts             ⚠️  Should be: agent.routes.ts
│
├── sales/
│   └── routes/
│       ├── sales.routes.ts            ✅
│       ├── pos.routes.ts              ✅
│       ├── paymentIn.routes.ts        ✅
│       └── salesOrder.routes.ts       ✅
│
└── inventory/
    └── routes/
        └── inventory.routes.ts        ✅
```

## Standardization Needed

### Purchase Module Renames (7 files)

```bash
purchasePaymentRoutes.ts   → purchasePayment.routes.ts
purchaseReturnRoutes.ts    → purchaseReturn.routes.ts
debitNoteRoutes.ts         → debitNote.routes.ts
agentRoutes.ts             → agent.routes.ts
grnTransferRoutes.ts       → grnTransfer.routes.ts
supplierGroupRoutes.ts     → supplierGroup.routes.ts
reconciliationRoutes.ts    → reconciliation.routes.ts
```

### CRM Module Renames (3 files)

```bash
supplierRoutes.ts          → supplier.routes.ts
customerRoutes.ts          → customer.routes.ts
whatsappRoutes.ts          → whatsapp.routes.ts
```

### HR Module Renames (5 files)

```bash
employeeRoutes.ts          → employee.routes.ts
attendanceRoutes.ts        → attendance.routes.ts
advanceRoutes.ts           → advance.routes.ts
payrollRoutes.ts           → payroll.routes.ts
```

### Core Module Renames (6 files)

```bash
userRoutes.ts              → user.routes.ts
shopRoutes.ts              → shop.routes.ts
roleRoutes.ts              → role.routes.ts
settingsRoutes.ts          → settings.routes.ts
syncRoutes.ts              → sync.routes.ts
subscriptionPlanRoutes.ts  → subscriptionPlan.routes.ts
```

### Marketing Module Renames (1 file)

```bash
crmAnalyticsRoutes.ts      → crmAnalytics.routes.ts
```

## Impact Assessment

- **Files to rename**: ~22 route files
- **Import statements to update**: ~40 references in app.ts / module routers
- **Risk**: Low (rename is a refactoring, no logic changes)
- **Effort**: 1-2 hours (can be automated with find/replace)
- **Benefit**: Consistency, improved developer clarity

## Implementation Plan

### Phase 1: Standardize Naming
1. Rename all route files to `{feature}.routes.ts` pattern
2. Update all import statements in:
   - `app.ts`
   - Module-level route aggregators
   - Index files

### Phase 2: Document in Codebase
1. Add comment block at top of each route file
2. Link to this standard
3. Update CODING_PRINCIPLES.md

### Phase 3: Lint Rule (Optional)
1. Add ESLint rule to enforce naming pattern
2. Prevent non-conforming file names in routes/ directories

## Rationale

- **Consistency**: Same naming across all 6 modules
- **Clarity**: Clear at a glance which files are routes
- **Scalability**: Easy to find where routes are defined
- **IDE friendliness**: Alphabetical sorting groups related files

## Not Changing

Route file organization (keep current structure):
- One route file per major feature
- Sub-routes can be aggregated in module-level route
- No consolidation needed (already separated logically)

---

**Status**: Ready for Phase 3 implementation after Phase 2 completion
