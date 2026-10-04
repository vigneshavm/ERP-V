# ERP ↔ TextileSoft SQL Gap Audit

**Date:** 2026-09-30  
**Source ERP:** `ERP_Project(20260929-212521).zip`  
**Business baseline:** TextileSoft documentation `02_company_branch_store.md` through `32_export_sharing.md`  
**Scope:** SQL gaps only. MongoDB business behavior was retained for non-SQL mode.

## 1. Executive result

The ERP already had a TextileSoft SQL integration layer for organisation masters, Product Master, Product Attributes, Purchase/GRN, sales invoice reads and POS SQL writes. The largest transaction gaps were that Purchase Orders, Purchase Returns and Sales Returns were still Mongo-first even when `ITEM_DATA_SOURCE=sql`.

The following SQL paths were added:

| Module                      | SQL status before              | SQL change                                                                                       |
| --------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------ |
| Company / Branch / Store    | SQL                            | No change                                                                                        |
| Product Master              | SQL                            | No change                                                                                        |
| Product Attributes          | SQL                            | No change                                                                                        |
| Purchase / GRN              | SQL write                      | No change                                                                                        |
| Purchase Order / PO receipt | Mongo                          | Added `POHeader` + `PODetails` adapter and SQL-mode routes                                       |
| Purchase Return             | Mongo                          | Added `PurchaseReturnHeader` + `PurchaseReturnDetails` + `purretrun` adapter and SQL-mode routes |
| Sales Billing               | SQL POS write was opt-in       | SQL mode now selects SQL POS writer directly                                                     |
| Sales Return                | Mongo                          | Added `sales2Return` + `salbillReturns` + `salsntryReturn` adapter and SQL-mode routes           |
| SQL write permissions       | Missing new transaction tables | Added PO/return tables to `WRITE_TABLES`                                                         |

No Mongo schema or Mongo transaction was removed. SQL mode selects the SQL adapter; non-SQL mode continues using the existing Mongo services.

## 2. Architecture comparison

### Existing ERP architecture

```text
React / TypeScript UI
        |
        v
Express routes/controllers
        |
        +---- Mongo services/repositories/models
        |
        +---- TextileSoft SQL adapters
                  |
                  +---- sqlOrg
                  +---- sqlProducts
                  +---- sqlAttributes
                  +---- sqlPurchase
                  +---- sqlPosWriter
                  +---- sqlStockReports
                  +---- sqlFinance / sqlGstReports / sqlPartyReports
                  +---- NEW sqlPurchaseOrder
                  +---- NEW sqlPurchaseReturn
                  +---- NEW sqlSalesReturn
                  |
                  v
              SQL Server / dbo
```

### TextileSoft transaction model

```text
Product Master
     |
     +--> Purchase Order: POHeader + PODetails
     |          |
     |          +--> Receipt quantities on PODetails
     |          |
     |          +--> Actual Purchase / GRN
     |                 |
     |                 +--> purgrnentry + purentrydetails
     |                         |
     |                         +--> stockdetails
     |                         |
     |                         +--> Barcode
     |                         |
     |                         +--> Sales: sales2 + salsntry
     |                                  |
     |                                  +--> Sales Return:
     |                                       sales2Return
     |                                       salbillReturns
     |                                       salsntryReturn
     |
     +--> Purchase Return:
              PurchaseReturnHeader
              PurchaseReturnDetails
              purretrun
```

## 3. API/UI flow after the SQL fix

### Purchase Order

```text
Purchase Order UI
  -> POST /api/purchases
  -> ITEM_DATA_SOURCE=sql
  -> sqlPurchaseOrder.createSqlPurchaseOrder()
  -> POHeader + PODetails
```

List/view/status/delete routes use the SQL document ID prefix `sql:po:`.

PO receiving is exposed through:

```text
PATCH /api/purchases/:id/receipt/:lineNo
```

and updates the confirmed TextileSoft receipt fields on `PODetails`.

### Purchase Return

```text
Purchase Return UI
  -> POST /api/purchase-returns
  -> sqlPurchaseReturn.createSqlPurchaseReturn()
  -> PurchaseReturnHeader
  -> PurchaseReturnDetails
  -> purretrun
```

The adapter validates an original GRN when a GRN/barcode is supplied and preserves the TextileSoft distinction between:

- return document `rgrno`
- original purchase `grn_no`
- supplier return GRN/reference `sup_retu_grn`

### Sales Billing

```text
POS UI
  -> POST /api/pos/invoice
  -> ITEM_DATA_SOURCE=sql
  -> sqlPosWriter.writePosBillToSql()
  -> sales2 + salsntry
```

Previously the route required a second `TEXTILESOFT_POS_WRITE=on` switch. SQL mode now selects the SQL writer directly. The SQL writer still requires the configured SQL write credentials.

### Sales Return

```text
Sales Return UI
  -> POST /api/returns
  -> sqlSalesReturn.createSqlSalesReturn()
  -> sales2Return
  -> salbillReturns
  -> salsntryReturn
```

The return adapter resolves the original SQL invoice through `sysidandbill`, validates the return quantity against the original `salsntry` line and already recorded `salbillReturns`, then persists the return representations in one SQL transaction.

## 4. SQL schema comparison

### Organisation

| TextileSoft         | ERP SQL adapter                |
| ------------------- | ------------------------------ |
| `companydetail`     | `sqlOrg.ts`                    |
| `branchdetail`      | `sqlOrg.ts`                    |
| `warehousedetail`   | `sqlOrg.ts`                    |
| `countername`       | `sqlOrg.ts`, `sqlPosWriter.ts` |
| `CommonSettings`    | `sqlOrg.ts`                    |
| `foolerdetail`      | `sqlOrg.ts`                    |
| `productwiserackno` | `sqlOrg.ts`, `sqlProducts.ts`  |

### Product / attributes

| TextileSoft              | ERP SQL adapter                      |
| ------------------------ | ------------------------------------ |
| `newproduct`             | `sqlProducts.ts`                     |
| `prounit`                | `sqlMasters.ts`                      |
| `progroup`               | `sqlMasters.ts`                      |
| `prosubgroup`            | `sqlMasters.ts`                      |
| `gstgroup`               | `sqlMasters.ts`                      |
| `brand`                  | `sqlMasters.ts` / `sqlAttributes.ts` |
| `pattern`                | `sqlMasters.ts` / `sqlAttributes.ts` |
| `size`                   | `sqlMasters.ts` / `sqlAttributes.ts` |
| `color`                  | `sqlMasters.ts` / `sqlAttributes.ts` |
| `style`                  | `sqlMasters.ts` / `sqlAttributes.ts` |
| `design`                 | `sqlMasters.ts` / `sqlAttributes.ts` |
| `productwiserackno`      | `sqlProducts.ts`                     |
| `productwisefashionname` | `sqlProducts.ts`                     |

### Purchase

| TextileSoft             | ERP SQL adapter                |
| ----------------------- | ------------------------------ |
| `purgrnentry`           | `sqlPurchase.ts`               |
| `purentrydetails`       | `sqlPurchase.ts`               |
| `stockdetails`          | `sqlPurchase.ts`               |
| `POHeader`              | **NEW `sqlPurchaseOrder.ts`**  |
| `PODetails`             | **NEW `sqlPurchaseOrder.ts`**  |
| `PurchaseReturnHeader`  | **NEW `sqlPurchaseReturn.ts`** |
| `PurchaseReturnDetails` | **NEW `sqlPurchaseReturn.ts`** |
| `purretrun`             | **NEW `sqlPurchaseReturn.ts`** |

### Sales

| TextileSoft      | ERP SQL adapter                  |
| ---------------- | -------------------------------- |
| `sales2`         | `sqlPosWriter.ts`, `sqlSales.ts` |
| `salsntry`       | `sqlPosWriter.ts`, `sqlSales.ts` |
| `sales2Return`   | **NEW `sqlSalesReturn.ts`**      |
| `salbillReturns` | **NEW `sqlSalesReturn.ts`**      |
| `salsntryReturn` | **NEW `sqlSalesReturn.ts`**      |

## 5. Module-by-module status against the supplied documentation

| Doc | Module                    | SQL status after fix               | Action                                                                                                                      |
| --- | ------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 02  | Company / Branch / Store  | Covered                            | Existing SQL adapter retained                                                                                               |
| 03  | Product / Item Master     | Covered                            | Existing SQL adapter retained                                                                                               |
| 04  | Product Attributes        | Covered                            | Existing SQL masters/mappings retained                                                                                      |
| 05  | Purchase                  | Covered                            | Existing `sqlPurchase.ts` retained                                                                                          |
| 06  | Purchase Order / GRN      | **Improved**                       | POHeader/PODetails SQL path added; actual GRN remains `purgrnentry/purentrydetails`                                         |
| 07  | Purchase Return           | **Improved**                       | Header/detail + legacy ledger SQL path added                                                                                |
| 08  | Sales Billing             | **Improved**                       | SQL POS writer selected automatically in SQL mode                                                                           |
| 09  | Sales Return              | **Improved**                       | Return header/detail/staging SQL path added                                                                                 |
| 10  | GST                       | Partial                            | GST master/report SQL exists; exact full legacy GST transaction schema was not proven by the supplied module document       |
| 11  | Barcode                   | Partial                            | Barcode is generated during SQL purchase and preserved in stock/sales; no separate proven barcode master table was invented |
| 12  | Barcode Rate              | Gap / not safely provable          | Exact legacy rate-maintenance table was not proven by the supplied module document                                          |
| 13  | Barcode Printing          | Not a SQL transaction gap          | Printing is presentation/device behavior; barcode source comes from SQL purchase/stock                                      |
| 14  | Printer Integrations      | Not a SQL transaction gap          | Device-specific integrations are outside SQL persistence                                                                    |
| 15  | Combo Offers              | Gap / not safely provable          | Exact TextileSoft combo persistence schema was not proven by the supplied module document                                   |
| 16  | Inventory / Stock         | Covered for traced SQL stock reads | Purchase creates `stockdetails`; stock reports read SQL; no unproven write path was invented                                |
| 17  | Material / Store Transfer | Gap / not safely provable          | Exact transfer tables and write semantics were not proven by the supplied module document                                   |
| 18  | Customer                  | Partial                            | SQL sales can carry customer name/phone; a full customer-master SQL CRUD mapping was not proven                             |
| 19  | Customer Loyalty          | Partial                            | SQL sales return/billing preserve points-related fields, but a full legacy loyalty ledger was not proven                    |
| 20  | Supplier                  | Partial                            | SQL supplier master/read/report path exists; full supplier CRUD was not safely mapped from the supplied document            |
| 21  | Accounts / Finance        | Partial                            | SQL finance/GST reports exist; legacy accounting write tables were not fully established                                    |
| 22  | Cash Management           | Partial                            | SQL sales payment fields and finance reports exist; complete cash-ledger write schema was not proven                        |
| 23  | Employee / Salesman       | Partial                            | SQL auth reads `newuser`; purchase/sales preserve salesman/user fields; complete employee master mapping was not proven     |
| 24  | Commission                | Partial                            | Purchase/sales rows preserve commission fields; complete commission-master write mapping was not proven                     |
| 25  | Discount                  | Partial                            | Product/purchase/sales discount values are SQL-backed; complete discount-offer master schema was not proven                 |
| 26  | Gift                      | Partial                            | Sales/return fields preserve gift/token fields; complete gift lifecycle table mapping was not proven                        |
| 27  | Special Business Modules  | Gap / not safely provable          | Grocery/electrical/appliance-specific persistence was not fully traced in the supplied module document                      |
| 28  | Reports                   | Covered for traced SQL reports     | Existing SQL report adapters retained                                                                                       |
| 29  | Printing / Billing Engine | Partial                            | Billing data is SQL-backed; physical printing remains an application/device concern                                         |
| 30  | QR Code                   | Partial                            | SQL return/sales records preserve QR-related identity fields where proven; QR rendering remains application-side            |
| 31  | Configuration             | Partial                            | `CommonSettings`, company, warehouse and counter settings have SQL coverage                                                 |
| 32  | Export / Sharing          | Covered at source-selection level  | Export consumes API/report data; no separate SQL transaction table was required                                             |

## 6. Why modules 10-32 were not given speculative SQL writes

Several supplied documents from `10_gst.md` onward explicitly state that the page/module was identified but that the exact page-to-database mappings still require source/database tracing. Adding guessed SQL INSERT/UPDATE statements for those modules would risk corrupting the shop database.

The fix therefore follows a strict rule:

```text
Confirmed TextileSoft table + confirmed column semantics
        -> SQL adapter may write

Module identified but table/column semantics not proven
        -> do not invent SQL writes
```

This keeps the requested change limited to SQL gaps that can actually be supported by the available evidence.

## 7. Files changed

### New

- `backend/src/integrations/textilesoft/sqlPurchaseOrder.ts`
- `backend/src/integrations/textilesoft/sqlPurchaseReturn.ts`
- `backend/src/integrations/textilesoft/sqlSalesReturn.ts`

### Updated

- `backend/src/modules/purchase/routes/purchaseOrder.routes.ts`
- `backend/src/modules/purchase/routes/purchaseReturn.routes.ts`
- `backend/src/modules/sales/routes/return.routes.ts`
- `backend/src/modules/sales/controllers/PosController.ts`
- `backend/src/integrations/textilesoft/sqlDbAccess.ts`
- `backend/src/config/itemDataSource.ts`

## 8. SQL permissions added

The SQL write user now receives permissions for the newly supported tables when those tables exist:

```text
POHeader
PODetails
PurchaseReturnHeader
PurchaseReturnDetails
purretrun
sales2Return
salbillReturns
salsntryReturn
```

Existing purchase and POS tables remain in the same permission list.

## 9. Important consistency rules

### PO vs GRN

Do not merge these identifiers:

```text
POHeader.grn_no       = legacy PO number
purgrnentry.grn_no    = actual posted purchase GRN
```

The supplied documentation explicitly warns that the PO `grn_no` is a legacy naming mismatch.

### Purchase Return

The three return identifiers remain distinct:

```text
rgrno          = purchase-return document number
purretrun.grn_no = original purchase GRN
sup_retu_grn   = supplier-return reference
```

### Sales Return

The SQL sales return uses:

```text
original sales bill -> sales2 / salsntry
return bill         -> sales2Return / salbillReturns / salsntryReturn
```

The adapter checks the original sale and already-returned quantity before inserting another return.

## 10. Verification limitation

The uploaded project does not contain installed backend dependencies in the archive. A targeted TypeScript parse/check was run against the changed files. The remaining compiler output is dominated by missing installed dependencies such as `express`, `mongoose`, `mssql`, `@types/node`, `tsyringe` and `winston`, so a complete build cannot be honestly claimed from this archive alone.

No live SQL Server connection was available during this source-only patch, so table existence, actual column types and write permissions must still be tested against the target shop database.

## 11. Recommended deployment verification

Before enabling SQL mode against a real shop database:

1. Restore/use a database copy.
2. Run the SQL access repair/grant mechanism.
3. Confirm `POHeader`, `PODetails`, `PurchaseReturnHeader`, `PurchaseReturnDetails`, `purretrun`, `sales2Return`, `salbillReturns`, and `salsntryReturn` exist.
4. Run one PO create/read/status test.
5. Run one PO receipt update test.
6. Run one purchase return against a known GRN/barcode.
7. Run one sales bill and verify `sales2` + `salsntry`.
8. Run one sales return against that bill.
9. Reconcile quantities and amounts directly in SQL.
10. Only then enable production SQL mode.

## 12. Final result

The ERP now has a substantially more complete SQL transaction path for the TextileSoft business flow:

```text
Company / Store
      |
      v
Product + Attributes
      |
      v
Purchase Order
POHeader + PODetails
      |
      v
Purchase / GRN
purgrnentry + purentrydetails
      |
      v
stockdetails / barcode
      |
      v
Sales Billing
sales2 + salsntry
      |
      v
Sales Return
sales2Return + salbillReturns + salsntryReturn

Purchase Return branches from the original GRN:

purgrnentry + purentrydetails
          |
          v
PurchaseReturnHeader + PurchaseReturnDetails + purretrun
```

The implementation intentionally does not create speculative SQL tables for the modules whose supplied documentation still says the exact legacy SQL mapping is unresolved.
