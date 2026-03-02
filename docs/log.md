# Project Change Log

This file tracks all changes made to the project, organized by date and time (IST).

---

## 2026-02-15

### 21:10
- **Feature Add**: Employee Benefit Breakdown Table
  - **New UI Section**: Added a comprehensive table to the Allowance Management page showing a per-employee breakdown of all earnings/allowances.
  - **Dynamic Columns**: The table automatically adds columns for setiap defined Earning component.
  - **Calculated Values**: Shows real-time benefit amounts based on basic salary (including percentage-based calculations).
  - **Backend Support**: Added `GET /structures` endpoint to fetch all salary structures in bulk.
  - **Frontend Support**: Updated `payrollSlice.ts` with `fetchAllSalaryStructures` to power the new view.

### 20:55
- **Feature Add**: Dynamic Salary Component Calculation
  - **Dynamic Logic**: Implemented support for both **Flat Amount** and **Percentage of Basic** for all salary components.
  - **Unit Support**: Updated UI to show correct symbols (₹ or %) and fixed gross salary estimates in `SalaryStructureManager.tsx`.
  - **Data Migration**: Updated all "Tea Allowance" components to be percentage-based (15% default) to align with company policy.
  - **Aligned Enums**: Synchronized `calculationType` enums across frontend and backend for reliable data saving.

### 18:45
- **Bug Fix**: Product Sync & Payroll Details
  - **Fixed Product Sync Crash**:
    - **Issue**: `useProductSync.ts` crashed with `prodData.map is not a function`.
    - **Root Cause**: The API returns data wrapped in `{ success: true, data: [...] }`, but `dataSource.ts` was returning the whole object instead of the array.
    - **Fix**: Updated `frontend/src/services/dataSource.ts` to automatically unwrap `data.data` if the response follows the standard API format.
  - **Fixed Payroll Run Details Crash**:
    - **Issue**: `PayrollRuns.tsx` details page crashed due to `Invalid time value` on line 62.
    - **Fix**: Updated formatting logic for the "Generated" date in the header to safely handle missing or renamed date fields.

### 18:40
- **Bug Fix**: Runtime Errors in POS & Payroll
  - **Fixed 404 Error in POS**:
    - **Issue**: `useSalesSync.ts` failed with 404 because `dataSource.ts` had incorrect endpoints.
    - **Fix**: Updated `frontend/src/services/dataSource.ts` mappings:
      - `customers` -> `/api/customers` (was `/api/crm/customers`)
      - `sales` -> `/api/sales-invoice/invoices` (was `/api/sales-invoice`)
  - **Fixed RangeError in Payroll**:
    - **Issue**: `PayrollDashboard` and `PayrollRuns` crashed when `processedDate` was missing.
    - **Fix**: Added safe checks before calling `formatDateISO`.

### 18:30
- **Bug Fix**: Invalid Payroll Run Data Display
  - **Issue**: "Recent Payroll Runs" showed "Invalid Date" and "₹0" payout.
  - **Root Cause**: Frontend (`PayrollDashboard.tsx`, `PayrollRuns.tsx`) expected fields `month`, `year`, `runDate`, `totalPayout` which do not exist in the backend `PayrollRun` model.
  - **Fix**: Updated frontend components to use correct backend fields:
    - `periodStart` -> used to derive Month/Year.
    - `processedDate` (or `createdAt`) -> used for Run Date.
    - `totalAmount` -> used for Total Payout.
  - **Files Modified**:
    - `frontend/src/pages/People/Payroll/PayrollDashboard.tsx`
    - `frontend/src/pages/People/Payroll/PayrollRuns.tsx`

### 18:15
- **Feature Add**: Manual Refresh for Salary Components
  - **Frontend**: Added a "Refresh" button to the `SalaryStructureManager` page.
  - **Purpose**: Allows users to manually re-fetch salary components if the list is stale (e.g., after backend updates).
  - **Reason**: User reported "Tea Allowance" not showing despite backend confirmation.

### 18:00
- **Bug Fix**: Missing Tea Allowance & 500 Error
  - **Issue**: "Tea Allowance" was missing from the dropdown, and bulk update failed with 500 (component not found).
  - **Root Cause**: **Tenant Mismatch**. The user is logged into the **"Default Organization"** tenant, but the component was originally created for the **"Vijaya Laxmi"** tenant.
  - **Fix**: Executed `backend/scripts/add_tea_allowance_default.js` to create the "Tea Allowance" component for the "Default Organization" tenant.
  - **Resolution**: The component should now appear in the dropdown, and the bulk update should succeed.

### 17:45
- **Bug Fix**: Frontend Crash (`bulkUpdateSalaryStructure is not defined`)
  - **Issue**: The `bulkUpdateSalaryStructure` action was imported in the component but **not exported** from `payrollSlice.ts`.
  - **Fix**: Added the `bulkUpdateSalaryStructure` async thunk to `frontend/src/redux/slices/payrollSlice.ts`.
  - **Correction**: Updated the API endpoint in the thunk to match the backend route: `/api/hr/payroll/structures/bulk`.

### 17:40
- **Bug Fix**: Frontend Crash (`require is not defined`)
  - **Issue**: `SalaryStructureManager.tsx` used `require()` dynamically to import an action, causing a crash in the Vite browser environment.
  - **Fix**: Replaced dynamic `require` with a standard top-level `import { bulkUpdateSalaryStructure } ...` statement.
  - **Result**: "Bulk Assign" feature should now work without crashing the page.

### 17:35
- **Bug Fix**: Finance Sync 404 Errors (Part 2)
  - **Identified**: The frontend was making requests to `http://localhost:5000/cashbank` instead of `http://localhost:5000/api/cashbank`.
  - **Fix**: Updated `frontend/src/services/dataSource.ts` to include the `/api` prefix in `TABLE_TO_ENDPOINT` mappings.
  - **Reason**: The `VITE_BACKEND_URL` is set to the root (`http://localhost:5000`), but backend routes are mounted under `/api`.

### 17:15
- **Bug Fix**: Finance Sync 404 Errors (Part 1)
  - **Frontend**: Fixed `useDBDataSync.ts` to ensure `tenantId` is passed as a string, preventing object serialization in API calls.
  - **Backend**:
    - Added `GET /cashbank` endpoint (via `getAllTransactions`) to fetch all transactions (mapped for sync).
    - Added `GET /daily-finance` endpoint (via `getAllDailyFinance`) to return daily finance records (currently empty/placeholder).

### 16:55
- **Bug Fix**: Server Crash Resolution
  - **Fixed**: `PayrollService.ts` had duplicated code at the end of the file, causing a syntax error. Removed the extra code block.
  - **Fixed**: `PayrollController.ts` was missing the exported `bulkUpdateSalaryStructure` function. Re-added it.

### 16:50
- **Feature Add**: Bulk Salary Structure Assignment
  - **Frontend**: Added "Bulk Assign" button in `SalaryStructureManager.tsx`.
  - **Backend**: Implemented `bulkUpdateStructure` endpoint.
  - **Functionality**: Users can now assign a component (e.g., "Tea Allowance") to **ALL** employees in one click.

### 16:45
- **Data Migration**: Bulk Assign Tea Allowance
  - Executed `backend/scripts/assign_tea_allowance_all.js`.
  - **Action**: Iterated through all 59 employees.
  - **Result**: Created/Updated Salary Structures for ALL employees to include **"Tea Allowance" (₹15)**.
  - **Impact**: All employees now have this allowance visible and editable in the Salary Structure UI.

### 16:40
- **Database Update**: Tea Allowance Component
  - Created and executed `backend/scripts/add_tea_allowance.js`.
  - **Action**: Automatically added "Tea Allowance" Salary Component to the 'vijaya-laxmi' tenant.
### [2026-02-15] Fixes for Payroll Generation and Finance Sync
- **Fixed 404 in Payroll Generation**: The frontend was calling `POST /generate`, but the backend route is `POST /runs`. Updated `payrollSlice.ts`.
- **Fixed Finance Sync Error**: Added missing `cheques` endpoint mapping in `dataSource.ts` to `/api/cashbank/cheques`.
- **Verified Daily Finance**: Confirmed mapping for `daily_finance` points to `/api/daily-finance` which is correctly routed in `finance.routes.ts`.
- **Stability**: Reverted debug logs in `PayrollController.ts` which might have caused a server crash.
- **Result**: The component should now be visible in the **Manage Components** dropdown in the Salary Structure UI.


### 16:35
- **Bug Fix**: Salary Structure Page
  - Fixed missing `Users` icon import in `SalaryStructureManager.tsx` causing compilation error.

### 16:18
- **Feature Update**: Configurable Tea Allowance (Backend)
  - Modified `PayrollService.ts` (`generatePayroll`).
  - **Logic**:
    - Checks for "Tea Allowance" component in Employee Salary Structure.
    - If found: Uses `component.amount` as **Daily Rate** (Configurable).
    - If not found: Uses Default **₹15/day** (Backward Compatibility).

### 16:15
- **Initialized Change Log**: Reformatted `log.md` to track changes chronologically with timestamps.
- **Log Structure**: Defined standard entry format for all future updates.

## 2026-02-14

### EOD Summary
  - Updated `PayrollService.ts` to include Tea Allowance (₹15/day).
  - Validated frontend dynamic rendering in `PayslipView.tsx`.
  - **Resolution**: Identified need to regenerate payroll runs to see new allowance in frontend.

### 23:55
- **Troubleshooting**: Cash Account Validation
  - **Issue**: User reported "No payment accounts found" on Cash Payments.
  - **Action**: Executed `backend/scripts/ensure_cash_account.cjs`.
  - **Resolution**: Verified/Created default 'Office Cash' account in database to enable cash transactions.
- **UI Refinement**: Cash Payment Messaging
  - Updated `AllowanceManager.tsx` to explicitly mention "Cash Payment" in confirmations and headers.

### 00:15
- **Data Migration**: Fix User Tenant & Cash Account
  - **Issue**: Users had `tenantId: undefined`, causing "No payment accounts found" error.
  - **Action**: Executed `backend/scripts/fix_user_tenant_and_account.cjs`.
  - **Changes**:
    - Created Tenant "Vijaya Laxmi".
    - Updated 2 Users (Demo Shop Owner, Test User) to belong to this Tenant.
    - Verified/Created 'Office Cash' account for this Tenant.
  - **Result**: Users now linked to valid Tenant and Cash Account. Payment flow should be unblocked.

### 00:30
- **Refinement**: Streamline Cash Payments
  - **Action**: Removed `confirm()` dialog from `handlePayment` in `AllowanceManager.tsx`.
  - **Action**: Modified `handlePayment` to prioritize a 'Cash' account if available, ensuring "only in cash" payments are handled correctly.
  - **Result**: Payments are now one-click and default to Cash.


