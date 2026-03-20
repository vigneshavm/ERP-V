"use client";

import React, { Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useParams } from 'next/navigation';
import { NavigationProvider } from '@/app/providers/NavigationContext';
import { EnterpriseMainView } from '@/pages/Views/ui/EnterpriseMainView';

export default function CatchAllPage() {
  const [isClient, setIsClient] = React.useState(false);
  const params = useParams();

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

  // Detect tenant ID in slug (e.g. /enterprise/TEN001/dashboard)
  // The slug is relative to /enterprise
  const slug = (params?.slug as string[]) || [];
  let basename = "/enterprise";
  
  // If first segment looks like a tenant ID (3 letters + digits), use it in basename
  if (slug.length > 0 && /^[A-Z]{3}\d+$/.test(slug[0])) {
    basename = `/enterprise/${slug[0]}`;
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-app flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-t-primary border-white/10 rounded-full animate-spin" />
      </div>
    }>
      <BrowserRouter basename={basename}>
        <NavigationProvider>
          <EnterpriseMainView />
        </NavigationProvider>
      </BrowserRouter>
    </Suspense>
  );
}

