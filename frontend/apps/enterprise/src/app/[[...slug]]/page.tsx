"use client";

import React, { Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { EnterpriseMainView } from '@/views/Views/ui/EnterpriseMainView';

export default function CatchAllPage() {
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-app flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 relative">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin"></div>
        </div>
        <p className="mt-6 text-secondary font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">Initializing Interface</p>
      </div>
    );
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BrowserRouter basename="/enterprise">
        <EnterpriseMainView />
      </BrowserRouter>
    </Suspense>
  );
}
