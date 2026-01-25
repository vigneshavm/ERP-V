# SmartERPAI Backend API Documentation

Welcome to the SmartERPAI Backend API documentation. This document is designed for developers to understand the existing API landscape and learn how to extend the system with new functionality.

## Table of Contents
1. [Base URL](#base-url)
2. [Authentication](#authentication)
3. [Module Landscape](#module-landscape)
    - [Core](#core)
    - [Inventory](#inventory)
    - [Sales](#sales)
    - [Purchase](#purchase)
    - [Finance](#finance)
    - [CRM](#crm)
    - [HR](#hr)
4. [Developer Guide: Adding New Functionality](#developer-guide-adding-new-funcationality)

---

## Base URL
Default: `http://localhost:5000/api`

## Authentication
Most endpoints are protected by JWT Bearer Authentication. 
- **Header**: `Authorization: Bearer <your_jwt_token>`
- **Token Acquisition**: Use the `/auth/login` endpoint.

---

## Module Landscape

### Core
*Shared infrastructure and base entities.*
- **Auth**: `/auth/register`, `/auth/login`, `/auth/profile`, `/auth/refresh-token`
- **User**: `/users/` (CRUD operations)
- **Business**: `/business/settings`, `/business/shop-details`
- **Settings**: `/settings/`
- **Reports**: `/reports/sales`, `/reports/inventory`, `/reports/profit-loss`
- **Health**: `/health`

### Inventory
*Product and stock management.*
- **Items**: `/items/` (CRUD, stock updates)
- **Categories**: `/items/categories/`
- **Inventory Logs**: `/inventory/logs`

### Sales
*Customer-facing transactions.*
- **Invoices**: `/sales/invoices/` (Create, List, Single, Payment)
- **Bills**: `/sales/bills/` (Sales bills)
- **Sales Orders**: `/sales/orders/` (Order tracking)
- **Returns**: `/sales/returns/` (Sales returns)
- **Estimates**: `/sales/estimates/` (Quotations)
- **POS**: `/sales/pos/summary`, `/sales/pos/sale`
- **Payments In**: `/sales/payments/in`

### Purchase
*Vendor-facing transactions.*
- **Purchases**: `/purchase/` (Purchase invoices)
- **Purchase Returns**: `/purchase/returns/`
- **Vendor Payments**: `/purchase/payments`

### Finance
*Money management and accounting.*
- **Cash & Bank**: `/finance/accounts/`, `/finance/transfers/`, `/finance/position`
- **Bill Management**: `/finance/bills/`
- **Dues**: `/finance/dues/adjust/`
- **Loyalty**: `/finance/loyalty/points`, `/finance/loyalty/history`

### CRM
*Customer and supplier relationships.*
- **Customers**: `/crm/customers/` (360 view, history)
- **Suppliers**: `/crm/suppliers/`
- **WhatsApp**: `/crm/whatsapp/templates`, `/crm/whatsapp/campaigns`

### HR
*Staff and payroll.*
- **Employees**: `/hr/employees/` (Onboarding, Active list)

---

## Developer Guide: Adding New Functionality

### 1. Folder Structure (DDD Pattern)
We use a Domain-Driven Design (DDD) modular structure. Each feature belongs to a module in `src/modules/`.

```text
src/modules/<module_name>/
├── controllers/    # Request handling and response (Express)
├── models/         # Mongoose schemas and Typescript interfaces
├── routes/         # Express router definitions
└── services/       # Core business logic (Complex operations)
```

### 2. Steps to Add a New API

#### A. Define the Model
Create a new model in `src/modules/<module>/models/<Entity>.ts`.

#### B. Implement the Controller
Create a controller function in `src/modules/<module>/controllers/<Entity>Controller.ts`. 
> [!TIP]
> Use the `AuthenticatedRequest` interface to access `req.user`.

#### C. Define the Routes
Register the routes in `src/modules/<module>/routes/<entity>Routes.ts`.
```typescript
import { Router } from 'express';
import { protect } from '../../../middlewares/authMiddleware.js';
import * as Controller from '../controllers/EntityController.js';

const router = Router();
router.post('/', protect, Controller.createEntity);
export default router;
```

#### D. Integrate with Module Router
Ensure the entity routes are used in the main module router (`src/modules/<module>/routes/<module>.routes.ts`).

#### E. Document with Swagger
Add `@swagger` JSDoc annotations to your controller functions. These will automatically appear in `http://localhost:5000/api-docs`.

---

## Summary Table for Quick Reference

| Module | Resource | Base Route | Auth Required |
| --- | --- | --- | --- |
| Core | Auth | `/api/auth` | No (for login/reg) |
| Core | User | `/api/users` | Yes |
| Inventory | Items | `/api/items` | Yes |
| Sales | Invoices | `/api/sales/invoices` | Yes |
| Purchase | Bills | `/api/purchase` | Yes |
| Finance | Bank | `/api/finance/accounts` | Yes |
| CRM | Customer | `/api/crm/customers` | Yes |
| HR | Employees | `/api/hr/employees` | Yes |

---
*Documented by Antigravity AI on 2026-01-25.*
