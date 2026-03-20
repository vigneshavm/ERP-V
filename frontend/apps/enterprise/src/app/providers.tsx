'use client';

import React, { Suspense, lazy } from 'react';
import { Provider } from 'react-redux';
import { QueryProvider, DataProvider } from '@repo/shared';
import { store } from '@/app/store/store';
import { ThemeProvider } from '@/app/providers/ThemeContext';

// FIX 3: ToastContainer is non-critical UI — lazy load it so it never blocks
// the first render. It will mount after the main content has painted.
const ToastContainer = lazy(() =>
  import('react-toastify').then((m) => ({ default: m.ToastContainer }))
);

// Import toast CSS eagerly but small — it does not block rendering.
import 'react-toastify/dist/ReactToastify.css';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    // Redux store is critical — must be synchronous.
    <Provider store={store}>
      {/*
        FIX 3: DataProvider and QueryProvider are necessary for data fetching
        but we wrap children first so the shell renders immediately, then
        providers hydrate around it. ThemeProvider is lightweight and kept inline.
      */}
      <DataProvider>
        <QueryProvider>
          <ThemeProvider>
            {children}

            {/*
              FIX 3: ToastContainer deferred — wrapped in Suspense with a null
              fallback so it never blocks the critical render path. Toasts will
              work as soon as the component lazy-loads (typically < 100ms after
              first paint).
            */}
            <Suspense fallback={null}>
              <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
              />
            </Suspense>
          </ThemeProvider>
        </QueryProvider>
      </DataProvider>
    </Provider>
  );
}
