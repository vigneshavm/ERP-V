# 🛠️ DNS Fix — MongoDB Atlas Connection Issue

## Problem

When connecting to **MongoDB Atlas**, the following error occurs:

```
querySrv ECONNREFUSED _mongodb._tcp.cluster0.kxzqtht.mongodb.net
```

**Root Cause**: Windows default DNS server cannot resolve MongoDB Atlas SRV records.  
The Atlas cluster is running fine — it's a local DNS resolution issue.

---

## Root Causes

| Cause | Description |
|---|---|
| **IP not whitelisted** | MongoDB Atlas blocks connections from unrecognised IPs by default |
| **Default DNS too slow/broken** | ISP DNS may not resolve `mongodb+srv://` SRV records correctly |
| **Firewall blocking port 27017** | Corporate/ISP firewalls may block outbound MongoDB traffic |
| **VPN interference** | VPN can intercept or drop SRV DNS lookups |

---

## ✅ Fix 1 — Whitelist Your IP on MongoDB Atlas (Most Common)

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com)
2. Select your project → **Security → Network Access**
3. Click **"+ Add IP Address"**
4. Choose:
   - **Add Current IP Address** — safe, for your current network
   - **Allow Access from Anywhere** (`0.0.0.0/0`) — dev only, not for production
5. Click **Confirm** and wait ~30 seconds

---

## ✅ Fix 2 — Change DNS to Cloudflare / Google (One-Time)

Open **PowerShell as Administrator** and run:

```powershell
Set-DnsClientServerAddress -InterfaceAlias "Wi-Fi" -ServerAddresses ("1.1.1.1","8.8.8.8")
ipconfig /flushdns
```

> **Note**: Replace `"Wi-Fi"` with your active adapter name if different.  
> To find it: `Get-NetAdapter | Where-Object {$_.Status -eq 'Up'}`

---

## ✅ Fix 3 — Disable VPN

If you're connected to a VPN, disconnect it and retry. VPNs often intercept or drop SRV record lookups.

---

## 🔍 Diagnose the Issue

### Check if DNS resolves SRV record:
```powershell
Resolve-DnsName cluster0.kxzqtht.mongodb.net -Type SRV
```
- Returns SRV entries → DNS works ✅
- Returns empty → DNS is broken, apply Fix 2 ☝️

### Force DNS in Node.js (temporary workaround):
```js
const dns = require('dns');
dns.setServers(['1.1.1.1', '8.8.8.8']); // Force Cloudflare/Google DNS
// ... then connect with MongoClient
```

### Run the user-list script after fixing:
```powershell
cd c:\Users\avmvi\Project\ERP\backend
node list_users.js
```

Expected output:
```
Connected to MongoDB
Total Tenants: X
Total Users: Y

--- Users by Tenant ---
Tenant: YourShopName
  - John Doe <john@example.com> (admin)
```

---

## 📋 Context

| Item | Value |
|------|-------|
| **Cluster** | `cluster0.kxzqtht.mongodb.net` |
| **DB Name** | `smarterpai` |
| **Auth DB** | `admin` |
| **Protocol** | `mongodb+srv://` (requires SRV DNS) |
| **DNS Fix Applied** | 2026-03-02 |
| **Working DNS Servers** | `1.1.1.1` (Cloudflare), `8.8.8.8` (Google) |

---

## 📁 Related Files

| File | Purpose |
|------|---------|
| `backend/.env` | Contains `MONGO_URI` Atlas connection string |
| `backend/list_users.js` | Script to connect DB and list all users by tenant |
| `backend/src/config/database.ts` | Main DB connection config used by the server |
