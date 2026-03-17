# ERP System API Endpoints Documentation

This document provides a comprehensive list of all API endpoints available in the SmartERPAI system, including the standardized Enterprise and Personal Finance services.

## Service Overview

| Service | Base URL | Port | Standard Prefix |
| :--- | :--- | :--- | :--- |
| **Enterprise API** | `http://localhost:5000` | 5000 | `/api/v1` |
| **Personal Finance API** | `http://localhost:4000` | 4000 | `/api/v1` |

---

## 1. Standardized Mock-First Endpoints (v1)

These endpoints are prioritized for frontend development and are verified to serve mock data even when the database is offline.

### Enterprise Mock Endpoints
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/finance/journal-entries` | List of mock journal entries |
| `GET` | `/api/v1/inventory/stock-reports` | Current mock stock levels |
| `GET` | `/api/v1/enterprise/dashboard/stats` | Global enterprise overview stats |
| `GET` | `/api/v1/crm/suppliers/analytics` | Supplier performance metrics |

### Personal Finance Mock Endpoints
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/auth/me` | Current authenticated user profile |
| `GET` | `/api/v1/transactions` | Full list of mock financial transactions |
| `GET` | `/api/v1/personal/reports/analytics` | Summary of spending/income trends |

---

## 2. Enterprise API Detailed Routes (Port 5000)

### 2.1 Core & Auth (`/api/v1`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Authenticate user |
| `POST` | `/api/v1/auth/register` | Register new user |
| `GET` | `/api/v1/auth/profile` | Get current user details |
| `GET` | `/api/v1/core/business` | Get current business info |
| `GET` | `/api/v1/core/health` | Service health status |

### 2.2 Inventory (`/api/v1/inventory`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/inventory/items` | Get all inventory items |
| `POST` | `/api/v1/inventory/items` | Add new inventory item |
| `GET` | `/api/v1/inventory/categories` | List item categories |
| `GET` | `/api/v1/inventory/inventory-stats` | Inventory summary |
| `GET` | `/api/v1/inventory/low-stock` | List items with low stock levels |
| `GET` | `/api/v1/inventory/aging-report` | Stock aging analysis |

### 2.3 Finance (`/api/v1/finance`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/finance/bills` | List all bills (payable/receivable) |
| `GET` | `/api/v1/finance/cash-banks` | Cash and bank account positions |
| `GET` | `/api/v1/finance/journal-entries` | Live journal entry list |
| `GET` | `/api/v1/finance/accounts` | Chart of Accounts |
| `GET` | `/api/v1/finance/bank-statements` | Bank reconciliation data |

### 2.4 CRM & Agents (`/api/v1/crm`, `/api/v1/agents`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/crm/customers` | List all customers |
| `GET` | `/api/v1/crm/suppliers` | List all suppliers |
| `GET` | `/api/v1/agents/tasks` | AI Agent active tasks |

---

## 3. Personal Finance API Detailed Routes (Port 4000)

All routes below use the `/api/v1` prefix.

### 3.1 Transactions & Analytics
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/transactions/monthly` | Transactions grouped by month |
| `GET` | `/api/v1/transactions/contacts` | List of contacts for transfers |
| `GET` | `/api/v1/reports/stats` | Dashboard chart data |
| `GET` | `/api/v1/reports/yearly` | Yearly financial insights |
| `GET` | `/api/v1/reports/recurring` | Recurring bills and subscriptions |

### 3.2 Goals, Loans & Accounts
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/goals` | List all financial goals |
| `POST` | `/api/v1/goals` | Create a new financial goal |
| `GET` | `/api/v1/loans` | List all active loans |
| `POST` | `/api/v1/loans/:id/payment` | Record a loan payment |
| `GET` | `/api/v1/accounts` | List linked bank accounts/wallets |
| `GET` | `/api/v1/cards/credit` | List of credit cards |

### 3.3 Auth & Settings
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/auth/pin/verify` | Verify app-lock PIN |
| `GET` | `/api/v1/settings` | Get user preferences |
| `POST` | `/api/v1/settings/backup` | Export all user data as JSON |
| `POST` | `/api/v1/settings/data/clear` | Wipe all personal data |

---
*Note: This list is an exhaustive mapping of currently implemented routes in the system.*
