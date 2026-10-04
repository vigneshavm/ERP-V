# PLAN 01 - Login, User & Security

## Objective
Migrate the legacy TextileSoft `Login, User & Security` capability into the latest React + Node.js ERP without losing functionality or business logic.

## Legacy scope
LoginOpen, user/login pages, role/access controls

## Business logic flow
```text
Authenticate → load company/branch/counter/business date → resolve permissions → create session/token → audit login → route to permitted module
```

## React implementation
React auth pages + route guards; Node auth/session service; SQL user/role/permission repositories; audit events

## Node.js implementation
React auth pages + route guards; Node auth/session service; SQL user/role/permission repositories; audit events

## Logic preservation
Authentication, authorization, session timeout, password/reset, company context, counter context, permission-based screen/action visibility

## SQL implementation
- Identify every source table/query/procedure.
- Map existing data to `dbo.*` without altering it.
- Create new ERP-owned structures only under `erp.*` through versioned migrations.
- Implement transaction boundaries explicitly.
- Preserve historical transaction snapshots.

## Reports
All reports owned by this module must be implemented from SQL-backed report repositories and exposed through the module's report navigation.

## Printing
All printer variants used by this module must call the shared print/document service and printer adapters.

## Migration
```text
legacy source
  ↓
mapping
  ↓
staging/validation
  ↓
SQL target
  ↓
reconciliation
  ↓
cutover
```

## Acceptance
- ] login parity
[ ] role/action permissions
[ ] company context
[ ] counter context
[ ] session timeout
[ ] audit
[ ] reset flows
[ ] unauthorized API tests
- [ ] legacy functionality trace complete
- [ ] business-rule trace complete
- [ ] SQL mapping complete
- [ ] React complete
- [ ] Node complete
- [ ] report/print complete
- [ ] migration complete
- [ ] parity tests complete
- [ ] rollback tested
- [ ] sign-off
