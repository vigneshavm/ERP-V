# Customer and supplier SQL screen audit — 2026-10-02

This audit traces the mounted UI/API paths and the existing SQL mappings. It introduces no tables or schema changes.

| Screen / behavior | Existing SQL evidence | Disposition |
|---|---|---|
| Customer directory | `GET /api/customers` reads `dbo.newcustomer`; fields mapped are serial/card, name, phone, email, address/city/postcode, GST, discount, points, credit days, balance and dates. | API read only; screen disabled until party identity is safe to link. |
| Customer detail / edit / add | Legacy key is `card_number || sl_nu`; both columns are nullable strings, neither is verified unique, and detail matching uses either field. A live customer row had both blank. | Disabled. Detail returns 409 on multiple key matches; all mutations return 503. |
| Customer groups | `dbo.CustomerGroup` exposes ID/code/name, but membership semantics and customer linkage are not mapped. | Disabled. |
| Customer ledger, statements, dues, referral, consent, archive | No compatible mounted SQL transaction/history contract was found for these behaviors. `sales2` has customer card/name references, but the SQL POS writer intentionally saves anonymous sales (`hasCustomer = false`). | Disabled; no Mongo fallback. |
| Loyalty | Existing `CatagaryPoints`, `Cus_points`, `customerAddPoints`, `customerLessPoints`, `custpoint`, and `ProductBrandPoint` tables describe rules/configuration. They do not establish customer-level earn, redeem, reversal history and authoritative balances. | Loyalty screen/actions and POS points preview disabled. |
| Supplier directory | `dbo.supplierdetail` and `dbo.purgrnentry` are grouped/joined by supplier name. Four duplicate supplier-name groups were found in the live aggregate. Some exposed IDs are SHA-derived from the current name when a code is absent. | Read adapter remains available internally; party screens disabled until IDs and bill links are verified. |
| Supplier detail / edit / add / groups / statements / ledger / ageing | There is no verified stable supplier key or complete payment/ledger contract. Existing purchase entries are not equivalent to supplier payables. | Disabled; no Mongo fallback. Supplier mutation API returns 503. |

## Applied SQL-only behavior

- Mounted customer and supplier APIs no longer write to SQL using unverified keys. Unsupported writes fail explicitly with HTTP 503.
- Customer detail lookup no longer returns an arbitrary first row when a key collides; it fails with HTTP 409.
- Customer/supplier screens are routed to a clear unavailable state. POS checkout states that it is anonymous and does not save customer balances or loyalty points.
- The POS customer lookup thunk no longer calls Mongo-shaped search/create endpoints or fabricates a local customer ID; it clears the selected party.
- The unsupported customer field-update SQL writer was removed. No SQL table was created or altered.

## Remaining evidence needed

SQL-053 stays blocked until existing customer and supplier identifiers can be proven stable and unique from deployed schema/write-path evidence. Do not enable party-linked workflows based on names, phone numbers, nullable card numbers, or synthesized IDs. Supplier/customer group membership and loyalty history also need an existing-table semantic map before those screens can be restored.
