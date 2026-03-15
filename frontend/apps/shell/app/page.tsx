"use client";

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryProvider } from '@repo/shared';
import ShellLayout from './layout';

// Lazy load MFEs
const PersonalMFE = lazy(() => import('personal/App'));
const BusinessMFE = lazy(() => import('business/App'));
const EnterpriseMFE = lazy(() => import('enterprise/App'));

export default function App() {
  return (
    <QueryProvider>
      <BrowserRouter>
        <ShellLayout>
          <Suspense fallback={<div className="p-8 text-center text-label-text">Loading Module...</div>}>
            <Routes>
              <Route path="/personal/*" element={<PersonalMFE />} />
              <Route path="/business/*" element={<BusinessMFE />} />
              <Route path="/enterprise/*" element={<EnterpriseMFE />} />
              <Route path="/" element={<Navigate to="/enterprise" replace />} />
            </Routes>
          </Suspense>
        </ShellLayout>
      </BrowserRouter>
    </QueryProvider>
  );
}
