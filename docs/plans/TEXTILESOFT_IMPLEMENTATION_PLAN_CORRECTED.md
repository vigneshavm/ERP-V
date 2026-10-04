# TextileSoft -> Latest ERP: Corrected Implementation Plan

Corrected version of the supplied plan. Original plan numbers are kept so existing references still work; new or split plans use `34`, `09A/09B` and `18A/18B`. Plans are listed in **delivery order**, grouped by phase.

> **Status column:** taken from a scan of the `team/legacytomodern` branch and the 2026-09-30 SQL gap audit. The plan names `ERP_Application_Code (2).zip`, which was not opened for this review - re-verify the Status column against it.

## 0. What was corrected

| # | Problem in the original | Correction |
|---|---|---|
| 1 | Every checklist was malformed (`- ] item`, then `[ ] item` with no bullet), so none rendered as checkboxes. | All checklists rewritten as `- [ ]` items. |
| 2 | Completion matrix was broken: blank line after the header, a literal `\n` at the end of every row, Plans 00 and 01 missing, and every row said "Source-mapped / ERP feature / Build/extend". | Matrix rebuilt with phase, priority, dependencies, status and work type for all plans. |
| 3 | Plan 02 and the target list include **tenants**, but the SQL-only decision is single shop (Tenant model dropped). | Tenant removed from Plan 02; `tenants` area to be retired. |
| 4 | Restore carryover was in Plan 31 / P3 / Phase 10, but `RESTORE ... WITH REPLACE` wipes `erp` as soon as the first `erp` table exists. | Moved to Plan 01 (P0). |
| 5 | Every plan's definition of done requires reports, printers, permissions and audit, yet those frameworks arrived in Plans 29, 11 and 30 (late). | Report, print, RBAC and audit frameworks moved to Plan 01. |
| 6 | Plan 05 creates barcodes but barcode logic was Plan 09 (later). | Split Plan 09: **09A** identity and allocation before purchase; **09B** lifecycle later. |
| 7 | GST engine (Plan 18) came after the purchase and sales plans that must use it, while the plan says "do not duplicate tax formulas". | Split Plan 18: **18A** engine early (Phase 2); **18B** statutory reports (Phase 7). About 54 of the 63 "GST" pages are sales/purchase entry variants and become modes of Plans 05 and 14. |
| 8 | Plans 08 and 12 build a "stock ledger", which would be a second source of truth next to `dbo.stockdetails` while the legacy app keeps writing. | Stock stays a service over `dbo`; `erp` holds only audit and adjustment documents. |
| 9 | Commission appeared in both Plan 17 and Plan 28; the appendix filed only 2 commission pages while ~14 more sat in five other categories. | Plan 17 = discounts and promotions; Plan 28 owns all commission pages. |
| 10 | Wholesale listed as a target in Plans 05 and 14 and again as Plan 23. | Wholesale is a mode of 05 / 14; Plan 23 narrowed to WSR rates and reports. |
| 11 | No plan owned employees / salesman / cashier masters (8 pages) although the ERP has `employees` and `payroll`; sales orders / delivery (4 pages) and card swipe machines were also unowned. | New Plan 34 (staff masters); sales orders added to Plan 14; card terminals added to Plan 19. |
| 12 | Printer appendix: three `GiftNewPurchaseDiscountSchema*` pages are purchase discount schemes, not printers; `ZeabraGC420T.aspx` (misspelled in the source) was missed. The printer list also omitted Zebra GC420T. | Printer variants corrected from 44 to 42; GC420T added. |
| 13 | Other misfiled pages: `MissingStockReport` under GST, `PurchaseReturnBillView` under sales returns, `PatternAndSizeWiseSalesReportQty` under product masters, three stock reports under suppliers, `ExpansesBillview` under sales. | Moved to the right categories (Appendix A). |
| 14 | Plan 00 exit says "no unknown business capability", but 52 pages were unclassified. | 38 remain after moves; each has a proposed home to confirm (Appendix A). |
| 15 | Rule "`dbo` is never altered" contradicts the plans that write POS bills, GRNs and masters into `dbo`. | Reworded: no DDL on `dbo`; DML only on the reviewed `WRITE_TABLES` allow-list. |
| 16 | The plan ignored work already done: org, products, GRN, PO, purchase return, POS and sales return already have SQL adapters. Every plan said "Build/extend". | Status column added for every plan. |
| 17 | Section 14 (phases) and section 15 (order) disagreed with the plan priorities (commission in Phase 6 and in item 8; GST after sales; security P3). | Single delivery order by phase with an exit gate each. |
| 18 | No rule for document numbers or for the legacy app writing the same tables at the same time. | Added concurrency and number-allocation rules and a parallel-run reconciliation step. |
| 19 | `finance` and `financial` both appear as ERP feature areas with no decision. | Flagged in section 3 and Plan 19: choose one canonical area. |

## 1. Objective

Implement the business scope of `TEXTILESOFT 17.07.2025` in the latest ERP on **SQL Server only**, in the existing Textilesoft database (`SSS_copy`, later `SSS`), with ERP-owned data in an `erp` schema and MongoDB removed. Reports, barcode variants and printer variants are not separate modules; they are built inside the module that owns the data.

```text
TEXTILESOFT WebForms screen -> business capability -> ERP feature module
   -> service -> repository -> shared SQL pool
        |-- dbo.*  (Textilesoft tables, no DDL, DML on allow-list only)
        `-- erp.*  (ERP tables, versioned migrations only)
   -> React page + module report + print adapter
```

The source has **619 ASP.NET WebForms pages** and a large Crystal Reports / printer surface.

## 2. Hard implementation rules

- **No DDL on `dbo`.** Textilesoft tables, columns, indexes, triggers and procedures are never created, altered or dropped. The ERP writes (DML) only to tables on the reviewed `WRITE_TABLES` allow-list; adding a table to it is a reviewed change.
- **`erp.*` is created only by versioned migrations** run by the ADMIN login, tracked in `erp.schema_migrations`.
- **Three SQL identities:** READ, WRITE, ADMIN. The running app never uses ADMIN.
- **One shared SQL pool** and one transaction helper.
- **Every Mongo model has a disposition:** existing `dbo`, new `erp`, or drop. Decided in Plan 00 from the restored schema, not guessed.
- **Prefer `dbo` over `erp`.** If Textilesoft already stores a concept (customer, bank, due...), use its table. Create an `erp` table only after schema discovery shows there is none.
- **`dbo` stays authoritative** for stock, bills, GRNs and ledgers while the legacy app runs in parallel. No parallel balance, ledger or counter in `erp`.
- **Document numbers** (bill, GRN, barcode) come from one allocator that keeps Textilesoft formats and locks inside the transaction, because the legacy app writes the same tables at the same time.
- **Mongo `ObjectId`, `populate()`, aggregation and transactions** are translated at the repository / service boundary. API `_id` stays a string during migration.
- **`RESTORE ... WITH REPLACE` replaces the entire database, including `erp.*` and the database users.** `erp` export/import carryover and re-grants (Plan 01) must work before any real data is stored in `erp`.
- **Single shop:** no tenants, no `tenantId`.
- **Frameworks first:** reports, printing, RBAC, audit and number allocation are built once in Plan 01; modules only add definitions, templates and rules.
- **Reports and printers belong to the module that owns the data**; the central registry only composes navigation and filters.
- **Every write path** checks permission and writes audit in the same transaction as the business write.

## 3. Current ERP target areas

Feature areas found in the latest ERP: `auth`, `business`, `combo-offers`, `commercial`, `customers`, `dashboard`, `employees`, `engagement`, `expenses`, `finance`, `financial`, `inventory`, `online-store`, `payroll`, `pos`, `purchase`, `reports`, `sales`, `suppliers`, `system`, `tenants`, `wholesale`.

- Extend these modules; do not create parallel legacy-style screen silos.
- `tenants`: retire (single shop).
- `finance` vs `financial`: two areas for overlapping work. Choose one canonical home before Plans 19-21.
- `online-store`: no legacy counterpart in this plan. Keep as is and out of scope unless the owner decides otherwise.

## 4. Delivery order

| Phase | Plans | Exit gate |
|---|---|---|
| Phase 0 - Source inventory | 00 | All pages, reports, printers and Mongo models classified and confirmed. |
| Phase 1 - SQL foundation and shared frameworks | 01 | Migrations run on a clean and a restored DB; `erp` carryover drill passes; jest runs `.test.ts`. |
| Phase 2 - Masters, tax engine and barcode identity | 02, 03, 04, 09A, 18A, 34 | Org, staff, product, supplier masters, tax engine and barcode identity on SQL with parity to legacy. |
| Phase 3 - Purchase, GRN and purchase returns | 05, 06, 07 | Purchase -> GRN -> return matches legacy on sample documents, incl. GST and barcodes. |
| Phase 4 - Inventory, barcode lifecycle, rates, printing, transfer, combo | 08, 09B, 10, 11, 12, 13 | Stock, barcode lifecycle, rate changes, labels printing on target printers, transfers and combos reconcile. |
| Phase 5 - Sales, POS and returns | 14, 15 | Bills and returns made in ERP and in legacy appear correctly in each other's reports. |
| Phase 6 - Customers, discounts and commission | 16, 17, 28 | Customer, discount and commission results match legacy on sample data. |
| Phase 7 - GST reports, finance, cash/bank, payments, expenses | 18B, 19, 20, 21, 22 | GST, cash/bank, dues and expense reports reconcile to legacy for a fixed period. |
| Phase 8 - Wholesale and specialty modes | 23, 24, 25, 26, 27 | Each mode passes its purchase and sales acceptance scenarios. |
| Phase 9 - Report registry and approvals | 29, 30 | Report registry complete; approvals enforced. |
| Phase 10 - Restore drills and certification | 31, 32 | Restore and rollback drills pass; parallel-run reconciliation signed off. |
| Phase 11-12 - Cutover, then Mongo removal | 33 | One month-end close on SQL; then Mongo removed and verified. |

No phase is complete because the UI exists. A phase is complete only when data, business rules, reports, printing, security, tests and rollback are verified.

## 5. Plans

### Phase 0 - Source inventory

#### Plan 00 - Baseline and source-to-target inventory

**Priority:** P0 | **Depends on:** - | **Status:** Partial: schema-discovery script written, not yet run  
**Legacy scope:** All 619 ASPX pages, report and printer families, Mongo models  
**Latest ERP target:** - (spreadsheet in the repo)

Freeze scope before coding. The deliverable is one spreadsheet row per page / report / printer / Mongo model.

- Record which Textilesoft source is authoritative: `TEXTILESOFT 17.07.2025` (this plan) or `TEXTILESOFT VIJAYALAKSHMI` (also in the Project folder). They may differ.
- The appendix classification was keyword-based and contained errors (see section 0); every row must be confirmed by opening the page, not by its name.
- Run `textilesoftSchemaDiscovery.ts` on the restored `.BAK` and attach `SCHEMA.md` and `CONCEPTS.md`; that decides which Mongo models map to existing `dbo` tables.
- Capture the legacy `dbo` object list including triggers and procedures, which may enforce rules the ERP must respect.

**Checklist**

- [ ] 619 pages classified and each confirmed against its source
- [ ] The 38 pages still unclassified resolved (proposed homes in Appendix A)
- [ ] Report inventory classified (report family -> owning module)
- [ ] Printer inventory classified (42 variants -> adapters)
- [ ] Duplicate WebForms variants identified (same rule, different copy)
- [ ] Obsolete screens listed and signed off as "do not recreate"
- [ ] Every Mongo model has a disposition: existing `dbo` / new `erp` / drop
- [ ] `dbo` schema snapshot and restore behaviour captured
- [ ] No unknown business capability


### Phase 1 - SQL foundation and shared frameworks

#### Plan 01 - SQL foundation, security and shared frameworks

**Priority:** P0 | **Depends on:** 00 | **Status:** Partial: read/write logins, `WRITE_TABLES` allow-list and post-restore re-grants exist; no `erp` schema, migration runner or `erp` carryover yet  
**Legacy scope:** n/a (platform)  
**Latest ERP target:** `backend/src` database layer, `backend/sql/migrations`

What every later plan depends on. **Expanded from the original:** restore carryover, the report and print frameworks, and the RBAC/audit baseline now live here, because every plan's definition of done requires them.

- **Moved here from Plan 31:** export/import of `erp.*` around any `RESTORE ... WITH REPLACE`. The restore replaces the whole database, `erp` included, so this must work before the first `erp` table holds real data.
- **Moved here from Plans 11 and 29:** the report-definition framework (registry, filters, pagination, export) and the print-job framework (job model, queue, adapter interface). Modules add definitions and templates; they do not build frameworks.
- **Moved here from Plan 30:** RBAC and audit baseline. Every write path checks permission and writes audit in the same transaction.
- One shared document-number allocator (bill no, GRN no, barcode) using Textilesoft formats, locking inside the transaction so it is safe while the legacy app writes the same tables.
- Fix `jest.config.js`: `.test.ts` files are silently skipped today.
- Three logins: READ, WRITE (DML on allow-listed `dbo` tables and on `erp`), ADMIN (migrations, user re-grants, restore). The running app never uses ADMIN.

**Checklist**

- [ ] Shared SQL pool and transaction helper (deadlock retry)
- [ ] Migration runner and `erp.schema_migrations`
- [ ] READ / WRITE / ADMIN logins and `erp` grants, re-applied after restore
- [ ] `erp` export/import carryover around restore, with checksum
- [ ] Report-definition framework
- [ ] Print-job framework and adapter interface
- [ ] RBAC and audit baseline
- [ ] Shared number allocator, safe against concurrent legacy writes
- [ ] Health checks (SQL reachable, migrations current)
- [ ] `jest.config.js` fixed and a first SQL integration test running
- [ ] Migrations run from a clean database and from restored `SSS_copy` without touching `dbo`


### Phase 2 - Masters, tax engine and barcode identity

#### Plan 02 - Organization, company, branch, warehouse, counter and business date

**Priority:** P0 | **Depends on:** 01 | **Status:** SQL adapter exists (`sqlOrg`: company, branch, warehouse, counter, settings); business date and per-counter permissions not confirmed  
**Legacy scope:** companydetail, branchdetail, warehousedetail, countername, AccountDate, LoginOpen, floor/rack setup  
**Latest ERP target:** `system`, `business`

Build organization hierarchy and operating context. Add branch/store/counter permissions and business-date controls. Preserve legacy counter/account-date behavior through services.

- **Tenant removed from the title and target.** The SQL-only decision is single shop: no Tenant model, no `tenants` feature area, no `tenantId`.
- Business date must follow legacy semantics (`AccountDate`, `LoginOpen`).

**Checklist**

- [ ] company/branch/store
- [ ] warehouse/counter
- [ ] business date
- [ ] floor/rack
- [ ] permissions
- [ ] audit
- [ ] Tenant model and `tenants` UI removed

#### Plan 03 - Product master and item catalog

**Priority:** P0 | **Depends on:** 02 | **Status:** SQL adapter exists (`sqlProducts`, `sqlMasters`, `sqlAttributes`); import/export not confirmed  
**Legacy scope:** newproduct, product groups/subgroups, units, HSN, department, fashion/model/design, brand/pattern/size/color/style  
**Latest ERP target:** `inventory/ProductMaster, settings/master-data`

Complete the product master. Keep product identity separate from barcode/SKU identity. Add all textile attributes without changing dbo.

- Product identity stays separate from barcode identity (identity rules in Plan 09A).
- The product request / approval workflow (`NeedProduct*`) belongs to Plan 30, not here.

**Checklist**

- [ ] product CRUD
- [ ] groups/subgroups
- [ ] units
- [ ] HSN
- [ ] attributes
- [ ] import/export
- [ ] Group and sub-group pictures
- [ ] Design master (`purdesign`)

#### Plan 04 - Supplier, agent and vendor master

**Priority:** P0 | **Depends on:** 02 | **Status:** Read-only SQL (`sqlSuppliers`); writes, agents and ledger not built  
**Legacy scope:** supplier screens, AgentView, AgentPaymentEntry, supplier groups, supplier ledger  
**Latest ERP target:** `suppliers, purchase`

Unify supplier master, agents, supplier balances and supplier statements. Preserve agent commission/payment relationships.

- Supplier ledger is derived from the `dbo` supplier tables. Do not create a second supplier ledger in `erp`.
- `agentdetail` belongs here (it was in the unclassified list); `SupplierSticker` printing is a Plan 11 template.

**Checklist**

- [ ] supplier CRUD
- [ ] groups
- [ ] agents
- [ ] ledger
- [ ] payments
- [ ] statements
- [ ] Supplier bank, account number and credit days

#### Plan 09A - Barcode identity and allocation

**Priority:** P0 | **Depends on:** 03, 01 | **Status:** Not started (barcode allocation currently sits inside `sqlPurchase`)  
**Legacy scope:** barcode, barcodetaking, barcodetakingUpdate, barcodeview, BarcodeSetting, CommonBarcodeSetting, NewCounterBarcodeSetting, samebarcodecategoryNameEntry  
**Latest ERP target:** `inventory` (barcode service)

**Split out of Plan 09 and moved before purchase.** Plan 05 creates barcodes, so the identity service has to exist first. Plans 05 and 14 call it; they do not own barcode logic.

- Identity rule (owner statement): a new barcode is created for each purchase, so one barcode is one purchase lot.
- Allocation uses the shared allocator from Plan 01 and locks inside the transaction.

**Checklist**

- [ ] Generate / allocate (one lot per purchase)
- [ ] Lookup
- [ ] Uniqueness and duplicate validation
- [ ] Barcode settings per counter
- [ ] Same-barcode re-entry rules (`samebarcode*` pages)
- [ ] Concurrency test with the legacy app writing

#### Plan 18A - GST and tax engine (calculation and masters)

**Priority:** P0 | **Depends on:** 01, 03 | **Status:** Partial: GST reports read SQL (`sqlGstReports`); a single shared tax engine is not confirmed  
**Legacy scope:** GSTCompany, GSTType, gstgroup, HsnDetails, and the tax logic inside every GST billing and purchase page  
**Latest ERP target:** `finance/gst` (engine), inventory masters

**Split out of Plan 18 and moved early.** Purchase (Plan 05) and sales (Plan 14) both need tax calculation, so it cannot come after them. One tax service and one stored tax snapshot per document; no tax formula is copied into any entry mode.

- About 54 of the 63 pages in the "Tax / GST" category (by name) are sales or purchase entry variants (`AllGST*`, `Gst*Salesentry*`, `GST*Purchase*`). They are modes of Plans 05 and 14 that call this engine, not GST screens.

**Checklist**

- [ ] Tax master, GST company and type settings
- [ ] HSN master
- [ ] CGST / SGST / IGST rules by party state
- [ ] Tax-inclusive and tax-exclusive pricing
- [ ] Rounding rules
- [ ] Tax snapshot stored with each document
- [ ] Tests against real legacy bills

#### Plan 34 - Employees, salesman, cashier and staff masters (new)

**Priority:** P0 | **Depends on:** 01, 02 | **Status:** Mongo only (Employee and 7 other HR models)  
**Legacy scope:** employeecatagary, employeegroup, employeesection, newemployee, newEmployeeWithoutCommission, cashiername, SupervisorNameEntry, CustomerStaffNameEntry, purinch  
**Latest ERP target:** `employees`, `sales`, `payroll` (masters only)

**Missing from the original plan.** The ERP already has `employees` and `payroll` areas and the legacy app has staff pages, but no plan owned them. Sales, commission, cash and reports all need salesman / cashier / supervisor / incharge masters first.

- Read the attendance decision notes before designing attendance and payroll tables, so they match how attendance is actually taken.
- Payroll runs and payslips stay later work; only the masters are needed by Phase 5.

**Checklist**

- [ ] Employee master, groups, sections, categories
- [ ] Salesman, cashier, supervisor, incharge masters
- [ ] Link staff to the Textilesoft login (`dbo.newuser`)
- [ ] Commission-eligible flag (used by Plan 28)
- [ ] Permissions and audit


### Phase 3 - Purchase, GRN and purchase returns

#### Plan 05 - Purchase and GRN

**Priority:** P0 | **Depends on:** 03, 04, 09A, 18A | **Status:** GRN SQL write exists (`sqlPurchase`); GST / small / fancy / department / wholesale modes not confirmed  
**Legacy scope:** purchase entry variants, GST purchase, small purchase, fancy purchase, department purchase, wholesale purchase, appliance/grocery/gift purchase  
**Latest ERP target:** `purchase`, `wholesale` (modes only)

Create one purchase engine with configurable document modes instead of separate copies. Support header/items, discounts, tax, rates, barcode creation and stock receipt.

- One purchase engine with a document-mode configuration. The ten `WRPurchase*` pages and the GST, small, fancy, department, appliance, grocery and gift variants are modes, not copies.
- Barcode creation calls the Plan 09A service; tax calls the Plan 18A engine.
- Purchase discount-scheme pages (`NewPurchaseDiscountEntry*`, `GiftNewPurchaseDiscountSchemaEntry*`) belong here and to Plan 17. The `GiftNew...` ones were wrongly listed as printers.
- Plan 05 owns the purchase entry and its modes; Plan 06 owns PO, receiving and the GRN document workflow.

**Checklist**

- [ ] normal purchase
- [ ] GST purchase
- [ ] small purchase
- [ ] specialty modes
- [ ] wholesale
- [ ] GRN
- [ ] reports
- [ ] Barcode creation via the Plan 09A service
- [ ] Tax via the Plan 18A engine

#### Plan 06 - Purchase order and GRN workflow

**Priority:** P0 | **Depends on:** 05 | **Status:** SQL adapter exists (`sqlPurchaseOrder`, added 2026-09-30); approval, bill and payment hand-off not confirmed  
**Legacy scope:** purchase order pages, GRN view/update, invoice purchase, invoice purchase transactions  
**Latest ERP target:** `purchase`

Implement PO → receipt → GRN → purchase bill/payment flow. Preserve partial receipt and outstanding behavior.

- Boundary with Plan 05: this plan owns PO, partial receipt, the GRN document and the hand-off to bill and payment.

**Checklist**

- [ ] PO
- [ ] approval
- [ ] GRN
- [ ] bill
- [ ] outstanding
- [ ] payment

#### Plan 07 - Purchase returns

**Priority:** P0 | **Depends on:** 05, 06 | **Status:** SQL adapter exists (`sqlPurchaseReturn`, added 2026-09-30)  
**Legacy scope:** purchase return pages, supplier-wise return, gift purchase return, barcode-wise purchase return  
**Latest ERP target:** `purchase/PurchaseReturn`

Implement return against GRN/barcode with stock reversal, supplier balance adjustment, tax reversal and audit.

- Keep the three legacy references distinct: return document `rgrno`, original purchase `grn_no`, supplier return reference `sup_retu_grn`.
- Pages scattered elsewhere: `PurchaseReturnBillView` (was filed under sales returns), `PurchaseReturnBarcodewise` (under barcode), `PurchaseReturnNegativeQty`, `Giftpurchaseretrun`, `PurchSupplierWiseReturn`, `NewPurchaseReturn`, `purchaseretrun`.

**Checklist**

- [ ] barcode return
- [ ] GRN return
- [ ] supplier balance
- [ ] GST reversal
- [ ] reports


### Phase 4 - Inventory, barcode lifecycle, rates, printing, transfer, combo

#### Plan 08 - Inventory core and stock

**Priority:** P0 | **Depends on:** 05, 09A | **Status:** SQL reads/reports exist (`sqlStockReports`); damage, missing and write-off writes not confirmed  
**Legacy scope:** stock reports, current stock, group/brand/city/floor/rack/model stock, minimum quantity, missing/damage/write-off  
**Latest ERP target:** `inventory, reports/stock`

Stock balances and movements, built as a service over the existing Textilesoft stock tables.

- **Changed from "build a stock ledger".** While the legacy app runs in parallel, `dbo.stockdetails` stays the single source of truth. A second balance or ledger in `erp` would drift from it. `erp` holds only audit and adjustment documents the ERP itself creates.
- Barcode is the identity (Plan 09A). Support quantity, free quantity and meter-based stock.

**Checklist**

- [ ] current stock
- [ ] location stock
- [ ] minimum qty
- [ ] aged/dead stock
- [ ] write-off
- [ ] reconciliation
- [ ] Stock service over `dbo.stockdetails` (no parallel balance)
- [ ] Stock adjustment (`stockaj`) with audit

#### Plan 09B - Barcode lifecycle

**Priority:** P1 | **Depends on:** 08, 09A | **Status:** Not started  
**Legacy scope:** BarcodetakingMove, WSbarcodeview, CustomWiseBarcode, and the variant generators GarmentBarcode, Giftbarcode, WRBarcode, InvoiceBarcode, ApplianceCategoryBarcode  
**Latest ERP target:** `inventory`

Movement, history and the variant barcode generators, on top of the Plan 09A identity service.

- Check whether the variant generator pages contain print code. If so the print part goes to Plan 11 templates and the rest is configuration of 09A.

**Checklist**

- [ ] Move / reassign
- [ ] History
- [ ] Void and replace
- [ ] Variant generators as configuration
- [ ] Link to reprint (Plan 11)

#### Plan 10 - Barcode pricing, MRP and rate revisions

**Priority:** P1 | **Depends on:** 09A | **Status:** Not started (confirm)  
**Legacy scope:** barcoderatechange, samebarcoderatechange, MRP/rate pages, wholesale/small/fancy/invoice/combo rate changes  
**Latest ERP target:** `inventory, purchase/rate-revisions`

Create one rate revision engine with mode-specific rules. Preserve price history and current price separately.

- Current price stays in the `dbo` tables the legacy app reads. Price history goes to `erp` only if the legacy schema has none (check `CONCEPTS.md`).

**Checklist**

- [ ] MRP
- [ ] sale rate
- [ ] cost rate
- [ ] commission rate
- [ ] rate history
- [ ] cancellation/reversal

#### Plan 11 - Barcode printing and label templates

**Priority:** P1 | **Depends on:** 01, 09A | **Status:** `ReprintQueue` exists as a Mongo model only; no printer adapters confirmed  
**Legacy scope:** Zebra TLP2844 / ZD220 / ZD230 / GC420T, TSC TTP-244, TVS LP44 / LP45 Lite / LP46 NEO, Citizen 621, GODEX barcode and combo pages; sticker and print settings (42 variants, Appendix B)  
**Latest ERP target:** `inventory/reprint`, `system/print settings`

The print framework is built in Plan 01. This plan adds label templates and printer adapters for the 42 variants and the reprint queue.

- Printer list in the original omitted **Zebra GC420T** (`ZeabraGC420T.aspx`, misspelled in the source so it was missed) and wrongly included three purchase discount pages.
- Customer, supplier, salesman and pattern/size sticker templates are owned by their own modules but print through this framework.

**Checklist**

- [ ] template engine
- [ ] printer profiles
- [ ] queue
- [ ] retry
- [ ] reprint
- [ ] audit

#### Plan 12 - Material and store transfer

**Priority:** P1 | **Depends on:** 08, 09B | **Status:** Mongo only (`StockTransfer`, `GRNTransfer`)  
**Legacy scope:** MaterialTransfer, BarcodewiseMaterialTransfer, GRNwiseMaterialTransfer, StoreTransfer, received flows  
**Latest ERP target:** `inventory/stock-transfer`

Transfer request -> issue -> transit -> receive, with explicit transfer status and source / destination locations. Stock quantity continues to live in the existing Textilesoft stock tables.

- **Changed from "use a stock ledger".** Quantity authority stays in `dbo`.
- Open question to confirm in the legacy pages: does the legacy app have an in-transit state? If not, keep transit documents in `erp.transfer_*` and move quantity in `dbo` at receive.

**Checklist**

- [ ] create
- [ ] barcode transfer
- [ ] GRN transfer
- [ ] receive
- [ ] cancel
- [ ] reconciliation

#### Plan 13 - Combo offers and combo inventory

**Priority:** P1 | **Depends on:** 03, 08, 09A, 10 | **Status:** Mongo only (`ComboOffer`)  
**Legacy scope:** ComboOfferEntry/Edit, single/multi MRP, combo product name, SuperCombo, barcodewise combo, combo stock  
**Latest ERP target:** `combo-offers, inventory`

Implement normalized combo definition, components, quantity rules, price tiers, barcode/virtual identity, sale allocation and returns. Treat physical-vs-virtual combo barcode as an explicit decision.

- Decide before building: physical vs virtual combo barcode; how combos stack with discounts (Plan 17); how combo returns restore stock.
- The 14 `Combo*` / `MultiCombo*` printer pages are Plan 11 templates, not combo screens.

**Checklist**

- [ ] offer master
- [ ] components
- [ ] qty sets
- [ ] price tiers
- [ ] barcode
- [ ] POS matching
- [ ] returns
- [ ] stock


### Phase 5 - Sales, POS and returns

#### Plan 14 - Sales POS and cash billing

**Priority:** P1 | **Depends on:** 08, 09A, 18A, 34 | **Status:** POS SQL writer exists (`sqlPosWriter`) and SQL invoice reads; mode variants not confirmed  
**Legacy scope:** SaleBillCash, GST sales entry variants, invoice entry, barcode sales, credit/retail/wholesale sales, POS bills  
**Latest ERP target:** `pos, sales, wholesale`

Create one sales engine with modes for retail, GST, credit, wholesale, gift, electrical, grocery and textile. POS owns cart, billing, payment, stock commit and receipt generation.

- One sales engine with modes (retail, GST, credit, wholesale, gift, electrical, grocery). Decide in Plan 00 whether `TeaShopSalesEntry`, `TouchBillingEntryNewAll` and `samplesalesentry` are modes or obsolete.
- **Added (missing in original):** sales orders and order delivery (`SalesOrderEntry`, `SaleOrders`, `salesorder`, `OrderDeliverySalesentryNewsaleAll`), bill hold / pending / cancelled handling (`billcontinue`, `Pending*CashBillView`), and `SuperBill*`.
- Tax via the Plan 18A engine; barcode via Plan 09A; salesman via Plan 34.

**Checklist**

- [ ] scan
- [ ] cart
- [ ] discount
- [ ] tax
- [ ] payment
- [ ] invoice
- [ ] hold/recover
- [ ] reprint
- [ ] Sales orders and order delivery
- [ ] Pending / cancelled bill handling

#### Plan 15 - Sales returns and exchange

**Priority:** P1 | **Depends on:** 14 | **Status:** SQL adapter exists (`sqlSalesReturn`, added 2026-09-30)  
**Legacy scope:** sales return/edit/return bill, exchange, invoice return, barcode return  
**Latest ERP target:** `sales/returns, pos`

Implement full/partial returns and exchange with stock reversal/re-entry and payment/refund adjustment.

**Checklist**

- [ ] full return
- [ ] partial return
- [ ] exchange
- [ ] refund
- [ ] stock reversal
- [ ] audit


### Phase 6 - Customers, discounts and commission

#### Plan 16 - Customer, credit, loyalty and engagement

**Priority:** P1 | **Depends on:** 14 | **Status:** Mongo only (`Customer`, loyalty); dashboard Customer Base and Top Outstanding Dues still read Mongo  
**Legacy scope:** customer master, credit payment, customer ledger, points, festival, relationship, response, customer reports  
**Latest ERP target:** `customers, engagement`

Unify customer master, credit, loyalty, customer history and engagement. Keep financial ledger separate from CRM profile.

- Check `CONCEPTS.md` first: if Textilesoft already has customer tables, use them instead of creating `erp.customer`.
- Customer staff names (`CustomerStaffNameEntry`) moved to Plan 34.

**Checklist**

- [ ] master
- [ ] ledger
- [ ] dues
- [ ] payment
- [ ] points
- [ ] groups
- [ ] reports

#### Plan 17 - Discounts and promotions

**Priority:** P1 | **Depends on:** 14 | **Status:** Mongo only; no SQL path  
**Legacy scope:** DiscountOfferEntry, InvoicePriceOfferEntry, BarcodeWiseDiscount, ProductWiseDiscount, DateWiseProductDiscount, DepartmentDiscountWSREntry*, purchase discount schemes, FreeQtyEntry, freeproduct, discountpermission  
**Latest ERP target:** `inventory`, `sales`

Rules engine for discounts, offers and department pricing. Precedence and stacking are explicit. **Commission removed from this plan** (it was duplicated here and in Plan 28).

- Write the precedence order down before coding (item, barcode, department, invoice, combo, loyalty).

**Checklist**

- [ ] discount rules
- [ ] offers
- [ ] precedence
- [ ] approval
- [ ] audit

#### Plan 28 - Commission and salesperson settlement

**Priority:** P2 | **Depends on:** 14, 34 | **Status:** Mongo only (`CommissionRule`)  
**Legacy scope:** All commission pages: ProductWiseCommission, RangeWiseCommission, PCSwiseProductCommission, BarcodeWiseCommission, SalesManAGEwiseProductCommission, SpecialSalesmanCommission, newSalesmanCommission, FloorWiseSectionCommissionReport, DaysFromComission, DaysFromComissionNew, Daysfrom (+ barcoderatechangecommission, newProductCommission, newProductWithoutCommission, NewCounterCommBarcodeSetting)  
**Latest ERP target:** `sales`, `employees`, `payroll`, `reports`

Create commission calculation and settlement service linked to sale lines and salesperson/agent context.

- **Owns all commission work.** The original appendix filed only 2 pages under "Commission"; about 14 more were spread across five other categories.

**Checklist**

- [ ] rule master
- [ ] sale calculation
- [ ] settlement
- [ ] reports
- [ ] audit


### Phase 7 - GST reports, finance, cash/bank, payments, expenses

#### Plan 18B - GST returns and statutory reports

**Priority:** P1 | **Depends on:** 05, 14, 15, 18A | **Status:** Partial: GST reports read SQL (`sqlGstReports`)  
**Legacy scope:** gstreport, igstreport, newgstreport, CatagaryWisegstreport, PurchaseBillViewWOGST, GST sales and purchase views  
**Latest ERP target:** `finance/gst`, `reports/gst`

Statutory reports on top of the Plan 18A engine.

- Owner decision already taken: a Purchase GST Register (ITC) replaces GSTR-2.

**Checklist**

- [ ] Sales GST report
- [ ] Purchase GST Register (ITC)
- [ ] Return and credit-note impact
- [ ] Category-wise and IGST reports
- [ ] Reconcile against legacy GST reports

#### Plan 19 - Cash, bank, petty cash and day-end

**Priority:** P2 | **Depends on:** 14, 16 | **Status:** Mongo only for ERP data; finance reads partly SQL (`sqlFinance`)  
**Legacy scope:** CashInOut, cash reports, closing cash, bank transactions, deposits, petty cash, cheque, cashier reports  
**Latest ERP target:** `financial/Cashbank, finance`

Implement cash/bank ledger, cashier sessions, day-end closing, deposits, petty cash and cheque lifecycle.

- The ERP has both `finance` and `financial` feature areas. Pick one canonical home before building, so the work does not split across two.
- Card swipe machines (`SwipeMachineDetails`, `CardTerminal`) and `paymenttype` / `CashNameEntry` belong here.

**Checklist**

- [ ] opening
- [ ] cash in/out
- [ ] cashier
- [ ] bank
- [ ] cheque
- [ ] day-end
- [ ] reconciliation
- [ ] Card terminals / swipe machines
- [ ] Payment types

#### Plan 20 - Payments, receivables, payables and dues

**Priority:** P2 | **Depends on:** 04, 16, 19 | **Status:** Mongo only  
**Legacy scope:** customer/supplier payment pages, invoice payment, purchase payment, dues, balance reports  
**Latest ERP target:** `financial, customers, suppliers, purchase, sales`

Create unified payment allocation and ledger services for customer and supplier sides.

- Allocation must preserve legacy payment semantics; check the legacy payment tables first (`CONCEPTS.md`).

**Checklist**

- [ ] receive
- [ ] pay
- [ ] allocate
- [ ] partial
- [ ] advance
- [ ] outstanding
- [ ] statements

#### Plan 21 - Finance, journals, loans and EMI

**Priority:** P2 | **Depends on:** 18B, 19, 20 | **Status:** Mongo only for journals, loans and EMI  
**Legacy scope:** DayBook, account, journal, loan, EMI, bank reconciliation, financial reports  
**Latest ERP target:** `financial, finance`

Implement accounting/finance services while retaining legacy dbo financial data where authoritative. Add journal posting and reconciliation controls.

- Owner decision: Trial Balance and Balance Sheet stay "Coming soon" until every transaction posts to a ledger.

**Checklist**

- [ ] journal
- [ ] day book
- [ ] bank reconciliation
- [ ] loans
- [ ] EMI
- [ ] finance reports

#### Plan 22 - Expenses and cash expenses

**Priority:** P2 | **Depends on:** 19 | **Status:** Mongo only  
**Legacy scope:** ExpensesReport, ExpenseBillView, ExpenseInOutReport, recurring expenses  
**Latest ERP target:** `expenses`

Implement expense categories, entries, recurring expenses, approvals, payment source and reporting.

- Replaces the earlier "expenses stay on MongoDB" decision: expenses move to `erp.expense*` under the SQL-only strategy. `ExpansesBillview` moved here from sales.

**Checklist**

- [ ] categories
- [ ] entry
- [ ] recurring
- [ ] approval
- [ ] payment
- [ ] reports


### Phase 8 - Wholesale and specialty modes

#### Plan 23 - Wholesale / WSR rates and reports

**Priority:** P2 | **Depends on:** 05, 14 | **Status:** Not started  
**Legacy scope:** WR purchase/sales pages, WSR rate, WSR stock/sales reports  
**Latest ERP target:** `wholesale`

**Narrowed.** Wholesale purchase and sales documents are modes of Plans 05 and 14 (the original listed `wholesale` as a target in both and again here). This plan covers WSR rates, party rules and WSR reports only.

- Avoid a second wholesale engine.

**Checklist**

- [ ] WSR rates
- [ ] Wholesale party rules
- [ ] WSR stock and sales reports
- [ ] Mode acceptance tests for purchase and sales

#### Plan 24 - Gift module

**Priority:** P2 | **Depends on:** 05, 14 | **Status:** Not started  
**Legacy scope:** Gift purchase/sales, gift barcode, gift supplier, gift reports  
**Latest ERP target:** `inventory, purchase, sales`

Implement gift items as a configurable item category/mode, not a duplicate ERP engine.

- Mode of Plans 05 and 14. The `GiftNewPurchaseDiscountSchema*` pages are purchase discount schemes, not printers.

**Checklist**

- [ ] gift master
- [ ] purchase
- [ ] barcode
- [ ] sales
- [ ] return
- [ ] reports

#### Plan 25 - Grocery mode

**Priority:** P2 | **Depends on:** 05, 14 | **Status:** Not started  
**Legacy scope:** GroceryNewProductEntry, GrocerySalesEntry, GroceryModewiseReport  
**Latest ERP target:** `inventory, pos, reports`

Implement grocery as a product/measurement mode supporting weight/unit sale and mode-specific reporting.

- Mode of Plans 05 and 14.

**Checklist**

- [ ] product mode
- [ ] unit/weight
- [ ] POS
- [ ] stock
- [ ] report

#### Plan 26 - Electrical / appliance mode

**Priority:** P2 | **Depends on:** 05, 14 | **Status:** Not started  
**Legacy scope:** ElectricalSalesEntry, Electrical reports, Appliance purchase, model-number stock, appliance barcode  
**Latest ERP target:** `inventory, purchase, sales, reports`

Implement appliance/electrical attributes such as model number and category. Serialized/asset-like units must remain linked to barcode/stock.

- Mode of Plans 05 and 14.

**Checklist**

- [ ] appliance master
- [ ] model no
- [ ] purchase
- [ ] sales
- [ ] stock
- [ ] reports

#### Plan 27 - Fancy / garment / textile specialty modes

**Priority:** P2 | **Depends on:** 05, 14 | **Status:** Not started  
**Legacy scope:** FancyPurchaseEntry, Fancy rate pages, GarmentBarcode, textile attributes  
**Latest ERP target:** `purchase, inventory, barcode`

Implement specialty behavior as configuration around common product/barcode engines. Do not fork the stock engine.

- Mode of Plans 05 and 14; do not fork the stock engine.

**Checklist**

- [ ] textile attributes
- [ ] fancy purchase
- [ ] garment labels
- [ ] pricing
- [ ] stock


### Phase 9 - Report registry and approvals

#### Plan 29 - Report registry and cross-module analytics

**Priority:** P2 | **Depends on:** all report definitions | **Status:** Partial: SQL report adapters exist for sales, stock, party, GST, finance and dashboard  
**Legacy scope:** all Crystal report families and WebForms report pages  
**Latest ERP target:** `reports + owning modules`

**Narrowed.** The framework moved to Plan 01 and each module ships its own report definitions. This plan is the navigation registry, shared filters and analytics that span modules.

- Do not recreate one React page per Crystal `.rpt`.

**Checklist**

- [ ] report registry
- [ ] filters
- [ ] pagination
- [ ] export
- [ ] print
- [ ] reconciliation

#### Plan 30 - Approvals and operational controls

**Priority:** P2 | **Depends on:** 01, 08, 14, 15 | **Status:** Partial: `AuditLog` / `Role` in Mongo; login uses `dbo.newuser` rights  
**Legacy scope:** NeedProductApproval/Edit, login/cash controls, audit, account-date controls  
**Latest ERP target:** `auth, system, settings`

**Narrowed.** RBAC and the audit baseline moved to Plan 01. This plan adds approval workflows and operational controls on top.

- `NeedProductApproval` / `NeedProductEdit` / `NeedProductEntry` (product request workflow) belong here.

**Checklist**

- [ ] approvals
- [ ] session controls
- [ ] device controls
- [ ] restore controls
- [ ] Product request and approval workflow
- [ ] Price-change and discount approval


### Phase 10 - Restore drills and certification

#### Plan 31 - Restore drills and disaster recovery

**Priority:** P2 | **Depends on:** 01 | **Status:** Partial: `sqlRestoreService` with bill carryover exists; `erp` carryover is built in Plan 01  
**Legacy scope:** SuperReset, AccountDateSharing, restore-related operational pages  
**Latest ERP target:** `system/Sync`

**Narrowed.** Carryover implementation moved to Plan 01. This plan runs the drills and operational procedures.

- A restore also drops the database users; re-grants run automatically (`ensureErpDbAccess`) and must include `erp`.

**Checklist**

- [ ] Restore drill with real `erp` data
- [ ] Re-grant of READ / WRITE logins incl. `erp`
- [ ] Checksum verification
- [ ] Newer local bills re-applied, no duplicates
- [ ] Rollback drill
- [ ] Scheduled native backups (SQL `BACKUP DATABASE`)

#### Plan 32 - Testing and parity certification

**Priority:** P3 | **Depends on:** all | **Status:** Partial: `.test.ts` files are not executed until the Plan 01 fix  
**Legacy scope:** all transaction/report/printer variants  
**Latest ERP target:** `all modules`

For each plan create unit, integration, SQL parity and UI/E2E tests. Test legacy examples against the new result set where source data is available.

- Add **parallel-run reconciliation**: the shop runs both billing systems, so compare real bills, stock and GST totals created in each for the same period.

**Checklist**

- [ ] unit
- [ ] SQL integration
- [ ] E2E
- [ ] report parity
- [ ] printer tests
- [ ] rollback
- [ ] Parallel-run reconciliation against live legacy data


### Phase 11-12 - Cutover, then Mongo removal

#### Plan 33 - Cutover (Phase 11) and Mongo removal (Phase 12)

**Priority:** P3 | **Depends on:** 32 | **Status:** Not started  
**Legacy scope:** all Mongo repositories/models/config  
**Latest ERP target:** `whole ERP`

Freeze writes, migrate final data, validate SQL-only runtime, remove Mongo dependencies, then monitor and retain rollback release.

- Two gates: cutover is complete only after one month-end close on SQL; Mongo removal happens after that, never together with cutover.

**Checklist**

- [ ] Freeze Mongo writes
- [ ] Final import of setup/master data into `erp`
- [ ] Reconciliation
- [ ] SQL-only runtime verified
- [ ] Monitoring
- [ ] Rollback release retained
- [ ] Mongo removal: dependency, models, config, scripts, docker, docs
- [ ] `grep -ri mongo` returns nothing; app boots with no MongoDB

## 6. Completion matrix

| Plan | Module | Phase | Priority | Depends on | Status | Work |
|---|---|---|---|---|---|---|
| 00 | Baseline and source-to-target inventory | 0 | P0 | - | Partial: schema-discovery script written, not yet run | Finish |
| 01 | SQL foundation, security and shared frameworks | 1 | P0 | 00 | Partial: read/write logins, `WRITE_TABLES` allow-list and post-restore re-grants exist; no `erp` schema, migration runner or `erp` carryover yet | Finish |
| 02 | Organization, company, branch, warehouse, counter and business date | 2 | P0 | 01 | SQL adapter exists (`sqlOrg`: company, branch, warehouse, counter, settings); business date and per-counter permissions not confirmed | Parity + gaps |
| 03 | Product master and item catalog | 2 | P0 | 02 | SQL adapter exists (`sqlProducts`, `sqlMasters`, `sqlAttributes`); import/export not confirmed | Parity + gaps |
| 04 | Supplier, agent and vendor master | 2 | P0 | 02 | Read-only SQL (`sqlSuppliers`); writes, agents and ledger not built | Extend (writes) |
| 09A | Barcode identity and allocation | 2 | P0 | 03, 01 | Not started (barcode allocation currently sits inside `sqlPurchase`) | Build |
| 18A | GST and tax engine (calculation and masters) | 2 | P0 | 01, 03 | Partial: GST reports read SQL (`sqlGstReports`); a single shared tax engine is not confirmed | Finish |
| 34 | Employees, salesman, cashier and staff masters (new) | 2 | P0 | 01, 02 | Mongo only (Employee and 7 other HR models) | Port from Mongo |
| 05 | Purchase and GRN | 3 | P0 | 03, 04, 09A, 18A | GRN SQL write exists (`sqlPurchase`); GST / small / fancy / department / wholesale modes not confirmed | Parity + gaps |
| 06 | Purchase order and GRN workflow | 3 | P0 | 05 | SQL adapter exists (`sqlPurchaseOrder`, added 2026-09-30); approval, bill and payment hand-off not confirmed | Parity + gaps |
| 07 | Purchase returns | 3 | P0 | 05, 06 | SQL adapter exists (`sqlPurchaseReturn`, added 2026-09-30) | Parity + gaps |
| 08 | Inventory core and stock | 4 | P0 | 05, 09A | SQL reads/reports exist (`sqlStockReports`); damage, missing and write-off writes not confirmed | Parity + gaps |
| 09B | Barcode lifecycle | 4 | P1 | 08, 09A | Not started | Build |
| 10 | Barcode pricing, MRP and rate revisions | 4 | P1 | 09A | Not started (confirm) | Build |
| 11 | Barcode printing and label templates | 4 | P1 | 01, 09A | `ReprintQueue` exists as a Mongo model only; no printer adapters confirmed | Build |
| 12 | Material and store transfer | 4 | P1 | 08, 09B | Mongo only (`StockTransfer`, `GRNTransfer`) | Port from Mongo |
| 13 | Combo offers and combo inventory | 4 | P1 | 03, 08, 09A, 10 | Mongo only (`ComboOffer`) | Port from Mongo |
| 14 | Sales POS and cash billing | 5 | P1 | 08, 09A, 18A, 34 | POS SQL writer exists (`sqlPosWriter`) and SQL invoice reads; mode variants not confirmed | Parity + gaps |
| 15 | Sales returns and exchange | 5 | P1 | 14 | SQL adapter exists (`sqlSalesReturn`, added 2026-09-30) | Parity + gaps |
| 16 | Customer, credit, loyalty and engagement | 6 | P1 | 14 | Mongo only (`Customer`, loyalty); dashboard Customer Base and Top Outstanding Dues still read Mongo | Port from Mongo |
| 17 | Discounts and promotions | 6 | P1 | 14 | Mongo only; no SQL path | Port from Mongo |
| 28 | Commission and salesperson settlement | 6 | P2 | 14, 34 | Mongo only (`CommissionRule`) | Port from Mongo |
| 18B | GST returns and statutory reports | 7 | P1 | 05, 14, 15, 18A | Partial: GST reports read SQL (`sqlGstReports`) | Finish |
| 19 | Cash, bank, petty cash and day-end | 7 | P2 | 14, 16 | Mongo only for ERP data; finance reads partly SQL (`sqlFinance`) | Port from Mongo |
| 20 | Payments, receivables, payables and dues | 7 | P2 | 04, 16, 19 | Mongo only | Port from Mongo |
| 21 | Finance, journals, loans and EMI | 7 | P2 | 18B, 19, 20 | Mongo only for journals, loans and EMI | Port from Mongo |
| 22 | Expenses and cash expenses | 7 | P2 | 19 | Mongo only | Port from Mongo |
| 23 | Wholesale / WSR rates and reports | 8 | P2 | 05, 14 | Not started | Build |
| 24 | Gift module | 8 | P2 | 05, 14 | Not started | Build |
| 25 | Grocery mode | 8 | P2 | 05, 14 | Not started | Build |
| 26 | Electrical / appliance mode | 8 | P2 | 05, 14 | Not started | Build |
| 27 | Fancy / garment / textile specialty modes | 8 | P2 | 05, 14 | Not started | Build |
| 29 | Report registry and cross-module analytics | 9 | P2 | all report definitions | Partial: SQL report adapters exist for sales, stock, party, GST, finance and dashboard | Finish |
| 30 | Approvals and operational controls | 9 | P2 | 01, 08, 14, 15 | Partial: `AuditLog` / `Role` in Mongo; login uses `dbo.newuser` rights | Finish |
| 31 | Restore drills and disaster recovery | 10 | P2 | 01 | Partial: `sqlRestoreService` with bill carryover exists; `erp` carryover is built in Plan 01 | Finish |
| 32 | Testing and parity certification | 10 | P3 | all | Partial: `.test.ts` files are not executed until the Plan 01 fix | Finish |
| 33 | Cutover (Phase 11) and Mongo removal (Phase 12) | 11 | P3 | 32 | Not started | Build |

## 7. Report placement rule

- Sales reports -> `reports/sales` or the sales feature.
- Purchase / GRN reports -> `reports/purchase`.
- Stock reports -> `reports/stock` (includes the supplier-wise and gift stock reports that were filed under suppliers).
- Customer reports -> `reports/customers`.
- Supplier reports -> `reports/suppliers`.
- GST reports -> `reports/gst`.
- Cash / bank / expense reports -> `reports/finance`.
- Commission reports -> sales / commission.
- Wholesale reports -> wholesale.
- Combo stock and offer reports -> combo / inventory.

Do not recreate one React page for every Crystal `.rpt`. Variants that differ only by grouping, printer format or filter share one SQL report definition with a configurable view. The framework is built in Plan 01; modules add definitions.

## 8. Printer placement rule

- Barcode printers -> Inventory / Barcode (Plans 09B, 11).
- Combo barcode printers -> Combo / Inventory (Plan 13 templates on the Plan 11 adapters).
- Sales bill printers -> Sales / POS.
- Purchase documents -> Purchase.
- Customer, supplier, salesman and pattern/size labels -> their own module templates, printed through the shared framework.
- Common printer settings -> System / Print settings.

Supported variants (Appendix B): Zebra TLP2844, ZD220, ZD230, **GC420T**; TSC / TTP-244; TVS LP44, LP45 Lite, LP46 NEO; Citizen 621; GODEX; raw PRN / `PrintBarCode.exe` workflows. Printers are infrastructure, not a business module.

## 9. Appendix A - Legacy page classification (corrected)

Heuristic scope inventory, not a requirement to recreate each screen. Counts total **619**. Pages moved from the original classification are listed first.

### Pages moved from the original classification

| Page | Was | Now |
|---|---|---|
| `BarcodeWiseCommission.aspx` | Barcode / Rate / Pricing | Commission |
| `cashiername.aspx` | Finance / Cash / Banking | Employees / Staff masters (new) |
| `CustomerStaffNameEntry.aspx` | Customer / Loyalty | Employees / Staff masters (new) |
| `Daysfrom.aspx` | Needs manual classification | Commission |
| `employeecatagary.aspx` | Needs manual classification | Employees / Staff masters (new) |
| `employeegroup.aspx` | Needs manual classification | Employees / Staff masters (new) |
| `employeesection.aspx` | Needs manual classification | Employees / Staff masters (new) |
| `ExpansesBillview.aspx` | Sales / POS / Billing | Finance / Cash / Banking |
| `FloorWiseSectionCommissionReport.aspx` | Inventory / Stock | Commission |
| `GiftSupplierWiseStockReport.aspx` | Supplier / Purchase | Inventory / Stock |
| `GODEX.aspx` | Needs manual classification | Printing / Documents |
| `GODEXOLD.aspx` | Needs manual classification | Printing / Documents |
| `MissingStockReport.aspx` | Tax / GST | Inventory / Stock |
| `newemployee.aspx` | Needs manual classification | Employees / Staff masters (new) |
| `newEmployeeWithoutCommission.aspx` | Barcode / Rate / Pricing | Employees / Staff masters (new) |
| `newSalesmanCommission.aspx` | Sales / POS / Billing | Commission |
| `PatternAndSizeWiseSalesReportQty.aspx` | Product / Master Data | Reports / Analytics |
| `PCSwiseProductCommission.aspx` | Barcode / Rate / Pricing | Commission |
| `ProductWiseCommission.aspx` | Barcode / Rate / Pricing | Commission |
| `PurchaseReturnBillView.aspx` | Sales Returns / Exchange | Supplier / Purchase |
| `RangeWiseCommission.aspx` | Barcode / Rate / Pricing | Commission |
| `SalesManAGEwiseProductCommission.aspx` | Sales / POS / Billing | Commission |
| `SpecialSalesmanCommission.aspx` | Sales / POS / Billing | Commission |
| `SupervisorNameEntry.aspx` | Needs manual classification | Employees / Staff masters (new) |
| `SupplierPatternandSizeWiseStockReportQty.aspx` | Supplier / Purchase | Inventory / Stock |
| `SupplierPatternBrandandSizeWiseStockReportQty.aspx` | Supplier / Purchase | Inventory / Stock |
| `tscte244.aspx` | Needs manual classification | Printing / Documents |
| `TSCTTP244PRO.aspx` | Needs manual classification | Printing / Documents |
| `TVSLP45Lite.aspx` | Needs manual classification | Printing / Documents |
| `TVSLP45Litenew.aspx` | Needs manual classification | Printing / Documents |
| `ZeabraGC420T.aspx` | Needs manual classification | Printing / Documents |
| `zebrazd220.aspx` | Needs manual classification | Printing / Documents |

### Security / Platform / Administration (47 pages)

`AccountDate.aspx`, `AccountDateAllUser.aspx`, `accountdateset.aspx`, `AccountDateSharing.aspx`, `AccountNoEntry.aspx`, `AccountType.aspx`, `branchdetail.aspx`, `caser_login.aspx`, `CashInOutLogin.aspx`, `ClientEntry.aspx`, `ClientEntryNew.aspx`, `ClientEntrySuper.aspx`, `commonsettings.aspx`, `counternameentry.aspx`, `Default.aspx`, `Default2.aspx`, `deleteuser.aspx`, `EXCashInOutLogin.aspx`, `HeaderFooterEntry.aspx`, `login.aspx`, `LoginClosingpattyCash.aspx`, `LoginClosingpattyCashDateWise.aspx`, `LoginOpen.aspx`, `LoginOpenpattyCash.aspx`, `LoginWholeSaleClosingpattyCash.aspx`, `LoginWiseReport.aspx`, `LoginWiseSalesSummaryReport.aspx`, `LoginWiseSummaryReport.aspx`, `Multitab.aspx`, `NewAccountDate.aspx`, `NewCashInOutLogin.aspx`, `NewCounterPrintSetting.aspx`, `NewCounterSalesIDsetting.aspx`, `NewCounterSetting.aspx`, `newuser.aspx`, `NewUserAddRightsEntry.aspx`, `NewUserCashFocusSetting.aspx`, `NewUserSalesFocusSetting.aspx`, `SuperAdminLogin.aspx`, `SuperAdminLoginMaster.aspx`, `SuperBillNewCounter.aspx`, `Supernewuser.aspx`, `SuperReset.aspx`, `SuperResetNew.aspx`, `userpermission.aspx`, `UserWisepattyCash.aspx`, `WRSalesLogin.aspx`

### Product / Master Data (33 pages)

`BrandWiseMinimumQtyEntry.aspx`, `CashGroupName.aspx`, `DepartmentDiscountWSREntry2.aspx`, `DepartmentDiscountWSREntryAdd2.aspx`, `DepartmentDiscountWSREntryUpdate2.aspx`, `DesignModelEntry.aspx`, `DesignModelGroupName.aspx`, `DesignModelView.aspx`, `FashionName.aspx`, `foolerdetail.aspx`, `giftnewproduct.aspx`, `GroceryNewProductEntry.aspx`, `ModelNo.aspx`, `NewCity.aspx`, `newproduct.aspx`, `newProductCommission.aspx`, `newproductRateEntry.aspx`, `newProductWithoutCommission.aspx`, `PatternSizeSticker.aspx`, `PrintSizeCompany.aspx`, `ProductBrandWise.aspx`, `ProductWiseFashionName.aspx`, `ProductWiseRack.aspx`, `progroup.aspx`, `prounit.aspx`, `purbrand.aspx`, `purcolor.aspx`, `purpattern.aspx`, `pursize.aspx`, `Purstyle.aspx`, `RackNo.aspx`, `Retailnewproduct.aspx`, `subgroupPicEntry.aspx`

### Employees / Staff masters (new) (8 pages)

`cashiername.aspx`, `CustomerStaffNameEntry.aspx`, `employeecatagary.aspx`, `employeegroup.aspx`, `employeesection.aspx`, `newemployee.aspx`, `newEmployeeWithoutCommission.aspx`, `SupervisorNameEntry.aspx`

### Supplier / Purchase (94 pages)

`AgentPaymentEntry.aspx`, `AgentView.aspx`, `ApplianceCategoryPurchaseEntry.aspx`, `ApplianceCategoryPurchaseEntryAdd.aspx`, `ApplianceCategoryPurchaseEntryView.aspx`, `ApplianceCategoryPurchaseUpdate.aspx`, `datewisedepartmentpurchasesalesreport.aspx`, `datewisepurchasesalesreport.aspx`, `DepartmentalPurchaseEntry.aspx`, `Departmentpurchasesalesreport.aspx`, `FancyPurchaseEntry.aspx`, `FancyPurchaseEntryNewAdd.aspx`, `GiftNewPurchaseDiscountSchemaEntry2.aspx`, `GiftNewPurchaseDiscountSchemaEntryAdd2.aspx`, `GiftNewPurchaseDiscountSchemaEntryUpdate2.aspx`, `GiftPurchaseReport.aspx`, `Giftpurchaseretrun.aspx`, `Giftsuppliers.aspx`, `grndetail.aspx`, `GRNwisesalesReport.aspx`, `Invoicepurchasereport.aspx`, `InvoicePurchaseTransactions.aspx`, `NewCounterGRNsetting.aspx`, `NewPurchaseDiscountEntry1.aspx`, `NewPurchaseDiscountEntry2.aspx`, `NewPurchaseDiscountEntryAdd.aspx`, `NewPurchaseDiscountEntryAdd2.aspx`, `NewPurchaseDiscountEntryUpdate.aspx`, `NewPurchaseDiscountEntryUpdate2.aspx`, `NewPurchaseDiscountWSREntry2.aspx`, `NewPurchaseDiscountWSREntryAdd2.aspx`, `NewPurchaseDiscountWSREntryUpdate2.aspx`, `NewPurchaseentry.aspx`, `NewPurchaseentryAdd.aspx`, `NewPurchaseentryView.aspx`, `NewPurchaseReturn.aspx`, `NewPurchaseUpdate.aspx`, `NewWithoutDiscountPurchaseEntry1.aspx`, `NewWithoutDiscountPurchaseEntry2.aspx`, `NewWithoutDiscountPurchaseEntryAdd.aspx`, `NewWithoutDiscountPurchaseEntryAdd2.aspx`, `NewWithoutDiscountPurchaseEntryUpdate.aspx`, `NewWithoutDiscountPurchaseEntryUpdate2.aspx`, `PurchaseBillView.aspx`, `purchaseedit.aspx`, `purchaseentry.aspx`, `purchaseentryadd.aspx`, `PurchaseOrderEdit.aspx`, `PurchaseOrderEntry.aspx`, `PurchaseOrderEntryReport.aspx`, `PurchaseOrderView.aspx`, `purchaserateview.aspx`, `PurchaseReceivedEntry.aspx`, `purchasereport.aspx`, `PurchaseReportPrint.aspx`, `purchaseretrun.aspx`, `PurchaseReturnBillView.aspx`, `PurchaseReturnGRNwise.aspx`, `PurchaseReturnNegativeQty.aspx`, `purchasesalescusreport.aspx`, `PurchaseSalesPerEdit.aspx`, `PurchaseSalesPerEntry.aspx`, `purchasesalesreport.aspx`, `PurchaseSalesViewReport.aspx`, `purchasesetting.aspx`, `purchasestockreport.aspx`, `PurchaseTransactions.aspx`, `PurchSupplierWiseReturn.aspx`, `SmallPurchaseEntry.aspx`, `SmallPurchaseEntryAdd.aspx`, `SmallPurchaseEntryView.aspx`, `SmallPurchaseUpdate.aspx`, `SplitPurchaseEntry.aspx`, `SupplierAccountNo.aspx`, `SupplierBank.aspx`, `SupplierBillCreditDays.aspx`, `suppliers.aspx`, `SupplierSticker.aspx`, `SupplierView.aspx`, `SupplierWiseMinimumQtyReminder.aspx`, `SupplierWiseMinimumQtyReminderDetails.aspx`, `SupplierWisePaymentReport.aspx`, `supplierwisereport.aspx`, `WholeSaleRetailPurchaseBillView.aspx`, `WRPurchaseEntry.aspx`, `WRPurchaseEntryAdd.aspx`, `WRPurchaseEntryNew.aspx`, `WRPurchaseEntryNewAdd.aspx`, `WRPurchaseEntryNewOLD.aspx`, `WRPurchaseEntryNewUpdate.aspx`, `WRPurchaseEntryNewView.aspx`, `WRPurchaseEntryView.aspx`, `WRPurchaseReport.aspx`, `WRPurchaseUpdate.aspx`

### Sales / POS / Billing (74 pages)

`billcontinue.aspx`, `CashBillView.aspx`, `CashBillWise.aspx`, `CashInOutBillwiseReport.aspx`, `CashSalesBillView.aspx`, `CatCreditSalesEntry.aspx`, `CatCreditSalesEntryEdit.aspx`, `CategarywiseBillView.aspx`, `ClosingSales.aspx`, `DateDepositCashInvoice.aspx`, `datewisesalesreport.aspx`, `DatewiseTransectionbillwiseReport.aspx`, `ElectricalBillReport.aspx`, `ElectricalCategarywiseBillView.aspx`, `ElectricalSalesEntry.aspx`, `giftokensalesbillview.aspx`, `GiftPurcheaseBillview.aspx`, `GiftSalesBillView.aspx`, `GrocerySalesEntry.aspx`, `InvBillEntry.aspx`, `InvBillEntryAdd.aspx`, `InvoiceBillEdit.aspx`, `InvoiceBillEntry.aspx`, `InvoiceEntry.aspx`, `InvoiceEntryEdit.aspx`, `InvoiceEntryView.aspx`, `InvoiceMRP.aspx`, `InvoiceNoWiseMRPpendingReports.aspx`, `InvoicePaymentEntry.aspx`, `InvoicePrice.aspx`, `InvoicePriceEntry.aspx`, `Invoicepurbalansecash.aspx`, `InvoicewisesalesReport.aspx`, `MissingSalesReport.aspx`, `MRPInvoiceBillEntry.aspx`, `MRPWiseInvoiceNopendingReports.aspx`, `newsalesmanwisereport.aspx`, `OrderDeliverySalesentryNewsaleAll.aspx`, `PendingCancelCashBillView.aspx`, `PendingCashBillView.aspx`, `PrintDuplicateBill.aspx`, `RateWiseSalesReport.aspx`, `SaleBillCash.aspx`, `SaleCashBillEntry.aspx`, `SaleOrders.aspx`, `Salesbillcreditcollection.aspx`, `SalesBillPrintCopies.aspx`, `SalesBillView.aspx`, `SalesClosingReport.aspx`, `salesentry.aspx`, `SalesEntryEdit.aspx`, `SalesentryNewsaleAll.aspx`, `SalesmanSticker.aspx`, `salesmanwisereport.aspx`, `SalesMRPPercentage.aspx`, `salesorder.aspx`, `SalesOrderEntry.aspx`, `salessetting.aspx`, `samplesalesentry.aspx`, `SectionWiseSalesReport.aspx`, `SuperBill.aspx`, `SuperBillNew.aspx`, `SuperBillUpdate.aspx`, `TeaShopSalesEntry.aspx`, `TouchBillingEntryNewAll.aspx`, `WholeSaleRetailEntry.aspx`, `WholeSaleRetailEntryAdd.aspx`, `WholeSaleRetailEntryUpdate.aspx`, `WholeSaleRetailEntryView.aspx`, `WholeSaleRetailSalesViewReport.aspx`, `WholeSaleSummaryReport.aspx`, `WRSalesentry.aspx`, `WRSalesEntryEditNew.aspx`, `WRSalesEntryNew.aspx`

### Sales Returns / Exchange (3 pages)

`InvocieReturnBillView.aspx`, `InvoiceReturnEntry.aspx`, `SalesReturnBillview.aspx`

### Inventory / Stock (20 pages)

`ApplianceModelNoWiseStockReport.aspx`, `CityWiseStockReport.aspx`, `FloorRackNowiseStockReport.aspx`, `FloorWiseCurrentStockDetail.aspx`, `FloorWiseCurrentStockSummary.aspx`, `FloorWiseMinimumQty.aspx`, `GiftSupplierWiseStockReport.aspx`, `GroupwiseStockReport.aspx`, `MinimumQtyReminder.aspx`, `MissingStockReport.aspx`, `ModelNoWiseStockReport.aspx`, `PatternAndSizeWiseStockReportQty.aspx`, `PatternBrandandSizeWiseStockReportQty.aspx`, `stockaj.aspx`, `StockDamage.aspx`, `StockMissing.aspx`, `StockMissingEdit.aspx`, `SupplierPatternandSizeWiseStockReportQty.aspx`, `SupplierPatternBrandandSizeWiseStockReportQty.aspx`, `WholeSaleRetailStockReport.aspx`

### Barcode / Rate / Pricing (57 pages)

`ApplianceCategoryBarcode.aspx`, `ApplianceMRPRateEntry.aspx`, `barcode.aspx`, `BarcodePrint.aspx`, `barcoderatecancelchange.aspx`, `barcoderatechange.aspx`, `barcoderatechangecommission.aspx`, `barcoderatechangemtr.aspx`, `BarcodeSetting.aspx`, `BarcodeSizeSerialNoSetting.aspx`, `barcodestickeroptions.aspx`, `barcodetaking.aspx`, `BarcodetakingMove.aspx`, `barcodetakingUpdate.aspx`, `barcodeview.aspx`, `BarcodeWiseDiscount.aspx`, `BarcodeWiseDiscountReport.aspx`, `BarcodeWiseSales.aspx`, `CategarywiseMRP.aspx`, `CategarywiseMRPAdd.aspx`, `CategarywiseMRPView.aspx`, `ClientEntryBarcode.aspx`, `CommonBarcodeSetting.aspx`, `CustomWiseBarcode.aspx`, `DateWiseProductDiscount.aspx`, `DepartmentalMRPRateEntry.aspx`, `discountpermission.aspx`, `Fancybarcoderatechange.aspx`, `Fancymrpratechange.aspx`, `GarmentBarcode.aspx`, `Giftbarcode.aspx`, `InvoiceBarcode.aspx`, `Invoicebarcoderatechange.aspx`, `MRPRateEntry.aspx`, `MRPRateEntryView.aspx`, `MultiSinglebarcoderatechange.aspx`, `NewCounterBarcodeSetting.aspx`, `NewCounterCommBarcodeSetting.aspx`, `PrintDuplicateBillwithBarcode.aspx`, `ProductWiseDiscount.aspx`, `PurchaseRateChange.aspx`, `PurchaseReturnBarcodewise.aspx`, `samebarcodecategoryNameEntry.aspx`, `samebarcoderatechange.aspx`, `samebarcodeWithoutMRPratechange.aspx`, `samebarcodeWSRratechange.aspx`, `SmallBarcodeRateChange.aspx`, `TSCBarcode.aspx`, `TVSBarcodeLP44BU.aspx`, `TVSLP46NEOBarcode.aspx`, `TVSLP46NEOBarcodeMobile.aspx`, `TVSLP46ONLYBarcode.aspx`, `WRBarcode.aspx`, `WSbarcoderatechange.aspx`, `WSbarcodeview.aspx`, `ZEBRATLP2844Barcode.aspx`, `ZEBRAZD230TBarcode.aspx`

### Material / Store Transfer (5 pages)

`BarcodewiseMaterialTransfer.aspx`, `GRNwiseMaterialTransfer.aspx`, `MaterialTransfer.aspx`, `StoreReceivedEntry.aspx`, `StoreTransferEntry.aspx`

### Combo / Offers (34 pages)

`BarcodewiseComboMaterialTransfer.aspx`, `BarcodewiseComboOfferEntry.aspx`, `CombobarcodeSticker.aspx`, `ComboBarcodewiseCitizen621.aspx`, `ComboBarcodewiseGODEX.aspx`, `ComboBarcodewiseTSC.aspx`, `ComboBarcodewiseTVSLP44BUNeo.aspx`, `ComboBarcodewiseTVSLP45Lite.aspx`, `ComboBarcodewiseTVSLP46.aspx`, `ComboBarcodewiseZEBRATLP2844.aspx`, `ComboOfferEdit.aspx`, `ComboOfferEntry.aspx`, `ComboOfferMultiMRPEntry.aspx`, `ComboOfferSingleMRPEntry.aspx`, `ComboProductNameEntry.aspx`, `ComboSinglebarcoderatechange.aspx`, `ComboStockReport.aspx`, `DiscountOfferEntry.aspx`, `GRNwiseComboMaterialTransfer.aspx`, `InvoiceBarcodewiseComboOfferEntry.aspx`, `InvoiceComboOfferSingleMRPEntry.aspx`, `InvoicePriceOfferEntry.aspx`, `MultiComboCitizen621.aspx`, `MultiComboGODEX.aspx`, `MultiComboTSC.aspx`, `MultiComboTVSLP44BU.aspx`, `MultiComboTVSLP45Lite.aspx`, `MultiComboTVSLP46NEO.aspx`, `MultiComboZEBRATLP2844.aspx`, `SingleComboBarcodeSticker.aspx`, `SuperComboOffer.aspx`, `SuperComboOfferAdd.aspx`, `SuperComboOfferUpdate.aspx`, `SuperComboOfferView.aspx`

### Customer / Loyalty (50 pages)

`addpoints.aspx`, `CatagaryCustomerWisePaymentReport.aspx`, `CatagaryCustomerWisePaymentSubReport.aspx`, `customerAddPoints.aspx`, `customerbalansecash.aspx`, `customerBillView.aspx`, `CustomerCardNoUpdate.aspx`, `customercat.aspx`, `Customercitywisereport.aspx`, `Customercompanynameentry.aspx`, `CustomerCreditPaymentEntry.aspx`, `CustomerCreditWiseSalesReport.aspx`, `CustomerCreditWiseSalesSubReport.aspx`, `CustomerFestivalView.aspx`, `customerGiftBillView.aspx`, `CustomerGiftItemDetailReport.aspx`, `CustomerGiftSalesReport.aspx`, `CustomerGroup.aspx`, `customerLessPoints.aspx`, `CustomerMobileNoUpdate.aspx`, `CustomerNameUpdate.aspx`, `CustomerPaymentBillView.aspx`, `CustomerPaymentReport.aspx`, `CustomerPaymentTransactions.aspx`, `CustomerPointNameEntry.aspx`, `CustomerPointsUpdate.aspx`, `CustomerRelationship.aspx`, `CustomerResponseEntry.aspx`, `CustomerSalesPaymentBillView.aspx`, `CustomerSalesPaymentEditEntry.aspx`, `CustomerSticker.aspx`, `CustomerTokenReport.aspx`, `CustomerTransactions.aspx`, `CustomerWisePaymentReport.aspx`, `CustomerWisePaymentSubReport.aspx`, `customerwisePointReport.aspx`, `customerwiseredeemReport.aspx`, `customerwisereport.aspx`, `CustomerWiseSalesReport.aspx`, `CustomerWiseSalesSubReport.aspx`, `CustomerWiseWholeSalesReport.aspx`, `newcustomer.aspx`, `newcustomerreligion.aspx`, `newcustomerreligionwithoutpoints.aspx`, `NewCustomerStatus.aspx`, `newcustomerwisereport.aspx`, `newcustomerwithoutpoints.aspx`, `Pointupdateamountwise.aspx`, `ProductandBrandwisePointEntry.aspx`, `SilkSareeTokenEntry.aspx`

### Finance / Cash / Banking (46 pages)

`balansecashcollection.aspx`, `bankdetail.aspx`, `BankEntry.aspx`, `BankTransaction.aspx`, `CashCencel.aspx`, `cashcollection.aspx`, `CashcollectionClear.aspx`, `CashFocus.aspx`, `CashInOutCashierwiseReport.aspx`, `CashInOutEntry.aspx`, `CashInOutEntry2.aspx`, `CashInOutItemwiseReport.aspx`, `CashInOutReport.aspx`, `CashNameEntry.aspx`, `CashPaidReport.aspx`, `CashPaymentEditEntry.aspx`, `CashReport.aspx`, `CashWiseReports.aspx`, `ClosingCashReport.aspx`, `closingpattycash.aspx`, `ClosingPettyCashReport.aspx`, `closingrepo.aspx`, `DateDepositCash.aspx`, `dateexcashinoutreport.aspx`, `dateexcashinoutwithproductreport.aspx`, `DateWiseTransitionCashReport.aspx`, `DayBook.aspx`, `EMIMasterEntry.aspx`, `EXCashInOutEntry.aspx`, `EXCashInOutEntry2.aspx`, `EXclosingpattycash.aspx`, `EXopenpattycash.aspx`, `ExpansesBillview.aspx`, `expensegroup.aspx`, `ExpenseInOutReport.aspx`, `expensename.aspx`, `ExpensesReport.aspx`, `newclosingpattycash.aspx`, `openpattycash.aspx`, `paymenttype.aspx`, `PendingCashReport.aspx`, `purbalansecash.aspx`, `SamplePayment4.aspx`, `SamplePayment5.aspx`, `TransactionGroup.aspx`, `TransactionNameEntry.aspx`

### Tax / GST (62 pages)

`AllGSTInvBillEntry.aspx`, `AllGSTInvBillEntryAdd.aspx`, `AllGSTMRPInvoiceBillEntry.aspx`, `AllGSTNewPurchaseEntry.aspx`, `AllGSTNewPurchaseEntryAdd.aspx`, `AllGSTNewPurchaseEntryView.aspx`, `AllGSTNewPurchaseUpdate.aspx`, `AllGSTPurchaseEntry.aspx`, `AllGSTPurchaseEntryAdd.aspx`, `AllGSTPurchaseEntryView.aspx`, `AllGSTPurchaseUpdate.aspx`, `AllGSTSuperComboOffer.aspx`, `AllGSTSuperComboOfferAdd.aspx`, `BarcodeGstSalesentryNewsaleAllEdit.aspx`, `CatagaryWisegstreport.aspx`, `CommonGstSaleCashBillEntryNewAll.aspx`, `CreditGstWholeSalesRetailSalesEntryNew.aspx`, `DepartmentGstSaleCashBillEntryNewAll.aspx`, `DepartmentWSRGstSaleCashBillEntryNewAll.aspx`, `DepartmentWSRplusGstSaleCashBillEntryNewAll.aspx`, `GiftGSTInvBillEntry.aspx`, `GiftGSTInvBillEntryAdd.aspx`, `GiftGSTInvBillEntryUpdate.aspx`, `GiftGstSalesentryNew.aspx`, `GiftGstSalesentryNewsaleAll.aspx`, `GstBilling.aspx`, `GSTCompany.aspx`, `gstgroup.aspx`, `GSTNewPurchaseEntry.aspx`, `GSTNewPurchaseEntryAdd.aspx`, `gstreport.aspx`, `GstReturnSalesentryNewsaleAll.aspx`, `GstSaleCashBillEntryNew.aspx`, `GstSaleCashBillEntryNewAll.aspx`, `GstSaleCashBillEntryNewAllRateEntry.aspx`, `GstSaleCashBillEntryNewTamil2023.aspx`, `GstSaleCashBillEntryTamilNew.aspx`, `GstSaleCreditBillEntryNew.aspx`, `GstSalesBillView.aspx`, `GstSalesEditWithDate.aspx`, `GstSalesentryEditNew.aspx`, `GstSalesentryNew.aspx`, `GstSalesentryNewsale.aspx`, `GstSalesentryNewsaleAll.aspx`, `GstSalesentryNewsaleAllEdit.aspx`, `GstSaleTokenNoEntry.aspx`, `GSTSmallPurchaseEntry.aspx`, `GSTSmallPurchaseEntryAdd.aspx`, `GstSuperSalesEntryNew.aspx`, `GSTType.aspx`, `gstWholeSalesRetailSalesEntry.aspx`, `GstWholeSalesRetailSalesEntryNew.aspx`, `gstwsalesentry.aspx`, `gstwsalesentryedit.aspx`, `HsnDetails.aspx`, `igstreport.aspx`, `newgstreport.aspx`, `PurchaseBillViewWOGST.aspx`, `RetailGstSaleCashBillEntryNewAll.aspx`, `WholeSalesGstSaleCashBillEntryNewAll.aspx`, `WRGstSaleCashBillEntryNewTamil2023.aspx`, `WSRplusGstSaleCashBillEntryNewAll.aspx`

### Commission (11 pages)

`BarcodeWiseCommission.aspx`, `Daysfrom.aspx`, `DaysFromComission.aspx`, `DaysFromComissionNew.aspx`, `FloorWiseSectionCommissionReport.aspx`, `newSalesmanCommission.aspx`, `PCSwiseProductCommission.aspx`, `ProductWiseCommission.aspx`, `RangeWiseCommission.aspx`, `SalesManAGEwiseProductCommission.aspx`, `SpecialSalesmanCommission.aspx`

### Reports / Analytics (26 pages)

`Addcompanyreport.aspx`, `AGEWiseReport.aspx`, `Catagarycompanywisereport.aspx`, `companywisereport.aspx`, `counterreport.aspx`, `CounterWisePaidReport.aspx`, `DailyModeWisereport.aspx`, `DateWiseCounterPaidReport.aspx`, `datewisereport.aspx`, `DatewiseTransitionReport.aspx`, `GraphWiseReports.aspx`, `GroceryModewiseReport.aspx`, `inchargewisereport.aspx`, `modewisereport.aspx`, `NeedProductEntryReports.aspx`, `newprofitreport.aspx`, `NotPaidReport.aspx`, `PaidReport.aspx`, `PatternAndSizeWiseSalesReportQty.aspx`, `profitreport.aspx`, `pursereport.aspx`, `RangeWiseReport.aspx`, `reportoptions.aspx`, `ReportPrintName.aspx`, `ShareReportOption.aspx`, `SpecialProfitreport.aspx`

### Printing / Documents (11 pages)

`GODEX.aspx`, `GODEXOLD.aspx`, `MasterPrint.aspx`, `OfficeCoverPrint.aspx`, `printsetting.aspx`, `tscte244.aspx`, `TSCTTP244PRO.aspx`, `TVSLP45Lite.aspx`, `TVSLP45Litenew.aspx`, `ZeabraGC420T.aspx`, `zebrazd220.aspx`

### Needs manual classification (38 pages) - proposed homes

Name-based proposals only; confirm each in Plan 00.

| Page | Proposed home |
|---|---|
| `agentdetail.aspx` | Plan 04 (agents) |
| `bookingroup.aspx` | Inspect source (booking group) |
| `Calculator.aspx` | Likely obsolete utility - confirm |
| `commandetail.aspx` | Inspect source (common detail) |
| `company detail.aspx` | Plan 02 |
| `companyitemrepo.aspx` | Plan 29 company-wise report |
| `companyrepo.aspx` | Plan 29 company-wise report |
| `CompanyWiseCatagary.aspx` | Plan 29 report (company/category) - confirm |
| `CS.aspx` | Inspect source (purpose unclear) |
| `freeproduct.aspx` | Plan 17 (free-product offer) |
| `FreeQtyEntry.aspx` | Plan 17 (free-quantity offer) |
| `groupPictureEntry.aspx` | Plan 03 (group pictures) |
| `home.aspx` | Obsolete landing page (replaced by dashboard) - confirm |
| `NeedProductApproval.aspx` | Plan 30 (product request approval) |
| `NeedProductEdit.aspx` | Plan 30 (product request) |
| `NeedProductEntry.aspx` | Plan 30 (product request) |
| `newcompanyrepo.aspx` | Plan 29 company-wise report |
| `option select.aspx` | Plan 02 settings - inspect |
| `PrivatePage.aspx` | Inspect source / likely obsolete |
| `ProductNameWithRateEntry.aspx` | Plan 03 / 10 |
| `prosubgrp.aspx` | Plan 03 (sub-group) |
| `PurchNew.aspx` | Plan 05 (purchase entry variant) |
| `PurchNewDetails.aspx` | Plan 05 (purchase entry variant) |
| `purcommentry.aspx` | Plan 05 - inspect |
| `purdesign.aspx` | Plan 03 (design master) |
| `purgroup.aspx` | Plan 03 (group) |
| `purinch.aspx` | Plan 34 / 05 (incharge) - inspect |
| `RightsEntry.aspx` | Plan 01 / 30 (user rights) |
| `Search.aspx` | Shared global search UI - inspect |
| `serverupload.aspx` | Plan 31 or obsolete - inspect |
| `ShareMenu.aspx` | Inspect source (menu/report sharing) |
| `slsoptn.aspx` | Plan 02 sales settings - inspect |
| `SwipeMachineDetails.aspx` | Plan 19 (card terminal) |
| `systemoption.aspx` | Plan 02 settings - inspect |
| `UpdatePanelTest.aspx` | Obsolete test page |
| `warehous.aspx` | Plan 02 (warehouse) |
| `WebForm1.aspx` | Obsolete test page |
| `Welcome.aspx` | Obsolete landing page (replaced by dashboard) - confirm |

## 10. Appendix B - Printer and barcode variants (42)

Removed from the original list: `GiftNewPurchaseDiscountSchemaEntry2`, `...Add2`, `...Update2` (purchase discount schemes). Added: `ZeabraGC420T`.

`BarcodePrint.aspx`, `barcodestickeroptions.aspx`, `CombobarcodeSticker.aspx`, `ComboBarcodewiseCitizen621.aspx`, `ComboBarcodewiseGODEX.aspx`, `ComboBarcodewiseTSC.aspx`, `ComboBarcodewiseTVSLP44BUNeo.aspx`, `ComboBarcodewiseTVSLP45Lite.aspx`, `ComboBarcodewiseTVSLP46.aspx`, `ComboBarcodewiseZEBRATLP2844.aspx`, `CustomerSticker.aspx`, `GODEX.aspx`, `GODEXOLD.aspx`, `MasterPrint.aspx`, `MultiComboCitizen621.aspx`, `MultiComboGODEX.aspx`, `MultiComboTSC.aspx`, `MultiComboTVSLP44BU.aspx`, `MultiComboTVSLP45Lite.aspx`, `MultiComboTVSLP46NEO.aspx`, `MultiComboZEBRATLP2844.aspx`, `NewCounterPrintSetting.aspx`, `PatternSizeSticker.aspx`, `PrintDuplicateBill.aspx`, `PrintDuplicateBillwithBarcode.aspx`, `printsetting.aspx`, `SalesmanSticker.aspx`, `SingleComboBarcodeSticker.aspx`, `SupplierSticker.aspx`, `TSCBarcode.aspx`, `tscte244.aspx`, `TSCTTP244PRO.aspx`, `TVSBarcodeLP44BU.aspx`, `TVSLP45Lite.aspx`, `TVSLP45Litenew.aspx`, `TVSLP46NEOBarcode.aspx`, `TVSLP46NEOBarcodeMobile.aspx`, `TVSLP46ONLYBarcode.aspx`, `ZeabraGC420T.aspx`, `ZEBRATLP2844Barcode.aspx`, `zebrazd220.aspx`, `ZEBRAZD230TBarcode.aspx`

The barcode generator pages (`barcode`, `WRBarcode`, `Giftbarcode`, `GarmentBarcode`, `InvoiceBarcode`, `ApplianceCategoryBarcode`, `CustomWiseBarcode`) are not in this list; check each for embedded print code in Plan 09B / 11.

## 11. Report implementation checklist

For every legacy report family:

- [ ] identify source table/query
- [ ] identify filters
- [ ] identify grouping
- [ ] identify calculated fields
- [ ] identify totals/subtotals
- [ ] identify date semantics
- [ ] identify tax semantics
- [ ] identify permissions
- [ ] create SQL report query/repository
- [ ] add report definition to registry
- [ ] add React report page/view
- [ ] add export
- [ ] add print/PDF output
- [ ] reconcile sample output against legacy

Crystal Reports remain a source of field and layout requirements; the data source must be SQL repositories, views or queries, not Crystal-specific logic.

## 12. Printer implementation checklist

- [ ] printer capability registry
- [ ] printer profile
- [ ] label size
- [ ] DPI
- [ ] media type
- [ ] template version
- [ ] raw PRN adapter where required
- [ ] Windows print agent where required
- [ ] queue
- [ ] retry
- [ ] duplicate-job protection
- [ ] reprint
- [ ] print history
- [ ] per-counter assignment
- [ ] test page

## 13. SQL implementation pattern

```text
React feature -> API route -> Controller -> Service -> Repository -> shared SQL pool
                                                          |-- dbo.* (no DDL; allow-listed DML)
                                                          `-- erp.* (versioned migrations)
```

Business transaction:

```text
validate input and permission
  -> BEGIN TRANSACTION
  -> allocate document number / barcode (lock inside the transaction)
  -> write header -> write lines -> write stock / ledger effects (in dbo)
  -> write audit
  -> COMMIT   (retry on deadlock; roll back everything on failure)
```

## 14. Definition of done for every plan

- [ ] Legacy screens mapped and confirmed
- [ ] Business rules documented
- [ ] Target ERP feature selected
- [ ] SQL ownership defined
- [ ] dbo / erp mapping defined from the restored schema
- [ ] Migration created (if `erp` tables are needed)
- [ ] Repository created
- [ ] Service created
- [ ] UI created or extended
- [ ] Reports implemented under the owning module (using the Plan 01 framework)
- [ ] Printer variants implemented as templates on the Plan 01 print framework
- [ ] Permissions implemented
- [ ] Audit implemented
- [ ] Unit tests pass (and are actually executed)
- [ ] SQL integration tests pass
- [ ] E2E tests pass
- [ ] Sample legacy results reconcile
- [ ] Concurrency checked (legacy app writing at the same time)
- [ ] Restore impact reviewed (`erp` carryover covers the new tables)
- [ ] No Mongo dependency remains in the completed scope
- [ ] Owner sign-off

## 15. Decisions needed from the owner

- Which Textilesoft source is authoritative: `TEXTILESOFT 17.07.2025` or `TEXTILESOFT VIJAYALAKSHMI`?
- Does `online-store` stay out of scope?
- Canonical area: `finance` or `financial`?
- Tea shop, touch billing and sample sales: modes or obsolete?
- Combo barcodes: physical or virtual? Combo discount stacking?
- Does the legacy app have an in-transit state for material transfers?
- Forgot-password / change-password: disable, or admin-only reset in `dbo.newuser`?
- Parallel-run length after cutover.
