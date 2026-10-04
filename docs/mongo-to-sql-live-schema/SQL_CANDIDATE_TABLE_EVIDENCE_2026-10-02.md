# SQL candidate table evidence — 2026-10-02

Live source: `SSS_copy`; metadata snapshot: `backend/textilesoft-discovery/schema-SSS_copy/schema.json`, generated 2026-10-02T09:36:04.835Z.

## Scope

This inventory covers 62 distinct `dbo.*` / `erp.*` objects found in static SQL query text under `backend/src`. It records metadata and observed code ownership; it does not prove business equivalence, safe writes, data quality, or workflow compatibility. Dynamic SQL and external stored-procedure internals may not be discoverable from this scan. Tenant/branch scope is reported only when a corresponding column exists; presence alone does not prove enforcement.

## Objects

### `dbo.agentdetail`

- Approximate rows: 1
- Key evidence: No PK/unique index recorded
- Other unique indexes: none recorded
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: none by column name
- Observed runtime owner(s): `src/integrations/textilesoft/sqlParties.ts`, `src/integrations/textilesoft/sqlPurchase.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `sl_nu` | varchar(1000) | yes | no | — |
| `card_number` | varchar(1000) | yes | no | — |
| `eng_name` | varchar(1000) | yes | no | — |
| `eng_address1` | varchar(1000) | yes | no | — |
| `eng_city` | varchar(1000) | yes | no | — |
| `pin_code` | varchar(1000) | yes | no | — |
| `phone_nu` | varchar(1000) | yes | no | — |
| `mobile_nu` | varchar(1000) | yes | no | — |
| `emil_id` | varchar(1000) | yes | no | — |
| `date` | varchar(1000) | yes | no | — |
| `discount` | varchar(1000) | yes | no | — |
| `dob` | varchar(1000) | yes | no | — |
| `wedding_date` | varchar(1000) | yes | no | — |
| `eng_address2` | varchar(1000) | yes | no | — |
| `eng_address3` | varchar(1000) | yes | no | — |
| `eng_address4` | varchar(1000) | yes | no | — |
| `eng_address5` | varchar(1000) | yes | no | — |

### `dbo.banktransentry`

- Approximate rows: 1
- Key evidence: PK PK__BankTran__85DD85641E3A7A34(BankEntryID)
- Other unique indexes: none recorded
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: CounterName
- Observed runtime owner(s): `src/integrations/textilesoft/sqlCashBank.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `BankEntryID` | int | no | yes | — |
| `TansactionCode` | nvarchar(1000) | yes | no | — |
| `TranasctionName` | nvarchar(1000) | yes | no | — |
| `TranOutAmount` | nvarchar(1000) | yes | no | — |
| `TranInAmount` | nvarchar(1000) | yes | no | — |
| `TranBalanceAmount` | nvarchar(1000) | yes | no | — |
| `Remarks` | nvarchar(2000) | yes | no | — |
| `TranNo` | nvarchar(1000) | yes | no | — |
| `TranEntryDate` | nvarchar(1000) | yes | no | — |
| `ChqNo` | nvarchar(1000) | yes | no | — |
| `ChqDate` | nvarchar(1000) | yes | no | — |
| `ChqClearDate` | nvarchar(1000) | yes | no | — |
| `ChqStatus` | nvarchar(1000) | yes | no | — |
| `Status` | nvarchar(1000) | yes | no | — |
| `CounterName` | nvarchar(1000) | yes | no | — |
| `LoginName` | nvarchar(1000) | yes | no | — |
| `AccountNo` | nvarchar(1000) | yes | no | — |
| `AccountName` | nvarchar(1000) | yes | no | — |
| `IFSC` | nvarchar(1000) | yes | no | — |
| `BankName` | nvarchar(1000) | yes | no | — |
| `AccountType` | nvarchar(1000) | yes | no | — |
| `RefNo` | nvarchar(1000) | yes | no | — |
| `Mode` | nvarchar(1000) | yes | no | — |

### `dbo.bill_option`

- Approximate rows: 6
- Key evidence: No PK/unique index recorded
- Other unique indexes: none recorded
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: none by column name
- Observed runtime owner(s): `src/integrations/textilesoft/sqlPosWriter.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `sys_name` | varchar(1000) | yes | no | — |
| `sys_bil_no_mode` | varchar(1000) | yes | no | — |
| `sys_bil_no_strt` | varchar(1000) | yes | no | — |
| `sys_bil_no_rest` | varchar(1000) | yes | no | — |
| `cmny_name` | varchar(1000) | yes | no | — |
| `cmny_mode` | varchar(1000) | yes | no | — |
| `cmny_bil_no_strt` | varchar(1000) | yes | no | — |
| `cmny_bil_no_rest` | varchar(1000) | yes | no | — |
| `barcode` | varchar(1000) | yes | no | — |
| `cash_collec_no` | varchar(1000) | yes | no | — |
| `cmny_id` | varchar(1000) | yes | no | — |
| `bil_strt` | varchar(1000) | yes | no | — |
| `cash_collec_no_rest` | varchar(1000) | yes | no | — |
| `bil_no_mode` | varchar(1000) | yes | no | — |
| `bil_no_rest` | varchar(1000) | yes | no | — |
| `cmny_grp` | varchar(1000) | yes | no | — |
| `slno` | int | yes | no | — |
| `month` | varchar(5000) | yes | no | — |
| `date` | varchar(5000) | yes | no | — |
| `year` | varchar(5000) | yes | no | — |
| `timedate` | varchar(5000) | yes | no | — |
| `cmny_grop` | varchar(5000) | yes | no | — |

### `dbo.cashiername`

- Approximate rows: 5
- Key evidence: No PK/unique index recorded
- Other unique indexes: none recorded
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: none by column name
- Observed runtime owner(s): `src/integrations/textilesoft/sqlParties.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `sl_no` | varchar(1000) | yes | no | — |
| `cashier_name` | varchar(1000) | yes | no | — |
| `date` | varchar(1000) | yes | no | — |
| `password` | varchar(50) | yes | no | — |
| `cashier_mode` | varchar(50) | yes | no | — |
| `cashier_bil_no_strt` | varchar(500) | yes | no | — |
| `cashier_bil_no_rest` | varchar(500) | yes | no | — |

### `dbo.cashinoutentry`

- Approximate rows: 0
- Key evidence: PK PK__CashInOu__3214EC2733D4B598(ID)
- Other unique indexes: none recorded
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: Counter_Name
- Observed runtime owner(s): `src/integrations/textilesoft/sqlCashBank.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `slno` | int | yes | no | — |
| `code` | varchar(MAX) | yes | no | — |
| `Cash_Name` | varchar(MAX) | yes | no | — |
| `Cash_Out_Amout` | varchar(MAX) | yes | no | — |
| `Cash_In_Amount` | varchar(MAX) | yes | no | — |
| `Cash` | varchar(MAX) | yes | no | — |
| `Remarks` | varchar(MAX) | yes | no | — |
| `Cash_no` | varchar(MAX) | yes | no | — |
| `date` | varchar(MAX) | yes | no | — |
| `Counter_Name` | varchar(MAX) | yes | no | — |
| `Cashier_Name` | varchar(MAX) | yes | no | — |
| `login_name` | varchar(MAX) | yes | no | — |
| `cmy_name` | varchar(MAX) | yes | no | — |
| `datetime` | date | yes | no | — |
| `cmny_bill` | varchar(MAX) | yes | no | — |
| `daily_cmy_bill` | varchar(MAX) | yes | no | — |
| `cashier_bill` | varchar(MAX) | yes | no | — |
| `daily_cashier_bill` | varchar(MAX) | yes | no | — |
| `ID` | int | no | yes | — |
| `daily_sys_bill` | varchar(MAX) | yes | no | — |
| `UpdatedOn` | datetime | yes | no | — |
| `Sys_Bill_no` | varchar(MAX) | yes | no | — |
| `amounttype` | varchar(100) | yes | no | — |

### `dbo.closepattycash`

- Approximate rows: 0
- Key evidence: No PK/unique index recorded
- Other unique indexes: none recorded
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: counter_name
- Observed runtime owner(s): `src/integrations/textilesoft/sqlCashBank.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `counter_name` | varchar(1000) | yes | no | — |
| `cashier_name` | varchar(1000) | yes | no | — |
| `r2000` | varchar(1000) | yes | no | — |
| `r500` | varchar(1000) | yes | no | — |
| `r200` | varchar(1000) | yes | no | — |
| `r100` | varchar(1000) | yes | no | — |
| `r50` | varchar(1000) | yes | no | — |
| `r20` | varchar(1000) | yes | no | — |
| `r10` | varchar(1000) | yes | no | — |
| `r5` | varchar(1000) | yes | no | — |
| `r2` | varchar(1000) | yes | no | — |
| `r1` | varchar(1000) | yes | no | — |
| `tot_amm` | varchar(1000) | yes | no | — |
| `date` | varchar(1000) | yes | no | — |
| `open_amnt` | varchar(1000) | yes | no | — |
| `batta_amnt` | varchar(1000) | yes | no | — |
| `salary_amnt` | varchar(1000) | yes | no | — |
| `advance_amnt` | varchar(1000) | yes | no | — |
| `close_amnt` | varchar(1000) | yes | no | — |
| `select_date` | varchar(1000) | yes | no | — |
| `sl_no` | varchar(1000) | yes | no | — |
| `totalbillno` | varchar(1000) | yes | no | — |
| `totalcross` | varchar(1000) | yes | no | — |
| `disamt` | varchar(1000) | yes | no | — |
| `discrosssale` | varchar(1000) | yes | no | — |
| `totalcancelbill` | varchar(1000) | yes | no | — |
| `totalcancelamt` | varchar(1000) | yes | no | — |
| `netamount` | varchar(1000) | yes | no | — |
| `cashinamt` | varchar(1000) | yes | no | — |
| `cashoutamt` | varchar(1000) | yes | no | — |
| `openingamt` | varchar(1000) | yes | no | — |
| `cashdrawamt` | varchar(1000) | yes | no | — |
| `status` | varchar(1000) | yes | no | — |
| `cardamt` | varchar(1000) | yes | no | — |
| `creditamt` | varchar(1000) | yes | no | — |
| `statusamt` | varchar(1000) | yes | no | — |
| `googlepay` | varchar(1000) | yes | no | — |
| `selfpay` | varchar(1000) | yes | no | — |
| `opr2000` | varchar(100) | yes | no | — |
| `opr500` | varchar(100) | yes | no | — |
| `opr200` | varchar(100) | yes | no | — |
| `opr100` | varchar(100) | yes | no | — |
| `opr50` | varchar(100) | yes | no | — |
| `opr20` | varchar(100) | yes | no | — |
| `opr10` | varchar(100) | yes | no | — |
| `opr5` | varchar(100) | yes | no | — |
| `opr2` | varchar(100) | yes | no | — |
| `opr1` | varchar(100) | yes | no | — |
| `oprtotamt` | varchar(100) | yes | no | — |
| `oprcashinhand` | varchar(100) | yes | no | — |
| `updatetime` | datetime | yes | no | — |
| `opslno` | varchar(100) | yes | no | — |
| `cashpayamt` | varchar(100) | yes | no | — |
| `upipayamt` | varchar(100) | yes | no | — |
| `totalcashamt` | varchar(100) | yes | no | — |
| `totalupiamt` | varchar(100) | yes | no | — |
| `oldcashpayamt` | varchar(100) | yes | no | — |
| `cashinexamt` | varchar(100) | yes | no | — |
| `subtotalcashamt` | varchar(100) | yes | no | — |
| `cashoutexamt` | varchar(100) | yes | no | — |
| `oldupipayamt` | varchar(100) | yes | no | — |
| `upiamt` | varchar(100) | yes | no | — |
| `upiexinamt` | varchar(100) | yes | no | — |
| `subtotalupiamt` | varchar(100) | yes | no | — |
| `upicashoutamt` | varchar(100) | yes | no | — |
| `totalupiamt1` | varchar(100) | yes | no | — |
| `oldcardpayamt` | varchar(100) | yes | no | — |
| `cardamt1` | varchar(100) | yes | no | — |
| `cardexinamt` | varchar(100) | yes | no | — |
| `subtotalcardamt` | varchar(100) | yes | no | — |
| `cardcashoutamt` | varchar(100) | yes | no | — |
| `totalcardamt` | varchar(100) | yes | no | — |
| `totalamt` | varchar(100) | yes | no | — |

### `dbo.commonsettings`

- Approximate rows: 3
- Key evidence: No PK/unique index recorded
- Other unique indexes: none recorded
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: Counter, CounterSalesReport, CompanySalesReport
- Observed runtime owner(s): `src/integrations/textilesoft/sqlOrg.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `ID` | int | no | yes | — |
| `Counter` | varchar(100) | yes | no | — |
| `DateOption` | varchar(100) | yes | no | — |
| `SalesBarcodeOption` | varchar(50) | yes | no | — |
| `SalesBarcodeQty` | varchar(50) | yes | no | — |
| `EXPMRPPER` | varchar(50) | yes | no | — |
| `AsalPer` | varchar(50) | yes | no | — |
| `DateOn` | datetime | yes | no | — |
| `PurNetTotal` | varchar(50) | yes | no | — |
| `SameCodeAddQty` | varchar(100) | yes | no | — |
| `SameBarCodeAddQty` | varchar(100) | yes | no | — |
| `BarcodeDiscountAdj` | varchar(100) | yes | no | — |
| `PnrateMrp` | varchar(100) | yes | no | — |
| `PnrateMrpRange` | varchar(100) | yes | no | — |
| `BarcodePurrateVisible` | varchar(100) | yes | no | — |
| `BarcodeStockBalance` | varchar(100) | yes | no | — |
| `BillwiseProfit` | varchar(100) | yes | no | — |
| `SalesProfitEncryptCode` | varchar(100) | yes | no | — |
| `PrintBarcodeNetRate` | varchar(100) | yes | no | — |
| `PrinterSelect` | varchar(150) | yes | no | — |
| `CustomerMan` | varchar(200) | yes | no | — |
| `CounterSalesReport` | varchar(200) | yes | no | — |
| `CompanySalesReport` | varchar(200) | yes | no | — |
| `BrandMiniumSalesReport` | varchar(200) | yes | no | — |
| `sr_negative` | varchar(50) | yes | no | — |
| `CreditbillAllowed` | varchar(50) | yes | no | — |
| `CustPointAllowed` | varchar(50) | yes | no | — |
| `CustPointCheck` | varchar(100) | yes | no | ('NO') |
| `PrintPRATE` | varchar(50) | yes | no | — |
| `DesignOrColor` | varchar(50) | yes | no | — |
| `CrossRight` | varchar(50) | yes | no | — |
| `CrossLeft` | varchar(50) | yes | no | — |
| `InvoiceNo` | varchar(100) | yes | no | — |
| `AllowWholeSale` | varchar(100) | yes | no | — |
| `SalemanReadonly` | varchar(100) | yes | no | — |
| `SeasonDate` | varchar(100) | yes | no | — |
| `CategoryPrint` | varchar(100) | yes | no | — |
| `CreditBillShow` | varchar(100) | yes | no | — |
| `PurchaseEntry` | varchar(100) | yes | no | — |
| `PRB` | varchar(100) | yes | no | — |
| `offDa` | varchar(100) | yes | no | — |
| `cashtype` | varchar(100) | yes | no | — |
| `BarClear` | varchar(100) | yes | no | — |
| `LPoints` | varchar(100) | yes | no | — |
| `CashEntry` | varchar(100) | yes | no | — |
| `MinLevelQty` | varchar(100) | yes | no | — |
| `AddPoints` | varchar(100) | yes | no | — |
| `BillAmtDis` | varchar(100) | yes | no | — |
| `LPCal` | varchar(100) | yes | no | — |
| `BarProDis` | varchar(100) | yes | no | — |
| `BarProFree` | varchar(100) | yes | no | — |
| `BarProCombo` | varchar(100) | yes | no | — |
| `GRN_Reset` | varchar(100) | yes | no | — |
| `Language` | varchar(100) | yes | no | — |
| `SMAN` | varchar(100) | yes | no | — |
| `DateWiseTransi` | varchar(200) | yes | no | — |
| `GroupLanguage` | varchar(200) | yes | no | — |
| `SubGroupImg` | varchar(200) | yes | no | — |
| `PayLink` | varchar(200) | yes | no | — |
| `ProductPoint` | varchar(200) | yes | no | — |
| `CustInfo` | varchar(200) | yes | no | — |
| `SMS_Send` | varchar(200) | yes | no | — |
| `OTP_Send` | varchar(200) | yes | no | — |
| `Gift_Voucher` | varchar(200) | yes | no | — |
| `ProductDisToken` | varchar(200) | yes | no | — |
| `Gift_Vocher_AMTWISE` | varchar(200) | yes | no | — |
| `Gift_Voucher_FromDate` | varchar(200) | yes | no | — |
| `offerDiscount` | varchar(200) | yes | no | — |
| `CashPointLess` | varchar(200) | yes | no | — |
| `GRNReportPrint` | varchar(200) | yes | no | — |

### `dbo.companydetail`

- Approximate rows: 2
- Key evidence: No PK/unique index recorded
- Other unique indexes: none recorded
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: branch_name_eng, branch_name_tam
- Observed runtime owner(s): `src/integrations/textilesoft/sqlAuth.ts`, `src/integrations/textilesoft/sqlOrg.ts`, `src/integrations/textilesoft/sqlPurchase.ts`, `src/integrations/textilesoft/sqlPurchaseOrder.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `cmy_cd` | varchar(100) | yes | no | — |
| `cmy_name_eng` | varchar(1000) | yes | no | — |
| `cmy_name_tam` | nvarchar(1800) | yes | no | — |
| `address_eng` | varchar(1000) | yes | no | — |
| `address_tam` | nvarchar(1800) | yes | no | — |
| `city_eng` | varchar(100) | yes | no | — |
| `city_tam` | nvarchar(1800) | yes | no | — |
| `pin_cd` | varchar(50) | yes | no | — |
| `ph_nu` | varchar(50) | yes | no | — |
| `mb_nu` | varchar(50) | yes | no | — |
| `e_id` | varchar(100) | yes | no | — |
| `tin_nu` | varchar(1000) | yes | no | — |
| `cgst` | varchar(1000) | yes | no | — |
| `sgst` | varchar(1000) | yes | no | — |
| `bank_name` | varchar(100) | yes | no | — |
| `ac_nu` | varchar(100) | yes | no | — |
| `branch_name_eng` | varchar(1000) | yes | no | — |
| `branch_name_tam` | nvarchar(1800) | yes | no | — |
| `ifsc_nu` | varchar(100) | yes | no | — |
| `pan_nu` | varchar(100) | yes | no | — |
| `print_eng` | varchar(1000) | yes | no | — |
| `print_tam` | nvarchar(1800) | yes | no | — |
| `acc_name` | varchar(1000) | yes | no | — |
| `acc_tam` | nvarchar(1800) | yes | no | — |
| `date` | varchar(100) | yes | no | — |
| `cmp_address1` | varchar(100) | yes | no | — |
| `cmp_address2` | varchar(100) | yes | no | — |
| `cmp_address3` | varchar(100) | yes | no | — |
| `cmp_cgstno` | varchar(100) | yes | no | — |

### `dbo.countername`

- Approximate rows: 3
- Key evidence: No PK/unique index recorded
- Other unique indexes: none recorded
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: counter_name, counter_mode
- Observed runtime owner(s): `src/integrations/textilesoft/sqlOrg.ts`, `src/integrations/textilesoft/sqlPosWriter.ts`, `src/integrations/textilesoft/sqlPurchase.ts`, `src/integrations/textilesoft/tests/sqlSales.test.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `sl_no` | varchar(1000) | yes | no | — |
| `counter_name` | varchar(1000) | yes | no | — |
| `date` | varchar(1000) | yes | no | — |
| `last_bil_up_date` | date | yes | no | — |
| `year_from` | date | yes | no | — |
| `year_to` | date | yes | no | — |
| `counter_mode` | varchar(1000) | yes | no | — |
| `count_days` | varchar(50) | yes | no | — |
| `st_mode` | varchar(100) | yes | no | — |

### `dbo.customercmyname`

- Approximate rows: 1
- Key evidence: No PK/unique index recorded
- Other unique indexes: none recorded
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: none by column name
- Observed runtime owner(s): `src/integrations/textilesoft/sqlParties.ts`, `src/modules/crm/routes/partiesSql.routes.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `sl_nu` | varchar(1000) | yes | no | — |
| `card_number` | varchar(1000) | yes | no | — |
| `eng_name` | varchar(1000) | yes | no | — |
| `eng_address` | varchar(1000) | yes | no | — |
| `eng_city` | varchar(1000) | yes | no | — |
| `pin_code` | varchar(1000) | yes | no | — |
| `phone_nu` | varchar(1000) | yes | no | — |
| `mobile_nu` | varchar(1000) | yes | no | — |
| `emil_id` | varchar(1000) | yes | no | — |
| `date` | varchar(1000) | yes | no | — |
| `discount` | varchar(1000) | yes | no | — |
| `dob` | varchar(1000) | yes | no | — |
| `wedding_date` | varchar(1000) | yes | no | — |
| `points` | varchar(5000) | yes | no | — |
| `gst_no` | varchar(5000) | yes | no | — |
| `datetimt` | datetime | yes | no | — |
| `Adress1` | varchar(500) | yes | no | — |
| `Adress2` | varchar(500) | yes | no | — |
| `Adress3` | varchar(500) | yes | no | — |
| `Adress4` | varchar(500) | yes | no | — |
| `Adress5` | varchar(500) | yes | no | — |
| `SaleBalance` | varchar(500) | yes | no | — |
| `creditdays` | varchar(500) | yes | no | — |
| `frompoint` | int | yes | no | — |
| `topoint` | int | yes | no | — |
| `pointname` | varchar(50) | yes | no | — |
| `frompoint1` | int | yes | no | — |
| `topoint1` | int | yes | no | — |
| `pointname1` | varchar(50) | yes | no | — |
| `frompoint2` | int | yes | no | — |
| `topoint2` | int | yes | no | — |
| `pointname2` | varchar(50) | yes | no | — |
| `frompoint3` | int | yes | no | — |
| `topoint3` | int | yes | no | — |
| `pointname3` | varchar(50) | yes | no | — |
| `entryupdate` | datetime | yes | no | — |
| `creditbalance` | varchar(100) | yes | no | — |
| `SupplierStatus` | varchar(50) | yes | no | — |

### `dbo.customercreditpaymententry`

- Approximate rows: 2
- Key evidence: PK PK__Customer__3214EC2758A712EB(ID)
- Other unique indexes: none recorded
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: none by column name
- Observed runtime owner(s): `src/integrations/textilesoft/sqlPartyReports.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `ID` | int | no | yes | — |
| `invoice_no` | varchar(1000) | yes | no | — |
| `bill_amt` | varchar(1000) | yes | no | — |
| `bill_credit_amt` | varchar(1000) | yes | no | — |
| `pay_amt` | varchar(1000) | yes | no | — |
| `date` | date | yes | no | — |
| `chek_num` | varchar(1000) | yes | no | — |
| `chek_amt` | varchar(1000) | yes | no | — |
| `supper_name` | varchar(1000) | yes | no | — |
| `supper_no` | varchar(1000) | yes | no | — |
| `suppler_mble_no` | varchar(1000) | yes | no | — |
| `chek_date` | date | yes | no | — |
| `chek_statues` | varchar(1000) | yes | no | — |
| `tot_pay` | varchar(1000) | yes | no | — |
| `chek_tot_pay` | varchar(1000) | yes | no | — |
| `bill_date` | date | yes | no | — |
| `datetime` | datetime | yes | no | — |
| `chek_cmy_name` | varchar(5000) | yes | no | — |
| `chek_credit_statues` | varchar(5000) | yes | no | — |
| `chek_clear_date` | date | yes | no | — |
| `refr_name` | varchar(1000) | yes | no | — |
| `bill_cmy_name` | varchar(1000) | yes | no | — |
| `pu_grno` | varchar(1000) | yes | no | — |
| `sysbillid` | varchar(100) | yes | no | — |
| `pay_refeno` | varchar(1000) | yes | no | — |
| `pay_systemname` | varchar(50) | yes | no | — |
| `pc_bankname` | varchar(100) | yes | no | — |
| `pc_accountname` | varchar(100) | yes | no | — |
| `pc_totalamt` | varchar(100) | yes | no | — |
| `pc_transfertype` | varchar(100) | yes | no | — |
| `pc_currentdate` | date | yes | no | — |
| `pc_loginname` | varchar(100) | yes | no | — |

### `dbo.customergroup`

- Approximate rows: 3
- Key evidence: PK PK_CustomerGroup(ID)
- Other unique indexes: none recorded
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: none by column name
- Observed runtime owner(s): `src/integrations/textilesoft/sqlParties.ts`, `src/integrations/textilesoft/sqlPartyReports.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `ID` | int | no | yes | — |
| `code` | varchar(100) | yes | no | — |
| `name` | varchar(100) | yes | no | — |

### `dbo.expenseentry`

- Approximate rows: 0
- Key evidence: No PK/unique index recorded
- Other unique indexes: none recorded
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: Counter_Name
- Observed runtime owner(s): `src/integrations/textilesoft/sqlExpenses.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `slno` | int | yes | no | — |
| `code` | varchar(5000) | yes | no | — |
| `exname` | varchar(5000) | yes | no | — |
| `exoutamt` | varchar(5000) | yes | no | — |
| `exinamt` | varchar(5000) | yes | no | — |
| `expens` | varchar(5000) | yes | no | — |
| `remarks` | varchar(5000) | yes | no | — |
| `ex_no` | varchar(1000) | yes | no | — |
| `date` | varchar(1000) | yes | no | — |
| `Counter_Name` | varchar(MAX) | yes | no | — |

### `dbo.grndetail`

- Approximate rows: 2
- Key evidence: No PK/unique index recorded
- Other unique indexes: none recorded
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: none by column name
- Observed runtime owner(s): `src/integrations/textilesoft/sqlPurchase.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `code` | varchar(1000) | yes | no | — |
| `cmy_name` | varchar(1000) | yes | no | — |
| `grn` | varchar(1000) | yes | no | — |
| `barcode` | varchar(1000) | yes | no | — |
| `pur_code` | varchar(1000) | yes | no | — |
| `sys_name` | varchar(1000) | yes | no | — |
| `grn_reset` | varchar(1000) | yes | no | — |
| `date_con` | varchar(1000) | yes | no | — |
| `date_pos` | varchar(1000) | yes | no | — |
| `month_con` | varchar(1000) | yes | no | — |
| `month_pos` | varchar(1000) | yes | no | — |
| `year_con` | varchar(1000) | yes | no | — |
| `year_pos` | varchar(1000) | yes | no | — |
| `ratechagebar` | varchar(1000) | yes | no | — |
| `month_year` | varchar(100) | yes | no | — |
| `reverse_con` | varchar(100) | yes | no | — |
| `month_gen` | varchar(100) | yes | no | — |
| `pur_code1` | varchar(100) | yes | no | — |

### `dbo.gstgroup`

- Approximate rows: 4
- Key evidence: No PK/unique index recorded
- Other unique indexes: none recorded
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: none by column name
- Observed runtime owner(s): `src/integrations/textilesoft/sqlMasters.ts`, `src/integrations/textilesoft/sqlPosWriter.ts`, `src/integrations/textilesoft/sqlPurchase.ts`, `src/integrations/textilesoft/sqlPurchaseOrder.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `gst_code` | varchar(1000) | yes | no | — |
| `gst_name` | varchar(1000) | yes | no | — |
| `from_amount` | varchar(1000) | yes | no | — |
| `to_amount` | varchar(1000) | yes | no | — |
| `gst` | varchar(1000) | yes | no | — |
| `cgst` | varchar(1000) | yes | no | — |
| `sgst` | varchar(1000) | yes | no | — |
| `igst` | varchar(1000) | yes | no | — |
| `from_amount1` | varchar(1000) | yes | no | — |
| `to_amount1` | varchar(1000) | yes | no | — |
| `gst1` | varchar(1000) | yes | no | — |
| `cgst1` | varchar(1000) | yes | no | — |
| `sgst1` | varchar(1000) | yes | no | — |
| `igst1` | varchar(1000) | yes | no | — |
| `from_amount2` | varchar(1000) | yes | no | — |
| `to_amount2` | varchar(1000) | yes | no | — |
| `gst2` | varchar(1000) | yes | no | — |
| `cgst2` | varchar(1000) | yes | no | — |
| `sgst2` | varchar(1000) | yes | no | — |
| `igst2` | varchar(1000) | yes | no | — |
| `from_amount3` | varchar(1000) | yes | no | — |
| `to_amount3` | varchar(1000) | yes | no | — |
| `gst3` | varchar(1000) | yes | no | — |
| `cgst3` | varchar(1000) | yes | no | — |
| `sgst3` | varchar(1000) | yes | no | — |
| `igst3` | varchar(1000) | yes | no | — |
| `date` | varchar(1000) | yes | no | — |
| `sales_from_amount` | varchar(1000) | yes | no | — |
| `sales_to_amount` | varchar(1000) | yes | no | — |
| `sales_from_amount1` | varchar(1000) | yes | no | — |
| `sales_to_amount1` | varchar(1000) | yes | no | — |
| `sales_from_amount2` | varchar(1000) | yes | no | — |
| `sales_to_amount2` | varchar(1000) | yes | no | — |
| `sales_from_amount3` | varchar(1000) | yes | no | — |
| `sales_to_amount3` | varchar(1000) | yes | no | — |

### `dbo.headerfooterentry`

- Approximate rows: 1
- Key evidence: No PK/unique index recorded
- Other unique indexes: none recorded
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: hfcountername
- Observed runtime owner(s): `src/integrations/textilesoft/sqlAuth.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `ID` | int | no | yes | — |
| `header1` | varchar(100) | yes | no | — |
| `header2` | varchar(100) | yes | no | — |
| `header3` | varchar(100) | yes | no | — |
| `header4` | varchar(100) | yes | no | — |
| `footer1` | varchar(100) | yes | no | — |
| `footer2` | varchar(100) | yes | no | — |
| `footer3` | varchar(100) | yes | no | — |
| `footer4` | varchar(100) | yes | no | — |
| `footer5` | varchar(100) | yes | no | — |
| `footer6` | varchar(100) | yes | no | — |
| `hfcountername` | varchar(100) | yes | no | — |

### `dbo.hsndetails`

- Approximate rows: 350
- Key evidence: No PK/unique index recorded
- Other unique indexes: none recorded
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: none by column name
- Observed runtime owner(s): `src/integrations/textilesoft/sqlGstReports.ts`, `src/integrations/textilesoft/tests/sqlGstReports.test.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `group_cd` | nvarchar(2000) | yes | no | — |
| `name_eng` | varchar(1000) | yes | no | — |
| `name_tam` | nvarchar(1800) | yes | no | — |
| `date` | nvarchar(1800) | yes | no | — |
| `prin_name_eng` | varchar(1000) | yes | no | — |
| `prin_name_tam` | nvarchar(1800) | yes | no | — |

### `dbo.newcustomer`

- Approximate rows: 1
- Key evidence: No PK/unique index recorded
- Other unique indexes: none recorded
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: none by column name
- Observed runtime owner(s): `src/scripts/textilesoftCustomerKeyAudit.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `sl_nu` | varchar(1000) | yes | no | — |
| `card_number` | varchar(1000) | yes | no | — |
| `eng_name` | varchar(1000) | yes | no | — |
| `eng_address` | varchar(1000) | yes | no | — |
| `eng_city` | varchar(1000) | yes | no | — |
| `pin_code` | varchar(1000) | yes | no | — |
| `phone_nu` | varchar(1000) | yes | no | — |
| `mobile_nu` | varchar(1000) | yes | no | — |
| `emil_id` | varchar(1000) | yes | no | — |
| `date` | varchar(1000) | yes | no | — |
| `discount` | varchar(1000) | yes | no | — |
| `dob` | varchar(1000) | yes | no | — |
| `wedding_date` | varchar(1000) | yes | no | — |
| `points` | varchar(5000) | yes | no | — |
| `gst_no` | varchar(5000) | yes | no | — |
| `datetimt` | datetime | yes | no | — |
| `Adress1` | varchar(500) | yes | no | — |
| `Adress2` | varchar(500) | yes | no | — |
| `Adress3` | varchar(500) | yes | no | — |
| `Adress4` | varchar(500) | yes | no | — |
| `Adress5` | varchar(500) | yes | no | — |
| `SaleBalance` | varchar(500) | yes | no | — |
| `creditdays` | varchar(500) | yes | no | — |
| `frompoint` | int | yes | no | — |
| `topoint` | int | yes | no | — |
| `pointname` | varchar(50) | yes | no | — |
| `frompoint1` | int | yes | no | — |
| `topoint1` | int | yes | no | — |
| `pointname1` | varchar(50) | yes | no | — |
| `frompoint2` | int | yes | no | — |
| `topoint2` | int | yes | no | — |
| `pointname2` | varchar(50) | yes | no | — |
| `frompoint3` | int | yes | no | — |
| `topoint3` | int | yes | no | — |
| `pointname3` | varchar(50) | yes | no | — |
| `entryupdate` | datetime | yes | no | — |
| `creditbalance` | varchar(100) | yes | no | — |
| `SupplierStatus` | varchar(50) | yes | no | — |
| `cmygrpname` | varchar(100) | yes | no | — |
| `Token_no` | varchar(100) | yes | no | — |
| `religion` | varchar(100) | yes | no | — |

### `dbo.newproduct`

- Approximate rows: 224
- Key evidence: No PK/unique index recorded
- Other unique indexes: none recorded
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: none by column name
- Observed runtime owner(s): `src/integrations/textilesoft/sqlAttributes.ts`, `src/integrations/textilesoft/sqlPosWriter.ts`, `src/integrations/textilesoft/sqlProducts.ts`, `src/integrations/textilesoft/sqlPurchase.ts`, `src/integrations/textilesoft/sqlPurchaseOrder.ts`, `src/scripts/textilesoftAnalyze.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `code` | varchar(1000) | yes | no | — |
| `hsn_code` | varchar(1000) | yes | no | — |
| `name` | varchar(1000) | yes | no | — |
| `print_name` | varchar(1000) | yes | no | — |
| `group_name` | varchar(1000) | yes | no | — |
| `sub_group_name` | varchar(1000) | yes | no | — |
| `floor_name` | varchar(1000) | yes | no | — |
| `gst_group` | varchar(1000) | yes | no | — |
| `cmy_name` | varchar(1000) | yes | no | — |
| `discount` | varchar(1000) | yes | no | — |
| `date` | varchar(1000) | yes | no | — |
| `unit_de` | varchar(1000) | yes | no | — |
| `com_per` | varchar(1000) | yes | no | — |
| `com_amt` | varchar(1000) | yes | no | — |
| `commission` | varchar(1000) | yes | no | — |
| `PnameTamil` | nvarchar(2000) | yes | no | — |
| `PrintNameTamil` | nvarchar(2000) | yes | no | — |
| `ProductID` | int | yes | no | — |
| `ProductHSNCode` | varchar(100) | yes | no | — |
| `PCS_Amount` | varchar(100) | yes | no | — |
| `WR_Rate` | varchar(100) | yes | no | — |
| `Retail_Rate` | varchar(100) | yes | no | — |
| `Product_points` | varchar(100) | yes | no | — |
| `mrp` | varchar(100) | yes | no | — |
| `qty` | varchar(100) | yes | no | — |

### `dbo.newuser`

- Approximate rows: 34
- Key evidence: No PK/unique index recorded
- Other unique indexes: none recorded
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: counter_name
- Observed runtime owner(s): `src/integrations/textilesoft/sqlAuth.ts`, `src/integrations/textilesoft/sqlUserAdmin.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `NewUser_ID` | int | no | yes | — |
| `name` | varchar(1000) | yes | no | — |
| `user_id` | varchar(1000) | yes | no | — |
| `pass` | varchar(1000) | yes | no | — |
| `re_pass` | varchar(1000) | yes | no | — |
| `statues` | varchar(1000) | yes | no | — |
| `counter_name` | varchar(1000) | yes | no | — |
| `active` | varchar(50) | yes | no | — |
| `DaysPermit` | varchar(500) | yes | no | — |
| `mode` | varchar(50) | yes | no | — |
| `rights` | varchar(100) | yes | no | — |
| `entrydate` | date | yes | no | — |
| `LastLoginDate` | datetime | yes | no | — |
| `CreatedDate` | datetime | yes | no | — |
| `PurentryLogInStatus` | varchar(200) | yes | no | — |

### `dbo.openpattycash`

- Approximate rows: 0
- Key evidence: No PK/unique index recorded
- Other unique indexes: none recorded
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: counter_name
- Observed runtime owner(s): `src/integrations/textilesoft/sqlCashBank.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `counter_name` | varchar(1000) | yes | no | — |
| `cashier_name` | varchar(1000) | yes | no | — |
| `r2000` | varchar(1000) | yes | no | — |
| `r500` | varchar(1000) | yes | no | — |
| `r200` | varchar(1000) | yes | no | — |
| `r100` | varchar(1000) | yes | no | — |
| `r50` | varchar(1000) | yes | no | — |
| `r20` | varchar(1000) | yes | no | — |
| `r10` | varchar(1000) | yes | no | — |
| `r5` | varchar(1000) | yes | no | — |
| `r2` | varchar(1000) | yes | no | — |
| `r1` | varchar(1000) | yes | no | — |
| `tot_amm` | varchar(1000) | yes | no | — |
| `date` | varchar(1000) | yes | no | — |
| `sl_no` | varchar(1000) | yes | no | — |
| `status` | varchar(50) | yes | no | — |
| `updatetime` | datetime | yes | no | — |

### `dbo.podetails`

- Approximate rows: 0
- Key evidence: No PK/unique index recorded
- Other unique indexes: none recorded
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: none by column name
- Observed runtime owner(s): `src/integrations/textilesoft/sqlPurchaseOrder.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `ID` | int | no | yes | — |
| `grn_no` | varchar(1000) | yes | no | — |
| `sl_no` | varchar(1000) | yes | no | — |
| `barcode` | varchar(1000) | yes | no | — |
| `design` | varchar(1000) | yes | no | — |
| `code` | varchar(1000) | yes | no | — |
| `pname` | varchar(1000) | yes | no | — |
| `prate` | varchar(1000) | yes | no | — |
| `mtr` | varchar(1000) | yes | no | — |
| `qty` | varchar(1000) | yes | no | — |
| `amount` | varchar(1000) | yes | no | — |
| `dis_per` | varchar(1000) | yes | no | — |
| `dis_amount` | varchar(1000) | yes | no | — |
| `gst_per` | varchar(1000) | yes | no | — |
| `gst_amount` | varchar(1000) | yes | no | — |
| `nrate` | varchar(1000) | yes | no | — |
| `net_amount` | varchar(1000) | yes | no | — |
| `sr_per` | varchar(1000) | yes | no | — |
| `mrp` | varchar(1000) | yes | no | — |
| `sr_rate` | varchar(1000) | yes | no | — |
| `cr_per` | varchar(1000) | yes | no | — |
| `cr_rate` | varchar(1000) | yes | no | — |
| `brand` | varchar(1000) | yes | no | — |
| `patrn` | varchar(1000) | yes | no | — |
| `size` | varchar(1000) | yes | no | — |
| `color` | varchar(1000) | yes | no | — |
| `style` | varchar(1000) | yes | no | — |
| `image` | varchar(1000) | yes | no | — |
| `fqty` | varchar(1000) | yes | no | — |
| `fname` | varchar(1000) | yes | no | — |
| `disgroamt` | varchar(1000) | yes | no | — |
| `gstgrosamt` | varchar(1000) | yes | no | — |
| `salesexrate` | varchar(1000) | yes | no | — |
| `salesinrate` | varchar(1000) | yes | no | — |
| `crsalesexrate` | varchar(1000) | yes | no | — |
| `crsalesinrate` | varchar(1000) | yes | no | — |
| `date` | varchar(1000) | yes | no | — |
| `pro_group_name` | varchar(1000) | yes | no | — |
| `unit_details` | varchar(1000) | yes | no | — |
| `old_mrp` | varchar(1000) | yes | no | — |
| `old_sr_mrp` | varchar(1000) | yes | no | — |
| `old_cr_per` | varchar(1000) | yes | no | — |
| `old_crr` | varchar(1000) | yes | no | — |
| `old_qty` | varchar(1000) | yes | no | — |
| `pratecode` | varchar(1000) | yes | no | — |
| `STATUS` | varchar(1000) | yes | no | — |
| `bar_take_status` | varchar(1000) | yes | no | — |
| `oldbarcode` | varchar(1000) | yes | no | — |
| `oldbrand` | varchar(1000) | yes | no | — |
| `oldpat` | varchar(1000) | yes | no | — |
| `oldsize` | varchar(1000) | yes | no | — |
| `oldcolor` | varchar(1000) | yes | no | — |
| `oldstyle` | varchar(1000) | yes | no | — |
| `orgbar` | varchar(1000) | yes | no | — |
| `entry_date` | date | yes | no | — |
| `pless` | varchar(1000) | yes | no | — |
| `plamt` | varchar(1000) | yes | no | — |
| `mrpdisper` | varchar(1000) | yes | no | — |
| `mrpdisamt` | varchar(1000) | yes | no | — |
| `TotalMeter` | varchar(100) | yes | no | — |
| `FromMRP` | varchar(300) | yes | no | — |
| `ToMRP` | varchar(300) | yes | no | — |
| `AppMtr` | varchar(200) | yes | no | — |
| `AppQty` | varchar(200) | yes | no | — |
| `Remarks` | varchar(200) | yes | no | — |
| `returnqty` | varchar(1000) | yes | no | — |
| `receivqty` | varchar(1000) | yes | no | — |
| `receivdate` | date | yes | no | — |
| `receivrefno` | varchar(100) | yes | no | — |
| `receiventryqty` | varchar(1000) | yes | no | — |
| `shortqty` | varchar(1000) | yes | no | — |
| `excessqty` | varchar(1000) | yes | no | — |
| `billstatus` | varchar(100) | yes | no | — |
| `checkedby` | varchar(200) | yes | no | — |

### `dbo.poheader`

- Approximate rows: 0
- Key evidence: No PK/unique index recorded
- Other unique indexes: none recorded
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: warehouse
- Observed runtime owner(s): `src/integrations/textilesoft/sqlPurchaseOrder.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `ID` | int | no | yes | — |
| `cmy_name` | varchar(1000) | yes | no | — |
| `warehouse` | varchar(1000) | yes | no | — |
| `suplier_name` | varchar(1000) | yes | no | — |
| `agent_name` | varchar(1000) | yes | no | — |
| `grn_no` | varchar(1000) | yes | no | — |
| `invoce_amount` | varchar(1000) | yes | no | — |
| `invoce_date` | date | yes | no | — |
| `entry_date` | date | yes | no | — |
| `pay_type` | varchar(1000) | yes | no | — |
| `pnet_tot` | varchar(1000) | yes | no | — |
| `com_per` | varchar(1000) | yes | no | — |
| `com_amount` | varchar(1000) | yes | no | — |
| `pack_char` | varchar(1000) | yes | no | — |
| `oter_char` | varchar(1000) | yes | no | — |
| `char_tot` | varchar(1000) | yes | no | — |
| `tot_qut` | varchar(1000) | yes | no | — |
| `char_qut_amou` | varchar(1000) | yes | no | — |
| `bdis_in` | varchar(1000) | yes | no | — |
| `bdis_exe` | varchar(1000) | yes | no | — |
| `gst_in` | varchar(1000) | yes | no | — |
| `gst_exe` | varchar(1000) | yes | no | — |
| `igst_in` | varchar(1000) | yes | no | — |
| `igst_exe` | varchar(1000) | yes | no | — |
| `incharge` | varchar(1000) | yes | no | — |
| `brand` | varchar(1000) | yes | no | — |
| `sales` | varchar(1000) | yes | no | — |
| `cross_amount` | varchar(1000) | yes | no | — |
| `date` | date | yes | no | — |
| `gst5` | varchar(1000) | yes | no | — |
| `gst12` | varchar(1000) | yes | no | — |
| `gst18` | varchar(1000) | yes | no | — |
| `gst28` | varchar(1000) | yes | no | — |
| `LR_no` | varchar(1000) | yes | no | — |
| `less` | varchar(1000) | yes | no | — |
| `totnetamot` | varchar(1000) | yes | no | — |
| `tot_less` | varchar(1000) | yes | no | — |
| `mrpdisperh` | varchar(500) | yes | no | — |
| `SalesMan` | varchar(500) | yes | no | — |
| `POStatus` | varchar(50) | yes | no | — |
| `OverAllQty` | varchar(500) | yes | no | — |
| `OverAllMtr` | varchar(500) | yes | no | — |

### `dbo.purchasereturndetails`

- Approximate rows: 8
- Key evidence: No PK/unique index recorded
- Other unique indexes: none recorded
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: none by column name
- Observed runtime owner(s): `src/integrations/textilesoft/sqlPartyReports.ts`, `src/integrations/textilesoft/sqlPosWriter.ts`, `src/integrations/textilesoft/sqlPurchase.ts`, `src/integrations/textilesoft/sqlPurchaseReturn.ts`, `src/integrations/textilesoft/sqlStockReports.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `ID` | int | no | yes | — |
| `grn_no` | varchar(1000) | yes | no | — |
| `sl_no` | varchar(1000) | yes | no | — |
| `barcode` | varchar(1000) | yes | no | — |
| `design` | varchar(1000) | yes | no | — |
| `code` | varchar(1000) | yes | no | — |
| `pname` | varchar(1000) | yes | no | — |
| `prate` | varchar(1000) | yes | no | — |
| `mtr` | varchar(1000) | yes | no | — |
| `qty` | varchar(1000) | yes | no | — |
| `amount` | varchar(1000) | yes | no | — |
| `dis_per` | varchar(1000) | yes | no | — |
| `dis_amount` | varchar(1000) | yes | no | — |
| `gst_per` | varchar(1000) | yes | no | — |
| `gst_amount` | varchar(1000) | yes | no | — |
| `nrate` | varchar(1000) | yes | no | — |
| `net_amount` | varchar(1000) | yes | no | — |
| `sr_per` | varchar(1000) | yes | no | — |
| `mrp` | varchar(1000) | yes | no | — |
| `sr_rate` | varchar(1000) | yes | no | — |
| `cr_per` | varchar(1000) | yes | no | — |
| `cr_rate` | varchar(1000) | yes | no | — |
| `brand` | varchar(1000) | yes | no | — |
| `patrn` | varchar(1000) | yes | no | — |
| `size` | varchar(1000) | yes | no | — |
| `color` | varchar(1000) | yes | no | — |
| `style` | varchar(1000) | yes | no | — |
| `image` | varchar(1000) | yes | no | — |
| `fqty` | varchar(1000) | yes | no | — |
| `fname` | varchar(1000) | yes | no | — |
| `disgroamt` | varchar(1000) | yes | no | — |
| `gstgrosamt` | varchar(1000) | yes | no | — |
| `salesexrate` | varchar(1000) | yes | no | — |
| `salesinrate` | varchar(1000) | yes | no | — |
| `crsalesexrate` | varchar(1000) | yes | no | — |
| `crsalesinrate` | varchar(1000) | yes | no | — |
| `date` | varchar(1000) | yes | no | — |
| `pro_group_name` | varchar(1000) | yes | no | — |
| `unit_details` | varchar(1000) | yes | no | — |
| `old_mrp` | varchar(1000) | yes | no | — |
| `old_sr_mrp` | varchar(1000) | yes | no | — |
| `old_cr_per` | varchar(1000) | yes | no | — |
| `old_crr` | varchar(1000) | yes | no | — |
| `old_qty` | varchar(1000) | yes | no | — |
| `pratecode` | varchar(1000) | yes | no | — |
| `STATUS` | varchar(1000) | yes | no | — |
| `bar_take_status` | varchar(1000) | yes | no | — |
| `oldbarcode` | varchar(1000) | yes | no | — |
| `oldbrand` | varchar(1000) | yes | no | — |
| `oldpat` | varchar(1000) | yes | no | — |
| `oldsize` | varchar(1000) | yes | no | — |
| `oldcolor` | varchar(1000) | yes | no | — |
| `oldstyle` | varchar(1000) | yes | no | — |
| `orgbar` | varchar(1000) | yes | no | — |
| `entry_date` | date | yes | no | — |
| `pless` | varchar(1000) | yes | no | — |
| `plamt` | varchar(1000) | yes | no | — |
| `mrpdisper` | varchar(1000) | yes | no | — |
| `mrpdisamt` | varchar(1000) | yes | no | — |
| `TotalMeter` | varchar(100) | yes | no | — |
| `cqty` | varchar(1000) | yes | no | — |
| `cqtysets` | varchar(1000) | yes | no | — |
| `corate` | varchar(1000) | yes | no | — |
| `costatus` | varchar(50) | yes | no | — |
| `cmpamt` | varchar(1000) | yes | no | — |
| `smpper` | varchar(1000) | yes | no | — |
| `cfbarcode` | varchar(1000) | yes | no | — |
| `cfname` | varchar(1000) | yes | no | — |
| `hsncode` | varchar(1000) | yes | no | — |
| `rackno` | varchar(1000) | yes | no | — |
| `model` | varchar(1000) | yes | no | — |
| `fashion` | varchar(1000) | yes | no | — |
| `comboname` | varchar(1000) | yes | no | — |
| `costatus1` | varchar(50) | yes | no | — |
| `billstatus` | int | yes | no | — |
| `UpdatedOn` | datetime | yes | no | — |
| `DatewiseStatus` | varchar(100) | yes | no | — |
| `wsper` | varchar(100) | yes | no | — |
| `wsamt` | varchar(100) | yes | no | — |
| `warranty` | varchar(200) | yes | no | — |
| `SalesStatus` | varchar(200) | yes | no | — |

### `dbo.purchasereturnheader`

- Approximate rows: 6
- Key evidence: No PK/unique index recorded
- Other unique indexes: none recorded
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: warehouse
- Observed runtime owner(s): `src/integrations/textilesoft/sqlPartyReports.ts`, `src/integrations/textilesoft/sqlPurchaseReturn.ts`, `src/integrations/textilesoft/sqlStockReports.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `ID` | int | no | yes | — |
| `cmy_name` | varchar(1000) | yes | no | — |
| `warehouse` | varchar(1000) | yes | no | — |
| `suplier_name` | varchar(1000) | yes | no | — |
| `agent_name` | varchar(1000) | yes | no | — |
| `grn_no` | varchar(1000) | yes | no | — |
| `invoce_amount` | varchar(1000) | yes | no | — |
| `invoce_date` | date | yes | no | — |
| `entry_date` | date | yes | no | — |
| `pay_type` | varchar(1000) | yes | no | — |
| `pnet_tot` | varchar(1000) | yes | no | — |
| `com_per` | varchar(1000) | yes | no | — |
| `com_amount` | varchar(1000) | yes | no | — |
| `pack_char` | varchar(1000) | yes | no | — |
| `oter_char` | varchar(1000) | yes | no | — |
| `char_tot` | varchar(1000) | yes | no | — |
| `tot_qut` | varchar(1000) | yes | no | — |
| `char_qut_amou` | varchar(1000) | yes | no | — |
| `bdis_in` | varchar(1000) | yes | no | — |
| `bdis_exe` | varchar(1000) | yes | no | — |
| `gst_in` | varchar(1000) | yes | no | — |
| `gst_exe` | varchar(1000) | yes | no | — |
| `igst_in` | varchar(1000) | yes | no | — |
| `igst_exe` | varchar(1000) | yes | no | — |
| `incharge` | varchar(1000) | yes | no | — |
| `brand` | varchar(1000) | yes | no | — |
| `sales` | varchar(1000) | yes | no | — |
| `cross_amount` | varchar(1000) | yes | no | — |
| `date` | date | yes | no | — |
| `gst5` | varchar(1000) | yes | no | — |
| `gst12` | varchar(1000) | yes | no | — |
| `gst18` | varchar(1000) | yes | no | — |
| `gst28` | varchar(1000) | yes | no | — |
| `LR_no` | varchar(1000) | yes | no | — |
| `less` | varchar(1000) | yes | no | — |
| `totnetamot` | varchar(1000) | yes | no | — |
| `tot_less` | varchar(1000) | yes | no | — |
| `mrpdisperh` | varchar(500) | yes | no | — |
| `pack_charless` | varchar(500) | yes | no | — |
| `AddchargeAmt` | varchar(500) | yes | no | — |
| `AddchargePer` | varchar(500) | yes | no | — |
| `AddcharegeGST` | varchar(500) | yes | no | — |
| `AddchargeWOGST` | varchar(500) | yes | no | — |
| `IGSTAmt` | varchar(500) | yes | no | — |
| `billstatus` | varchar(50) | yes | no | — |
| `Supplier_City` | varchar(200) | yes | no | — |
| `CTotal` | varchar(200) | yes | no | — |
| `CQty` | varchar(200) | yes | no | — |
| `CMtr` | varchar(200) | yes | no | — |
| `CGst` | varchar(200) | yes | no | — |
| `GrnComboStatus` | varchar(200) | yes | no | — |
| `PreDisamt` | varchar(150) | yes | no | — |
| `ViewStatus` | varchar(200) | yes | no | — |

### `dbo.purentrydetails`

- Approximate rows: 81023
- Key evidence: No PK/unique index recorded
- Other unique indexes: none recorded
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: none by column name
- Observed runtime owner(s): `src/integrations/textilesoft/sqlAttributes.ts`, `src/integrations/textilesoft/sqlPartyReports.ts`, `src/integrations/textilesoft/sqlPosWriter.ts`, `src/integrations/textilesoft/sqlProducts.ts`, `src/integrations/textilesoft/sqlPurchase.ts`, `src/integrations/textilesoft/sqlPurchaseReturn.ts`, `src/integrations/textilesoft/sqlReferences.ts`, `src/integrations/textilesoft/sqlSales.ts`, `src/integrations/textilesoft/sqlStockReports.ts`, `src/scripts/textilesoftStockAgeCheck.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `ID` | int | no | yes | — |
| `grn_no` | varchar(1000) | yes | no | — |
| `sl_no` | varchar(1000) | yes | no | — |
| `barcode` | varchar(1000) | yes | no | — |
| `design` | varchar(1000) | yes | no | — |
| `code` | varchar(1000) | yes | no | — |
| `pname` | varchar(1000) | yes | no | — |
| `prate` | varchar(1000) | yes | no | — |
| `mtr` | varchar(1000) | yes | no | — |
| `qty` | varchar(1000) | yes | no | — |
| `amount` | varchar(1000) | yes | no | — |
| `dis_per` | varchar(1000) | yes | no | — |
| `dis_amount` | varchar(1000) | yes | no | — |
| `gst_per` | varchar(1000) | yes | no | — |
| `gst_amount` | varchar(1000) | yes | no | — |
| `nrate` | varchar(1000) | yes | no | — |
| `net_amount` | varchar(1000) | yes | no | — |
| `sr_per` | varchar(1000) | yes | no | — |
| `mrp` | varchar(1000) | yes | no | — |
| `sr_rate` | varchar(1000) | yes | no | — |
| `cr_per` | varchar(1000) | yes | no | — |
| `cr_rate` | varchar(1000) | yes | no | — |
| `brand` | varchar(1000) | yes | no | — |
| `patrn` | varchar(1000) | yes | no | — |
| `size` | varchar(1000) | yes | no | — |
| `color` | varchar(1000) | yes | no | — |
| `style` | varchar(1000) | yes | no | — |
| `image` | varchar(1000) | yes | no | — |
| `fqty` | varchar(1000) | yes | no | — |
| `fname` | varchar(1000) | yes | no | — |
| `disgroamt` | varchar(1000) | yes | no | — |
| `gstgrosamt` | varchar(1000) | yes | no | — |
| `salesexrate` | varchar(1000) | yes | no | — |
| `salesinrate` | varchar(1000) | yes | no | — |
| `crsalesexrate` | varchar(1000) | yes | no | — |
| `crsalesinrate` | varchar(1000) | yes | no | — |
| `date` | varchar(1000) | yes | no | — |
| `pro_group_name` | varchar(1000) | yes | no | — |
| `unit_details` | varchar(1000) | yes | no | — |
| `old_mrp` | varchar(1000) | yes | no | — |
| `old_sr_mrp` | varchar(1000) | yes | no | — |
| `old_cr_per` | varchar(1000) | yes | no | — |
| `old_crr` | varchar(1000) | yes | no | — |
| `old_qty` | varchar(1000) | yes | no | — |
| `pratecode` | varchar(1000) | yes | no | — |
| `STATUS` | varchar(1000) | yes | no | — |
| `bar_take_status` | varchar(1000) | yes | no | — |
| `oldbarcode` | varchar(1000) | yes | no | — |
| `oldbrand` | varchar(1000) | yes | no | — |
| `oldpat` | varchar(1000) | yes | no | — |
| `oldsize` | varchar(1000) | yes | no | — |
| `oldcolor` | varchar(1000) | yes | no | — |
| `oldstyle` | varchar(1000) | yes | no | — |
| `orgbar` | varchar(1000) | yes | no | — |
| `entry_date` | date | yes | no | — |
| `pless` | varchar(1000) | yes | no | — |
| `plamt` | varchar(1000) | yes | no | — |
| `mrpdisper` | varchar(1000) | yes | no | — |
| `mrpdisamt` | varchar(1000) | yes | no | — |
| `TotalMeter` | varchar(100) | yes | no | — |
| `cqty` | varchar(1000) | yes | no | — |
| `cqtysets` | varchar(1000) | yes | no | — |
| `corate` | varchar(1000) | yes | no | — |
| `costatus` | varchar(50) | yes | no | — |
| `cmpamt` | varchar(1000) | yes | no | — |
| `smpper` | varchar(1000) | yes | no | — |
| `cfbarcode` | varchar(1000) | yes | no | — |
| `cfname` | varchar(1000) | yes | no | — |
| `hsncode` | varchar(1000) | yes | no | — |
| `rackno` | varchar(1000) | yes | no | — |
| `model` | varchar(1000) | yes | no | — |
| `fashion` | varchar(1000) | yes | no | — |
| `comboname` | varchar(1000) | yes | no | — |
| `costatus1` | varchar(50) | yes | no | — |
| `billstatus` | int | yes | no | — |
| `UpdatedOn` | datetime | yes | no | — |
| `DatewiseStatus` | varchar(100) | yes | no | — |
| `wsper` | varchar(100) | yes | no | — |
| `wsamt` | varchar(100) | yes | no | — |
| `warranty` | varchar(200) | yes | no | — |
| `SalesStatus` | varchar(200) | yes | no | — |
| `barLen` | varchar(100) | yes | no | — |
| `cqty2` | varchar(100) | yes | no | — |
| `corate2` | varchar(100) | yes | no | — |
| `cqty3` | varchar(100) | yes | no | — |
| `corate3` | varchar(100) | yes | no | — |
| `cqtysets2` | varchar(100) | yes | no | — |
| `cqtysets3` | varchar(100) | yes | no | — |
| `corate1` | varchar(100) | yes | no | — |
| `corate4` | varchar(100) | yes | no | — |
| `silver` | varchar(100) | yes | no | — |
| `gold` | varchar(100) | yes | no | — |
| `diamond` | varchar(100) | yes | no | — |
| `IMEI_1` | varchar(100) | yes | no | — |
| `IMEI_2` | varchar(100) | yes | no | — |
| `barcodecomm` | varchar(100) | yes | no | — |
| `barcodepcs` | varchar(100) | yes | no | — |
| `WRpratecode` | varchar(100) | yes | no | — |
| `totQty` | varchar(100) | yes | no | — |
| `BQty` | varchar(100) | yes | no | — |
| `SQty` | varchar(100) | yes | no | — |
| `SecondryPercentage` | varchar(100) | yes | no | — |
| `SecondryAmount` | varchar(100) | yes | no | — |
| `SecondryBal` | varchar(100) | yes | no | — |
| `pnameTamil` | nvarchar(200) | yes | no | — |
| `TDAmount` | varchar(100) | yes | no | — |
| `SchemaDiscount` | varchar(100) | yes | no | — |
| `SchemaDisAmount` | varchar(100) | yes | no | — |
| `SchemaDisGrossAmt` | varchar(100) | yes | no | — |
| `disgrossamt` | varchar(100) | yes | no | — |
| `sTotal` | varchar(100) | yes | no | — |
| `totSoloQty` | varchar(100) | yes | no | — |
| `bstatus` | varchar(100) | yes | no | — |
| `prQty` | varchar(100) | yes | no | — |
| `adjustQty` | varchar(100) | yes | no | — |
| `transQty` | varchar(100) | yes | no | — |
| `oldBalQty` | varchar(100) | yes | no | — |
| `cMrp_per` | varchar(100) | yes | no | — |
| `cMrp` | varchar(100) | yes | no | — |
| `BsTotQty` | varchar(100) | yes | no | — |
| `LessPCSAmt` | varchar(100) | yes | no | — |
| `Doz` | varchar(100) | yes | no | — |

### `dbo.purgrnentry`

- Approximate rows: 17793
- Key evidence: No PK/unique index recorded
- Other unique indexes: none recorded
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: warehouse
- Observed runtime owner(s): `src/integrations/textilesoft/sqlAttributes.ts`, `src/integrations/textilesoft/sqlPartyReports.ts`, `src/integrations/textilesoft/sqlProducts.ts`, `src/integrations/textilesoft/sqlPurchase.ts`, `src/integrations/textilesoft/sqlPurchaseReturn.ts`, `src/integrations/textilesoft/sqlSales.ts`, `src/integrations/textilesoft/sqlStockReports.ts`, `src/integrations/textilesoft/sqlSuppliers.ts`, `src/scripts/financeCheck.ts`, `src/scripts/textilesoftAnalyzeSuppliers.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `ID` | int | no | yes | — |
| `cmy_name` | varchar(1000) | yes | no | — |
| `warehouse` | varchar(1000) | yes | no | — |
| `suplier_name` | varchar(1000) | yes | no | — |
| `agent_name` | varchar(1000) | yes | no | — |
| `grn_no` | varchar(1000) | yes | no | — |
| `invoce_amount` | varchar(1000) | yes | no | — |
| `invoce_date` | date | yes | no | — |
| `entry_date` | date | yes | no | — |
| `pay_type` | varchar(1000) | yes | no | — |
| `pnet_tot` | varchar(1000) | yes | no | — |
| `com_per` | varchar(1000) | yes | no | — |
| `com_amount` | varchar(1000) | yes | no | — |
| `pack_char` | varchar(1000) | yes | no | — |
| `oter_char` | varchar(1000) | yes | no | — |
| `char_tot` | varchar(1000) | yes | no | — |
| `tot_qut` | varchar(1000) | yes | no | — |
| `char_qut_amou` | varchar(1000) | yes | no | — |
| `bdis_in` | varchar(1000) | yes | no | — |
| `bdis_exe` | varchar(1000) | yes | no | — |
| `gst_in` | varchar(1000) | yes | no | — |
| `gst_exe` | varchar(1000) | yes | no | — |
| `igst_in` | varchar(1000) | yes | no | — |
| `igst_exe` | varchar(1000) | yes | no | — |
| `incharge` | varchar(1000) | yes | no | — |
| `brand` | varchar(1000) | yes | no | — |
| `sales` | varchar(1000) | yes | no | — |
| `cross_amount` | varchar(1000) | yes | no | — |
| `date` | date | yes | no | — |
| `gst5` | varchar(1000) | yes | no | — |
| `gst12` | varchar(1000) | yes | no | — |
| `gst18` | varchar(1000) | yes | no | — |
| `gst28` | varchar(1000) | yes | no | — |
| `LR_no` | varchar(1000) | yes | no | — |
| `less` | varchar(1000) | yes | no | — |
| `totnetamot` | varchar(1000) | yes | no | — |
| `tot_less` | varchar(1000) | yes | no | — |
| `mrpdisperh` | varchar(500) | yes | no | — |
| `pack_charless` | varchar(500) | yes | no | — |
| `AddchargeAmt` | varchar(500) | yes | no | — |
| `AddchargePer` | varchar(500) | yes | no | — |
| `AddcharegeGST` | varchar(500) | yes | no | — |
| `AddchargeWOGST` | varchar(500) | yes | no | — |
| `IGSTAmt` | varchar(500) | yes | no | — |
| `billstatus` | varchar(50) | yes | no | — |
| `Supplier_City` | varchar(200) | yes | no | — |
| `CTotal` | varchar(200) | yes | no | — |
| `CQty` | varchar(200) | yes | no | — |
| `CMtr` | varchar(200) | yes | no | — |
| `CGst` | varchar(200) | yes | no | — |
| `GrnComboStatus` | varchar(200) | yes | no | — |
| `ViewStatus` | varchar(200) | yes | no | — |
| `PreDisamt` | varchar(200) | yes | no | — |
| `gstOther` | varchar(200) | yes | no | — |
| `SecPer` | varchar(200) | yes | no | — |
| `statusCheck` | varchar(200) | yes | no | — |
| `sstatus` | varchar(200) | yes | no | — |
| `SchemaDiscount` | varchar(200) | yes | no | — |
| `TotSchemaDisAmount` | varchar(200) | yes | no | — |
| `TotSchemaDisGrossAmt` | varchar(200) | yes | no | — |
| `totBillQty` | varchar(200) | yes | no | — |

### `dbo.purretrun`

- Approximate rows: 0
- Key evidence: No PK/unique index recorded
- Other unique indexes: none recorded
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: none by column name
- Observed runtime owner(s): `src/integrations/textilesoft/sqlPosWriter.ts`, `src/integrations/textilesoft/sqlPurchase.ts`, `src/integrations/textilesoft/sqlPurchaseReturn.ts`, `src/integrations/textilesoft/sqlStockReports.ts`, `src/scripts/textilesoftOverlap.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `sup_retu_grn` | varchar(1000) | yes | no | — |
| `supp_name` | varchar(1000) | yes | no | — |
| `agent_name` | varchar(1000) | yes | no | — |
| `cmy_name` | varchar(1000) | yes | no | — |
| `invoice_nu` | varchar(1000) | yes | no | — |
| `grn_no` | varchar(1000) | yes | no | — |
| `gst` | varchar(1000) | yes | no | — |
| `igst` | varchar(1000) | yes | no | — |
| `deign_nu` | varchar(1000) | yes | no | — |
| `barcode` | varchar(1000) | yes | no | — |
| `code` | varchar(1000) | yes | no | — |
| `pr_name` | varchar(1000) | yes | no | — |
| `pr_rate` | varchar(1000) | yes | no | — |
| `mtr` | varchar(1000) | yes | no | — |
| `qty` | varchar(1000) | yes | no | — |
| `fqty` | varchar(1000) | yes | no | — |
| `amt` | varchar(1000) | yes | no | — |
| `dis_per` | varchar(1000) | yes | no | — |
| `dis_amt` | varchar(1000) | yes | no | — |
| `sr` | varchar(1000) | yes | no | — |
| `mrp` | varchar(1000) | yes | no | — |
| `gst_per` | varchar(1000) | yes | no | — |
| `gst_amt` | varchar(1000) | yes | no | — |
| `netamt` | varchar(1000) | yes | no | — |
| `brand` | varchar(1000) | yes | no | — |
| `pattern` | varchar(1000) | yes | no | — |
| `color` | varchar(1000) | yes | no | — |
| `size` | varchar(1000) | yes | no | — |
| `date` | date | yes | no | — |
| `incharge_name` | varchar(1000) | yes | no | — |
| `rgrno` | varchar(1000) | yes | no | — |
| `type` | varchar(1000) | yes | no | — |
| `sl_no` | varchar(1000) | yes | no | — |
| `cr` | varchar(1000) | yes | no | — |
| `crrate` | varchar(1000) | yes | no | — |
| `pratecode` | varchar(1000) | yes | no | — |
| `style` | varchar(1000) | yes | no | — |
| `nrate` | varchar(1000) | yes | no | — |
| `add_charge` | varchar(1000) | yes | no | — |
| `courier_charge` | varchar(1000) | yes | no | — |
| `bill_dis_per` | varchar(1000) | yes | no | — |
| `bill_dis_amt` | varchar(1000) | yes | no | — |
| `bill_less` | varchar(1000) | yes | no | — |
| `Count_Name` | varchar(50) | yes | no | — |
| `Login_Name` | varchar(50) | yes | no | — |
| `unit_dtl` | varchar(50) | yes | no | — |
| `supp_netamt` | varchar(50) | yes | no | — |
| `Return_Status` | varchar(100) | yes | no | — |
| `sp_Return_Status` | varchar(50) | yes | no | — |
| `igst_amt` | varchar(100) | yes | no | — |
| `BarAddCharge` | varchar(100) | yes | no | — |
| `BarCourierCharge` | varchar(100) | yes | no | — |
| `BarcodeNetAmt` | varchar(100) | yes | no | — |
| `GroupName` | varchar(100) | yes | no | — |
| `Totmtr` | varchar(100) | yes | no | — |
| `balmtr` | varchar(100) | yes | no | — |
| `BSQty` | varchar(150) | yes | no | — |
| `Prmtr` | varchar(150) | yes | no | — |
| `totmtr1` | varchar(150) | yes | no | — |
| `totbalmtr` | varchar(150) | yes | no | — |
| `TotalPurMtr` | varchar(150) | yes | no | — |
| `StackMtr` | varchar(150) | yes | no | — |
| `BalMtr1` | varchar(150) | yes | no | — |
| `PurReturnMtr` | varchar(150) | yes | no | — |
| `MaterialMtr` | varchar(150) | yes | no | — |
| `smtr` | varchar(150) | yes | no | — |

### `dbo.salbillreturns`

- Approximate rows: 0
- Key evidence: No PK/unique index recorded
- Other unique indexes: none recorded
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: countername, counterID
- Observed runtime owner(s): `src/integrations/textilesoft/sqlSalesReturn.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `sn` | varchar(1000) | yes | no | — |
| `slman` | varchar(1000) | yes | no | — |
| `barcode` | varchar(1000) | yes | no | — |
| `code` | varchar(1000) | yes | no | — |
| `p_name` | varchar(1000) | yes | no | — |
| `mrp` | varchar(1000) | yes | no | — |
| `rate` | varchar(1000) | yes | no | — |
| `mtr` | varchar(1000) | yes | no | — |
| `qty` | varchar(1000) | yes | no | — |
| `amt` | varchar(1000) | yes | no | — |
| `pds` | varchar(1000) | yes | no | — |
| `pamt` | varchar(1000) | yes | no | — |
| `bdis` | varchar(1000) | yes | no | — |
| `less` | varchar(1000) | yes | no | — |
| `gst` | varchar(1000) | yes | no | — |
| `cgst` | varchar(1000) | yes | no | — |
| `sgst` | varchar(1000) | yes | no | — |
| `netamt` | varchar(1000) | yes | no | — |
| `billno` | varchar(1000) | yes | no | — |
| `cmy_name` | varchar(1000) | yes | no | — |
| `cmy_bill` | varchar(1000) | yes | no | — |
| `gst_per` | varchar(1000) | yes | no | — |
| `bdisam` | varchar(1000) | yes | no | — |
| `unit` | varchar(1000) | yes | no | — |
| `countername` | varchar(1000) | yes | no | — |
| `costatus` | varchar(100) | yes | no | — |
| `design` | varchar(100) | yes | no | — |
| `brand` | varchar(100) | yes | no | — |
| `size` | varchar(100) | yes | no | — |
| `color` | varchar(100) | yes | no | — |
| `style` | varchar(100) | yes | no | — |
| `patrn` | varchar(100) | yes | no | — |
| `prate` | varchar(100) | yes | no | — |
| `nrate` | varchar(100) | yes | no | — |
| `CheckBarcodeBalanceStock` | varchar(100) | yes | no | — |
| `totlamt` | varchar(1000) | yes | no | — |
| `credit_catagary` | varchar(1000) | yes | no | — |
| `creditper` | varchar(50) | yes | no | — |
| `freeproduct` | varchar(50) | yes | no | — |
| `gstcrossamt` | varchar(200) | yes | no | — |
| `pdisrate` | varchar(200) | yes | no | — |
| `pamtTemp` | varchar(200) | yes | no | — |
| `custpointamt` | varchar(1000) | yes | no | — |
| `pnameTamil` | nvarchar(200) | yes | no | — |
| `user_id` | varchar(100) | yes | no | — |
| `comp_continu_billno` | int | yes | no | — |
| `cmy_wo_continu_billno` | int | yes | no | — |
| `cmnyname` | varchar(100) | yes | no | — |
| `pgname` | varchar(100) | yes | no | — |
| `fname` | varchar(100) | yes | no | — |
| `counterID` | varchar(50) | yes | no | — |
| `points` | varchar(50) | yes | no | — |
| `cusname` | varchar(100) | yes | no | — |
| `pre_qty` | varchar(100) | yes | no | — |
| `c_Mrp` | varchar(100) | yes | no | — |
| `c_Amt` | varchar(100) | yes | no | — |
| `ProductPoint` | varchar(100) | yes | no | — |
| `TotProductPoint` | varchar(100) | yes | no | — |
| `corate` | varchar(100) | yes | no | — |
| `corate1` | varchar(100) | yes | no | — |
| `corate2` | varchar(100) | yes | no | — |
| `corate3` | varchar(100) | yes | no | — |
| `corate4` | varchar(100) | yes | no | — |
| `cqty` | varchar(100) | yes | no | — |
| `status` | varchar(100) | yes | no | — |
| `TotQtyCof` | varchar(100) | yes | no | — |
| `offer_Qty` | varchar(100) | yes | no | — |
| `Token_Dis_Amount` | varchar(100) | yes | no | — |
| `BsTotQty` | varchar(100) | yes | no | — |
| `Sub_Mrp` | varchar(100) | yes | no | — |
| `gst_group` | varchar(100) | yes | no | — |
| `PHSN_CODE` | varchar(100) | yes | no | — |

### `dbo.sales2`

- Approximate rows: 252996
- Key evidence: PK PK_sales2_1(No)
- Other unique indexes: none recorded
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: countername
- Observed runtime owner(s): `src/integrations/textilesoft/sqlCashBank.ts`, `src/integrations/textilesoft/sqlFinance.ts`, `src/integrations/textilesoft/sqlGstReports.ts`, `src/integrations/textilesoft/sqlPartyReports.ts`, `src/integrations/textilesoft/sqlPosWriter.ts`, `src/integrations/textilesoft/sqlReturnsAudit.ts`, `src/integrations/textilesoft/sqlSales.ts`, `src/integrations/textilesoft/sqlSalesReports.ts`, `src/integrations/textilesoft/sqlSalesReturn.ts`, `src/scripts/financeCheck.ts`, `src/scripts/gstCheck.ts`, `src/scripts/textilesoftFieldUsage.ts`, `src/scripts/textilesoftPreview.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `No` | int | no | yes | — |
| `billno` | int | yes | no | — |
| `cus_card` | varchar(5000) | yes | no | — |
| `cus_name` | varchar(5000) | yes | no | — |
| `city` | varchar(5000) | yes | no | — |
| `mbl_no` | varchar(5000) | yes | no | — |
| `cus_cat` | varchar(5000) | yes | no | — |
| `points` | varchar(5000) | yes | no | — |
| `bill_disc` | varchar(5000) | yes | no | — |
| `bill_disc1` | varchar(5000) | yes | no | — |
| `bill_less` | varchar(5000) | yes | no | — |
| `bill_less1` | varchar(5000) | yes | no | — |
| `roundoff` | varchar(5000) | yes | no | — |
| `five_per` | varchar(5000) | yes | no | — |
| `twl_per` | varchar(5000) | yes | no | — |
| `eten_per` | varchar(5000) | yes | no | — |
| `twtyet_per` | varchar(5000) | yes | no | — |
| `bankname` | varchar(5000) | yes | no | — |
| `tot_qty` | varchar(5000) | yes | no | — |
| `tot_netamnt` | varchar(5000) | yes | no | — |
| `igstper` | varchar(5000) | yes | no | — |
| `countername` | varchar(5000) | yes | no | — |
| `notdislesamt` | varchar(5000) | yes | no | — |
| `totpdisamt` | varchar(5000) | yes | no | — |
| `cus_add` | varchar(5000) | yes | no | — |
| `five_per1` | varchar(5000) | yes | no | — |
| `twl_per1` | varchar(5000) | yes | no | — |
| `eten_per1` | varchar(5000) | yes | no | — |
| `twtyet_per1` | varchar(5000) | yes | no | — |
| `paymenttype` | varchar(5000) | yes | no | — |
| `billamt` | varchar(5000) | yes | no | — |
| `recivedamt` | varchar(5000) | yes | no | — |
| `balanceamt` | varchar(5000) | yes | no | — |
| `mode` | varchar(5000) | yes | no | — |
| `date` | date | yes | no | — |
| `cmnywisebillnomode` | int | yes | no | — |
| `sysidandbill` | varchar(5000) | yes | no | — |
| `gst5` | varchar(5000) | yes | no | — |
| `gst12` | varchar(5000) | yes | no | — |
| `gst18` | varchar(5000) | yes | no | — |
| `gst28` | varchar(5000) | yes | no | — |
| `tmtr` | varchar(5000) | yes | no | — |
| `totnetsub` | varchar(5000) | yes | no | — |
| `pdisamtot` | varchar(5000) | yes | no | — |
| `exchange` | int | yes | no | — |
| `bill_status` | varchar(5000) | yes | no | — |
| `amunt_status` | varchar(5000) | yes | no | — |
| `systemname` | varchar(5000) | yes | no | — |
| `crs_amount` | varchar(1000) | yes | no | — |
| `status` | varchar(1000) | yes | no | — |
| `cancel_bilno` | varchar(1000) | yes | no | — |
| `date1` | date | yes | no | — |
| `upnet` | varchar(1000) | yes | no | — |
| `upsat` | varchar(1000) | yes | no | — |
| `bilcles_per` | varchar(1000) | yes | no | — |
| `billcls_amt` | varchar(1000) | yes | no | — |
| `retstat` | varchar(1000) | yes | no | — |
| `tot_pdis` | varchar(100) | yes | no | — |
| `datetime` | datetime | yes | no | — |
| `SBillStatus` | varchar(1000) | yes | no | — |
| `UserID` | varchar(1000) | yes | no | — |
| `Lmode` | varchar(50) | yes | no | — |
| `editbillno` | int | yes | no | — |
| `BarcodeWiseProfit` | varchar(1000) | yes | no | — |
| `s_recevied_cashamt` | varchar(100) | yes | no | — |
| `s_card_amt` | varchar(100) | yes | no | — |
| `s_credit_amt` | varchar(100) | yes | no | — |
| `s_googlepay` | varchar(100) | yes | no | — |
| `s_selfamt` | varchar(100) | yes | no | — |
| `s_card_bankname` | varchar(100) | yes | no | — |
| `s_googlepay_bankname` | varchar(100) | yes | no | — |
| `s_selfremarks` | varchar(100) | yes | no | — |
| `s_balance_amt` | varchar(100) | yes | no | — |
| `WholeSaleStatus` | varchar(100) | yes | no | — |
| `IMEI1` | varchar(100) | yes | no | — |
| `IMEI2` | varchar(100) | yes | no | — |
| `IMEI3` | varchar(100) | yes | no | — |
| `MobileSerialNo` | varchar(100) | yes | no | — |
| `s_advance_amt` | varchar(100) | yes | no | — |
| `s_credit_current_balance` | varchar(100) | yes | no | — |
| `credit_billstatus` | varchar(100) | yes | no | — |
| `s_credit_preview_balance` | varchar(100) | yes | no | — |
| `credit_cmy` | varchar(50) | yes | no | — |
| `credit_transfer` | varchar(100) | yes | no | — |
| `credit_cmy_status` | varchar(50) | yes | no | — |
| `credit` | varchar(50) | yes | no | — |
| `credit_status` | varchar(50) | yes | no | — |
| `CustomerMan` | varchar(200) | yes | no | — |
| `Custpointamt` | varchar(100) | yes | no | — |
| `cashbill_status` | varchar(50) | yes | no | — |
| `CM_Amt` | varchar(100) | yes | no | — |
| `QRImage` | varchar(200) | yes | no | — |
| `BillQrImage` | varchar(200) | yes | no | — |
| `Token_Dis_Gift_Amount` | varchar(200) | yes | no | — |
| `GiftTokenQrImage` | varchar(200) | yes | no | — |
| `Gift_Amount_wiseToken` | varchar(200) | yes | no | — |
| `GiftValueFromDate` | date | yes | no | — |
| `GiftValueToDate` | varchar(200) | yes | no | — |
| `GiftNoCopy` | varchar(200) | yes | no | — |
| `ProductToAmount` | varchar(200) | yes | no | — |
| `Single_Token_Amount` | varchar(200) | yes | no | — |
| `Type` | varchar(200) | yes | no | — |
| `Tot_pdisAmount` | varchar(200) | yes | no | — |
| `Tot_SchemaDisAmount` | varchar(200) | yes | no | — |
| `Tot_DisGrossAmt` | varchar(200) | yes | no | — |
| `Tot_SchemaDisGrossAmt` | varchar(200) | yes | no | — |

### `dbo.sales2return`

- Approximate rows: 0
- Key evidence: PK PK_sales2Return(No)
- Other unique indexes: none recorded
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: countername
- Observed runtime owner(s): `src/integrations/textilesoft/sqlSalesReturn.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `No` | int | no | yes | — |
| `billno` | int | yes | no | — |
| `cus_card` | varchar(5000) | yes | no | — |
| `cus_name` | varchar(5000) | yes | no | — |
| `city` | varchar(5000) | yes | no | — |
| `mbl_no` | varchar(5000) | yes | no | — |
| `cus_cat` | varchar(5000) | yes | no | — |
| `points` | varchar(5000) | yes | no | — |
| `bill_disc` | varchar(5000) | yes | no | — |
| `bill_disc1` | varchar(5000) | yes | no | — |
| `bill_less` | varchar(5000) | yes | no | — |
| `bill_less1` | varchar(5000) | yes | no | — |
| `roundoff` | varchar(5000) | yes | no | — |
| `five_per` | varchar(5000) | yes | no | — |
| `twl_per` | varchar(5000) | yes | no | — |
| `eten_per` | varchar(5000) | yes | no | — |
| `twtyet_per` | varchar(5000) | yes | no | — |
| `bankname` | varchar(5000) | yes | no | — |
| `tot_qty` | varchar(5000) | yes | no | — |
| `tot_netamnt` | varchar(5000) | yes | no | — |
| `igstper` | varchar(5000) | yes | no | — |
| `countername` | varchar(5000) | yes | no | — |
| `notdislesamt` | varchar(5000) | yes | no | — |
| `totpdisamt` | varchar(5000) | yes | no | — |
| `cus_add` | varchar(5000) | yes | no | — |
| `five_per1` | varchar(5000) | yes | no | — |
| `twl_per1` | varchar(5000) | yes | no | — |
| `eten_per1` | varchar(5000) | yes | no | — |
| `twtyet_per1` | varchar(5000) | yes | no | — |
| `paymenttype` | varchar(5000) | yes | no | — |
| `billamt` | varchar(5000) | yes | no | — |
| `recivedamt` | varchar(5000) | yes | no | — |
| `balanceamt` | varchar(5000) | yes | no | — |
| `mode` | varchar(5000) | yes | no | — |
| `date` | date | yes | no | — |
| `cmnywisebillnomode` | int | yes | no | — |
| `sysidandbill` | varchar(5000) | yes | no | — |
| `gst5` | varchar(5000) | yes | no | — |
| `gst12` | varchar(5000) | yes | no | — |
| `gst18` | varchar(5000) | yes | no | — |
| `gst28` | varchar(5000) | yes | no | — |
| `tmtr` | varchar(5000) | yes | no | — |
| `totnetsub` | varchar(5000) | yes | no | — |
| `pdisamtot` | varchar(5000) | yes | no | — |
| `exchange` | int | yes | no | — |
| `bill_status` | varchar(5000) | yes | no | — |
| `amunt_status` | varchar(5000) | yes | no | — |
| `systemname` | varchar(5000) | yes | no | — |
| `crs_amount` | varchar(1000) | yes | no | — |
| `status` | varchar(1000) | yes | no | — |
| `cancel_bilno` | varchar(1000) | yes | no | — |
| `date1` | date | yes | no | — |
| `upnet` | varchar(1000) | yes | no | — |
| `upsat` | varchar(1000) | yes | no | — |
| `bilcles_per` | varchar(1000) | yes | no | — |
| `billcls_amt` | varchar(1000) | yes | no | — |
| `retstat` | varchar(1000) | yes | no | — |
| `tot_pdis` | varchar(100) | yes | no | — |
| `datetime` | datetime | yes | no | — |
| `SBillStatus` | varchar(1000) | yes | no | — |
| `UserID` | varchar(1000) | yes | no | — |
| `Lmode` | varchar(50) | yes | no | — |
| `editbillno` | int | yes | no | — |
| `BarcodeWiseProfit` | varchar(1000) | yes | no | — |
| `s_recevied_cashamt` | varchar(100) | yes | no | — |
| `s_card_amt` | varchar(100) | yes | no | — |
| `s_credit_amt` | varchar(100) | yes | no | — |
| `s_googlepay` | varchar(100) | yes | no | — |
| `s_selfamt` | varchar(100) | yes | no | — |
| `s_card_bankname` | varchar(100) | yes | no | — |
| `s_googlepay_bankname` | varchar(100) | yes | no | — |
| `Type` | varchar(200) | yes | no | — |
| `s_selfremarks` | varchar(100) | yes | no | — |
| `s_balance_amt` | varchar(100) | yes | no | — |
| `WholeSaleStatus` | varchar(100) | yes | no | — |
| `IMEI1` | varchar(100) | yes | no | — |
| `IMEI2` | varchar(100) | yes | no | — |
| `IMEI3` | varchar(100) | yes | no | — |
| `MobileSerialNo` | varchar(100) | yes | no | — |
| `s_advance_amt` | varchar(100) | yes | no | — |
| `s_credit_current_balance` | varchar(100) | yes | no | — |
| `credit_billstatus` | varchar(100) | yes | no | — |
| `s_credit_preview_balance` | varchar(100) | yes | no | — |
| `credit_cmy` | varchar(50) | yes | no | — |
| `credit_transfer` | varchar(100) | yes | no | — |
| `credit_cmy_status` | varchar(50) | yes | no | — |
| `credit` | varchar(50) | yes | no | — |
| `credit_status` | varchar(50) | yes | no | — |
| `CustomerMan` | varchar(200) | yes | no | — |
| `Custpointamt` | varchar(100) | yes | no | — |
| `cashbill_status` | varchar(50) | yes | no | — |
| `CM_Amt` | varchar(100) | yes | no | — |
| `QRImage` | varchar(200) | yes | no | — |
| `BillQrImage` | varchar(200) | yes | no | — |
| `Token_Dis_Gift_Amount` | varchar(100) | yes | no | — |
| `GiftTokenQrImage` | varchar(200) | yes | no | — |
| `Gift_Amount_wiseToken` | varchar(200) | yes | no | — |
| `GiftValueFromDate` | date | yes | no | — |
| `GiftValueToDate` | varchar(200) | yes | no | — |
| `GiftNoCopy` | varchar(200) | yes | no | — |
| `ProductToAmount` | varchar(200) | yes | no | — |
| `Single_Token_Amount` | varchar(200) | yes | no | — |
| `returnStatus` | varchar(100) | yes | no | — |

### `dbo.salsntry`

- Approximate rows: 906137
- Key evidence: PK PK_salsntry(No)
- Other unique indexes: none recorded
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: company_name, counter_ID, counter_Billno, counter_mode, company_billno, company_billmode, company_code
- Observed runtime owner(s): `src/integrations/textilesoft/sqlFinance.ts`, `src/integrations/textilesoft/sqlGstReports.ts`, `src/integrations/textilesoft/sqlPartyReports.ts`, `src/integrations/textilesoft/sqlPosWriter.ts`, `src/integrations/textilesoft/sqlPurchase.ts`, `src/integrations/textilesoft/sqlPurchaseReturn.ts`, `src/integrations/textilesoft/sqlReturnsAudit.ts`, `src/integrations/textilesoft/sqlSales.ts`, `src/integrations/textilesoft/sqlSalesReports.ts`, `src/integrations/textilesoft/sqlSalesReturn.ts`, `src/integrations/textilesoft/sqlShopClock.ts`, `src/integrations/textilesoft/sqlStockReports.ts`, `src/scripts/gstCheck.ts`, `src/scripts/textilesoftAnalyzeStock.ts`, `src/scripts/textilesoftOverlap.ts`, `src/scripts/textilesoftPreview.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `No` | int | no | yes | — |
| `srl_no` | varchar(1000) | yes | no | — |
| `sls_man` | varchar(1000) | yes | no | — |
| `barcode` | varchar(1000) | yes | no | — |
| `p_name` | varchar(1000) | yes | no | — |
| `rate` | varchar(1000) | yes | no | — |
| `mtr` | varchar(1000) | yes | no | — |
| `qty` | varchar(1000) | yes | no | — |
| `amount` | varchar(1000) | yes | no | — |
| `pdis` | varchar(1000) | yes | no | — |
| `pdis_amount` | varchar(1000) | yes | no | — |
| `cr_amount` | varchar(1000) | yes | no | — |
| `less` | varchar(1000) | yes | no | — |
| `net_amount` | varchar(1000) | yes | no | — |
| `cstr_amnt` | varchar(1000) | yes | no | — |
| `pre_bill_amnt` | varchar(1000) | yes | no | — |
| `pre_qty` | varchar(1000) | yes | no | — |
| `tax` | varchar(1000) | yes | no | — |
| `cgst` | varchar(1000) | yes | no | — |
| `sgst` | varchar(1000) | yes | no | — |
| `dic` | varchar(1000) | yes | no | — |
| `net_amnt` | varchar(1000) | yes | no | — |
| `tmtr` | varchar(1000) | yes | no | — |
| `tamt` | varchar(1000) | yes | no | — |
| `tdsamt` | varchar(1000) | yes | no | — |
| `dis` | varchar(1000) | yes | no | — |
| `t_nat_amnt` | varchar(1000) | yes | no | — |
| `t_qty` | varchar(1000) | yes | no | — |
| `billno` | int | yes | no | — |
| `design` | varchar(1000) | yes | no | — |
| `hsncode` | varchar(5000) | yes | no | — |
| `mrp` | varchar(5000) | yes | no | — |
| `mode` | varchar(5000) | yes | no | — |
| `date` | date | yes | no | — |
| `cmnywisebillnomode` | int | yes | no | — |
| `cmnyname` | varchar(5000) | yes | no | — |
| `cmny_bill` | varchar(1000) | yes | no | — |
| `systemidbill` | varchar(5000) | yes | no | — |
| `status` | varchar(5000) | yes | no | — |
| `hdnmtr` | varchar(5000) | yes | no | — |
| `hdnunit` | varchar(5000) | yes | no | — |
| `hdnpgrm` | varchar(5000) | yes | no | — |
| `hdngst` | varchar(5000) | yes | no | — |
| `amt` | varchar(5000) | yes | no | — |
| `bil_cl_qty` | varchar(5000) | yes | no | — |
| `company_name` | varchar(5000) | yes | no | — |
| `edit_status` | varchar(5000) | yes | no | — |
| `daily_cmy_bill` | varchar(5000) | yes | no | — |
| `upmrp` | varchar(5000) | yes | no | — |
| `upnet` | varchar(5000) | yes | no | — |
| `upsta` | varchar(5000) | yes | no | — |
| `cr_per` | varchar(5000) | yes | no | — |
| `cr_amt` | varchar(5000) | yes | no | — |
| `systemname` | varchar(5000) | yes | no | — |
| `datetime` | datetime | yes | no | — |
| `degin` | varchar(5000) | yes | no | — |
| `patt` | varchar(5000) | yes | no | — |
| `size` | varchar(5000) | yes | no | — |
| `Change1` | varchar(1000) | yes | no | — |
| `Change2` | varchar(1000) | yes | no | — |
| `Change3` | varchar(1000) | yes | no | — |
| `Change4` | varchar(1000) | yes | no | — |
| `Change5` | varchar(1000) | yes | no | — |
| `OfferQty` | varchar(1000) | yes | no | — |
| `PrintNameEng` | varchar(1000) | yes | no | — |
| `PrintNameTam` | nvarchar(2000) | yes | no | — |
| `ProductTamil` | nvarchar(2000) | yes | no | — |
| `BillStatus` | varchar(1000) | yes | no | — |
| `UserID` | varchar(1000) | yes | no | — |
| `costatus` | varchar(100) | yes | no | — |
| `GSTPer` | varchar(200) | yes | no | — |
| `comboname` | varchar(200) | yes | no | — |
| `combostatus` | varchar(200) | yes | no | — |
| `combobarcode` | varchar(200) | yes | no | — |
| `costatus1` | varchar(200) | yes | no | — |
| `brand` | varchar(100) | yes | no | — |
| `color` | varchar(100) | yes | no | — |
| `style` | varchar(100) | yes | no | — |
| `Lmode` | varchar(50) | yes | no | — |
| `rackno` | varchar(50) | yes | no | — |
| `editbillno` | int | yes | no | — |
| `ProGroupBillNo` | varchar(150) | yes | no | — |
| `ProGroupName` | varchar(150) | yes | no | — |
| `credit_cardno` | varchar(50) | yes | no | — |
| `credit` | varchar(50) | yes | no | — |
| `credit_status` | varchar(50) | yes | no | — |
| `creditper` | varchar(50) | yes | no | — |
| `credit_cmy` | varchar(50) | yes | no | — |
| `credit_catagary` | varchar(50) | yes | no | — |
| `credit_totalamt` | varchar(100) | yes | no | — |
| `credit_transfer` | varchar(100) | yes | no | — |
| `credit_cmy_status` | varchar(50) | yes | no | — |
| `freeproduct` | varchar(50) | yes | no | — |
| `SystemDate` | date | yes | no | — |
| `LLDate` | date | yes | no | — |
| `CustomerMan` | varchar(200) | yes | no | — |
| `gstcrossamt` | varchar(200) | yes | no | — |
| `PHSN_CODE` | varchar(50) | yes | no | — |
| `counter_ID` | int | yes | no | — |
| `counter_Billno` | int | yes | no | — |
| `count_IDBillno` | int | yes | no | — |
| `counter_mode` | varchar(50) | yes | no | — |
| `company_billno` | int | yes | no | — |
| `company_billmode` | varchar(50) | yes | no | — |
| `company_code` | int | yes | no | — |
| `comp_continu_billno` | int | yes | no | — |
| `cmy_wo_billno` | varchar(100) | yes | no | — |
| `cmy_wo_continu_billno` | int | yes | no | — |
| `cmy_wo_cont_idbillno` | int | yes | no | — |
| `WRS_Catagary` | varchar(50) | yes | no | — |
| `PrintType` | varchar(100) | yes | no | — |
| `billoption_cmy` | varchar(100) | yes | no | — |
| `EMINAME` | varchar(100) | yes | no | — |
| `EMIAMOUNT` | varchar(100) | yes | no | — |
| `EMIOPTION` | varchar(100) | yes | no | — |
| `c_Mrp` | varchar(100) | yes | no | — |
| `c_Amt` | varchar(100) | yes | no | — |
| `corate1` | varchar(100) | yes | no | — |
| `corate2` | varchar(100) | yes | no | — |
| `corate3` | varchar(100) | yes | no | — |
| `corate4` | varchar(100) | yes | no | — |
| `corate` | varchar(100) | yes | no | — |
| `cqty` | varchar(100) | yes | no | — |
| `offer_Qty` | varchar(100) | yes | no | — |
| `Token_Dis_Amount` | varchar(200) | yes | no | — |
| `Sub_Mrp` | varchar(100) | yes | no | — |
| `gst_group` | varchar(100) | yes | no | — |
| `Print_Sales` | varchar(200) | yes | no | — |
| `SchemaDiscount` | varchar(200) | yes | no | — |
| `SchemaDisAmount` | varchar(200) | yes | no | — |
| `SchemaDisGrossAmt` | varchar(200) | yes | no | — |
| `disgrossamt` | varchar(200) | yes | no | — |
| `nrate` | varchar(200) | yes | no | — |
| `TotalQty` | varchar(200) | yes | no | — |
| `Sub_group_name` | varchar(200) | yes | no | — |
| `prate` | varchar(200) | yes | no | — |

### `dbo.specialcondion`

- Approximate rows: 11
- Key evidence: No PK/unique index recorded
- Other unique indexes: none recorded
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: CounterName, StoreReceivedGRN
- Observed runtime owner(s): `src/integrations/textilesoft/sqlBillingLimits.ts`, `src/integrations/textilesoft/sqlUserAdmin.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `user_id` | varchar(1000) | yes | no | — |
| `last_bill` | varchar(1000) | yes | no | — |
| `dup_bill` | varchar(1000) | yes | no | — |
| `bill_cancel` | varchar(1000) | yes | no | — |
| `bill_discount` | varchar(1000) | yes | no | — |
| `bill_less` | varchar(1000) | yes | no | — |
| `dis_per` | varchar(1000) | yes | no | — |
| `less_rang` | varchar(1000) | yes | no | — |
| `save_alertbox` | varchar(1000) | yes | no | — |
| `spcl_save` | varchar(1000) | yes | no | — |
| `pdis` | varchar(5000) | yes | no | — |
| `pdis_per` | varchar(5000) | yes | no | — |
| `CounterName` | varchar(1000) | yes | no | — |
| `Re_update` | varchar(50) | yes | no | — |
| `StockUpdateVisible` | varchar(50) | yes | no | — |
| `StockMoveVisible` | varchar(50) | yes | no | — |
| `StoreReceivedGRN` | varchar(50) | yes | no | — |
| `BillShortcutKey` | varchar(50) | yes | no | — |
| `WholeSaleRate` | varchar(100) | yes | no | — |
| `SalesEditSaveOnly` | varchar(200) | yes | no | — |
| `accdate_report` | varchar(50) | yes | no | — |
| `ProductLess` | varchar(200) | yes | no | — |
| `ProdLessAmt` | varchar(200) | yes | no | — |
| `cashDisPer` | varchar(200) | yes | no | — |

### `dbo.status1`

- Approximate rows: 2
- Key evidence: No PK/unique index recorded
- Other unique indexes: none recorded
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: none by column name
- Observed runtime owner(s): `src/integrations/textilesoft/sqlOrg.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `cmy_code` | varchar(1000) | yes | no | — |
| `cmy_name` | varchar(1000) | yes | no | — |
| `cmy_status` | varchar(1) | yes | no | — |
| `ID` | int | no | yes | — |

### `dbo.stockdetails`

- Approximate rows: 80997
- Key evidence: No PK/unique index recorded
- Other unique indexes: none recorded
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: none by column name
- Observed runtime owner(s): `src/integrations/textilesoft/sqlFinance.ts`, `src/integrations/textilesoft/sqlPartyReports.ts`, `src/integrations/textilesoft/sqlPurchase.ts`, `src/integrations/textilesoft/sqlSalesReports.ts`, `src/scripts/textilesoftAnalyze.ts`, `src/scripts/textilesoftAnalyzeStock.ts`, `src/scripts/textilesoftFieldUsage.ts`, `src/scripts/textilesoftOverlap.ts`, `src/scripts/textilesoftPreview.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `grn_no` | varchar(1000) | yes | no | — |
| `sl_no` | varchar(1000) | yes | no | — |
| `barcode` | varchar(1000) | yes | no | — |
| `design` | varchar(1000) | yes | no | — |
| `code` | varchar(1000) | yes | no | — |
| `pname` | varchar(1000) | yes | no | — |
| `prate` | varchar(1000) | yes | no | — |
| `mtr` | varchar(1000) | yes | no | — |
| `qty` | varchar(1000) | yes | no | — |
| `amount` | varchar(1000) | yes | no | — |
| `dis_per` | varchar(1000) | yes | no | — |
| `dis_amount` | varchar(1000) | yes | no | — |
| `gst_per` | varchar(1000) | yes | no | — |
| `gst_amount` | varchar(1000) | yes | no | — |
| `nrate` | varchar(1000) | yes | no | — |
| `net_amount` | varchar(1000) | yes | no | — |
| `sr_per` | varchar(1000) | yes | no | — |
| `mrp` | varchar(1000) | yes | no | — |
| `sr_rate` | varchar(1000) | yes | no | — |
| `cr_per` | varchar(1000) | yes | no | — |
| `cr_rate` | varchar(1000) | yes | no | — |
| `brand` | varchar(1000) | yes | no | — |
| `patrn` | varchar(1000) | yes | no | — |
| `size` | varchar(1000) | yes | no | — |
| `color` | varchar(1000) | yes | no | — |
| `style` | varchar(1000) | yes | no | — |
| `image` | varchar(1000) | yes | no | — |
| `fqty` | varchar(1000) | yes | no | — |
| `fname` | varchar(1000) | yes | no | — |
| `disgroamt` | varchar(1000) | yes | no | — |
| `gstgrosamt` | varchar(1000) | yes | no | — |
| `salesexrate` | varchar(1000) | yes | no | — |
| `salesinrate` | varchar(1000) | yes | no | — |
| `crsalesexrate` | varchar(1000) | yes | no | — |
| `crsalesinrate` | varchar(1000) | yes | no | — |
| `sales_qty` | varchar(1000) | yes | no | — |
| `sreturn_qty` | varchar(1000) | yes | no | — |
| `preturn_qty` | varchar(1000) | yes | no | — |
| `stock_aj` | varchar(1000) | yes | no | — |
| `tot_qty` | varchar(1000) | yes | no | — |
| `pc_name` | varchar(1000) | yes | no | — |
| `date` | varchar(1000) | yes | no | — |
| `old_mrp` | varchar(1000) | yes | no | — |
| `old_sr_mrp` | varchar(1000) | yes | no | — |
| `old_cr_per` | varchar(1000) | yes | no | — |
| `old_crr` | varchar(1000) | yes | no | — |
| `old_qty` | varchar(1000) | yes | no | — |
| `pless` | varchar(1000) | yes | no | — |
| `plamt` | varchar(1000) | yes | no | — |
| `mrpdisper` | varchar(1000) | yes | no | — |
| `mrpdisamt` | varchar(1000) | yes | no | — |
| `TotalMeter` | varchar(100) | yes | no | — |
| `cmpamt` | varchar(1000) | yes | no | — |
| `smpper` | varchar(1000) | yes | no | — |
| `cqty` | varchar(1000) | yes | no | — |
| `cqtysets` | varchar(1000) | yes | no | — |
| `corate` | varchar(1000) | yes | no | — |
| `costatus` | varchar(1000) | yes | no | — |
| `hsncode` | varchar(1000) | yes | no | — |
| `rackno` | varchar(1000) | yes | no | — |
| `model` | varchar(1000) | yes | no | — |
| `fashion` | varchar(1000) | yes | no | — |
| `wsper` | varchar(100) | yes | no | — |
| `wsamt` | varchar(100) | yes | no | — |
| `warranty` | varchar(200) | yes | no | — |
| `silver` | varchar(100) | yes | no | — |
| `gold` | varchar(100) | yes | no | — |
| `diamond` | varchar(100) | yes | no | — |
| `IMEI_1` | varchar(100) | yes | no | — |
| `IMEI_2` | varchar(100) | yes | no | — |
| `WRpratecode` | varchar(100) | yes | no | — |

### `dbo.superbill1`

- Approximate rows: 889
- Key evidence: No PK/unique index recorded
- Other unique indexes: none recorded
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: company_name, counter_ID, counter_Billno, counter_mode, company_billno, company_billmode, company_code
- Observed runtime owner(s): `src/scripts/textilesoftFieldUsage.ts`, `src/scripts/textilesoftOverlap.ts`, `src/scripts/textilesoftPreview.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `No` | int | no | yes | — |
| `srl_no` | varchar(1000) | yes | no | — |
| `sls_man` | varchar(1000) | yes | no | — |
| `barcode` | varchar(1000) | yes | no | — |
| `p_name` | varchar(1000) | yes | no | — |
| `rate` | varchar(1000) | yes | no | — |
| `mtr` | varchar(1000) | yes | no | — |
| `qty` | varchar(1000) | yes | no | — |
| `amount` | varchar(1000) | yes | no | — |
| `pdis` | varchar(1000) | yes | no | — |
| `pdis_amount` | varchar(1000) | yes | no | — |
| `cr_amount` | varchar(1000) | yes | no | — |
| `less` | varchar(1000) | yes | no | — |
| `net_amount` | varchar(1000) | yes | no | — |
| `cstr_amnt` | varchar(1000) | yes | no | — |
| `pre_bill_amnt` | varchar(1000) | yes | no | — |
| `pre_qty` | varchar(1000) | yes | no | — |
| `tax` | varchar(1000) | yes | no | — |
| `cgst` | varchar(1000) | yes | no | — |
| `sgst` | varchar(1000) | yes | no | — |
| `dic` | varchar(1000) | yes | no | — |
| `net_amnt` | varchar(1000) | yes | no | — |
| `tmtr` | varchar(1000) | yes | no | — |
| `tamt` | varchar(1000) | yes | no | — |
| `tdsamt` | varchar(1000) | yes | no | — |
| `dis` | varchar(1000) | yes | no | — |
| `t_nat_amnt` | varchar(1000) | yes | no | — |
| `t_qty` | varchar(1000) | yes | no | — |
| `billno` | int | yes | no | — |
| `design` | varchar(1000) | yes | no | — |
| `hsncode` | varchar(5000) | yes | no | — |
| `mrp` | varchar(5000) | yes | no | — |
| `mode` | varchar(5000) | yes | no | — |
| `date` | date | yes | no | — |
| `cmnywisebillnomode` | int | yes | no | — |
| `cmnyname` | varchar(5000) | yes | no | — |
| `cmny_bill` | varchar(1000) | yes | no | — |
| `systemidbill` | varchar(5000) | yes | no | — |
| `status` | varchar(5000) | yes | no | — |
| `hdnmtr` | varchar(5000) | yes | no | — |
| `hdnunit` | varchar(5000) | yes | no | — |
| `hdnpgrm` | varchar(5000) | yes | no | — |
| `hdngst` | varchar(5000) | yes | no | — |
| `amt` | varchar(5000) | yes | no | — |
| `bil_cl_qty` | varchar(5000) | yes | no | — |
| `company_name` | varchar(5000) | yes | no | — |
| `edit_status` | varchar(5000) | yes | no | — |
| `daily_cmy_bill` | varchar(5000) | yes | no | — |
| `upmrp` | varchar(5000) | yes | no | — |
| `upnet` | varchar(5000) | yes | no | — |
| `upsta` | varchar(5000) | yes | no | — |
| `cr_per` | varchar(5000) | yes | no | — |
| `cr_amt` | varchar(5000) | yes | no | — |
| `systemname` | varchar(5000) | yes | no | — |
| `datetime` | datetime | yes | no | — |
| `degin` | varchar(5000) | yes | no | — |
| `patt` | varchar(5000) | yes | no | — |
| `size` | varchar(5000) | yes | no | — |
| `Change1` | varchar(1000) | yes | no | — |
| `Change2` | varchar(1000) | yes | no | — |
| `Change3` | varchar(1000) | yes | no | — |
| `Change4` | varchar(1000) | yes | no | — |
| `Change5` | varchar(1000) | yes | no | — |
| `OfferQty` | varchar(1000) | yes | no | — |
| `PrintNameEng` | varchar(1000) | yes | no | — |
| `PrintNameTam` | varchar(1000) | yes | no | — |
| `ProductTamil` | varchar(1000) | yes | no | — |
| `BillStatus` | varchar(1000) | yes | no | — |
| `UserID` | varchar(1000) | yes | no | — |
| `costatus` | varchar(100) | yes | no | — |
| `GSTPer` | varchar(200) | yes | no | — |
| `comboname` | varchar(200) | yes | no | — |
| `combostatus` | varchar(200) | yes | no | — |
| `combobarcode` | varchar(200) | yes | no | — |
| `costatus1` | varchar(200) | yes | no | — |
| `brand` | varchar(100) | yes | no | — |
| `color` | varchar(100) | yes | no | — |
| `style` | varchar(100) | yes | no | — |
| `Lmode` | varchar(50) | yes | no | — |
| `rackno` | varchar(50) | yes | no | — |
| `editbillno` | int | yes | no | — |
| `ProGroupBillNo` | varchar(150) | yes | no | — |
| `ProGroupName` | varchar(150) | yes | no | — |
| `credit_cardno` | varchar(50) | yes | no | — |
| `credit` | varchar(50) | yes | no | — |
| `credit_status` | varchar(50) | yes | no | — |
| `creditper` | varchar(50) | yes | no | — |
| `credit_cmy` | varchar(50) | yes | no | — |
| `credit_catagary` | varchar(50) | yes | no | — |
| `credit_totalamt` | varchar(100) | yes | no | — |
| `credit_transfer` | varchar(100) | yes | no | — |
| `credit_cmy_status` | varchar(50) | yes | no | — |
| `freeproduct` | varchar(50) | yes | no | — |
| `SystemDate` | date | yes | no | — |
| `LLDate` | date | yes | no | — |
| `CustomerMan` | varchar(200) | yes | no | — |
| `gstcrossamt` | varchar(200) | yes | no | — |
| `PHSN_CODE` | varchar(50) | yes | no | — |
| `counter_ID` | int | yes | no | — |
| `counter_Billno` | int | yes | no | — |
| `count_IDBillno` | int | yes | no | — |
| `counter_mode` | varchar(50) | yes | no | — |
| `company_billno` | int | yes | no | — |
| `company_billmode` | varchar(50) | yes | no | — |
| `company_code` | int | yes | no | — |
| `comp_continu_billno` | int | yes | no | — |
| `cmy_wo_billno` | varchar(100) | yes | no | — |
| `cmy_wo_continu_billno` | int | yes | no | — |
| `cmy_wo_cont_idbillno` | int | yes | no | — |

### `dbo.superbill2`

- Approximate rows: 31530
- Key evidence: No PK/unique index recorded
- Other unique indexes: none recorded
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: countername
- Observed runtime owner(s): `src/scripts/textilesoftFieldUsage.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `No` | int | no | yes | — |
| `billno` | int | yes | no | — |
| `cus_card` | varchar(5000) | yes | no | — |
| `cus_name` | varchar(5000) | yes | no | — |
| `city` | varchar(5000) | yes | no | — |
| `mbl_no` | varchar(5000) | yes | no | — |
| `cus_cat` | varchar(5000) | yes | no | — |
| `points` | varchar(5000) | yes | no | — |
| `bill_disc` | varchar(5000) | yes | no | — |
| `bill_disc1` | varchar(5000) | yes | no | — |
| `bill_less` | varchar(5000) | yes | no | — |
| `bill_less1` | varchar(5000) | yes | no | — |
| `roundoff` | varchar(5000) | yes | no | — |
| `five_per` | varchar(5000) | yes | no | — |
| `twl_per` | varchar(5000) | yes | no | — |
| `eten_per` | varchar(5000) | yes | no | — |
| `twtyet_per` | varchar(5000) | yes | no | — |
| `bankname` | varchar(5000) | yes | no | — |
| `tot_qty` | varchar(5000) | yes | no | — |
| `tot_netamnt` | varchar(5000) | yes | no | — |
| `igstper` | varchar(5000) | yes | no | — |
| `countername` | varchar(5000) | yes | no | — |
| `notdislesamt` | varchar(5000) | yes | no | — |
| `totpdisamt` | varchar(5000) | yes | no | — |
| `cus_add` | varchar(5000) | yes | no | — |
| `five_per1` | varchar(5000) | yes | no | — |
| `twl_per1` | varchar(5000) | yes | no | — |
| `eten_per1` | varchar(5000) | yes | no | — |
| `twtyet_per1` | varchar(5000) | yes | no | — |
| `paymenttype` | varchar(5000) | yes | no | — |
| `billamt` | varchar(5000) | yes | no | — |
| `recivedamt` | varchar(5000) | yes | no | — |
| `balanceamt` | varchar(5000) | yes | no | — |
| `mode` | varchar(5000) | yes | no | — |
| `date` | date | yes | no | — |
| `cmnywisebillnomode` | int | yes | no | — |
| `sysidandbill` | varchar(5000) | yes | no | — |
| `gst5` | varchar(5000) | yes | no | — |
| `gst12` | varchar(5000) | yes | no | — |
| `gst18` | varchar(5000) | yes | no | — |
| `gst28` | varchar(5000) | yes | no | — |
| `tmtr` | varchar(5000) | yes | no | — |
| `totnetsub` | varchar(5000) | yes | no | — |
| `pdisamtot` | varchar(5000) | yes | no | — |
| `exchange` | int | yes | no | — |
| `bill_status` | varchar(5000) | yes | no | — |
| `amunt_status` | varchar(5000) | yes | no | — |
| `systemname` | varchar(5000) | yes | no | — |
| `crs_amount` | varchar(1000) | yes | no | — |
| `status` | varchar(1000) | yes | no | — |
| `cancel_bilno` | varchar(1000) | yes | no | — |
| `date1` | date | yes | no | — |
| `upnet` | varchar(1000) | yes | no | — |
| `upsat` | varchar(1000) | yes | no | — |
| `bilcles_per` | varchar(1000) | yes | no | — |
| `billcls_amt` | varchar(1000) | yes | no | — |
| `retstat` | varchar(1000) | yes | no | — |
| `tot_pdis` | varchar(100) | yes | no | — |
| `datetime` | datetime | yes | no | — |
| `SBillStatus` | varchar(1000) | yes | no | — |
| `UserID` | varchar(1000) | yes | no | — |
| `Lmode` | varchar(50) | yes | no | — |
| `editbillno` | int | yes | no | — |
| `BarcodeWiseProfit` | varchar(1000) | yes | no | — |
| `s_recevied_cashamt` | varchar(100) | yes | no | — |
| `s_card_amt` | varchar(100) | yes | no | — |
| `s_credit_amt` | varchar(100) | yes | no | — |
| `s_googlepay` | varchar(100) | yes | no | — |
| `s_selfamt` | varchar(100) | yes | no | — |
| `s_card_bankname` | varchar(100) | yes | no | — |
| `s_googlepay_bankname` | varchar(100) | yes | no | — |
| `s_selfremarks` | varchar(100) | yes | no | — |
| `s_balance_amt` | varchar(100) | yes | no | — |
| `WholeSaleStatus` | varchar(100) | yes | no | — |
| `IMEI1` | varchar(100) | yes | no | — |
| `IMEI2` | varchar(100) | yes | no | — |
| `IMEI3` | varchar(100) | yes | no | — |
| `MobileSerialNo` | varchar(100) | yes | no | — |
| `s_advance_amt` | varchar(100) | yes | no | — |
| `s_credit_current_balance` | varchar(100) | yes | no | — |
| `credit_billstatus` | varchar(100) | yes | no | — |
| `s_credit_preview_balance` | varchar(100) | yes | no | — |
| `credit_cmy` | varchar(50) | yes | no | — |
| `credit_transfer` | varchar(100) | yes | no | — |
| `credit_cmy_status` | varchar(50) | yes | no | — |
| `credit` | varchar(50) | yes | no | — |
| `credit_status` | varchar(50) | yes | no | — |
| `CustomerMan` | varchar(200) | yes | no | — |
| `Custpointamt` | varchar(100) | yes | no | — |

### `dbo.supplierdetail`

- Approximate rows: 114
- Key evidence: No PK/unique index recorded
- Other unique indexes: none recorded
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: branch_name, CompanyName
- Observed runtime owner(s): `src/integrations/textilesoft/sqlGstReports.ts`, `src/integrations/textilesoft/sqlPartyReports.ts`, `src/integrations/textilesoft/sqlPurchase.ts`, `src/integrations/textilesoft/sqlPurchaseOrder.ts`, `src/integrations/textilesoft/sqlSuppliers.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `code` | varchar(1000) | yes | no | — |
| `ledger` | varchar(1000) | yes | no | — |
| `opening_amount` | varchar(1000) | yes | no | — |
| `sup_name` | varchar(1000) | yes | no | — |
| `nike_name` | varchar(1000) | yes | no | — |
| `address` | varchar(1000) | yes | no | — |
| `city` | varchar(1000) | yes | no | — |
| `pincode` | varchar(1000) | yes | no | — |
| `phone_nu` | varchar(1000) | yes | no | — |
| `mb_nu` | varchar(1000) | yes | no | — |
| `e_id` | varchar(1000) | yes | no | — |
| `tin_number` | varchar(1000) | yes | no | — |
| `cst_number` | varchar(1000) | yes | no | — |
| `gst_number` | varchar(1000) | yes | no | — |
| `sales_tax` | varchar(1000) | yes | no | — |
| `service_tax` | varchar(1000) | yes | no | — |
| `credit_days` | varchar(1000) | yes | no | — |
| `bank_name` | varchar(1000) | yes | no | — |
| `acc_number` | varchar(1000) | yes | no | — |
| `branch_name` | varchar(1000) | yes | no | — |
| `ifsc_code` | varchar(1000) | yes | no | — |
| `pan_card_number` | varchar(1000) | yes | no | — |
| `aadhar_card` | varchar(1000) | yes | no | — |
| `agent_name` | varchar(1000) | yes | no | — |
| `agent_number` | varchar(1000) | yes | no | — |
| `factory_name` | varchar(1000) | yes | no | — |
| `f_address` | varchar(1000) | yes | no | — |
| `f_city` | varchar(1000) | yes | no | — |
| `f_pin_code` | varchar(1000) | yes | no | — |
| `f_mb_nu` | varchar(1000) | yes | no | — |
| `f_bank_name` | varchar(1000) | yes | no | — |
| `f_acc_name` | varchar(1000) | yes | no | — |
| `f_acc_number` | varchar(1000) | yes | no | — |
| `f_pan_card` | varchar(1000) | yes | no | — |
| `f_ifsc_code` | varchar(1000) | yes | no | — |
| `office_opening` | varchar(1000) | yes | no | — |
| `date` | varchar(1000) | yes | no | — |
| `ref_code` | varchar(1000) | yes | no | — |
| `Address2` | varchar(1000) | yes | no | — |
| `Address3` | varchar(1000) | yes | no | — |
| `CompanyName` | varchar(200) | yes | no | — |
| `gstType` | varchar(100) | yes | no | — |

### `dbo.warehousedetail`

- Approximate rows: 1
- Key evidence: No PK/unique index recorded
- Other unique indexes: none recorded
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: branch_name_eng, branch_name_tam
- Observed runtime owner(s): `src/integrations/textilesoft/sqlPurchase.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `ware_cd` | varchar(1000) | yes | no | — |
| `ware_name_eng` | varchar(1000) | yes | no | — |
| `ware_name_tam` | varchar(1000) | yes | no | — |
| `address_eng` | varchar(1000) | yes | no | — |
| `address_tam` | varchar(1000) | yes | no | — |
| `city_eng` | varchar(1000) | yes | no | — |
| `city_tam` | varchar(1000) | yes | no | — |
| `ph_nu` | varchar(1000) | yes | no | — |
| `mb_nu` | varchar(1000) | yes | no | — |
| `e_id` | varchar(1000) | yes | no | — |
| `tin_nu` | varchar(1000) | yes | no | — |
| `cst_nu` | varchar(1000) | yes | no | — |
| `gst_nu` | varchar(1000) | yes | no | — |
| `bank_name` | varchar(1000) | yes | no | — |
| `ac_nu` | varchar(1000) | yes | no | — |
| `branch_name_eng` | varchar(1000) | yes | no | — |
| `branch_name_tam` | varchar(1000) | yes | no | — |
| `ifsc_cd` | varchar(1000) | yes | no | — |
| `pan_cd` | varchar(1000) | yes | no | — |
| `date` | varchar(1000) | yes | no | — |
| `land_mark` | varchar(1000) | yes | no | — |

### `erp.category`

- Approximate rows: 0
- Key evidence: PK PK__category__3213E83FEF222034(id)
- Other unique indexes: UQ__category__72E12F1BAC94C30B(name)
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: none by column name
- Observed runtime owner(s): `src/integrations/textilesoft/erpCategory.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `id` | bigint | no | yes | — |
| `name` | nvarchar(400) | no | no | — |
| `description` | nvarchar(1000) | yes | no | — |
| `color` | nvarchar(40) | no | no | ('#6366f1') |
| `gst_rate` | decimal(5,2) | no | no | ((5)) |
| `default_unit` | nvarchar(40) | no | no | ('pcs') |
| `is_active` | bit | no | no | ((1)) |
| `created_at` | datetime2 | no | no | (sysutcdatetime()) |
| `updated_at` | datetime2 | no | no | (sysutcdatetime()) |

### `erp.commission_rule`

- Approximate rows: 0
- Key evidence: PK PK__commissi__3213E83F8D8E00E7(id)
- Other unique indexes: none recorded
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: none by column name
- Observed runtime owner(s): `src/integrations/textilesoft/erpCommissionRule.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `id` | bigint | no | yes | — |
| `name` | nvarchar(400) | no | no | — |
| `employee_id` | nvarchar(128) | yes | no | — |
| `scope` | nvarchar(40) | no | no | ('ALL') |
| `item_id` | nvarchar(128) | yes | no | — |
| `category` | nvarchar(400) | yes | no | — |
| `rate_type` | nvarchar(40) | no | no | ('PERCENT') |
| `rate_value` | decimal(18,2) | no | no | — |
| `status` | nvarchar(40) | no | no | ('active') |
| `created_at` | datetime2 | no | no | (sysutcdatetime()) |
| `updated_at` | datetime2 | no | no | (sysutcdatetime()) |

### `erp.debit_note`

- Approximate rows: 0
- Key evidence: PK PK__debit_no__3213E83F48E899C4(id)
- Other unique indexes: UQ__debit_no__CEDD0FA5B22FEE2A(note_id)
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: branch_id
- Observed runtime owner(s): `src/integrations/textilesoft/erpDebitNote.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `id` | bigint | no | yes | — |
| `note_id` | nvarchar(200) | no | no | — |
| `debit_note_number` | nvarchar(200) | yes | no | — |
| `source_id` | nvarchar(200) | yes | no | — |
| `note_date` | datetime2 | no | no | (sysutcdatetime()) |
| `vendor_id` | nvarchar(128) | no | no | — |
| `vendor_name` | nvarchar(400) | no | no | — |
| `po_reference` | nvarchar(200) | yes | no | — |
| `reason` | nvarchar(40) | no | no | — |
| `items` | nvarchar(MAX) | no | no | — |
| `total_amount` | decimal(18,2) | no | no | — |
| `status` | nvarchar(40) | no | no | ('PENDING') |
| `branch_id` | nvarchar(200) | no | no | ('Main') |
| `notes` | nvarchar(2000) | yes | no | — |
| `created_by` | nvarchar(128) | yes | no | — |
| `created_at` | datetime2 | no | no | (sysutcdatetime()) |
| `updated_at` | datetime2 | no | no | (sysutcdatetime()) |

### `erp.delivery_challan`

- Approximate rows: 0
- Key evidence: PK PK__delivery__3213E83F260E9099(id)
- Other unique indexes: UQ__delivery__5A1A90AF3EC6BEEE(challan_number)
- Foreign-key links: erp.delivery_challan [undefined] → erp.sales_order
- Tenant/branch/location candidate columns: none by column name
- Observed runtime owner(s): `src/integrations/textilesoft/erpDeliveryChallan.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `id` | bigint | no | yes | — |
| `challan_number` | nvarchar(200) | no | no | — |
| `customer_id` | nvarchar(128) | no | no | — |
| `challan_date` | datetime2 | no | no | (sysutcdatetime()) |
| `delivery_date` | datetime2 | yes | no | — |
| `items` | nvarchar(MAX) | no | no | — |
| `sales_order_id` | bigint | yes | no | — |
| `vehicle_no` | nvarchar(100) | yes | no | — |
| `driver_name` | nvarchar(400) | yes | no | — |
| `transport_mode` | nvarchar(40) | no | no | ('road') |
| `notes` | nvarchar(2000) | yes | no | — |
| `status` | nvarchar(40) | no | no | ('Draft') |
| `converted_to_invoice_id` | nvarchar(128) | yes | no | — |
| `converted_at` | datetime2 | yes | no | — |
| `system_generated` | bit | no | no | ((0)) |
| `is_deleted` | bit | no | no | ((0)) |
| `created_by` | nvarchar(128) | yes | no | — |
| `created_at` | datetime2 | no | no | (sysutcdatetime()) |
| `updated_at` | datetime2 | no | no | (sysutcdatetime()) |

### `erp.estimate`

- Approximate rows: 0
- Key evidence: PK PK__estimate__3213E83F031AAD8A(id)
- Other unique indexes: UQ__estimate__6797CEEDED2A541C(estimate_no)
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: none by column name
- Observed runtime owner(s): `src/integrations/textilesoft/erpEstimate.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `id` | bigint | no | yes | — |
| `estimate_no` | nvarchar(200) | no | no | — |
| `customer_id` | nvarchar(128) | yes | no | — |
| `items` | nvarchar(MAX) | no | no | — |
| `subtotal` | decimal(18,2) | no | no | ((0)) |
| `discount` | decimal(18,2) | no | no | ((0)) |
| `total_amount` | decimal(18,2) | no | no | ((0)) |
| `notes` | nvarchar(2000) | yes | no | — |
| `status` | nvarchar(40) | no | no | ('draft') |
| `valid_until` | datetime2 | yes | no | — |
| `created_at` | datetime2 | no | no | (sysutcdatetime()) |
| `updated_at` | datetime2 | no | no | (sysutcdatetime()) |

### `erp.expense_category`

- Approximate rows: 0
- Key evidence: PK PK__expense___3213E83F6B26ECC1(id)
- Other unique indexes: UQ_expense_category_name(name)
- Foreign-key links: erp.expense_category [undefined] → erp.master_entry
- Tenant/branch/location candidate columns: none by column name
- Observed runtime owner(s): `src/integrations/textilesoft/erpExpenseCategory.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `id` | bigint | no | yes | — |
| `name` | nvarchar(400) | no | no | — |
| `monthly_budget` | decimal(18,2) | no | no | ((0)) |
| `approval_required` | bit | no | no | ((0)) |
| `is_cash_allowed` | bit | no | no | ((1)) |
| `is_active` | bit | no | no | ((1)) |
| `gst_eligible` | bit | no | no | ((0)) |
| `group_id` | bigint | yes | no | — |
| `created_by` | nvarchar(128) | yes | no | — |
| `created_at` | datetime2 | no | no | (sysutcdatetime()) |
| `updated_at` | datetime2 | no | no | (sysutcdatetime()) |

### `erp.master_entry`

- Approximate rows: 4
- Key evidence: PK PK__master_e__3213E83FE4E5C321(id)
- Other unique indexes: UQ_master_entry_type_name(entry_type,name)
- Foreign-key links: erp.master_entry [undefined] → erp.master_entry; erp.expense_category [undefined] → erp.master_entry
- Tenant/branch/location candidate columns: none by column name
- Observed runtime owner(s): `src/integrations/textilesoft/erpMasterEntry.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `id` | bigint | no | yes | — |
| `entry_type` | nvarchar(100) | no | no | — |
| `name` | nvarchar(400) | no | no | — |
| `description` | nvarchar(1000) | yes | no | — |
| `parent_id` | bigint | yes | no | — |
| `meta` | nvarchar(MAX) | yes | no | — |
| `is_active` | bit | no | no | ((1)) |
| `created_by` | nvarchar(128) | yes | no | — |
| `created_at` | datetime2 | no | no | (sysutcdatetime()) |
| `updated_at` | datetime2 | no | no | (sysutcdatetime()) |

### `erp.payment_in`

- Approximate rows: 0
- Key evidence: PK PK__payment___3213E83F8F5B8CA2(id)
- Other unique indexes: UQ_payment_in_receipt(receipt_number,created_by)
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: none by column name
- Observed runtime owner(s): `src/integrations/textilesoft/erpPaymentIn.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `id` | bigint | no | yes | — |
| `receipt_number` | nvarchar(200) | no | no | — |
| `customer_id` | nvarchar(128) | no | no | — |
| `payment_date` | datetime2 | no | no | (sysutcdatetime()) |
| `total_amount` | decimal(18,2) | no | no | — |
| `payment_methods` | nvarchar(MAX) | no | no | — |
| `allocated_invoices` | nvarchar(MAX) | no | no | ('[]') |
| `credit_applied` | decimal(18,2) | no | no | ((0)) |
| `excess_amount` | decimal(18,2) | no | no | ((0)) |
| `deposit_account` | nvarchar(200) | yes | no | — |
| `notes` | nvarchar(2000) | yes | no | — |
| `created_by` | nvarchar(128) | yes | no | — |
| `created_at` | datetime2 | no | no | (sysutcdatetime()) |
| `updated_at` | datetime2 | no | no | (sysutcdatetime()) |

### `erp.payment_out`

- Approximate rows: 0
- Key evidence: PK PK__payment___3213E83FC207B682(id)
- Other unique indexes: UQ__payment___ED1FE10807E3406C(payment_no)
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: none by column name
- Observed runtime owner(s): `src/integrations/textilesoft/erpPaymentOut.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `id` | bigint | no | yes | — |
| `payment_no` | nvarchar(200) | no | no | — |
| `supplier_id` | nvarchar(128) | no | no | — |
| `supplier_name` | nvarchar(400) | yes | no | — |
| `payment_date` | datetime2 | no | no | (sysutcdatetime()) |
| `amount` | decimal(18,2) | no | no | — |
| `payment_mode` | nvarchar(40) | no | no | — |
| `reference_no` | nvarchar(200) | yes | no | — |
| `bank_account_id` | nvarchar(128) | yes | no | — |
| `bank_name` | nvarchar(400) | yes | no | — |
| `bank_account_number` | nvarchar(100) | yes | no | — |
| `cheque_date` | datetime2 | yes | no | — |
| `status` | nvarchar(40) | no | no | ('cleared') |
| `allocations` | nvarchar(MAX) | no | no | ('[]') |
| `unallocated_amount` | decimal(18,2) | no | no | ((0)) |
| `notes` | nvarchar(2000) | yes | no | — |
| `created_by` | nvarchar(128) | yes | no | — |
| `created_by_name` | nvarchar(400) | yes | no | — |
| `created_at` | datetime2 | no | no | (sysutcdatetime()) |
| `updated_at` | datetime2 | no | no | (sysutcdatetime()) |

### `erp.purchase_payment`

- Approximate rows: 0
- Key evidence: PK PK__purchase__3213E83F54385D1B(id)
- Other unique indexes: UQ__purchase__ED1FE108798D5517(payment_no)
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: none by column name
- Observed runtime owner(s): `src/integrations/textilesoft/erpPurchasePayment.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `id` | bigint | no | yes | — |
| `payment_no` | nvarchar(200) | no | no | — |
| `payment_date` | datetime2 | no | no | (sysutcdatetime()) |
| `supplier_id` | nvarchar(128) | no | no | — |
| `payment_method` | nvarchar(40) | no | no | ('cash') |
| `amount` | decimal(18,2) | no | no | — |
| `notes` | nvarchar(2000) | yes | no | — |
| `created_by` | nvarchar(128) | yes | no | — |
| `created_at` | datetime2 | no | no | (sysutcdatetime()) |
| `updated_at` | datetime2 | no | no | (sysutcdatetime()) |

### `erp.rate_revision`

- Approximate rows: 0
- Key evidence: PK PK__rate_rev__3213E83FAFF8E50D(id)
- Other unique indexes: none recorded
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: none by column name
- Observed runtime owner(s): `src/integrations/textilesoft/erpRateRevision.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `id` | bigint | no | yes | — |
| `item_id` | nvarchar(128) | no | no | — |
| `item_name` | nvarchar(400) | yes | no | — |
| `item_sku` | nvarchar(200) | yes | no | — |
| `supplier_id` | nvarchar(128) | no | no | — |
| `supplier_name` | nvarchar(400) | yes | no | — |
| `batch_number` | nvarchar(200) | no | no | — |
| `old_rate` | decimal(18,2) | no | no | — |
| `new_rate` | decimal(18,2) | no | no | — |
| `affected_qty` | decimal(18,3) | no | no | — |
| `diff_amount` | decimal(18,2) | no | no | — |
| `reason` | nvarchar(1000) | yes | no | — |
| `status` | nvarchar(40) | no | no | ('PENDING') |
| `created_by` | nvarchar(128) | yes | no | — |
| `created_by_name` | nvarchar(400) | yes | no | — |
| `approved_by` | nvarchar(128) | yes | no | — |
| `created_at` | datetime2 | no | no | (sysutcdatetime()) |
| `updated_at` | datetime2 | no | no | (sysutcdatetime()) |

### `erp.refresh_token`

- Approximate rows: 2
- Key evidence: PK PK__refresh___3213E83FF8731E1D(id)
- Other unique indexes: UQ__refresh___9F6BDB1375D1C712(token_hash)
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: none by column name
- Observed runtime owner(s): `src/integrations/textilesoft/erpRefreshToken.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `id` | bigint | no | yes | — |
| `user_id` | nvarchar(128) | no | no | — |
| `token_hash` | char(64) | no | no | — |
| `expires_at` | datetime2 | no | no | — |
| `revoked_at` | datetime2 | yes | no | — |
| `created_by_ip` | nvarchar(128) | yes | no | — |
| `user_agent` | nvarchar(800) | yes | no | — |
| `created_at` | datetime2 | no | no | (sysutcdatetime()) |

### `erp.sales_idempotency`

- Approximate rows: OBJECT NOT FOUND IN SNAPSHOT
- Key evidence: No PK/unique index recorded
- Other unique indexes: none recorded
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: none by column name
- Observed runtime owner(s): `src/integrations/textilesoft/sqlPosWriter.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|

### `erp.sales_order`

- Approximate rows: 0
- Key evidence: PK PK__sales_or__3213E83F3E515486(id)
- Other unique indexes: UQ__sales_or__730E34DFB4AF454A(order_number)
- Foreign-key links: erp.delivery_challan [undefined] → erp.sales_order
- Tenant/branch/location candidate columns: none by column name
- Observed runtime owner(s): `src/integrations/textilesoft/erpSalesOrder.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `id` | bigint | no | yes | — |
| `order_number` | nvarchar(200) | no | no | — |
| `customer_id` | nvarchar(128) | no | no | — |
| `order_date` | datetime2 | no | no | (sysutcdatetime()) |
| `expected_delivery_date` | datetime2 | yes | no | — |
| `items` | nvarchar(MAX) | no | no | — |
| `subtotal` | decimal(18,2) | no | no | ((0)) |
| `tax_total` | decimal(18,2) | no | no | ((0)) |
| `discount_total` | decimal(18,2) | no | no | ((0)) |
| `total_amount` | decimal(18,2) | no | no | ((0)) |
| `status` | nvarchar(60) | no | no | ('Draft') |
| `notes` | nvarchar(2000) | yes | no | — |
| `is_confirmed` | bit | no | no | ((0)) |
| `is_cancelled` | bit | no | no | ((0)) |
| `is_overdue` | bit | no | no | ((0)) |
| `prices_locked` | bit | no | no | ((0)) |
| `delivery_challan_ids` | nvarchar(MAX) | no | no | ('[]') |
| `invoice_ids` | nvarchar(MAX) | no | no | ('[]') |
| `created_by` | nvarchar(128) | yes | no | — |
| `confirmed_at` | datetime2 | yes | no | — |
| `confirmed_by` | nvarchar(128) | yes | no | — |
| `cancelled_at` | datetime2 | yes | no | — |
| `cancelled_by` | nvarchar(128) | yes | no | — |
| `created_at` | datetime2 | no | no | (sysutcdatetime()) |
| `updated_at` | datetime2 | no | no | (sysutcdatetime()) |

### `erp.sales_return_allocation`

- Approximate rows: OBJECT NOT FOUND IN SNAPSHOT
- Key evidence: No PK/unique index recorded
- Other unique indexes: none recorded
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: none by column name
- Observed runtime owner(s): `src/integrations/textilesoft/sqlPosWriter.ts`, `src/integrations/textilesoft/sqlReturnsAudit.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|

### `erp.schema_migrations`

- Approximate rows: 3
- Key evidence: PK PK__schema_m__79B5C94CB52CE6F4(version)
- Other unique indexes: none recorded
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: none by column name
- Observed runtime owner(s): `src/scripts/erpMigrate.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `version` | int | no | no | — |
| `name` | nvarchar(400) | no | no | — |
| `checksum` | char(64) | no | no | — |
| `applied_at` | datetime2 | no | no | (sysutcdatetime()) |

### `erp.shop_settings`

- Approximate rows: 0
- Key evidence: PK PK__shop_set__3213E83F45F84E5F(id)
- Other unique indexes: none recorded
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: none by column name
- Observed runtime owner(s): `src/integrations/textilesoft/erpShopSettings.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `id` | bigint | no | yes | — |
| `shop_enabled` | bit | no | no | ((0)) |
| `custom_domain` | nvarchar(400) | no | no | ('') |
| `theme` | nvarchar(100) | no | no | ('Basic') |
| `support_email` | nvarchar(400) | no | no | ('') |
| `plan` | nvarchar(40) | no | no | ('Starter') |
| `products_limit` | int | no | no | ((50)) |
| `api_access` | bit | no | no | ((0)) |
| `white_labeling` | bit | no | no | ((0)) |
| `created_at` | datetime2 | no | no | (sysutcdatetime()) |
| `updated_at` | datetime2 | no | no | (sysutcdatetime()) |

### `erp.supplier_group`

- Approximate rows: 0
- Key evidence: PK PK__supplier__3213E83F5DAE73EF(id)
- Other unique indexes: UQ__supplier__72E12F1B4BD6267B(name)
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: none by column name
- Observed runtime owner(s): `src/integrations/textilesoft/erpSupplierGroup.ts`, `src/integrations/textilesoft/sqlPartyReports.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `id` | bigint | no | yes | — |
| `name` | nvarchar(400) | no | no | — |
| `description` | nvarchar(1000) | yes | no | — |
| `color` | nvarchar(40) | no | no | ('#3b82f6') |
| `nature` | nvarchar(40) | no | no | ('Raw Material') |
| `region` | nvarchar(40) | no | no | ('Local') |
| `financial_category` | nvarchar(40) | no | no | ('Credit') |
| `priority` | nvarchar(20) | no | no | ('Medium') |
| `tax_type` | nvarchar(20) | no | no | ('GST') |
| `payment_terms` | int | no | no | ((30)) |
| `credit_limit` | decimal(18,2) | no | no | ((0)) |
| `discount_percent` | decimal(5,2) | no | no | ((0)) |
| `icon` | nvarchar(100) | no | no | ('truck') |
| `created_at` | datetime2 | no | no | (sysutcdatetime()) |
| `updated_at` | datetime2 | no | no | (sysutcdatetime()) |

### `erp.supplier_group_member`

- Approximate rows: OBJECT NOT FOUND IN SNAPSHOT
- Key evidence: No PK/unique index recorded
- Other unique indexes: none recorded
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: none by column name
- Observed runtime owner(s): `src/integrations/textilesoft/sqlPartyReports.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|

### `erp.supplier_reconciliation`

- Approximate rows: 0
- Key evidence: PK PK__supplier__3213E83F7B272663(id)
- Other unique indexes: UQ__supplier__85C600AE1B475293(transaction_id)
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: none by column name
- Observed runtime owner(s): `src/integrations/textilesoft/erpSupplierReconciliation.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `id` | bigint | no | yes | — |
| `supplier_id` | nvarchar(128) | no | no | — |
| `transaction_type` | nvarchar(40) | no | no | — |
| `transaction_id` | nvarchar(200) | no | no | — |
| `reconciled_at` | datetime2 | no | no | (sysutcdatetime()) |
| `status` | nvarchar(40) | no | no | ('RECONCILED') |
| `notes` | nvarchar(1000) | yes | no | — |
| `created_by` | nvarchar(128) | yes | no | — |
| `created_at` | datetime2 | no | no | (sysutcdatetime()) |
| `updated_at` | datetime2 | no | no | (sysutcdatetime()) |

### `erp.system_config`

- Approximate rows: 0
- Key evidence: PK PK__system_c__3213E83FEC903409(id)
- Other unique indexes: UQ__system_c__BDF6033D78E1ADAD(config_key)
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: none by column name
- Observed runtime owner(s): `src/integrations/textilesoft/erpSystemConfig.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `id` | bigint | no | yes | — |
| `config_key` | nvarchar(400) | no | no | — |
| `value` | nvarchar(MAX) | no | no | — |
| `description` | nvarchar(1000) | no | no | ('') |
| `config_group` | nvarchar(40) | no | no | ('GENERAL') |
| `updated_by` | nvarchar(128) | yes | no | — |
| `created_at` | datetime2 | no | no | (sysutcdatetime()) |
| `updated_at` | datetime2 | no | no | (sysutcdatetime()) |

### `erp.tax_master`

- Approximate rows: 0
- Key evidence: PK PK__tax_mast__3213E83FA3D2F1C7(id)
- Other unique indexes: UQ__tax_mast__13E39CF6D61BD0D8(tax_code)
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: none by column name
- Observed runtime owner(s): `src/integrations/textilesoft/erpTaxMaster.ts`, `src/modules/core/services/ConfigService.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `id` | bigint | no | yes | — |
| `tax_code` | nvarchar(100) | no | no | — |
| `tax_name` | nvarchar(400) | no | no | — |
| `percentage` | decimal(5,2) | no | no | — |
| `effective_date` | datetime2 | no | no | (sysutcdatetime()) |
| `end_date` | datetime2 | yes | no | — |
| `is_active` | bit | no | no | ((1)) |
| `gst_type_id` | bigint | yes | no | — |
| `gst_group_id` | bigint | yes | no | — |
| `created_at` | datetime2 | no | no | (sysutcdatetime()) |
| `updated_at` | datetime2 | no | no | (sysutcdatetime()) |

### `erp.transaction`

- Approximate rows: 0
- Key evidence: PK PK__transact__3213E83F32437251(id)
- Other unique indexes: none recorded
- Foreign-key links: none recorded
- Tenant/branch/location candidate columns: none by column name
- Observed runtime owner(s): `src/integrations/textilesoft/erpTransaction.ts`
- Semantic ownership and behavioral compatibility: verify from page/workflow analysis; not inferred from names.

| Column | SQL type | Nullable | Identity | Default |
|---|---|---:|---:|---|
| `id` | bigint | no | yes | — |
| `txn_type` | nvarchar(40) | no | no | — |
| `customer_id` | nvarchar(128) | yes | no | — |
| `invoice_id` | nvarchar(128) | yes | no | — |
| `invoice_no` | nvarchar(200) | yes | no | — |
| `invoice_total_amount` | decimal(18,2) | yes | no | — |
| `invoice_payment_status` | nvarchar(60) | yes | no | — |
| `return_id` | nvarchar(128) | yes | no | — |
| `due_adjustment_id` | nvarchar(128) | yes | no | — |
| `amount` | decimal(18,2) | no | no | — |
| `payment_method` | nvarchar(40) | no | no | ('cash') |
| `description` | nvarchar(1000) | yes | no | — |
| `created_at` | datetime2 | no | no | (sysutcdatetime()) |
| `updated_at` | datetime2 | no | no | (sysutcdatetime()) |

## Limits and follow-up

- The reference schema report contains table and column names only; this live snapshot adds keys, indexes, foreign keys, types, nullability, identity/default metadata, and approximate row counts.
- A null or absent primary/business key, weak uniqueness evidence, nullable key, or missing relationship must be validated against representative data before enabling writes.
- Empty tables are not evidence of a usable business workflow. Runtime routes and business semantics require page-by-page verification.
- No data rows were read, and no SQL write or DDL statement was run.
