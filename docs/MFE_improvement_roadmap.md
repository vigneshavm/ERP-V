# Technical Improvement Roadmap: ERP Frontend 2.0

This document provides a granular blueprint for transitioning the current ERP codebase into a state-of-the-art, scalable ecosystem.

---

## 1. Feature-Sliced Design (FSD) Migration
The current flat structure in `apps/enterprise/src` is the primary bottleneck. We will migrate to FSD to group logic by business context rather than technical type.

### Phase 1: Structural Setup
Create the standard FSD layers:
```bash
mkdir -p src/{app,pages,features,entities,shared}
```

### Phase 2: Refactoring "Finance" (Example)
**Current:**
- `src/pages/FinanceDashboard.tsx`
- `src/components/FinanceChart.tsx`
- `src/hooks/useFinanceData.ts`

**Target (FSD):**
- `src/entities/finance/`: Model for finance data, base API calls, and local state.
- `src/features/create-invoice/`: Specific UI logic for invoice creation.
- `src/pages/finance/`: Composition of the dashboard view.

### Phase 3: Boundary Protection
Add `public-api.ts` (or `index.ts`) in every slice to control exports.
**Rules:**
- A slice can only import from its own internal folders or lower layers (e.g., `features` can import from `entities` and `shared`).
- Cross-imports within the same layer (e.g., `features/a` importing from `features/b`) are STRONGLY discouraged; logic should be moved to `entities` or `shared`).

---

## 2. Dynamic Module Federation
Transition from monorepo-linked MFEs to truly independent runtime remotes.

### Host Configuration ([apps/enterprise/vite.config.ts](file:///c:/Users/vigne/Project/30/ERP/frontend/apps/enterprise/vite.config.ts))
```typescript
import federation from "@originjs/vite-plugin-federation";

export default defineConfig({
  plugins: [
    federation({
      name: 'host-app',
      remotes: {
        'budget_planner': 'http://localhost:3001/assets/remoteEntry.js',
      },
      shared: ['react', 'react-dom', 'react-router-dom', '@reduxjs/toolkit', 'react-redux']
    })
  ],
  // ...
});
```

### Remote Configuration (`mfe/personal/budget-planner/vite.config.ts`)
```typescript
import federation from "@originjs/vite-plugin-federation";

export default defineConfig({
  plugins: [
    federation({
      name: 'budget_planner',
      filename: 'remoteEntry.js',
      exposes: {
        './App': './src/App.tsx',
      },
      shared: ['react', 'react-dom']
    })
  ],
  // ...
});
```

---

## 3. Shared Kernel & UI Kit
*   **Headless UI Conversion:** Refactor `@yourcompany/ui-react` to use **Radix UI** or **Headless UI**. This ensures that the components are accessible and unstyled, allowing different apps/MFEs to apply their own implementation of the design system without conflicting logic.
*   **Zod Schema Sharing:** Centralize business validation logic in `@repo/shared-kernel/schemas` to ensure consistent data contracts across the Backend, Host App, and MFEs.

---

## 4. Performance & Observability
*   **Zustand for MFE State:** Use **Zustand** for lightweight, localized MFE state instead of bloating the global Redux store.
*   **Sentry Traces:** Implement transaction tracing across the Federation boundary to track user journeys that span multiple MFEs.

---

## 5. Workspace Harmonization
Ensure `@repo/common` doesn't become a duplicate of `packages/`. 

*   **Move to `@repo/shared-kernel`**: All Zod schemas and TypeScript interfaces that define the "ERP Language" (e.g., `Invoice`, `Employee`, `InventoryItem`).
*   **Move to `@repo/ui-react`**: All "Atomic" components (Buttons, Inputs, Modals) that have zero business knowledge.
*   **Domain Libraries**: Keep `@yourcompany/finance-lib` strictly for purely functional math/logic (e.g., tax calculation, interest rates) with no UI or API dependencies.

---

> [!IMPORTANT]
> **2035 Architect Final Note:** The goal is to move from a "Codebase" to an "Ecosystem." Each MFE should be deployable by a single developer on a Friday afternoon without fear. 
