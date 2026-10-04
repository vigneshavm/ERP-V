# 07 - Purchase Return - End-to-End Flow

This document traces the TextileSoft purchase-return implementation from the `NewPurchaseReturn.aspx` user interface through temporary return-entry buffers, return header/detail persistence, the legacy `purretrun` return ledger, barcode-level handling, GRN/supplier linkage, return reports, edit/delete paths, and the relationship to original purchase, stock, barcode, accounts, and reporting. The analysis is based on the supplied TextileSoft source archive and compiled ASP.NET assemblies. Where the source does not prove a direct stock mutation, that is stated explicitly rather than inferred as fact.

# 1. Purpose
- Document the complete purchase-return lifecycle.
- Separate the modern/expanded `PurchaseReturnHeader` + `PurchaseReturnDetails` representation from the legacy `purretrun` return ledger.
- Trace barcode-wise and GRN-wise return workflows.
- Identify how the return references the original purchase GRN and supplier.
- Document quantity, meter, free quantity, tax, discount, charge and net-amount fields.
- Document edit/delete/reporting behavior and migration implications.

# 2. Source Scope Traced
| Area | Source |
| --- | --- |
| Primary entry | `NewPurchaseReturn.aspx` |
| Client scripts | `NewPurchaseReturnJS/*` |
| Primary compiled code | `bin/App_Web_qj0n24d4.dll` |
| GRN-wise return | `PurchaseReturnGRNwise.aspx` + `bin/App_Web_dukfunw5.dll` |
| Negative/barcode-wise return | `PurchaseReturnNegativeQty.aspx` + `bin/App_Web_p4sog2pf.dll` |
| Return details | `PurchNewDetails.aspx` |
| Return bill view | `PurchaseReturnBillView.aspx` |
| Barcode-wise return | `PurchaseReturnBarcodewise.aspx` |
| Purchase source | `purgrnentry`, `purentrydetails`, `stockdetails` |

# 3. Purchase Return Module Family
| Component | Role |
| --- | --- |
| NewPurchaseReturn.aspx | Main purchase-return entry and edit UI. |
| PurchaseReturnHeader | Expanded header record for return document. |
| PurchaseReturnDetails | Expanded detail record for returned product/barcode. |
| purretrun | Legacy/operational return ledger used extensively by views and reports. |
| PurchaseReturnMainTemp | User/session temporary detail buffer. |
| PurchaseReturnSubTemp | Secondary temporary detail buffer. |
| TMP_PURCH_BACK | GRN/barcode return working buffer used by return analysis/edit flows. |
| PurchNewDetails.aspx | Purchase return detail viewing. |
| PurchaseReturnGRNwise.aspx | GRN-wise return review/edit/delete. |
| PurchaseReturnNegativeQty.aspx | Barcode-wise/negative-quantity return handling. |
| PurchaseReturnBillView.aspx | Return bill/header and line presentation. |

# 4. Business Meaning
A purchase return represents goods moving back to a supplier after they have been received through purchasing. The return retains the supplier, company, original purchase GRN, invoice context, barcode/product identity, textile attributes, quantities, meters, rates, discounts and tax amounts. The return number is represented by `rgrno` in the legacy return ledger and is separate from the original purchase `grn_no`.

# 5. Return Document Identity
| Identifier | Meaning | Source evidence |
| --- | --- | --- |
| rgrno | Purchase Return GRN / return document number in `purretrun`. | Return list/report queries group/order by `rgrno`. |
| grn_no | Original purchase GRN linked to the return. | `purretrun.grn_no`; return UI accepts GRN No. |
| sup_retu_grn | Supplier-return GRN/reference number. | Stored in `purretrun` and shown as Supp_GRN. |
| barcode | Physical inventory/barcode identity of the returned line. | Return details and barcode lookup use barcode. |
| sl_no | Line number inside return document. | Stored in detail and ledger. |

# 6. Primary UI Context
The main screen displays COUNTER, LOGIN and DATE at the top. The entry header contains warehouse, supplier, agent, incharge, company, GRN No, invoice, dates and commercial/tax totals. The detail grid contains barcode, HSN, product, rates, quantities, tax, textile attributes and return-specific quantity/meter tracking.

# 7. Header Fields
| UI concept | Control / field | Business meaning |
| --- | --- | --- |
| Warehouse | `ComboBox1` | Return warehouse/location. |
| Supplier | `ComboBox2` | Supplier receiving the returned goods. |
| Agent | `ComboBox3` | Supplier agent. |
| Incharge | `ComboBox5` | Responsible person. |
| Company | `cmbx5` | Company/business entity. |
| Original GRN | `TextBox1` | Original purchase GRN reference. |
| Invoice | `TextBox26` | Supplier invoice reference. |
| Invoice date | `TextBox6` | Supplier invoice date. |
| Entry date | `TextBox13` | Return entry date. |
| PNET TOTAL | `TextBox3` | Header commercial total before later layers. |
| Agent commission % | `TextBox8` | Agent commission percentage. |
| Agent commission amount | `TextBox11` | Calculated commission amount. |
| Charges | `TextBox15`, `TextBox21`, `TextBox2` | Package/other/total charges. |
| PEXP% | `TextBox25` | Calculated purchase-expense percentage. |
| Bill discount % | `TextBox9` | Header bill discount percentage. |
| GST % | `TextBox17` | GST rate. |
| IGST % | `TextBox22` | IGST rate. |
| Brand | `ComboBox6` | Header brand context. |
| Sales % | `TextBox19` | Sales percentage. |
| Cross amount | `TextBox24` | Cross/related amount field. |
| MRP discount % | `txtMRPPer` | Header MRP discount percentage. |
| Less | `TextBox5` / `TextBox37` | Less/return reduction inputs. |

# 8. Detail Grid Fields
| Field | Meaning |
| --- | --- |
| sl_no | Return line number. |
| barcode | Returned physical item/barcode. |
| hsncode | HSN snapshot. |
| code | Product code. |
| pname | Product name snapshot. |
| prate | Purchase rate. |
| mtr | Meter value per unit/line. |
| qty | Returned quantity. |
| fqty | Returned free quantity. |
| amount | Gross line amount. |
| pless | Purchase-less value. |
| plamt | Purchase-less amount. |
| dis_per | Discount percentage. |
| dis_amount | Discount amount. |
| gst_per | GST percentage. |
| gst_amount | GST amount. |
| nrate / net_amount | Net rate and net line amount. |
| sr_per / sr_rate | Selling-rate percentage/rate snapshot. |
| mrp | MRP snapshot. |
| mrpdisper / mrpdisamt | MRP discount percentage/amount. |
| cr_per / cr_rate | Commission percentage/rate. |
| design | Design number. |
| brand | Brand. |
| patrn | Pattern. |
| size | Size. |
| color | Color. |
| style | Style. |
| rackno | Rack number. |
| model | Model number. |
| fashion | Fashion name. |
| unit_details | Unit snapshot. |
| pro_group_name | Product group snapshot. |
| orgbar | Original barcode/reference. |
| billstatus | Billing/status flag. |

# 9. Return Entry Client-Side Save Flow
`NewPurchaseReturnJS/updatejs/saveData.js` implements a two-step save. First it validates that the displayed total quantity equals the detail total quantity and that displayed total meters equal the detail total meters. Then it posts header data to `NewPurchaseReturn.aspx/Savehead`. On successful header save, it calls `NewPurchaseReturn.aspx/SaveData` with serialized grid rows.
```sql
// Simplified observed sequence from saveData.js
if (totalqty != totalviewqty) reject;
if (totalmtr != totalviewmtr) reject;

POST NewPurchaseReturn.aspx/Savehead
    -> header object

on success:
POST NewPurchaseReturn.aspx/SaveData
    -> serialized detail rows
```

# 10. Header Save Payload
The JavaScript builds the header payload with company, warehouse, supplier, agent, original GRN, invoice, invoice date, entry date, payment type, net total, commission, charges, discounts, GST/IGST, incharge, brand, sales percentage, cross amount, MRP discount and GST bucket totals.
| Payload property | UI source |
| --- | --- |
| cmy | `cmbx5` |
| warhouse | `ComboBox1_ComboBox1_TextBox` |
| sup | `ComboBox2_ComboBox2_TextBox` |
| age | `ComboBox3_ComboBox3_TextBox` |
| grno | `TextBox1` |
| invoceno | `TextBox26` |
| invocdate | `TextBox6` |
| entrydate | `TextBox13` |
| paytyp | `ComboBox4_ComboBox4_TextBox` |
| nettot | `TextBox3` |
| agcomper | `TextBox8` |
| agcom | `TextBox11` |
| packcha | `TextBox15` |
| othercha | `TextBox21` |
| totcha | `TextBox2` |
| tqty | `TextBox4` |
| eaamt | `TextBox25` |
| bdisper | `TextBox9` |
| gstper | `TextBox17` |
| igst | `TextBox22` |
| inch | `ComboBox5_ComboBox5_TextBox` |
| brand | `ComboBox6_ComboBox6_TextBox` |
| salesper | `TextBox19` |
| cross | `TextBox24` |
| mrpdisperh | `txtMRPPer` |
| gst5/gst12/gst18/gst28 | labels 79-82 |
| less | `TextBox5` |
| totnetamt | `Label64` |
| tot_less | `TextBox37` |

# 11. Header Save SQL
```sql
insert into PurchaseReturnHeader (
    warehouse, suplier_name, agent_name, incharge, cmy_name,
    grn_no, invoce_amount, invoce_date, entry_date, date,
    CQty, CMtr, ViewStatus, tot_less, less, totnetamot, pay_type,
    pnet_tot, com_per, com_amount, pack_char, pack_charless,
    oter_char, char_tot, tot_qut, char_qut_amou, bdis_in,
    gst_in, igst_in, brand, sales, cross_amount, gst5, gst12,
    gst18, gst28, mrpdisperh, AddchargeAmt, AddchargePer,
    AddcharegeGST, AddchargeWOGST, IGSTAmt, Supplier_City,
    CTotal, CGst, PreDisamt
)
values (
    @warehouse, @suplier_name, @agent_name, @incharge, @cmy_name,
    @grn_no, @invoce_amount, @invoce_date, @entry_date, @date,
    @CQty, @CMtr, @ViewStatus, @tot_less, @less, @totnetamot,
    @pay_type, @pnet_tot, @com_per, @com_amount, @pack_char,
    @pack_charless, @oter_char, @char_tot, @tot_qut,
    @char_qut_amou, @bdis_in, @gst_in, @igst_in, @brand, @sales,
    @cross_amount, @gst5, @gst12, @gst18, @gst28, @mrpdisperh,
    @AddchargeAmt, @AddchargePer, @AddcharegeGST, @AddchargeWOGST,
    @IGSTAmt, @Supplier_City, @CTotal, @CGst, @PreDisamt
)
```

# 12. Return Detail Save SQL
```sql
insert into PurchaseReturnDetails(
    entry_date, pratecode, grn_no, sl_no, barcode, design, hsncode,
    code, pname, prate, mtr, qty, amount, dis_per, dis_amount,
    gst_per, gst_amount, nrate, net_amount, sr_per, mrp, sr_rate,
    cr_per, cr_rate, brand, patrn, size, color, rackno, model,
    fashion, style, fqty, date, pro_group_name, unit_details,
    orgbar, pless, plamt, mrpdisper, mrpdisamt, billstatus
)
values(
    @entry_date, @pratecode, @grn_no, @sl_no, @barcode, @design,
    @hsncode, @code, @pname, @prate, @mtr, @qty, @amount,
    @dis_per, @dis_amount, @gst_per, @gst_amount, @nrate,
    @net_amount, @sr_per, @mrp, @sr_rate, @cr_per, @cr_rate,
    @brand, @patrn, @size, @color, @rackno, @model, @fashion,
    @style, @fqty, @date, @pro_group_name, @unit_details, @orgbar,
    @pless, @plamt, @mrpdisper, @mrpdisamt, @billstatus
)
```

# 13. Alternate Return Detail Insert
```sql
insert into PurchaseReturnDetails(
    grn_no, sl_no, barcode, design, hsncode, code, pname, mtr,
    qty, mrp, cr_per, cr_rate, brand, patrn, size, color, rackno,
    model, fashion, style, mrpdisper, mrpdisamt, billstatus, date,
    entry_date, pro_group_name, unit_details, orgbar, pratecode,
    prate, amount, dis_per, dis_amount, gst_per, gst_amount,
    nrate, net_amount, sr_per, sr_rate, fqty, pless, plamt
)
values(
    @grn_no, @sl_no, @barcode, @design, @hsncode, @code, @pname,
    @mtr, @qty, @mrp, @cr_per, @cr_rate, @brand, @patrn, @size,
    @color, @rackno, @model, @fashion, @style, @mrpdisper,
    @mrpdisamt, @billstatus, @date, @entry_date, @pro_group_name,
    @unit_details, @orgbar, @pratecode, @prate, @amount, @dis_per,
    @dis_amount, @gst_per, @gst_amount, @nrate, @net_amount,
    @sr_per, @sr_rate, @fqty, @pless, @plamt
)
```

# 14. Legacy Return Ledger `purretrun`
The compiled implementation also persists a legacy/operational return ledger in `purretrun`. This is important because many return views and reports query `purretrun` directly. It should not be assumed to be a duplicate that can simply be dropped during migration.
```sql
insert into purretrun (
    sup_retu_grn, supp_name, agent_name, cmy_name, invoice_nu,
    grn_no, gst, igst, deign_nu, barcode, code, pr_name, pr_rate,
    mtr, qty, fqty, amt, dis_per, dis_amt, sr, mrp, gst_per,
    gst_amt, netamt, brand, pattern, color, size, date,
    incharge_name, rgrno, type, sl_no, cr, crrate, pratecode,
    style, nrate, add_charge, courier_charge, bill_dis_per,
    bill_dis_amt, bill_less, Count_Name, Login_Name, unit_dtl,
    supp_netamt, Return_Status, sp_Return_Status, igst_amt
)
values (
    @supmode, @supplier, @agentname, @company, @Invoiceno,
    @grn_no, @gst_per, @igst, @design, @barcode, @code, @pname,
    @prate, @mtr, @qty, @fqty, @amount, @dis_per, @dis_amount,
    @sr_per, @sr_rate, @gst_per, @gst_amount, @net_amount,
    @brand, @patrn, @color, @size, @entry_date, @incharge,
    @grn_no, 'G', @sl_no, @cr_per, @cr_rate, '', @style, @nrate,
    @addcharges, '', @dis_per, @dis_amount, @pless, ...
)
```
The captured SQL shows the legacy row uses `type = 'G'` in this save path. The exact final values for the tail of the statement are parameterized/assembled in the compiled code, so migration should use the actual database schema and runtime values to confirm every status field.

# 15. Return Number / rgrno
The return ledger is queried using `rgrno`, often with a `PR` prefix. The source contains `select * from purretrun where rgrno LIKE 'PR...` patterns and year-based queries such as `rgrno LIKE 'PR` combined with `YEAR(date)`. This indicates `rgrno` is the user-visible return document identity.

# 16. Return Supplier GRN
`sup_retu_grn` is separately stored from `rgrno` and `grn_no`. The GRN-wise report explicitly displays `Supp_GRN` from `sup_retu_grn` and `Pur_GRN` from `grn_no`. Therefore the return model has three distinct references: return document number, supplier-return GRN/reference, and original purchase GRN.
| Reference | Direction |
| --- | --- |
| rgrno | Return document generated by TextileSoft. |
| grn_no | Back-reference to original purchase GRN. |
| sup_retu_grn | Supplier return GRN/reference associated with the supplier transaction. |

# 17. Original Purchase Link
The return detail and ledger both retain `grn_no`. Return views query the original purchase detail using the same GRN and display purchase-line information alongside return quantities. This is the primary source-level linkage between the purchase receipt and its return.
```sql
select grn_no, sl_no, barcode, design, hsncode, code, pname,
       prate, mtr, qty, amount, pless, plamt, dis_per,
       dis_amount, gst_per, gst_amount, nrate, net_amount,
       sr_per, mrp, sr_rate, cr_per, cr_rate, brand, patrn,
       size, color, rackno, model, fashion, style, fqty,
       mrpdisper, mrpdisamt, unit_details, STATUS
from PurchaseReturnDetails
where grn_no='...';
```

# 18. Barcode Lookup
The return UI supports barcode-driven identification. The compiled code contains `GetProductByBarcode`, `select * from PurchaseReturnDetails where barcode=@Barcode`, and `select * from purentrydetails where barcode=@Barcode`. This allows the return process to resolve a physical barcode against the original purchase and/or prior return records.

# 19. Barcode Duplicate / Return Safety
The source does not provide a single explicit database constraint proving one active return per barcode. Instead, the application queries purchase-return details and purchase details by barcode. New ERP should enforce available-return quantity at the transaction layer and prevent returning more than the unreturned quantity.

# 20. Detail Quantity and Meter Reconciliation
The client save routine compares the header/display quantity with the calculated detail quantity and the header/display meter total with the calculated detail meter total. If either differs, save is blocked with a message instructing the operator to adjust the quantity or meter.
```sql
if (totalqty != totalviewqty)
    alert("Not Allowed to Save. Please Adjust the Quantity Product....");

if (totalmtr != totalviewmtr)
    alert("Not Allowed to Save. Please Adjust the MTR Product....");
```

# 21. Meter Calculation
Return views calculate line total meters using `mtr * qty`. The GRN-wise detail query exposes `ViewTotMtr = ISNULL(CONVERT(float,mtr),0) * ISNULL(CONVERT(float,qty),0)`. Therefore meter quantity is not necessarily stored only as a precomputed total; it is also derivable from the line unit-meter and quantity values.

# 22. Free Quantity
`fqty` is carried through return header/detail/ledger data. It should be treated separately from paid quantity because it affects physical inventory but may have a different financial basis.

# 23. Return Line Amount
| Field | Meaning |
| --- | --- |
| amount / amt | Gross line amount before later deductions/tax. |
| pless / bill_less | Purchase/bill less deduction. |
| dis_amount | Line discount. |
| gst_amount | GST component. |
| net_amount / netamt | Net financial amount. |
| supp_netamt | Supplier-side net amount used in return views. |

# 24. GST and IGST
The return header contains GST/IGST inputs and GST bucket totals. The detail stores `gst_per`, `gst_amount`, while the ledger stores `gst`, `igst`, `gst_per`, `gst_amt`, `igst_amt`. The system therefore preserves both rate and calculated tax amount.
| Header tax field | Detail/ledger field |
| --- | --- |
| gst_in | gst_per / gst_amount |
| igst_in | igst / igst_amt |
| gst5 | GST 5 bucket |
| gst12 | GST 12 bucket |
| gst18 | GST 18 bucket |
| gst28 | GST 28 bucket |

# 25. Commercial Charges
The return header supports package/other charges and total charges. The legacy ledger additionally carries `add_charge`, `courier_charge`, `bill_dis_per`, `bill_dis_amt`, and `bill_less`. GRN-wise views expose these fields for review and recalculation.

# 26. Temporary Return Buffers
| Table | Purpose |
| --- | --- |
| PurchaseReturnMainTemp | Primary per-user working rows before final return persistence. |
| PurchaseReturnSubTemp | Secondary/import/sub-grid working rows. |
| TMP_PURCH_BACK | Working copy used by GRN/barcode return workflows and calculations. |

# 27. PurchaseReturnMainTemp Insert
```sql
Insert into PurchaseReturnMainTemp
(
    sl_no, hsncode, code, pname, mtr, qty, mrp,
    mrpdisper, mrpdisamt, cr_per, cr_rate, design,
    brand, patrn, size, color, rackno, model, fashion,
    style, UserName, CounterName, prate, amount, pless,
    plamt, dis_per, dis_amount, gst_per, gst_amount,
    nrate, net_amount, sr_per, sr_rate
)
values
(
    @sl_no,@hsncode,@code,@pname,@mtr,@qty,@mrp,
    @mrpdisper,@mrpdisamt,@cr_per,@cr_rate,@design,
    @brand,@patrn,@size,@color,@rackno,@model,@fashion,
    @style,@UserName,@CounterName,@prate,@amount,@pless,
    @plamt,@dis_per,@dis_amount,@gst_per,@gst_amount,
    @nrate,@net_amount,@sr_per,@sr_rate
)
```

# 28. PurchaseReturnSubTemp Insert
```sql
Insert into PurchaseReturnSubTemp
(
    sl_no, hsncode, code, pname, mtr, qty, mrp,
    mrpdisper, mrpdisamt, cr_per, cr_rate, design,
    brand, patrn, size, color, rackno, model, fashion,
    style, unit_details, UserName, CounterName, prate,
    nrate, pless, dis_per, gst_per
)
values
(
    @sl_no,@hsncode,@code,@pname,@mtr,@qty,@mrp,
    @mrpdisper,@mrpdisamt,@cr_per,@cr_rate,@design,
    @brand,@patrn,@size,@color,@rackno,@model,@fashion,
    @style,@unit_details,@UserName,@CounterName,@prate,
    @nrate,@pless,@dis_per,@gst_per
)
```

# 29. Temporary Buffer Isolation
The temporary tables are filtered by `UserName` and often `CounterName`. This prevents multiple operators/counters from sharing the same working return rows. New ERP should use an explicit draft/transaction ID rather than relying only on username/counter predicates.

# 30. Temporary Buffer Cleanup
```sql
delete from PurchaseReturnMainTemp where UserName = '...';
delete from PurchaseReturnSubTemp where UserName = '...';
delete from TMP_PURCH_BACK where counter = '...';
```

# 31. TMP_PURCH_BACK Population
```sql
INSERT INTO TMP_PURCH_BACK (
    netamount,dis_amount,dis_per,amount,gst_per,gst_amount,
    sl_no,design,barcode,code,p_name,mtr,qty,mrp,crrate,
    brand,pattern,color,size,fqty,sr,cr,grno,sup,pratecode,
    pnrate,sup_retu_gm,rgrno,add_charge,courier_charge,
    bill_dis_per,bill_dis_amt,bill_less,counter,unit_details,
    supp_netamt
)
SELECT
    netamt,dis_amt,dis_per,amt,gst_per,gst_amt,sl_no,deign_nu,
    barcode,code,pr_name,mtr,qty,mrp,crrate,brand,pattern,
    color,size,fqty,sr,cr,grn_no,supp_name,pratecode,pr_rate,
    sup_retu_grn,rgrno,add_charge,courier_charge,bill_dis_per,
    bill_dis_amt,bill_less,Count_Name,unit_dtl,supp_netamt
FROM purretrun
where rgrno='...';
```

# 32. GRN-wise Return Workflow
The GRN-wise path starts from an original purchase GRN, loads purchase detail lines, derives the quantity/meter available for return, stages selected lines into the return working buffer, allows the operator to adjust return quantities and charges, and then persists the return. The page is explicitly titled `PURCHASE RETURN GRNWISE`.

# 33. GRN-wise Screen
| Screen element | Purpose |
| --- | --- |
| Purchase GRN | Select original receipt. |
| Supplier GRN | Display supplier-side return reference. |
| Purchase Return GRN | Display return document. |
| Grid | Edit line quantities and financial values. |
| TQTY | Total purchased/selected quantity context. |
| RTQTY | Return quantity. |
| TMTR | Total meters. |
| RTMTR | Return meters. |
| Add Charges | Return additional charge. |
| Courier Charges | Courier-related charge. |
| Bill Discount | Return bill discount. |
| Bill Less | Return bill less. |
| OK / update | Persist or update return. |
| EDIT | Load existing return for editing. |
| DELETE | Delete selected return. |

# 34. GRN-wise Original Purchase Query
The return views use `purentrydetails` and `purretrun` together. A representative query retrieves original purchase lines for a GRN and may left-join the return ledger to expose supplier-return amounts/quantities.
```sql
select amount as [amt], dis_per as [dis], dis_amount as [disamt],
       net_amount as [net_amount], sl_no AS [SNo],
       design AS [DesignNo], barcode AS [BarCode], code AS [Code],
       pname AS [ProductName], prate AS [prate], mtr AS [Mtr],
       qty AS [Qty], fqty AS [Fquty], sr_per AS [SR],
       mrp AS [Mrp], cr_per AS [Cr], cr_rate AS [CRate],
       gst_per, gst_amount, brand, patrn, size, color,
       style, pratecode, unit_details, '0' as [BSQty]
from purentrydetails
where grn_no='...';
```

# 35. Return Available Quantity Concept
The source exposes purchased quantity and returned quantity side by side in GRN-wise screens. This is the basis for calculating how much of a purchased line remains returnable. The exact arithmetic is distributed across the compiled return logic and temporary-buffer calculations, so the safest migration rule is to calculate availability from persisted purchase quantity minus posted return quantity, with barcode-level validation where a barcode is unique.

# 36. Barcode-wise Return Workflow
The barcode-wise path is represented by `PurchaseReturnNegativeQty.aspx` and related JavaScript. The page title is `PURCHASE RETURN BARCODEWISE`. The compiled code supports barcode/product lookup and reads from `purentrydetails` and `purretrun`.

# 37. Barcode Return Safety
A barcode is a physical inventory identity. A return should therefore not be treated as a generic product-code adjustment. The legacy system retains the barcode in `PurchaseReturnDetails`, `purretrun`, and the working buffers. New ERP should calculate returnable quantity per barcode and reject a return that exceeds available stock or the remaining quantity from the source GRN.

# 38. Return Status
The return ledger has both `Return_Status` and `sp_Return_Status`. Queries filter `purretrun` by `Return_Status`. The exact complete status enumeration is not fully exposed in the source text, so migration should inventory distinct live database values before defining a new enum.

# 39. Legacy Type
The main `purretrun` insert path sets `type` to `G`. This is evidence that the standard purchase-return flow records a GRN-based return type. Other source modules may have additional return types, so do not hard-code `G` as the universal future model.

# 40. Return Bill View
`PurchaseReturnBillView.aspx` shows return-level data including `rgrno`, supplier name, cross amount, GST amount, net amount, agent and incharge. The detail view exposes design, barcode, code, product, rate, meter, quantity, free quantity, amount, discount, GST, net amount, brand, pattern, color and size.

# 41. Return Details View
`PurchNewDetails.aspx` is explicitly titled `PURCHASE RETURN DETAILS` and uses `rgrno` as the return document identifier. It provides a detailed line-level representation of the return.

# 42. GRN-wise Return List
`PurchaseReturnGRNwise.aspx` lists return documents with `rgrno`, supplier name, `sup_retu_grn`, and `grn_no`. The list supports edit and delete. Date filtering uses From Date and To Date and filters by `Return_Status`.
```sql
select rgrno,supp_name,grn_no,
       MAX(sup_retu_grn) as sup_retu_grn
from purretrun
where date BETWEEN @From AND @To
  and Return_Status=@Return_Status
group by rgrno,supp_name,grn_no
order by rgrno asc
```

# 43. Daily Return List
```sql
select rgrno,supp_name,grn_no,
       MAX(sup_retu_grn) as sup_retu_grn
from purretrun
where date = CONVERT(varchar, getdate(), 23)
  and Return_Status=@Return_Status
group by rgrno,supp_name,grn_no
order by rgrno asc
```

# 44. Return Delete
```sql
delete from purretrun where rgrno=@rgrno
```
The GRN-wise compiled code contains deletion by `rgrno`. This is a hard delete in the legacy ledger. New ERP should use reversal/cancellation states or a controlled void transaction rather than physical deletion after posting.

# 45. Return Working Buffer Delete
```sql
delete from TMP_PURCH_BACK where counter = '...';
```

# 46. Return Detail Delete by Barcode
```sql
delete from PurchaseReturnDetails WHERE barcode='...';
```
This source-level operation is particularly important: deleting by barcode alone is weaker than a composite return-document/detail key. A new implementation should identify the exact return line by return transaction ID and barcode.

# 47. Return Detail Update
```sql
update PurchaseReturnDetails set
    entry_date=@entry_date,
    pratecode=@pratecode,
    grn_no=@grn_no,
    sl_no=@sl_no,
    design=@design,
    hsncode=@hsncode,
    code=@code,
    pname=@pname,
    prate=@prate,
    mtr=@mtr,
    qty=@qty,
    amount=@amount,
    dis_per=@dis_per,
    dis_amount=@dis_amount,
    gst_per=@gst_per,
    gst_amount=@gst_amount,
    nrate=@nrate,
    net_amount=@net_amount,
    sr_per=@sr_per,
    mrp=@mrp,
    sr_rate=@sr_rate,
    cr_per=@cr_per,
    cr_rate=@cr_rate,
    brand=@brand,
    patrn=@patrn,
    size=@size,
    color=@color,
    rackno=@rackno,
    model=@model,
    fashion=@fashion,
    style=@style,
    fqty=@fqty,
    date=@date,
    pro_group_name=@pro_group_name,
    unit_details=@unit_details,
    pless=@pless,
    plamt=@plamt,
    mrpdisper=@mrpdisper,
    mrpdisamt=@mrpdisamt
where barcode='...';
```

# 48. Original Purchase Data Retention
Return rows retain purchase-rate, product, HSN, tax, discount and textile-attribute snapshots. This is valuable because the original product master or purchase line may later change. New ERP should retain immutable transaction snapshots rather than recomputing historical returns from current master data.

# 49. Stock Relationship
The source clearly links purchase returns to the purchased barcode and purchase GRN. However, the main return assembly does not expose a direct `update stockdetails ...` statement that reduces stock at return posting. `stockdetails` update statements observed in the same assembly are primarily purchase-detail synchronization operations. Therefore the supplied source proves the return ledger and original-purchase relationship, but does not prove that the return screen directly mutates `stockdetails` in the same save method.

# 50. Stock Impact: What Is Proven
- The returned barcode is stored in the return detail/ledger.
- The original purchase barcode exists in `purentrydetails`.
- Return quantities are available for stock/report calculations.
- Return reports can derive return quantity and meter from `purretrun`.
- A direct return-time `stockdetails` decrement was not identified in the inspected main return assembly.

# 51. Stock Impact: Migration Rule
For migration, reconstruct stock from purchase receipts minus purchase returns, plus/minus other inventory movements, instead of assuming that `stockdetails.qty` alone is the authoritative balance. If the live database contains additional return-posting triggers/jobs/stored procedures, those must be checked before finalizing the new stock ledger.

# 52. Sales Relationship
The return code checks whether the barcode exists in sales tables in other compiled paths, including `salbill` and `superbill1`. This indicates the system is aware of sales status when handling barcode inventory. The source does not establish a universal prohibition that every sold item can never be returned to supplier, so the business rule must be verified against live behavior.

# 53. Purchase Return After Sale
A physically sold barcode should normally not be available for supplier return unless the sale has been reversed or the item has returned to stock. New ERP should validate the barcode inventory state before supplier return.

# 54. Supplier Financial Effect
`purretrun` stores `supp_netamt`, and the return UI includes payment type, charges, discount and tax. This provides the basis for supplier-credit/debit settlement reporting. The supplied source does not prove a single accounting voucher is created directly by the return save; finance integration should therefore be treated as a separate posting step unless verified in the accounting module.

# 55. Supplier Credit / Debit
A purchase return generally reduces the supplier liability or creates a supplier credit. In the legacy application, the return amount and supplier net amount are stored in the return ledger. A new ERP should post the accounting effect from the final posted return transaction, not from editable draft rows.

# 56. Tax Reversal
The return carries GST/IGST rate and amount fields. A new ERP should reverse the tax components associated with the returned quantity and preserve the original tax basis where required. Do not recalculate historical tax using today’s GST master.

# 57. Attribute Snapshot
| Attribute | Return storage |
| --- | --- |
| Brand | PurchaseReturnDetails.brand / purretrun.brand |
| Pattern | patrn / pattern |
| Color | color |
| Size | size |
| Style | style |
| Design | design / deign_nu |
| Model | model |
| Fashion | fashion |
| Rack | rackno |

# 58. HSN Snapshot
`hsncode` is stored at return-detail level. This preserves the HSN used for the returned transaction rather than relying on the current product master.

# 59. Unit Snapshot
`unit_details` is stored in the return detail/ledger and temporary buffers. This should be migrated as a historical snapshot of the purchase unit.

# 60. Purchase Rate Snapshot
`prate` and `pratecode` are stored. The return amount should normally be based on the source purchase valuation rather than the current product rate.

# 61. Return MRP Snapshot
`mrp`, `mrpdisper`, and `mrpdisamt` are retained. This matters for reports and historical return bill rendering.

# 62. Return Selling/Commission Snapshot
`sr_per`, `sr_rate`, `cr_per`, and `cr_rate` are retained. These fields should not be silently replaced by current selling/commission master values during migration.

# 63. Return Charges
| Field | Layer |
| --- | --- |
| add_charge | Additional return charge |
| courier_charge | Courier charge |
| bill_dis_per | Bill discount percentage |
| bill_dis_amt | Bill discount amount |
| bill_less | Bill less |
| BarAddCharge | Barcode/return-level additional charge in some ledger variants |
| BarCourierCharge | Barcode/return-level courier charge |
| BarcodeNetAmt | Barcode-level net amount in some ledger variants |

# 64. Multiple Return Representations
There are at least three persistence/working representations: `PurchaseReturnHeader` + `PurchaseReturnDetails`, `purretrun`, and temporary buffers. The migration must establish which rows are duplicates, which are authoritative for which report, and whether every posted return has both representations.

# 65. Return Reconciliation Keys
| Key | Use |
| --- | --- |
| rgrno | Return document grouping. |
| grn_no | Original purchase receipt grouping. |
| barcode | Physical item identity. |
| sl_no | Return line identity within document. |
| supp_retu_grn | Supplier reference. |

# 66. Recommended Legacy Reconciliation
For every `purretrun` group, compare its `rgrno`, `grn_no`, barcode, quantity, meter, amount and net amount against `PurchaseReturnDetails` and `PurchaseReturnHeader`. Do not migrate only one representation without reconciliation.

# 67. Return Amount Formula Model
The exact legacy calculation is distributed through JavaScript and compiled code. The persisted fields imply a layered calculation: quantity × purchase rate → gross amount → purchase less → discount → GST/IGST → net amount, with header-level charges/discounts. New ERP should calculate from a deterministic pricing engine and store both base values and final posted amounts.

# 68. Illustrative Line Calculation
```sql
gross_amount = purchase_rate * meter_or_qty_basis
purchase_less_amount = purchase_less calculation
discount_amount = discount calculation
taxable_amount = gross_amount - purchase_less_amount - discount_amount
gst_amount = taxable_amount * gst_rate / 100
net_amount = taxable_amount + gst_amount

// Actual TextileSoft legacy arithmetic can vary by product/unit/tax mode.
// Treat this as the normalized ERP model, not as a claim about every legacy case.
```

# 69. Quantity vs Meter
For textile items, both `qty` and `mtr` are persisted. Return eligibility and valuation must distinguish pieces from meters. The source UI explicitly validates total quantity and total meters independently.

# 70. Negative Quantity Module
`PurchaseReturnNegativeQty.aspx` is explicitly named for negative-quantity/barcodewise purchase returns. It should be treated as a specialized operational path, not as evidence that the main return transaction itself stores negative `qty` values in every case.

# 71. GRN-wise vs Barcode-wise
| Flow | Primary selector | Use |
| --- | --- | --- |
| GRN-wise | Original purchase GRN | Return selected quantities from a receipt. |
| Barcode-wise | Physical barcode | Return a specific serialized/labelled item. |
| Return bill view | Return GRN `rgrno` | Review posted return. |
| Return details | Return GRN / line | Detailed line audit. |

# 72. Return List by Supplier
```sql
select supp_name
from purretrun
where supp_name = '...';
```
Supplier-specific queries are used to populate historical supplier return context and attribute lists.

# 73. Return History by Year
```sql
select supp_name,rgrno
from purretrun
where YEAR(date) = @Year
  and rgrno LIKE 'PR%'
group by supp_name,rgrno;
```

# 74. Return History by Date
GRN-wise reporting supports From Date/To Date and filters by `Return_Status`. This means date is part of the operational reporting key and should be preserved with timezone/date semantics during migration.

# 75. Return Search by GRN
```sql
select * from PurchaseReturnHeader where grn_no='...';
select * from PurchaseReturnDetails where grn_no='...';
```

# 76. Return Search by Barcode
```sql
select * from PurchaseReturnDetails where barcode=@Barcode;
select * from purretrun where barcode='...';
```

# 77. Return Search by Return GRN
```sql
select * from purretrun where rgrno=@rgrno;
select * from purretrun ORDER BY rgrno;
```

# 78. Return Edit
The GRN-wise page provides an EDIT action. The compiled code loads `TMP_PURCH_BACK` from the selected `rgrno`, allowing the operator to edit the working copy. This is a draft-like reconstruction of the posted return.

# 79. Return Delete
The GRN-wise page exposes DELETE and the compiled assembly contains `delete from purretrun where rgrno=@rgrno`. This is a hard-delete pattern and should be replaced by cancellation/reversal in a new ERP.

# 80. Return Update Risk
Editing an already posted return can change quantity, amount, tax and supplier settlement without a clearly demonstrated accounting reversal. New ERP should treat posted returns as immutable and create an amendment/reversal transaction.

# 81. Return and Original Purchase Immutability
A return should reference the original purchase transaction but should not modify the original purchase quantity. The return is an independent movement that reduces remaining inventory/returnable quantity.

# 82. Recommended Return Availability
```sql
returnable_qty = purchased_qty
                 - prior_purchase_return_qty
                 - quantities_no_longer_available_for_supplier_return

returnable_mtr = purchased_mtr
                 - prior_purchase_return_mtr
                 - other disqualifying movements

requested_return_qty <= returnable_qty
requested_return_mtr <= returnable_mtr
```

# 83. Barcode Availability
For barcode-controlled stock, the stronger rule is to check the barcode’s current state: received, available, sold, transferred, already returned, or otherwise unavailable. A product-level quantity check alone is insufficient.

# 84. Recommended Return State Machine
| State | Meaning |
| --- | --- |
| DRAFT | Working return not posted. |
| POSTED | Supplier return finalized. |
| CANCELLED | Posted return reversed/voided with audit trail. |
| AMENDED | Original return retained and a correcting transaction created. |

# 85. Recommended Return Posting
- Validate original GRN exists.
- Validate supplier/company/warehouse ownership.
- Validate barcode/product belongs to original receipt.
- Validate remaining returnable quantity.
- Calculate quantity and meter totals.
- Calculate financial and tax amounts.
- Create return header and lines atomically.
- Create inventory movement reversal.
- Create supplier accounting entry if finance is integrated.
- Commit only after all components succeed.
- Write audit event and retain operator/counter/time.

# 86. Inventory Ledger Model
The recommended new ERP should represent purchase return as an inventory movement with negative quantity/meter relative to purchase receipt, rather than physically deleting or overwriting purchase stock rows.
```sql
inventory_movements
-------------------
movement_type = PURCHASE_RETURN
source_document_type = PURCHASE_RETURN
source_document_id = return_id
source_line_id = return_line_id
product_id
variant_id
barcode_id
warehouse_id
rack_id
qty = negative movement
meter = negative movement
unit_cost
movement_date
posted_by
```

# 87. Supplier Ledger Model
```sql
supplier_ledger
---------------
entry_type = PURCHASE_RETURN
source_document_id = purchase_return_id
supplier_id
amount
currency
posting_date
debit_credit_direction
status
```

# 88. Tax Ledger Model
```sql
tax_transaction
---------------
source_type = PURCHASE_RETURN
source_id
hsn_code
taxable_amount
gst_rate
cgst_amount
sgst_amount
igst_amount
posting_date
```

# 89. Return Header Recommended Schema
| Field | Purpose |
| --- | --- |
| id | Surrogate key |
| return_no | Unique return number |
| company_id | Company |
| warehouse_id | Warehouse |
| supplier_id | Supplier |
| original_purchase_id | Original purchase |
| supplier_return_reference | Supplier GRN/reference |
| invoice_no | Supplier invoice |
| invoice_date | Invoice date |
| return_date | Posting date |
| agent_id | Agent |
| incharge_id | Incharge |
| payment_type_id | Settlement/payment mode |
| gross_amount | Gross amount |
| discount_amount | Discount |
| less_amount | Less |
| charge_amount | Charges |
| tax_amount | Tax |
| net_amount | Net return amount |
| status | Draft/Posted/Cancelled |
| created_by | Audit |
| created_at | Audit |
| posted_at | Audit |

# 90. Return Line Recommended Schema
| Field | Purpose |
| --- | --- |
| id | Line key |
| return_id | Header FK |
| original_purchase_line_id | Source purchase line |
| barcode_id | Physical item FK |
| product_id | Product FK |
| variant_id | Variant/SKU FK |
| qty | Returned quantity |
| free_qty | Returned free quantity |
| meter | Returned meters |
| unit_cost | Original purchase rate |
| gross_amount | Gross line amount |
| less_amount | Less |
| discount_amount | Discount |
| taxable_amount | Tax base |
| gst_rate | GST rate |
| gst_amount | GST amount |
| igst_amount | IGST amount |
| net_amount | Net line amount |
| hsn_code | Historical HSN |
| unit_snapshot | Historical unit |
| brand_snapshot | Historical brand |
| pattern_snapshot | Historical pattern |
| size_snapshot | Historical size |
| color_snapshot | Historical color |
| style_snapshot | Historical style |
| rack_snapshot | Historical rack |

# 91. Return vs Purchase
| Purchase | Purchase Return |
| --- | --- |
| purgrnentry | PurchaseReturnHeader |
| purentrydetails | PurchaseReturnDetails |
| grn_no | original grn_no |
| positive stock movement | negative/reversal stock movement |
| supplier payable increase | supplier payable reduction/credit |
| purchase tax input | tax reversal/adjustment |

# 92. Return vs Sales Return
Purchase return is supplier-facing and reverses inward inventory. Sales return is customer-facing and reverses outward inventory. Do not reuse the same financial direction or source-document relationship.

# 93. Return vs Material Transfer
The source contains a separate `MaterialTransfer` path that can also carry `rgrno`/`sup_retu_grn` fields in some modules. This indicates shared movement concepts, but a supplier purchase return must remain distinguishable by movement/document type.

# 94. Material Transfer Relationship
Compiled strings show `MaterialTransfer` rows can contain return-related references and that temporary return data can be copied into transfer buffers. This should be investigated before migration if the business uses supplier returns to move goods between warehouses/branches.

# 95. Return Reporting Data
| Report | Primary source |
| --- | --- |
| Purchase Return Bill View | `purretrun` + return details |
| Purchase Return Details | `rgrno`, return detail |
| Purchase Return GRN-wise | `purretrun` grouped by `rgrno`/supplier/original GRN |
| Purchase Return Barcode-wise | barcode-level purchase/return data |
| Negative Qty Return | return working and barcode quantity data |

# 96. Report Aggregation
The return list groups rows by return document and uses `MAX(sup_retu_grn)` to present the supplier return reference. This is a legacy reporting technique; new ERP should store one header-level supplier reference rather than deriving it with MAX across detail rows.

# 97. Return Header/Detail Reconciliation
| Check | Rule |
| --- | --- |
| Header exists | Every posted return must have exactly one header. |
| Detail exists | Every posted return must have one or more lines. |
| GRN consistent | All return lines must reference the same source purchase document unless the new ERP explicitly supports multi-GRN returns. |
| Supplier consistent | Supplier must match the source purchase supplier. |
| Company consistent | Company must match source purchase company. |
| Quantity consistent | Header total must equal line totals. |
| Meter consistent | Header total meters must equal line totals. |
| Financial consistent | Header net must reconcile with line/charge/tax amounts. |
| Status consistent | Header status must agree with detail posting state. |

# 98. Migration Mapping: Legacy Return Ledger
| Legacy | New ERP |
| --- | --- |
| rgrno | purchase_returns.return_no |
| grn_no | purchase_returns.original_purchase_id |
| sup_retu_grn | purchase_returns.supplier_return_reference |
| supp_name | supplier_id |
| cmy_name | company_id |
| barcode | barcode_id |
| code | product_id |
| pr_name | product snapshot |
| pr_rate | unit_cost |
| mtr | meter |
| qty | qty |
| fqty | free_qty |
| amt | gross_amount |
| dis_amt | discount_amount |
| gst_amt | gst_amount |
| netamt | net_amount |
| brand/pattern/color/size/style | variant snapshots |
| Return_Status | status |

# 99. Migration Mapping: Expanded Header/Detail
| Legacy expanded source | New ERP |
| --- | --- |
| PurchaseReturnHeader | purchase_returns |
| PurchaseReturnDetails | purchase_return_lines |
| PurchaseReturnMainTemp | return draft lines |
| PurchaseReturnSubTemp | return import/sub-draft lines |
| TMP_PURCH_BACK | return working/reconciliation table |

# 100. Migration Warning: Duplicate Representations
Do not count `purretrun`, `PurchaseReturnDetails`, and temporary rows as three separate returns. First reconcile by `rgrno`, `grn_no`, barcode, date, supplier and amount. Temporary rows should normally not become posted transactions.

# 101. Migration Warning: Hard Deletes
Legacy delete operations physically delete return ledger rows by `rgrno` and detail rows by barcode. Historical migration should preserve deleted/audited records if database backups or audit sources contain them. New ERP should avoid physical deletion after posting.

# 102. Migration Warning: Barcode Reuse
A returned barcode may later be reused or re-entered only according to business rules. New ERP should use an immutable barcode identity and movement history so the same label cannot become ambiguous across purchase and return transactions.

# 103. Migration Warning: Return Quantity Overrun
Legacy UI and temporary buffers contain multiple quantity fields such as `qty`, `BSQty`, `sup_retu_gm`, `PurReturnMtr`, `BalMtr` and related meter values. Reconstruct returnability from transaction history rather than trusting one derived field.

# 104. Migration Warning: Status Values
Distinct values of `Return_Status` and `sp_Return_Status` must be extracted from the live database. The source shows filtering by these fields but does not expose the complete enumeration.

# 105. Migration Warning: Date Semantics
Return data uses `date`, `entry_date`, and invoice date. Preserve all three concepts separately. Do not collapse them into a single `created_at` field.

# 106. Migration Warning: Supplier Snapshot
The ledger stores supplier name as a string. New ERP should use a supplier FK plus a supplier-name snapshot for historical rendering.

# 107. Migration Warning: Product Snapshot
The return ledger stores product name/code and textile attributes. Do not rebuild historical return descriptions solely from the current product master.

# 108. Migration Warning: Tax Snapshot
Historical GST/IGST rate and amount must be preserved. Do not recalculate from current GST master data.

# 109. Migration Warning: Charge Layers
Return charges exist at multiple levels: line fields, header fields, barcode-specific fields in some ledger variants. Migration must map each charge source to a defined accounting meaning.

# 110. Concurrency Risks
- Return number generation must be concurrency-safe.
- Barcode availability must be checked under transaction isolation.
- Two operators must not return the same available barcode simultaneously.
- Draft buffers must be isolated by transaction ID.
- Header and details must commit atomically.

# 111. Security Risks
The legacy application contains many string-built SQL queries. New ERP should use parameterized queries, strict authorization, server-side validation and tenant/company scoping. A return must never be able to reference another company’s purchase GRN or barcode.

# 112. Authorization
Recommended permissions: create return, edit draft, post return, cancel return, view return, delete draft, reverse posted return, and export return reports. Posting/cancellation should require stronger permission than draft editing.

# 113. Audit Requirements
- Return number.
- Original purchase GRN.
- Supplier.
- Barcode/product.
- Returned quantity and meters.
- Original and final amounts.
- Tax values.
- Operator.
- Counter.
- Warehouse.
- Entry date and posting timestamp.
- Edit/reversal reason.
- Approval user where applicable.

# 114. Recommended Posting Transaction
```sql
BEGIN TRANSACTION

1. Validate return header.
2. Validate original purchase.
3. Validate supplier/company/warehouse.
4. Validate barcode and returnable quantity.
5. Calculate line values and tax.
6. Insert return header.
7. Insert return lines.
8. Insert inventory movement reversal.
9. Insert supplier accounting entry.
10. Insert tax reversal entry.
11. Mark return as POSTED.
12. Write audit event.

COMMIT

On any failure:
ROLLBACK
```

# 115. End-to-End Legacy Flow
The observed standard path is: operator opens `NewPurchaseReturn.aspx` → selects company/warehouse/supplier/agent/incharge → enters original purchase GRN and invoice context → loads/selects purchased product/barcode lines → adjusts return quantity/meter and commercial/tax values → client validates total quantity and meters → `Savehead` writes `PurchaseReturnHeader` → `SaveData` writes `PurchaseReturnDetails` → compiled code also maintains the legacy `purretrun` ledger → return views/reporting group by `rgrno` and original `grn_no` → GRN-wise/barcode-wise modules use the stored return history for reconciliation and further operations.

# 116. Detailed Example
Example: Purchase GRN `PGRN-001` contains barcode `B001`, product code `P100`, quantity 5, meter 2 per unit, purchase rate ₹500. The supplier accepts a return of 2 units. The return document gets its own `rgrno` such as `PR...`, retains `grn_no = PGRN-001`, barcode `B001`, qty 2, meter 2, and historical rate/tax/attribute snapshots. Returnable quantity after posting becomes 3, subject to the barcode/movement model. The original purchase row remains the historical receipt; the return is a separate movement.

# 117. Lifecycle Diagram
```text
SUPPLIER PURCHASE
      |
      v
purgrnentry + purentrydetails
      |
      +---- barcode / product / SKU attributes
      |
      v
AVAILABLE INVENTORY
      |
      |  supplier return requested
      v
NEW PURCHASE RETURN
      |
      +--> select original GRN
      +--> select barcode / product lines
      +--> validate qty + meter
      +--> calculate discount / tax / charges
      |
      +--> PurchaseReturnHeader
      +--> PurchaseReturnDetails
      +--> purretrun (legacy return ledger)
      |
      v
RETURN POSTED
      |
      +--> inventory reversal / stock calculation
      +--> supplier settlement / credit
      +--> tax reversal
      +--> reporting
      |
      v
RETURN BILL / GRN-WISE / BARCODE-WISE REPORTS
```

# 118. Data Ownership Matrix
| Data | Primary responsibility |
| --- | --- |
| Return header identity | PurchaseReturnHeader / return transaction |
| Return line | PurchaseReturnDetails |
| Legacy report ledger | purretrun |
| Draft rows | PurchaseReturnMainTemp / SubTemp |
| GRN return working copy | TMP_PURCH_BACK |
| Original purchase | purgrnentry / purentrydetails |
| Physical stock | stockdetails plus movement/report logic |
| Physical barcode | purentrydetails.barcode and barcode subsystem |
| Supplier | supplier master |
| Product | newproduct |
| Attributes | purchase/detail attribute snapshots and attribute masters |

# 119. Confirmed vs Inferred
| Classification | Finding |
| --- | --- |
| Confirmed | Main page is `NewPurchaseReturn.aspx`. |
| Confirmed | Header insert targets `PurchaseReturnHeader`. |
| Confirmed | Detail insert targets `PurchaseReturnDetails`. |
| Confirmed | Legacy ledger is `purretrun`. |
| Confirmed | `rgrno` groups purchase-return documents. |
| Confirmed | `grn_no` links return rows to original purchase GRN. |
| Confirmed | `sup_retu_grn` is displayed separately from original purchase GRN. |
| Confirmed | Return detail contains barcode, product, textile attributes, quantities, rates and taxes. |
| Confirmed | Save validates total quantity and total meters before posting. |
| Confirmed | GRN-wise screen supports edit and delete. |
| Confirmed | Delete includes `delete from purretrun where rgrno=@rgrno`. |
| Confirmed | Return reports filter by `Return_Status`. |
| Not proven | A direct `stockdetails` decrement inside the main return save method. |
| Not proven | Complete enumeration of Return_Status values. |
| Not proven | A universal accounting voucher generated by the return save method. |

# 120. Final Architecture
The legacy purchase-return architecture is best understood as a transaction overlay on the original purchase receipt: the original purchase remains immutable historical evidence; the return stores a separate return identity and line snapshots; `purretrun` acts as a legacy reporting/operational ledger; temporary tables support interactive editing; GRN-wise and barcode-wise tools reconcile returnable quantity. A new ERP should consolidate these into one normalized return transaction with immutable posting, inventory movement, supplier settlement and tax reversal.

# 121. Recommended New ERP Return Model
```sql
purchase_returns
    |
    +-- purchase_return_lines
            |
            +-- original_purchase_line_id
            +-- barcode_id
            +-- product_id
            +-- variant_id
            +-- qty
            +-- free_qty
            +-- meter
            +-- unit_cost
            +-- tax / discount snapshots

purchase_returns
    |
    +-- inventory_movements (negative)
    +-- supplier_ledger
    +-- tax_transactions
    +-- audit_events
```

# 122. Final Checklist
- Original purchase GRN exists.
- Supplier matches original purchase.
- Company matches original purchase.
- Warehouse is authorized.
- Barcode belongs to source purchase.
- Barcode is not already fully returned.
- Barcode is not unavailable due to sale/transfer.
- Return qty <= available return qty.
- Return meter <= available return meter.
- Header and line quantities reconcile.
- Header and line meters reconcile.
- Financial totals reconcile.
- GST/IGST reconcile.
- Return number is unique.
- Posting is atomic.
- Inventory movement is recorded.
- Supplier settlement is recorded.
- Audit record is created.
- Posted return is not physically deleted.

# 123. Conclusion
TextileSoft purchase return is not a simple negative purchase line. It is a separate supplier-facing transaction linked back to the original purchase GRN and barcode/product details. The source contains a richer `PurchaseReturnHeader`/`PurchaseReturnDetails` model as well as the heavily used legacy `purretrun` ledger and temporary working tables. The safest migration is therefore to reconcile all representations by return number, original GRN and barcode, then post the result into a normalized immutable purchase-return transaction that drives inventory reversal, supplier settlement, tax reversal and reporting.
