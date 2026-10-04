# TextileSoft 01 - Login, User & Security
## End-to-End Technical Flow

**Source:** `TEXTILESOFT 17.07.2025`  
**Application type:** ASP.NET WebForms, precompiled deployment  
**Primary database identified in `web.config`:** SQL Server database `SSS`  
**Primary login page:** `login.aspx`  
**Login page compiled class:** `login`, assembly `App_Web_hhrnt4vj.dll`

---

# 1. Executive Summary

The TextileSoft login/security implementation is a **custom application-level authentication system**, not ASP.NET Forms Authentication.

The important characteristics found in the source are:

1. `web.config` explicitly sets:
   - `<authentication mode="None" />`
   - very long ASP.NET session timeout
2. `login.aspx` contains:
   - username textbox `t1`
   - password textbox `t2`
   - hidden server button `save`
   - click handler `Unnamed1_Click`
3. The compiled login assembly contains SQL and messages showing authentication against the custom `newuser` table.
4. The login process checks:
   - whether the user exists
   - whether the account is active
   - username/password
   - account-date state
   - counter information
5. Successful login establishes application state through session/application-level values such as `CurrentUserID` and then moves the user into the ERP.
6. The source repeatedly references:
   - `newuser`
   - `AccountDate`
   - `LoginOpen`
   - `countername`
   - `CommonSettings`
   - `specialcondion`
   - `opti`
   - `rightsentry`
7. User creation is performed by `newuser.aspx`.
8. User records are inserted into `newuser` with fields including:
   - `name`
   - `user_id`
   - `pass`
   - `re_pass`
   - `counter_name`
   - `active`
   - `mode`
   - `rights`
   - `entrydate`
   - `CreatedDate`
9. The application also has a menu/permission structure in `opti`, and rights are maintained using `rightsentry`.
10. `userpermission.aspx` provides more granular operational permissions such as:
   - bill entry
   - purchase entry
   - purchase bill
   - cash counter
   - purchase rate entry
   - estimate sticker
   - common entry
   - focus
   - read/write
   - print-bill keys
   - GST calculation
   - bill/product discount
   - product/bill less

---

# 2. High-Level Architecture

```text
Browser
   |
   | GET /login.aspx
   v
login.aspx
   |
   | Username + Password
   | ASP.NET postback
   v
Unnamed1_Click
   |
   +----> newuser
   |       |
   |       +-- user_id
   |       +-- pass
   |       +-- active
   |       +-- name
   |       +-- counter_name
   |       +-- mode
   |       +-- rights
   |
   +----> countername
   |
   +----> AccountDate
   |
   +----> LoginOpen / CommonSettings / other login context
   |
   v
Application Session / CurrentUserID
   |
   v
Home / ERP Menu
   |
   +----> Page access / menu permissions
   |
   +----> Operational permissions
   |
   +----> User/counter/company context
   |
   v
Business modules
```

---

# 3. Web Application Entry Point

## 3.1 Default document

`web.config` defines:

```xml
<defaultDocument>
    <files>
        <add value="login.aspx" />
    </files>
</defaultDocument>
```

Therefore the application root opens at:

```text
/login.aspx
```

There is no ASP.NET Forms Authentication redirect protecting the application at the framework level.

---

# 4. Authentication Configuration

The most important configuration is:

```xml
<authentication mode="None" />
```

This means the application is **not using ASP.NET Forms Authentication** for the login mechanism.

The login is implemented by the application's own server-side code.

The application also has:

```xml
<sessionState timeout="9999"></sessionState>
```

This indicates an extremely long ASP.NET session timeout.

The deployment is:

```xml
<compilation debug="true" targetFramework="4.0">
```

The application therefore relies heavily on custom application/session state rather than standard ASP.NET authentication middleware.

---

# 5. Login Screen

## Source

```text
login.aspx
```

## Compiled server class

```text
login
```

## Compiled assembly

```text
bin/App_Web_hhrnt4vj.dll
```

## Main controls

The page contains:

```text
t1
```

Username:

```text
<asp:TextBox ID="t1" ... placeholder="User name">
```

Password:

```text
<asp:TextBox ID="t2" TextMode="Password" ... placeholder="Password">
```

Login button:

```text
<asp:Button ID="save"
            Text="Sign in"
            onclick="Unnamed1_Click" />
```

The login button is currently inside a container with:

```css
display:none
```

So the current UI hides the server-side button visually. This suggests the page may have been modified over time or may rely on another interaction mechanism/version.

---

# 6. Login Event

The login button is wired to:

```text
Unnamed1_Click
```

The method itself is not present as readable `.cs` source because the application is precompiled.

The page directive shows:

```text
inherits="login, App_Web_hhrnt4vj"
```

Therefore the actual server-side implementation must be recovered from:

```text
bin/App_Web_hhrnt4vj.dll
```

or from the original source project if available.

---

# 7. Authentication Database

The application uses SQL Server.

`web.config` contains several connection strings pointing to database:

```text
SSS
```

The application therefore uses a custom SQL database rather than ASP.NET Membership for the business login.

The central authentication table identified in the compiled login code is:

```text
newuser
```

---

# 8. `newuser` Authentication Table

The source repeatedly queries:

```sql
select * from newuser where user_id=...
```

The login assembly also contains:

```sql
select name,active from newuser where user_id=...
```

and:

```sql
select name from newuser where user_id=...
```

and:

```sql
select name from newuser where user_id=... and pass=...
```

This establishes that `newuser` is the core application login table.

---

# 9. Login Validation Flow

The recovered compiled strings show the following logical sequence.

## Step 1 - User enters credentials

The browser submits:

```text
t1 = User ID
t2 = Password
```

to the ASP.NET postback handler:

```text
Unnamed1_Click
```

---

## Step 2 - Validate User ID

The login code checks `newuser` using the supplied user ID.

Evidence recovered from `App_Web_hhrnt4vj.dll`:

```sql
select name,active from newuser where user_id=...
```

If the account cannot be found, the application can display:

```text
UserId InCorrect
```

There is also:

```text
Invalid Account
```

and:

```text
Please Check The UserName & Password
```

---

# 10. Step 3 - Check Account Active Status

The login assembly explicitly retrieves:

```sql
select name,active from newuser where user_id=...
```

Therefore the account has an `active` state.

The logical model is:

```text
User ID
   |
   v
newuser
   |
   +-- exists?
   |     |
   |     +-- NO --> UserId InCorrect / Invalid Account
   |
   +-- active?
         |
         +-- NO --> login rejected
         |
         +-- YES --> continue
```

The exact textual message used for an inactive account should be confirmed from the compiled method because the recovered strings include several generic invalid-account messages.

---

# 11. Step 4 - Password Validation

The compiled login assembly contains:

```sql
select name from newuser where user_id=... and pass=...
```

This demonstrates that the application compares the entered password against the `pass` column.

The source also contains the error message:

```text
Password InCorrect
```

and:

```text
Enter the Password
```

Therefore the logical flow is:

```text
User ID exists
      |
      v
Password supplied?
      |
      +-- NO --> Enter the Password
      |
      v
Compare against newuser.pass
      |
      +-- mismatch --> Password InCorrect
      |
      +-- match -----> continue
```

## Important security finding

The password is stored/compared through the `pass` column.

The `newuser` maintenance code also exposes:

```text
pass
re_pass
```

This strongly indicates a legacy password-storage design rather than a modern one-way password-hash architecture.

For migration, the new ERP should **not copy this password-storage design**.

Use:

```text
Password
   ↓
Argon2id / bcrypt / PBKDF2
   ↓
Password hash
```

and never store `re_pass`.

---

# 12. Step 5 - Counter Association

The login/security code references:

```text
countername
```

and contains:

```sql
select counter_name from countername
```

The `newuser` record itself has:

```text
counter_name
```

Therefore the user is associated with one or more counter contexts through the legacy data model.

The system uses counter information throughout the application.

Examples from other compiled modules include:

```sql
select * from newuser where counter_name=...
```

and:

```sql
select * from LoginOpen
where UserName=@UserName
and CounterName=@CounterName
```

This shows that counter is part of the user's operating context.

---

# 13. Step 6 - Account Date

The login assembly contains the identifier:

```text
insertAccountdate
```

and SQL related to:

```text
AccountDate
```

The wider application repeatedly uses:

```sql
SELECT TOP 1 CurrentDate
FROM AccountDate
WHERE user_id=@user_id
AND Countername=@Countername
ORDER BY ID DESC
```

Other modules also use:

```sql
SELECT TOP 1
    ModifiedDate
FROM AccountDate
WHERE User_Id = ...
AND CurrentDate = ...
AND CounterName = ...
```

Therefore login is not only authentication.

It also establishes or validates an **accounting/business date context** for the user and counter.

---

# 14. AccountDate Flow

The inferred application flow is:

```text
Successful credentials
        |
        v
User + Counter
        |
        v
Check AccountDate
        |
        +-- Existing account-date record?
        |          |
        |          +-- YES --> use/validate current account date
        |
        +-- NO --> insertAccountdate
                       |
                       v
                  AccountDate record
```

The exact implementation of `insertAccountdate` is compiled, but the identifier and related SQL prove that this is part of the login/account-date workflow.

---

# 15. AccountDate Data Model

The source shows fields including:

```text
user_id
CurrentDate
ModifiedDate
Countername
LoginDatetime
ID
```

Other application SQL references:

```sql
ORDER BY LoginDatetime DESC
```

and:

```sql
ORDER BY ID DESC
```

Therefore the table is effectively an audit/context table for user + counter + business date.

---

# 16. LoginOpen

Another important table is:

```text
LoginOpen
```

Many application modules query:

```sql
select *
from LoginOpen
where UserName=@UserName
and CounterName=@CounterName
```

and:

```sql
select *
from LoginOpen
where UserName=@UserName
and CounterName=@CounterName
and LoginFileName=@LoginFileName
```

The application also retrieves:

```text
CounterName
UserName
FirstFocus
```

from `LoginOpen`.

Example recovered SQL:

```sql
SELECT CounterName,UserName,FirstFocus
FROM LoginOpen
WHERE UserName='...'
```

This means `LoginOpen` is used as a runtime/login-context table.

---

# 17. LoginOpen vs AccountDate

These tables serve different purposes.

### `AccountDate`

Primarily represents:

```text
User
+
Counter
+
Business/account date
+
Login/update timestamps
```

### `LoginOpen`

Primarily represents:

```text
User
+
Counter
+
Login/file context
+
FirstFocus
```

A simplified model:

```text
                    LOGIN
                      |
          +-----------+-----------+
          |                       |
          v                       v
     AccountDate              LoginOpen
          |                       |
   Business date            Runtime context
   Login datetime            Counter
   Modified date             User
```

---

# 18. Session / CurrentUserID

The compiled application repeatedly contains:

```text
CurrentUserID
```

and:

```text
HttpSessionState
```

and:

```text
get_Session
```

This is strong evidence that user identity is carried through ASP.NET session/application state.

The application also has:

```text
~/login.aspx
```

as a redirect target when login/session state is considered invalid.

A typical runtime model is therefore:

```text
Login
  |
  v
Validate credentials
  |
  v
Set CurrentUserID / session context
  |
  v
Open ERP
  |
  v
Every page reads current user context
```

The exact session key/value assignment should be recovered from the original source or decompiled assembly before reproducing it exactly.

---

# 19. Session Expiration / Unauthorized State

Because the application uses custom session checks rather than ASP.NET Forms Authentication, individual pages appear to rely on the shared login/session state.

The recurring reference:

```text
~/login.aspx
```

in compiled modules indicates that pages can redirect back to login when required context is missing.

This is important for migration.

The new ERP should centralize this behaviour:

```text
JWT / server session
        |
        v
Authentication middleware
        |
        +-- valid --> request continues
        |
        +-- invalid --> 401 / login
```

rather than duplicating login checks inside every page.

---

# 20. User Creation Flow

## Source

```text
newuser.aspx
```

## Compiled assembly

```text
App_Web_h5dj0v2q.dll
```

The page contains:

```text
TB1 = Name
TB3 = User ID
TB4 = Password
TB5 = Re-enter Password
chkCounterName = Counter
rblActive = Active
TextBox5 = Login Mode
DropDownList1 = Rights
```

Buttons:

```text
save
btnUpdate
btnSearch
Close
```

---

# 21. User Creation Validation

The compiled assembly contains these validation messages:

```text
Enter The Password
Enter The Reenterpassword
Please Check the Counter Name
Enter The Login Mode
Please Select The Rights
Enter The Same Password
```

It also checks duplicate user IDs.

Recovered SQL:

```sql
select * from newuser where user_id='...'
```

and:

```text
This User ID Name Is All Ready Insert
```

Therefore creation flow is approximately:

```text
Enter user details
       |
       v
Validate password
       |
       v
Validate re-enter password
       |
       v
Passwords equal?
       |
       +-- NO --> Enter The Same Password
       |
       v
Validate counter
       |
       v
Validate login mode
       |
       v
Validate rights
       |
       v
Check duplicate User ID
       |
       +-- exists --> duplicate error
       |
       v
INSERT newuser
```

---

# 22. User Insert SQL

The exact insert statement recovered from the compiled assembly is:

```sql
insert into newuser
(
    name,
    user_id,
    pass,
    re_pass,
    counter_name,
    active,
    mode,
    rights,
    entrydate,
    CreatedDate
)
values
(
    @name,
    @user_id,
    @pass,
    @re_pass,
    @counter_name,
    @Active,
    @mode,
    @rights,
    GETDATE(),
    GETDATE()
)
```

This is one of the strongest source-level pieces of evidence in this security module.

---

# 23. `newuser` Logical Structure

Based on the recovered SQL:

```text
newuser
├── name
├── user_id
├── pass
├── re_pass
├── counter_name
├── active
├── mode
├── rights
├── entrydate
├── CreatedDate
└── DaysPermit (present in newer user-management code)
```

The later user-management assembly also contains:

```sql
Update newuser
set active = @Active,
    DaysPermit=@DaysPermit,
    mode=@LoginMode,
    rights=@Rights
where name=@name
and user_id=@user_id
and counter_name=@counter_name
```

So `DaysPermit` is also part of the evolved user-management model.

---

# 24. Special User `SRI`

The source explicitly excludes:

```text
SRI
```

from normal user deletion/search operations.

Recovered SQL:

```sql
select distinct name,user_id,pass,re_pass
from newuser
where user_id<>'SRI'
```

and:

```sql
delete from newuser
where user_id in (@UserID)
and user_id<>'SRI'
```

Therefore `SRI` is a protected/special user in the legacy system.

It should be treated as a legacy administrative account during migration, not blindly recreated with the same credentials.

---

# 25. Rights Master

The application contains:

```text
RightsEntry.aspx
```

and the database table:

```text
rightsentry
```

The source retrieves enabled rights using:

```sql
SELECT r_name
FROM rightsentry
WHERE r_status='1'
```

This establishes a rights master:

```text
rightsentry
├── r_name
└── r_status
```

The user creation page then stores the selected right in:

```text
newuser.rights
```

---

# 26. User Rights Flow

```text
rightsentry
     |
     | r_status = 1
     v
Available rights
     |
     v
newuser.aspx
     |
     | select rights
     v
newuser.rights
```

Therefore there is a first-level role/right assignment directly on the user record.

---

# 27. Menu Permission System - `opti`

The application also has another permission structure:

```text
opti
```

Recovered SQL includes:

```sql
select distinct pc_name from opti
```

```sql
select distinct user_id from opti
```

```sql
select distinct pc_name,user_id from opti
```

and:

```sql
select top 1 *
from opti
where pc_name='...'
and user_id='...'
```

The columns referenced include:

```text
user_id
menu_id
menu
location
par_id
pc_name
```

This appears to be a menu/page-level authorization structure.

---

# 28. `opti` Permission Copy Flow

The source contains:

```sql
insert into TMP_OPTISELECT_SETTING
SELECT user_id,menu_id,menu,location,par_id,pc_name
FROM opti R1
WHERE user_id='...'
AND NOT EXISTS
(
    SELECT *
    FROM opti R2
    WHERE R2.menu_id = R1.menu_id
    AND user_id='...'
)
```

Then:

```sql
update TMP_OPTISELECT_SETTING
set pc_name='...',
    user_id='...'
```

Then:

```sql
insert into opti
select *
from TMP_OPTISELECT_SETTING
```

This indicates the application supports copying menu permissions from one user/context to another.

---

# 29. `opti` Delete Flow

The source also contains:

```sql
delete from opti
where pc_name=@username
and user_id=@userid
```

Therefore permissions can be removed at the menu/user level.

---

# 30. User Permission Screen

## Source

```text
userpermission.aspx
```

The UI allows selection of:

### User

```text
ddlcheckbox18
```

### Counter

```text
ddlcheckbox17
```

### Entry/application mode

```text
BILL ENTRY
PURCHASE ENTRY
PURCHASE BILL
CASH COUNTER
PURCHASE RATE ENTRY
ESTIMATE STICKER
COMMON ENTRY
```

### Discount values

```text
Bill Dis %
Product Dis %
Product Less
Bill Less
```

### Focus

```text
FOCUS
```

### Read/write

```text
CHANGE READ/WRITE
```

### Print controls

```text
PRINT BILL KEYS
```

### GST

```text
GST CALCULATION
```

The submit handler is:

```text
Button1_Click1
```

---

# 31. Granular Permission Tables

The compiled permission-related code contains references to:

```text
userper
calation
prmit
readonly
Focus
```

Recovered SQL includes:

```sql
insert into userper
(
    billdis,
    pdis,
    less,
    billess
)
values
(
    @billdis,
    @pdis,
    @less,
    @billess
)
```

It also contains:

```sql
update calation
set selectcolumn=@selectcolumn
where listfile=@listfile
```

```sql
update prmit
set selectoptn=@selectoptn
where listoptn=@listoptn
```

```sql
update readonly
set rwselect=@rwselect
where list=@list
```

```sql
update Focus
set SelectFocus=@SelectFocus
where listfocus=@listfocus
```

So the security system is not simply one `role` column.

It is a collection of permission/configuration tables.

---

# 32. Security Model Actually Used

The legacy security model is approximately:

```text
                    USER LOGIN
                        |
                        v
                     newuser
                        |
          +-------------+-------------+
          |             |             |
          v             v             v
       active         mode          rights
          |
          v
     AccountDate
          |
          v
      LoginOpen
          |
          v
     Session / CurrentUserID
          |
          +----------------------+
          |                      |
          v                      v
        opti                 userpermission
     menu/page                operational
      access                   controls
          |                      |
          +----------+-----------+
                     |
                     v
                 ERP Pages
```

---

# 33. End-to-End Login Flow

## Complete sequence

```text
1. User opens application
        |
        v
2. IIS / ASP.NET loads login.aspx
        |
        v
3. User enters User ID + Password
        |
        v
4. ASP.NET postback calls Unnamed1_Click
        |
        v
5. Query newuser by user_id
        |
        +-- not found --> UserId InCorrect / Invalid Account
        |
        v
6. Check active status
        |
        +-- inactive --> login rejected
        |
        v
7. Validate password against newuser.pass
        |
        +-- mismatch --> Password InCorrect
        |
        v
8. Read user name / user context
        |
        v
9. Resolve counter context
        |
        v
10. Check/create AccountDate
        |
        v
11. Establish login/session context
        |
        +-- CurrentUserID
        +-- user ID
        +-- counter
        +-- business/account date
        |
        v
12. LoginOpen/runtime context used by ERP
        |
        v
13. Redirect/open ERP home
        |
        v
14. Pages use current user/session
        |
        v
15. Menu/page permissions from opti/rights
        |
        v
16. Operational permissions from userpermission-related tables
        |
        v
17. User performs ERP transaction
```

---

# 34. Logout / Session-Clear Evidence

The archive contains compiled code referencing:

```text
clearSession
```

and:

```text
clearSessionAndLocalStorage();
```

This indicates that the application has client/session cleanup logic in at least some logout/navigation flows.

However, the exact central logout page/handler should be traced separately before documenting it as the definitive logout implementation.

---

# 35. Important Security Findings

## 35.1 ASP.NET authentication is disabled

```xml
<authentication mode="None" />
```

The application therefore implements its own authentication.

---

## 35.2 Passwords appear to be stored directly

The database fields are:

```text
pass
re_pass
```

and authentication directly compares against:

```text
pass
```

This is a legacy design.

### New ERP recommendation

Do not migrate passwords as plaintext.

Use:

```text
Argon2id
```

or:

```text
bcrypt
```

or a properly configured:

```text
PBKDF2
```

---

## 35.3 Database credentials are embedded in `web.config`

The supplied source archive contains SQL Server credentials directly inside connection strings.

These credentials should be considered compromised once the source has been distributed.

For the new ERP:

```text
Application
   |
   v
Environment/Secret Store
   |
   v
Database credentials
```

Do not commit database passwords into source control.

---

## 35.4 SQL injection risk exists in legacy code

The recovered application contains many dynamically concatenated SQL statements such as:

```text
select * from newuser where user_id='...
```

This is a significant legacy security concern.

The new ERP should use parameterized queries/ORM query parameters consistently.

---

## 35.5 Extremely long session timeout

```xml
<sessionState timeout="9999">
```

This creates a very long server session lifetime.

The new system should use controlled session/token expiry and explicit refresh mechanisms.

---

# 36. What Is Confirmed vs What Is Not

## Confirmed directly from the archive

| Area | Evidence |
|---|---|
| Login page | `login.aspx` |
| Login event | `Unnamed1_Click` |
| Login assembly | `App_Web_hhrnt4vj.dll` |
| Authentication table | `newuser` |
| User ID | `newuser.user_id` |
| Password | `newuser.pass` |
| Active state | `newuser.active` |
| User name | `newuser.name` |
| Counter | `newuser.counter_name` |
| Login mode | `newuser.mode` |
| Rights | `newuser.rights` |
| User creation | `newuser.aspx` |
| Rights master | `rightsentry` |
| Menu permissions | `opti` |
| Account date | `AccountDate` |
| Login runtime context | `LoginOpen` |
| Current user state | `CurrentUserID` / ASP.NET Session |
| Authentication framework | ASP.NET authentication mode `None` |

## Requires further reverse engineering

| Area | Status |
|---|---|
| Exact C# body of `Unnamed1_Click` | Compiled only |
| Exact session key names | Partially visible |
| Exact redirect target after successful login | Needs method-level decompilation |
| Exact inactive-account branch | SQL confirmed, branch details need decompilation |
| Exact `AccountDate` insert implementation | Identifier/related SQL confirmed |
| Exact `LoginOpen` insert/update during login | Needs further assembly tracing |
| Exact `opti` enforcement on every page | Needs page-by-page tracing |
| Exact logout implementation | Partially identified |
| Complete database schema | Not included in this archive |

---

# 37. Migration Mapping to New ERP

The legacy model should be transformed rather than copied literally.

## Legacy

```text
newuser
 ├── user_id
 ├── pass
 ├── re_pass
 ├── active
 ├── counter_name
 ├── mode
 └── rights
```

## Proposed new model

```text
users
 ├── id
 ├── username
 ├── password_hash
 ├── display_name
 ├── is_active
 ├── created_at
 └── updated_at

roles
 ├── id
 └── name

user_roles
 ├── user_id
 └── role_id

permissions
 ├── id
 ├── code
 └── name

role_permissions
 ├── role_id
 └── permission_id

user_permissions
 ├── user_id
 └── permission_id

counters
 ├── id
 └── name

user_counters
 ├── user_id
 └── counter_id

business_dates
 ├── counter_id
 ├── business_date
 └── opened_by
```

---

# 38. Recommended New ERP Authentication Flow

```text
POST /auth/login
       |
       v
Validate username
       |
       v
Load user
       |
       +-- inactive --> 401
       |
       v
Verify password hash
       |
       +-- invalid --> 401
       |
       v
Load roles
       |
       v
Load permissions
       |
       v
Load allowed counters
       |
       v
Select/open business date
       |
       v
Create authenticated session/JWT
       |
       v
Return authenticated context
```

---

# 39. Key Difference From TextileSoft

TextileSoft combines several responsibilities into the login process:

```text
Authentication
+
User master
+
Counter assignment
+
Business date
+
Runtime login state
+
Menu permission
+
Operational permission
```

The new ERP should separate these concerns:

```text
Authentication
        |
        +-- User identity
        |
        +-- Password
        |
        +-- Session/token

Authorization
        |
        +-- Roles
        +-- Permissions

Store context
        |
        +-- Branch
        +-- Counter
        +-- Warehouse

Accounting context
        |
        +-- Business date

Audit
        |
        +-- Login history
        +-- Logout
        +-- IP/device
```

This will make the system much easier to maintain and audit.

---

# 40. Final End-to-End Diagram

```text
                         ┌─────────────────────┐
                         │      Browser        │
                         └──────────┬──────────┘
                                    │
                                    │ GET
                                    ▼
                         ┌─────────────────────┐
                         │     login.aspx      │
                         │                     │
                         │ t1 = User ID       │
                         │ t2 = Password       │
                         └──────────┬──────────┘
                                    │
                                    │ POSTBACK
                                    ▼
                         ┌─────────────────────┐
                         │  Unnamed1_Click     │
                         │ compiled in         │
                         │ App_Web_hhrnt4vj    │
                         └──────────┬──────────┘
                                    │
                         ┌──────────▼──────────┐
                         │      newuser        │
                         ├─────────────────────┤
                         │ user_id             │
                         │ pass                │
                         │ active              │
                         │ name                │
                         │ counter_name        │
                         │ mode                │
                         │ rights              │
                         └──────────┬──────────┘
                                    │
                         credentials valid?
                           │              │
                          NO             YES
                           │              │
                           ▼              ▼
                     Login Error     Counter Context
                                          │
                                          ▼
                                   ┌──────────────┐
                                   │ countername  │
                                   └──────┬───────┘
                                          │
                                          ▼
                                   ┌──────────────┐
                                   │ AccountDate  │
                                   └──────┬───────┘
                                          │
                                          ▼
                                   ┌──────────────┐
                                   │  LoginOpen   │
                                   └──────┬───────┘
                                          │
                                          ▼
                                  ASP.NET Session
                                          │
                                          ▼
                                    CurrentUserID
                                          │
                                          ▼
                                  ERP Home / Menu
                                          │
                     ┌────────────────────┴────────────────────┐
                     │                                         │
                     ▼                                         ▼
                  rightsentry                                  opti
               Role/right master                         Menu/page access
                     │                                         │
                     └────────────────────┬────────────────────┘
                                          │
                                          ▼
                                  userpermission
                                          │
                                          ▼
                            Operational permissions
                                          │
                                          ▼
                                  ERP Transactions
```

---

# 41. Migration Priority

For the new ERP, preserve these business concepts:

### Must preserve

1. User identity
2. Active/inactive account
3. Counter assignment
4. Role/right assignment
5. Menu/page permission
6. Operational permission
7. Business/accounting date
8. Login audit
9. Session authentication
10. User-to-company/store context

### Do not preserve literally

1. Plaintext `pass`
2. `re_pass`
3. ASP.NET `authentication mode="None"`
4. `timeout="9999"`
5. SQL string concatenation
6. `SRI` as a hard-coded protected user
7. Page-specific duplicated authorization
8. Printer/business settings mixed into authentication

---

# 42. Source Files / Assemblies Used for This Analysis

```text
login.aspx
SuperAdminLogin.aspx
newuser.aspx
RightsEntry.aspx
userpermission.aspx
NewUserAddRightsEntry.aspx
NewUserSalesFocusSetting.aspx
deleteuser.aspx
web.config
MasterPage.master

bin/App_Web_hhrnt4vj.dll
bin/App_Web_h5dj0v2q.dll
bin/App_Web_qrpbn2np.dll
bin/App_Web_qj0n24d4.dll
bin/App_Web_sjbgvron.dll

Related database objects identified through compiled SQL:
newuser
rightsentry
opti
TMP_OPTISELECT_SETTING
AccountDate
LoginOpen
countername
CommonSettings
specialcondion
userper
calation
prmit
readonly
Focus
```

---

# 43. Important Conclusion

The TextileSoft login is **not just username/password validation**.

It is the entry point into a larger context model:

```text
USER
 ↓
PASSWORD / ACTIVE
 ↓
COUNTER
 ↓
ACCOUNT DATE
 ↓
LOGIN CONTEXT
 ↓
SESSION / CURRENT USER
 ↓
ROLE / RIGHTS
 ↓
MENU PERMISSIONS
 ↓
OPERATIONAL PERMISSIONS
 ↓
ERP TRANSACTIONS
```

For the ERP migration, this complete chain should be treated as one **Authentication + Authorization + Store Context + Business Date** subsystem.

The exact C# implementation of `Unnamed1_Click`, `insertAccountdate`, and the runtime `LoginOpen` creation remains compiled inside the precompiled assemblies. Those three methods are the next reverse-engineering targets if an exact line-by-line login implementation is required.
