# Backend Code Consistency & Pattern Standard

## 1. Purpose

Define the standard backend architecture and coding patterns
for the ERP application.

This document is the source of truth for:
- New backend development
- Existing module refactoring
- Code reviews
- AI-assisted development
- Architecture decisions

---

## 2. Scope

Applies to:

- Controllers
- Services
- Repositories
- DataSources / Adapters
- Middleware
- Validation
- Authentication
- Authorization
- Error handling
- API responses
- Logging
- Transactions
- Tenant isolation
- Testing

---

## 3. Mandatory Architecture

```text
Request
  ↓
Middleware
  ↓
Controller
  ↓
Service
  ↓
Repository / DataSource
  ↓
Database / External System
```

---

## 4. Controller Standard

### Responsibilities

Controller MUST:
- Read request parameters
- Read request body
- Call service
- Return HTTP response
- Pass errors to next()

Controller MUST NOT:
- Query MongoDB directly
- Query SQL directly
- Contain business rules
- Perform database transactions
- Access Models directly

### Standard pattern

```typescript
try {
    const result = await service.method(...);

    return res.json({
        success: true,
        data: result
    });
} catch (error) {
    next(error);
}
```

---

## 5. Service Standard

### Responsibilities

Service owns:
- Business rules
- Business validation
- Orchestration
- Transaction boundaries
- Domain operations

Service MUST NOT:
- Format HTTP responses
- Access req/res
- Contain Express-specific logic

---

## 6. Repository Standard

Repository owns:
- MongoDB queries
- CRUD
- Filtering
- Pagination
- Tenant-scoped persistence

All tenant-owned queries MUST include tenant context.

---

## 7. DataSource / Adapter Standard

External systems such as Textilesoft SQL MUST be accessed through:

```text
Service
  ↓
DataSource / Adapter
  ↓
External system
```

Business services MUST NOT contain SQL/Mongo source-selection logic.

---

## 8. Tenant Isolation

ERP APIs MUST fail closed when tenant context is required.

Public:
`resolveTenantOptional()`

ERP:
`requireTenant()`

All tenant-owned repository methods MUST enforce tenantId.

---

## 9. Authentication & Authorization

Request context should provide:

- userId
- tenantId
- requestId

Authorization must be applied before business operations.

---

## 10. Validation

```text
Request
  ↓
Validation Middleware
  ↓
Controller
  ↓
Service
```

Each API should have a defined request schema/DTO.

Examples:

- CreatePurchaseSchema
- UpdatePurchaseSchema
- CreateInvoiceSchema
- PaymentSchema

---

## 11. API Response Standard

### Success

```json
{
  "success": true,
  "data": {}
}
```

### Paginated

```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "total": 100,
      "totalPages": 4
    }
  }
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Resource not found"
  }
}
```

---

## 12. Error Handling

Controllers MUST NOT generate their own 500 responses.

Required:

```text
Controller
  ↓
next(error)
  ↓
Global errorHandler
```

`AppError` should be used for expected application errors.

---

## 13. Transaction Standard

Transactions belong at the service/use-case boundary.

Example:

```text
Service
  ↓
start transaction
  ↓
Repository operations
  ↓
commit / rollback
```

---

## 14. TypeScript Standard

Avoid:
- `any`
- `as any`
- untyped request bodies
- untyped service parameters
- untyped repository results

Use:
- interfaces
- DTOs
- enums
- typed request context
- typed repository results

---

## 15. Dependency Injection

Default:

`@injectable()`

Use `@singleton()` only when there is a genuine lifecycle/state requirement.

---

## 16. Logging

Do not use:

- `console.log()`
- `console.error()`
- `console.warn()`

Use the centralized logger.

Where applicable include:
- requestId
- tenantId
- userId
- entityId
- operation

---

## 17. Naming Convention

- Controllers: `PurchaseController`
- Services: `PurchaseService`
- Repositories: `PurchaseRepository`
- Routes: `purchase.routes.ts`
- Schemas: `purchase.schema.ts`
- DTOs: `purchase.dto.ts`

---

## 18. Module Structure

Example:

```text
modules/purchase/

├── controllers/
├── services/
├── repositories/
├── schemas/
├── dto/
├── routes/
├── models/
└── tests/
```

---

## 19. Migration Strategy

Existing code will be migrated incrementally.

Priority:

1. Finance
2. Sales
3. Purchase
4. Inventory
5. Returns
6. Reports
7. Remaining legacy modules

Do NOT rewrite the backend.

---

## 20. Module Definition of Done

A module is standardized only when:

- [ ] Controller contains no DB access
- [ ] Controller contains no business logic
- [ ] Controller uses next(error)
- [ ] Service owns business logic
- [ ] Repository owns persistence
- [ ] Tenant isolation is enforced
- [ ] Validation exists
- [ ] DTOs are typed
- [ ] Standard response format is used
- [ ] Global error handler is used
- [ ] Authorization is applied
- [ ] Central logger is used
- [ ] SQL/external access uses DataSource
- [ ] Tests exist

---

## 21. Reference Modules

Use the current implementations of:

- Sales
- Inventory

as the initial reference implementations.

Purchase should be progressively migrated toward the same pattern.

---

## 22. Anti-Patterns

The following are NOT allowed for new code:

- Controller ↓ Model (Direct model access)
- Controller ↓ SQL
- Controller ↓ Business logic
- Service ↓ HTTP response formatting
- Service ↓ Direct SQL source selection
- Repository ↓ Unscoped tenant query
- Controller ↓ `res.status(500)`

Use the standard architecture instead.

---

## 23. Migration Tracking

| Module | Controller | Service | Repository | Validation | Tenant Safe | Error Standard | DataSource | Status |
|---|---|---|---|---|---|---|---|---|
| Sales | Reference | In Progress | In Progress | Partial | Enforced | Partial | Pending | In Progress |
| Inventory | Reference | In Progress | In Progress | Partial | Enforced | Partial | Pending | In Progress |
| Purchase | Legacy/Mixed | Partial | Missing | Partial | Partial | Partial | None | Planned |
| Finance | Legacy/Mixed | Mixed | Missing | Partial | Partial | Partial | None | Priority 1 |
| Returns | Legacy | Partial | Missing | None | Partial | Partial | None | Priority 5 |
| Reports | Legacy | Services exist | N/A | None | Partial | Partial | None | Priority 6 |

---

## 24. Review Rules

Every new backend PR must verify:

- [ ] Correct architecture
- [ ] No direct model access from controller
- [ ] No SQL from controller
- [ ] Tenant-safe database operations
- [ ] Validation at API boundary
- [ ] Typed request/response
- [ ] Standard error handling
- [ ] Standard response format
- [ ] Central logging
- [ ] Tests

---

## 25. Final Target

The ERP backend must converge on:

```text
Middleware
    ↓
Controller
    ↓
Service
    ↓
Repository / DataSource
    ↓
Database / External System
```

- Business rules → Service
- Persistence → Repository
- External systems → DataSource
- Validation → Middleware
- Authorization → Middleware
- Errors → Global error handler
- HTTP formatting → Controller
