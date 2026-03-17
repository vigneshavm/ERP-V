# BizzAI ERP: Frontend Architecture Deep Dive

This document provides a technical deep dive into the frontend orchestration and  used in BizzAI ERP.

## 🛰️ 1. Multi-Zone Orchestration (Next.js)

The project leverages **Next.js Multi-Zones** to consolidate multiple independent applications into a single user-facing domain.

### Rewrite Matrix (`auth/next.config.ts`)
The Shell application acts as a reverse proxy, rewriting paths to specific MFE services.

| Prefix | Target MFE | Implementation | Primary Role |
| :--- | :--- | :--- | :--- |
| `/` | **Shell (Auth)** | Next.js | Gateway / Orchestrator |
| `/personal` | **Personal** | Next.js | Consumer Zone |
| `/business` | **Business** | Next.js | Consumer Zone |
| `/enterprise`| **Enterprise** | **Hybrid** (Next + Vite) | **Module Federation Host** |
| `/api` | **Backend** | Express | Data Provider |

### 🏭 2. The Enterprise "Hybrid" Model

The **Enterprise MFE** uses a unique dual-engine approach to support high-complexity resource planning.

#### A. Next.js "Wrapper" (`src/app/[[...slug]]`)
Runs on **Next.js 15** for Multi-Zone compatibility but uses a **Catch-all route** to bootstrap a client-side router.
- **Bootstrapping**: `[[...slug]]/page.tsx` mounts `BrowserRouter` with `basename="/enterprise"`.

#### B. React SPA "Engine"
Internally, Enterprise functions as a pure SPA using **React Router** to manage complex Redux state and deep view trees without the overhead of full-page Next.js transitions.

#### C. Module Federation Host (`vite.config.ts`)
Enterprise acts as a **Host** for other remotes (e.g., Budget Planner). The **Vite** config enables dynamic remote injection and provides build-time flexibility for SPA delivery.

---

## 🏛️ 3. MFE Pattern Comparison: Standard vs. Hybrid Host

The architecture intentionally distinguishes between "Consumer Zones" (Business/Personal) and the "Enterprise Host" based on scalability requirements.

| Feature | Standard Zone (Business/Personal) | Hybrid Host (Enterprise) |
| :--- | :--- | :--- |
| **Routing** | Static (Next.js rewrites) | **Dynamic** (Module Federation) |
| **Composition** | Compile-time / Multi-zone | **Runtime injection** |
| **Sub-module Deployment** | Requires full app rebuild | **Decoupled** (Update remotes independently) |
| **Dev Engine** | Next.js (Webpack/Turbo) | **Vite** (Instant HMR for huge modules) |
| **Use Case** | Vertical domain features | **Ecosystem Hub** (Aggregates multiple sub-apps) |

### 🚀 Strategic Advantages of the Hybrid Host

1.  **Infinite Scalability (Runtime Remotes)**:
    The Enterprise MFE can import new functionality from completely different repositories at runtime. For example, a "Cloud Accounting" team can deploy their remote without the "Enterprise Core" team ever knowing or triggering a build. Standard zones are restricted to their own internal package boundary.

2.  **Performance at Scale**:
    Vite's esbuild-powered engine handles the thousand-component scale of an ERP much faster than standard Next.js during development. The hybrid wrapper ensures this speed doesn't sacrifice the SSR/SEO benefits required at the Shell entry point.

3.  **Shared Instance Protocol**:
    As an MF Host, Enterprise shares its `react`, `react-dom`, and `react-redux` instances with all injected remotes. This prevents "Dependency Bloat" where each sub-app would otherwise load its own copy of React.

---

## 🏗️ 4. Strategic Framework Selection: Why not Hybrid for all?

A common question is why **Business** and **Personal** MFEs remain pure Next.js instead of adopting the Enterprise "Hybrid" model. This is a deliberate architectural choice based on the **"Complexity vs. Value"** tradeoff.

### ⚖️ The Comparison Table

| Feature | Consumer Zone (Personal/Business) | Strategic Choice |
| :--- | :--- | :--- |
| **Primary Goal** | Fast UX, SEO, and Low Maintenance | **Standard Next.js** |
| **Build System** | Single (Next.js/Turbo) | Low overhead; no dual-config sync. |
| **Data Fetching** | Server-Side Rendering (SSR) | Critical for initial load performance on mobile. |
| **Architecture** | Feature-Sliced Design (FSD) | Localized complexity management. |
| **Federation** | **Consumer** | Doesn't need to host external remotes. |

### 🔑 Rationale for Pure Next.js in Consumers

1.  **Lower Maintenance Overhead**:
    The Hybrid model requires synchronous maintenance of **Vite** and **Next.js** configurations. For consumer zones, which have clear vertical boundaries, this extra complexity offers zero ROI since they don't need to host dynamic remotes.

2.  **SEO & SSR Optimization**:
    Consumer-facing applications often require search visibility and fast "Time to First Byte" (TTFB). Pure Next.js is fine-tuned for these patterns, whereas the Hybrid model introduces a "Catch-all transition" that can marginally delay the initial render.

3.  **Architectural Clarity (The Host/Remote Principle)**:
    In a healthy MFE ecosystem, you should have **clear entry points (Hosts)** and **functional modules (Remotes/Consumers)**. Making every MFE a "Hybrid Host" creates an architectural bottleneck and increases the risk of circular dependencies and dependency versioning conflicts.

---

## 🏛️ 5. Unified Architectural Pattern: FSD Standard

The project mandates **Feature-Sliced Design (FSD)** across all MFEs to prevent "Spaghetti Code" in a multi-zone environment.

### 🏁 Alignment Strategy: Closing the Gaps

#### Enterprise (Hybrid Host) Alignment
Enterprise currently has redundant `views` and `hooks` directories.
- **Goal**: Decompose `src/views/` (21 domain folders) into FSD-compliant `features/` (logic) and `widgets/` (composition).
- **Goal**: Move top-level `src/hooks/` to `src/shared/hooks/` to follow the standard layer hierarchy.

#### Auth (Shell) Alignment
The Shell uses a legacy flat structure (`src/components`, `src/views`).
- **Goal**: Implement a "Shell-as-a-Feature" logic.
- **Goal**: Move `src/store/authStore` to `entities/auth/model/` and `src/components/` to `shared/ui/`.

---

Because MFEs run in separate processes (or as separate zones), standard React state sharing (Context/Redux) is not possible across zone boundaries.

### BroadcastChannel Implementation (`@repo/shared`)
The `EventBus` class implements a singleton pattern around the browser's `BroadcastChannel` API.

```typescript
// Example: Broadcaster (Shell)
eventBus.publish('AUTH_LOGOUT', { reason: 'user_initiated' });

// Example: Subscriber (MFE)
const unsubscribe = eventBus.subscribe('AUTH_LOGOUT', () => {
  redirectToLogin();
});
```

- **Scope**: Works across tabs, windows, and cross-zone navigations within the same origin.
- **Reliability**: Ensures that a logout in the Shell immediately propagates to all active MFE modules.

---

## 🏗️ 3. Feature-Sliced Design (FSD) Deep Dive

The `apps/business` and `apps/personal` applications implement FSD to manage complexity.

### Case Study: Accounting Feature (`src/features/accounting`)
The feature is split into logical layers to prevent circular dependencies:

- **`views/`**: Page-level compositions (e.g., `LedgerView`).
- **`components/`**: Feature-specific UI elements (e.g., `JournalEntryForm`).
- **`model/`** (Implicitly handled): Domain types and business rules.

### Cross-Layer Protocol
- **Shared -> Entities**: Shared components are domain-agnostic.
- **Features -> Widgets**: Features implement interaction logic; Widgets compose multiple features.
- **Widgets -> Pages**: Pages are thin wrappers that mount widgets into a layout.

---

## 🎨 4. Shared UI and Tailwind v4

### Component Library (`@repo/ui`)
The shared UI library provides "Atomic" components that ensure visual consistency across all zones.
- **Tailwind v4**: Uses the latest JIT engine for extreme performance.
- **Patterns**: High-quality, styled components like `AuthGuard`, `Button`, and `Card` are imported via workspace references.

### Transpilation
The Shell application explicitly transpiles these shared packages in `next.config.ts`:
```typescript
transpilePackages: ["@repo/ui", "@repo/shared", "@repo/b2b-services"]
```

---

## 🧠 5. State Management Strategy

| Tool | Usage Context | Rationale |
| :--- | :--- | :--- |
| **Zustand** | Auth & UI State | Lightweight, minimal boilerplate for cross-zone persistence. |
| **Redux Toolkit** | Enterprise Domain | High complexity management for legacy/heavy ERP modules. |
| **React Query** | Server State | Automatic caching, revalidation, and loading states for API data. |
| **React Context** | Layout/Theming | Scoped UI settings that don't require external state stores. |
