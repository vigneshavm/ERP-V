# Commission and offers SQL audit — 2026-10-02

No SQL schema changes were made.

| Area | Existing SQL evidence | Decision |
|---|---|---|
| Commission rules | `erp.commission_rule` exists in the captured schema and has an identity primary key, but no FK. It stores employee/item IDs and rate rules, not earned or paid commission transactions. Its API routes are not mounted by `app.ts` in SQL-only mode. | Commission rules and report screen unavailable. |
| Commission inputs | POS lines write `salsntry.sls_man`; the employee master query found zero `newemployee` rows, so the employee code join cannot be verified. Item/category sales detail is available, but no payout ledger or reversal history was found. | Do not calculate or claim commission totals. SQL-068 remains blocked. |
| Combo offers | `dbo.BarcodewiseComboOffer` exists with zero rows in the schema snapshot. Its fields are GRN/line/barcode/product/quantity and price adjustment fields; no verified effective-date, eligibility, redemption, sale-link or reversal lifecycle was found. | Combo and free-item configuration screens unavailable. |
| Discount/coupon/offer reporting | Sales line schema includes legacy fields such as `OfferQty`, `SchemaDiscount`, `SchemaDisAmount`, `comboname`, `combostatus` and `combobarcode`. The current SQL POS writer does not populate these fields; it stores line discount/less and bill payment/tax totals only. | No reliable applied-offer identifier or redemption report; screens unavailable. SQL-071 and SQL-072 remain blocked. |
| Marketing campaigns/integrations | No mounted SQL-only campaign, WhatsApp, SMS, social, email, coupon or storefront persistence route was found in the active app route graph. | Marketing actions now show unavailable; separate provider connectivity is not represented as a completed campaign. |

## UI changes

- Combo offers, marketing offers, coupons and campaign/engagement screens route to an explicit unavailable state.
- HR commission already routes to the unavailable state from the HR audit.
- No offer is inferred from a discount amount, product flag, or combo table row. Existing reports remain limited to the SQL data they explicitly read.

## Marketing/SMS/WhatsApp caller retirement — 2026-10-02

The UI routes for marketing, coupons, offers, email, WhatsApp, social, storefront, SMS and engagement now show the unavailable state. No active SQL route persists these actions. The old Meta integration controller/model, WhatsApp campaign/template controller/models, SMS tracker controller/model/parser, combo offer controller/model/service, and Mongo engagement report service/controller were unmounted from `app.ts`; their unused source files and route references were removed after checking callers. This removes the legacy persistence path without claiming provider connectivity or campaign delivery.
