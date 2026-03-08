# Detailed Comparison Report: MFE vs MFE-2 Branches

This report provides a granular technical comparison between the `MFE` and `MFE-2` branches.

## 1. Architectural Transformation (FSD)

`MFE-2` represents a complete shift to **Feature-Sliced Design (FSD)**.

| Path in MFE (Legacy) | Path in MFE-2 (FSD) | Change Type |
| :--- | :--- | :--- |
| `src/redux/slices/salesInvoiceSlice.ts` | `src/entities/sales/model/salesInvoiceSlice.ts` | **Refactored** |
| `src/services/salesInvoices.ts` | `src/entities/sales/api/sales_invoices.ts` | **Refactored** |
| `src/pages/Sales/` | `src/pages/Sales/` (Composition) | **Reorganized** |
| `src/components/shared/` | `src/shared/ui/` | **Standardized** |

---

## 2. UI Component Evolution

The UI library has been fundamentally rewritten in `MFE-2` to support higher-order composition and standard enterprise aesthetics.

### Key Technical Shifts:
- **Headless UI**: `MFE-2` introduces `@radix-ui/react-slot` for the `Button` component, allowing the `asChild` pattern for better flexibility.
- **Design Token System**: `MFE-2` moves away from the "neon-italic" experiments in `MFE` toward a design system based on standard variants (`primary`, `secondary`, `ghost`, `error`) and defined sizes (`sm`, [md](file:///c:/Users/vigne/Project/30/ERP/docs/MFE_improvement_roadmap.md), `lg`).
- **Aesthetic Direction**: 
    - `MFE`: Experimental, bold italic headers, neon accents, highly custom "registry purge" modals.
    - `MFE-2`: Professional, clean typography, underline accents, standard pagination, and accessible modal structures.

---

## 3. Shared Kernel & Domain Logic

`MFE-2` significantly matures the "Shared" package into a domain-driven `shared-kernel`.

- **MFE (Legacy `shared`)**: A flat collection of `types.ts`, `utils.ts`, and `LanguageContext.tsx`.
- **MFE-2 (`shared-kernel`)**: A structured ecosystem with explicit domain subdirectories:
    - `auth/`: Centralized `auth.schema.ts` (Zod).
    - `finance/`: Interest rates and tax calculators.
    - `inventory/`: Product attributes and sector definitions.
    - `sales/`: Unified transaction schemas.
    - `schemas/`: Aggregated Zod objects for the entire ERP.

---

## 4. Module Federation Infrastructure

`MFE-2` contains the production-ready infrastructure for runtime micro-frontends:
- **`vite-plugin-federation`**: Managed in both `apps/enterprise` (Host) and MFEs (Remotes).
- **Dynamic Remotes**: Configured in `vite.config.ts` to load `remoteEntry.js` from runtime URLs (localhost:5001/5002), moving away from build-time dependencies.

---

## 5. Application Bootstrapping & Entry Points

The root of the application has been restructured to separate concerns and support the FSD architecture.

| Component | MFE (Legacy) | MFE-2 (FSD) |
| :--- | :--- | :--- |
| **Main Entry** | `src/main.tsx` | `src/app/main.tsx` |
| **Root App** | `src/App.tsx` (Monolithic) | `src/app/App.tsx` (Lightweight) |
| **Providers** | Inlined in `App.tsx` | `src/app/providers/` |

### Key Improvements:
- **Complexity Reduction**: `App.tsx` in `MFE-2` is dramatically simpler. The massive inline components like `LandingPage`, `AdminView`, and `LoadingScreen` found in `MFE` have been moved to their respective FSD layers (`pages/`, `widgets/`).
- **Provider Pattern**: Global providers (Redux, Router, Toast, QueryClient) are now managed under `src/app/providers/`, making the bootstrap sequence more readable and maintainable.

---

## 6. Summary of "Behins" in MFE

While the `MFE` branch is functionally rich, it is "behind" in technical maturity:
1. **Implicit Dependencies**: `MFE` relies on build-time linking of MFEs, which prevents independent deployments.
2. **Prop Drilling/Bloated Slices**: State is managed in monolithic slices rather than being scoped to FSD entities.
3. **Inconsistent UI**: Components are styled ad-hoc with highly specific Tailwind classes, making them difficult to reuse across different apps in the monorepo.

> [!TIP]
> **Conclusion**: `MFE-2` is the recommended base for all future feature development. The "System Data Hub" and other new features in `MFE` should be ported to the FSD structure of `MFE-2` rather than continuing development in the legacy `MFE` branch.
