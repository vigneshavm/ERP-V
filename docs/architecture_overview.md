# BizzAI ERP: Frontend Architecture Overview

## 1. Architectural Style: Monorepo
The frontend is organized as a **Turbo-managed Monorepo**, ensuring consistency across multiple specialized applications while sharing core UI and business logic.

- **Apps Directory (`apps/`)**: Contains standalone React applications.
- **Packages Directory (`packages/`)**: Shared libraries and utilities.

---

## 2. Core Tech Stack (2026 Standards)
We leverage the latest stable versions for performance and developer experience:

- **React 19**: Utilizing `use`, Server Components (where applicable), and improved ref handling.
- **Tailwind v4**: Next-gen CSS engine with zero-runtime overhead and enhanced JIT.
- **Next.js 15 (App Router)**: Powering the Personal and Business apps for SSR/SSG benefits.
- **Vite**: Ultra-fast build tool powering the Enterprise ERP portal.
- **Redux Toolkit**: Centralized state management for complex Enterprise modules.

---

## 3. Application Landscape

### 📱 Personal Finance (`apps/personal`)
- **Framework**: Next.js 15
- **Purpose**: Mobile-first, individual expense tracking and goal setting.
- **Structure**: Next.js App Router (`app/` directory).

### 🏢 Business Finance (`apps/business`)
- **Framework**: Next.js 15
- **Purpose**: SMB-focused financial management and invoicing.
- **Structure**: Next.js App Router (`app/` directory).

### 🏭 Enterprise ERP (`apps/enterprise`)
- **Framework**: Vite + React 19
- **Purpose**: High-complexity resource planning (Commercial, Financial, HR, Analytics).
- **Structure**: Modular architecture by domain (Features/Modules).
- **Key Modules**:
    - **Commercial**: Inventory, POS, Sales, Purchase.
    - **Financial**: Expense, Cash/Bank, Reconciliation.
    - **People**: HR, CRM, Vendor management.

---

## 4. Shared Resources (`packages/`)

### 🎨 `@repo/ui`
Shared component library built with Tailwind v4.
- **Design System**: Atomic-based components (Buttons, Cards, Modals).
- **Theming**: Integrated Dark/Light mode support.

### 🛠️ `@repo/shared`
Common business logic and definitions.
- **Types**: Unified TypeScript interfaces for SMS transactions, User Profiles, etc.
- **Utils**: Formatting, validation, and API client wrappers.

---

## 5. Folder Convention (Standardized)
All apps follow a consistent internal structure (with framework-specific nuances):

```text
src/ (or app/)
├── components/   # Shared components within the app
├── features/     # Domain-specific logic and UI
├── hooks/        # Custom React hooks
├── services/     # API and external integrations
├── types/        # TypeScript definitions
└── utils/        # Internal utility functions
```
