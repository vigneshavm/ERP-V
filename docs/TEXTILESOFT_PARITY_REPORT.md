# Textilesoft Parity Report

Complete section-by-section comparison of the Textilesoft Vijayalakshmi capability map against the current state of this ERP. Verdicts are **Existing** (real, working, backend-backed), **Partial** (some real coverage, some gaps), or **Missing**. Where the ERP UI *looks* complete but is actually hardcoded/mock data with no backend behind it, that's called out explicitly — several sections below have exactly that trap.

## Summary table

| Section | Verdict | One-line reason |
|---|---|---|
| A. Master data & product taxonomy | Existing | Built out extensively this engagement (Master Data module, Agent, Warehouse) |
| B. Purchasing / GRN | Partial | PO/Returns/RateRevision/SupplierLedger are real; barcode/GRN-scoped returns and inter-GRN transfer are missing |
| C. Sales / billing (POS) | Partial | Cash sale, sales orders, Tamil variant real; credit sale / sale-edit not verified; vertical-specific sale out of scope |
| D. Wholesale/Retail billing | Missing | Only a customer-group tag with a discount %, no distinct WR session/flow |
| E. Invoice billing | Missing (aliased) | "Invoice" *is* the POS bill — no separate B2B/GST invoice document type |
| F. Barcode & label printing | Existing | Multi-printer label format support already built |
| G. Combo offers | Existing | Built this engagement, backend + frontend real |
| H. Cash management / till | Partial | Petty cash real; till/shift/cash-drawer screens are mock UI; no EMI or swipe-machine registry |
| I. Agent / supplier accounts | Existing | Supplier ledger/payments real; PO/returns/rate-correction real; Agent master built this engagement |
| J. Customer management | Partial | Registration/ledger/groups/loyalty real; feedback capture not verified |
| K. Commission management | Missing | No commission rule engine anywhere; only a flat `commissionPercent` on Agent |
| L. Discount management | Partial | Tenant-wide cap now enforced (2026-09-04) end-to-end; still no per-user discount rights like Textilesoft's `discountpermission.aspx` model, which itself shows signs of being unenforced in the legacy system |
| M. Stock management | Partial | Reorder threshold real but backend-only (frontend page is mock); damage/loss and inter-warehouse transfer missing |
| N. Reporting | Partial | ~15-20 real report surfaces vs Textilesoft's 66+; the main reports hub has hardcoded placeholder numbers |
| O. User admin & access control | Partial | Login/auth real; RBAC enforcement is a backend stub; super-admin console is mocked |
| P. System/printer/report settings | Missing | Branch/counter config exists; no printer config, no receipt layout, no report sharing |
| Q. Bundled verticals | N/A — decision needed | ERP is Textile/Pharmacy/Retail/General only; same open question Textilesoft's own doc raises |
| R. Dead code candidates | N/A | Applies to Textilesoft's own codebase hygiene, not this ERP |

---

## A. Master data & product taxonomy — Existing

Built out module-by-module this engagement via a generic Master Data system (`backend/src/modules/masters/`, `frontend/src/features/system/MasterDataManager.tsx`):

- **Product attributes**: design/pattern/model no./fashion name/subgroup/unit are real master types, wired into the actual Item create/edit form (`ProductModal.tsx`), plus HSN via `TaxMaster`.
- **GST setup**: `GST_TYPE`/`GST_GROUP` masters exist, deliberately kept organizational-only (not wired into live tax computation — a disclosed scope decision, not a gap).
- **Company/counter setup**: branches and counters are real (`Settings.tsx` → `BranchSettingsTab`); a real Warehouse master was built this engagement.
- **Customer taxonomy**: `CustomerGroups.tsx` is a real, backend-backed screen (rebuilt from a hardcoded mock earlier this engagement); `CUSTOMER_RELATIONSHIP_TYPE` master exists; loyalty point naming via `Tenant.loyaltyPointLabel`.
- **Employee/expense/transaction taxonomy**: employee category/group/section, expense group (linked to the pre-existing `ExpenseCategory` system), transaction group/name, cash group/name, payment type, and booking group are all real masters.
- **Supplier/agent master**: Supplier (with bank account fields) pre-existed; a full Agent master (commission %, linked supplier, bank payout details) was built this engagement.
- **Quick-add forms**: customer quick-add (POS phone+name lookup-or-create) and employee quick-add (`StaffManager.tsx`) are real. **Product quick-add at the POS counter is still missing** — explicitly deferred earlier this engagement in favor of building the Agent master instead.

## B. Purchasing / GRN — Partial

Real backend logic: Purchase Orders (`Purchase.ts`/`PurchaseController.ts`, real numbering, Bill/JournalEntry integration), Purchase Returns (`PurchaseReturnController.ts`, adjusts inventory, links to Debit Notes), rate correction (`RateRevisionController.ts`, full PENDING→APPROVED/REJECTED workflow with an auto-generated Debit Note inside a Mongo transaction), and Supplier Ledger (`SupplierLedgerController.ts`, real running-balance computation). GRN itself (`GRN.ts`/`GRNController.ts`) is real and just got Warehouse-master wiring this session.

**Missing**: Purchase Returns have no `grnId`/`barcode` fields — no barcode-wise or GRN-wise segmented returns, only supplier+bill scoped. There's no inter-GRN/inter-location material transfer model or endpoint anywhere. `PurchaseMockUI.tsx` and `PurchaseRegisterMockUI.tsx` also still exist alongside the real screens — some purchase-register list views may still be mock.

## C. Sales / billing (POS) — Partial

- **Cash sale**: Existing — full scan/select/total/pay flow (`StandardPOSTemplate.tsx`/`TextilePOSTemplate.tsx`, `POSFooter.tsx`), including the Tamil-language variant built this engagement.
- **Sales orders**: Existing (`SalesOrderList.tsx` and related routes).
- **Credit sale, sale edit, super/bulk sale**: not verified in this pass — the sales `Invoice` model's own schema comment says "OTC POS sales are delivered immediately by default," which suggests credit/ledger-posting and post-save bill amendment are not confirmed working; worth a dedicated follow-up check before assuming either way.
- **Vertical-specific sale** (grocery/bakery/electrical/tea-shop): out of scope by design — the ERP's `Sector` field only supports Textile/Pharmacy/Retail/General, matching the same open question Textilesoft's own document raises about which verticals this client actually needs.
- **Non-GST legacy billing**: not applicable — this is a single modern GST system, no legacy parallel needed.

## D. Wholesale/Retail (WR) billing — Missing

Confirmed via targeted search: "wholesale" only appears as a business-type/customer-group classification (with an associated discount %), never as a distinct billing session, login mode, or dedicated sales-entry/report flow. Textilesoft's separate WR billing pipeline has no ERP equivalent today.

## E. Invoice billing — Missing (aliased, not a separate type)

The ERP has exactly one sales document model (`backend/src/modules/sales/models/Invoice.ts`), used as both the POS bill and the "invoice" — same numbering series, same POS payment methods, same controller. Textilesoft's distinction between a B2B/GST "Invoice" and a B2C "Bill" (open question even in their own document) has no counterpart here: there's no second document type, no separate numbering series, and no distinct GST-filing linkage.

## F. Barcode & label printing — Existing

Multi-printer label format support was already built earlier in this engagement (`labelPrinterFormats.ts` and related). Textilesoft's approach of one page per printer model is explicitly *not* something to replicate — a single templating layer per printer driver, which is what the ERP already has, is the correct target shape here.

## G. Combo offers — Existing

Built earlier this engagement: `ComboOfferManager.tsx` frontend + real backend module (combo/bundle definition, pricing). Covers Textilesoft's combo/bundle definition and super-combo rows; combo stock/material-transfer reporting wasn't separately re-verified in this pass.

## H. Cash management / till — Partial

Petty cash close (denomination-based) is real. Core cash/bank operations (`CashBankController.ts`/`CashBankService.ts`, `BankAccount`/`Cheque` models) are genuine CRUD.

**But**: `CashDrawerIntelligence.tsx` and `ShiftManagementIntelligence.tsx` — the two screens most analogous to Textilesoft's till open/close and cash-in/cash-out logging — are **mock dashboards** with hardcoded fake data (fake cashier names, fake locations) and no API calls; each has a sibling `...MockUI.tsx` confirming the mock status. No EMI/installment master exists anywhere. No card-swipe-machine/payment-terminal registry exists.

## I. Agent / supplier accounts — Existing

Supplier payment entry, supplier ledger, purchase orders, purchase returns, and rate correction are all real (see Section B evidence). A full Agent master (name, commission, linked supplier, bank payout details) was built this engagement, matching Textilesoft's `agentdetail`.

## J. Customer management — Partial

Registration, ledger/transactions, customer groups, and loyalty-point redemption (POS `loyaltyConfig`, `Tenant.loyaltyPointLabel`) are all real. Customer feedback capture (`CustomerResponseEntry` equivalent) was not found or verified in this pass — likely missing, not confirmed either way.

## K. Commission management — Missing

No salesman commission, product/PCS/range-wise commission, or floor/section commission reporting exists anywhere. The only "commission" concept in the codebase is a single flat `commissionPercent` field on the new Agent master — a number, not a rule table. Textilesoft's described subsystem (its own rule configuration plus staff-incentive reporting) has no counterpart.

## L. Discount management — Partial

Discount is a bare `discount`/`discountTotal` number on invoice line items — no date-ranged, product-scoped, or barcode-scoped discount rule master exists anywhere.

**Resolved (2026-09-04)**: the ERP's own MIS Controls gap (`allowDiscountOverride`, `maxDiscountPercent`, `requireApprovalForHighDiscount` in `MISControlsTab.tsx`/`types/tenant/mis.ts`) is fixed. `Tenant.misConfig` now persists to MongoDB (previously the Settings save flow was local-Redux-only, and a wiring bug sent the discount-cap input to the wrong field). `PosController.createInvoice` reads it and rejects a sale whose bill+line discount exceeds `maxDiscountPercent` unless override is allowed, and requires a manager/co-owner/owner approver when `requireApprovalForHighDiscount` is on. The POS gained its first discount-entry field (`POSFooter.tsx`) to go with it — previously there was no way to apply a discount at all, so the flags had nothing to gate. Enforcement is tenant-wide (one cap, one override flag, one approval flag for the whole store) and role-gated (owner/co-owner/manager can self-approve; anyone else is told to hand the sale to a manager) — see below for why that's a lower bar than what Textilesoft's own rights model implies.

**New finding — Textilesoft's own discount-permission model is per-user and richer, and may itself be unenforced.** `discountpermission.aspx` in the legacy system is a per-user rights screen (`Select User` dropdown, then checkboxes/values for: Bill Discount, Product Discount, Product Less/Less Amount, Amount(Max), Percentage, Range, Wholesale Rate, Bill Cancel, Edit, Delete, plus a generic "Special Permission" flag). That's a materially richer authorization model than the ERP's new tenant-wide cap — it's scoped per user, distinguishes bill-level vs product-level discount, amount vs percentage vs range, and bundles in cancel/edit/delete rights alongside discount rights.

Whether Textilesoft actually *enforces* that model is unresolved. On `gstSaleCashBillEntry.aspx` and its sibling bill-entry pages, the discount textboxes (`TextBox13`, `TextBox45`, `txtTotalBillDisAmount`, `txtTotalBillDisAmount1`) toggle their HTML `readonly` state via inline `<script>` blocks keyed only to whether a sibling field on the same row is empty (an anti-fighting-fields convenience, not an authorization check). No `Session[...]` reference, `<%= %>`/`<%# %>` binding, or any occurrence of "permission" in the custom JS behind the cash/credit sale screens ties a field's editability to the logged-in user's `discountpermission` record (the only "permission" hits anywhere in the project are false positives inside third-party jQuery UI files). As rendered, the discount fields are always editable regardless of what that user's rights record says.

Per the framework's Rule 1 this is `UNKNOWN — REQUIRES SOURCE OR LIVE TEST`: the compiled Save handler (code-behind, unreadable from this vantage point — see the scoping note at the top of this document) could independently re-validate the submitted discount against the user's `discountpermission` record before persisting the bill, which would make this a UI-only gap rather than a fully open one. But no evidence of that was found either, and "an HTML `readonly` attribute toggled client-side with no server round-trip" is exactly the shape of a permission that only looks enforced — removable via dev tools, or bypassable by calling the save endpoint directly. Closing this with certainty needs either the Save handler's source or a live test: log in as a user with discount rights off, strip `readonly` via dev tools, and see if the server accepts the bill.

**How to apply**: don't reproduce the "readonly-toggle-only, no server check" pattern if/when the ERP grows a per-user discount rights model — that's the defect, not the behavior to migrate. Do treat Textilesoft's rights taxonomy (per-user; bill vs product; amount vs percentage vs range; wholesale-rate-specific; bundled with cancel/edit/delete) as the real target to eventually build toward, since the ERP's current tenant-wide cap is a real but comparatively blunt instrument next to it.

## M. Stock management — Partial

- **Reorder alerts**: real backend (`getLowStockItems`, compares against a genuine per-item `lowStockLimit` field, not a flat threshold) — but the frontend page consuming it, `LowStockAlerts.tsx`, is 100% hardcoded mock data, not wired to the real endpoint. `StockMovement.tsx` is likewise mock.
- **Damage/loss tracking**: missing — `StockLog`'s type enum has no DAMAGE/LOSS/WRITE_OFF value; the only trace is a `DAMAGED` status on serialized (IMEI) units specifically, with no workflow or report around it.
- **Inter-warehouse/store transfer**: data model only — `Item.ts` has `warehouseLevels[]`/`storeLevels[]` arrays, but there's no transfer/move endpoint anywhere, and no barcode-wise or store-to-store transfer UI.

## N. Reporting — Partial

Roughly 15-20 real report surfaces exist (`BrandWiseSalesReport`, `CategoryWiseSalesReport`, `CounterWiseSalesReport`, `HourlyBillingReport`, `CityWiseStockReport`, `RackWiseStockReport`, plus the `BusinessReportsHub`) against Textilesoft's 66+.

**Notable finding**: `menu.config.ts` deliberately routes the main Reports nav item to `ReportsMockUI.tsx`, with an explicit code comment that the more complete-looking `BusinessReportsHub` is "still backed by hardcoded placeholder numbers, not live queries" — meaning the more polished-looking screen is the less real one. GST/IGST reporting exists as a concept (`GSTReconciliation.tsx`) but is mock data (hardcoded `missingGSTR: 12`, etc.), not compliance-grade GSTR filing output — worth flagging given Textilesoft's own document marks this category P0 for statutory reasons.

## O. User administration & access control — Partial

Login/auth is real (`AuthController.ts`, `AuthService.ts`, `User.ts`, `Tenant.ts`). The frontend RBAC system (`settingsSlice.ts` per-role view lists) looks granular, but only controls UI visibility.

**Notable finding**: the actual backend enforcement, `rbacMiddleware.ts`, is a stub — `requirePermission()` grants everything to `role === 'owner'` and rejects every other role outright, with a comment noting other-role logic is optional/unimplemented. So today, any non-owner role's permissions are effectively "deny all" server-side regardless of what the frontend UI shows them. Separately, the super-admin/multi-tenant console (`SuperAdminGrowthConsole.tsx`) is explicitly mocked — its config service comment reads "Mocking global config controlled by Super Admin."

## P. System/printer/report settings — Missing (mostly)

Branch/counter configuration is real (`BranchSettingsTab.tsx`). No printer configuration, no receipt/bill layout customization (header/footer), and no report-sharing/export options exist anywhere in the settings module.

## Q. Bundled verticals — N/A, decision needed

The ERP's `Sector` concept covers Textile/Pharmacy/Retail/General only — grocery, bakery, electrical, tea-shop, and jewelry (all present in Textilesoft) have no ERP equivalent. This mirrors the open question Textilesoft's own capability map raises: confirm with the business which verticals this specific deployment actually needs before treating any of them as required scope.

## R. Dead code / retire candidates — N/A

Textilesoft's own dead-page list (`WebForm1.aspx`, test/sample pages, "OLD"-suffixed duplicates) is about *their* codebase hygiene and doesn't map onto this ERP.

---

## Flagged for priority attention

1. **RBAC enforcement is a backend stub** (Section O) — every non-owner role is effectively denied everything server-side today, regardless of what the frontend permission lists suggest. This is a real access-control gap, not a missing convenience feature. **Still open.**
2. ~~Discount-override permission flags are unenforced (Section L)~~ — **Resolved 2026-09-04.** `maxDiscountPercent`/`allowDiscountOverride`/`requireApprovalForHighDiscount` now persist to `Tenant.misConfig` and are enforced both client-side (`usePOSCheckout`, blocks before the receipt prints) and server-side (`PosController.createInvoice`, rejects at the API). See Section L.
3. **Textilesoft's own `discountpermission.aspx` shows the same "looks enforced, isn't" shape** (Section L) — a per-user discount/cancel/edit/delete rights screen whose checkboxes don't appear to be read anywhere in the sales-entry client script. Flagged as `UNKNOWN — REQUIRES SOURCE OR LIVE TEST`, evidence leaning toward unenforced. Treat as a defect pattern to avoid reproducing, not a behavior to migrate — but treat Textilesoft's per-user rights *taxonomy* (richer than the ERP's current tenant-wide cap) as the real target for a future pass.

## Recommended next steps

Given the scale, the Textilesoft document itself recommends picking specific modules to go deep on rather than tackling everything at once. Reasonable next candidates, roughly in order of business risk: (1) RBAC backend enforcement (security gap, still open), (2) per-user discount/cancel/edit/delete rights modeled on Textilesoft's `discountpermission.aspx` taxonomy — a natural extension of the tenant-wide cap just built, and ties directly into #1's RBAC work, (3) Commission management (entirely missing subsystem), (4) Wholesale/Retail billing or Invoice-vs-Bill distinction (both need a business-confirmation conversation first, per Textilesoft's own open questions, before any building starts), (5) replacing the mock screens found above (Cash Drawer, Shift Management, Low Stock Alerts, Stock Movement, Reports Hub) with real backend-wired versions now that the gap is documented.
