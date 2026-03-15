"use client";

import React from 'react';
import { useAuthStore } from '@repo/mfe-auth';
import { useRouter } from 'next/navigation';

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  React.useEffect(() => {
    if (!isAuthenticated) {
      // Redirect to unified auth if not logged in
      const currentHost = typeof window !== 'undefined' ? window.location.origin : '';
      const loginUrl = `http://localhost:3000/login?redirect=${encodeURIComponent(currentHost)}`;
      window.location.href = loginUrl;
    }
  }, [isAuthenticated, router]);


  return (
    <div className="shell-container min-h-screen bg-background text-foreground">
      <header className="shell-header border-b flex items-center justify-between px-6 py-4">
        <h1 className="text-xl font-bold tracking-tight">AI ERP Console</h1>
        <div className="flex items-center gap-4">
          {/* Global Search, Notifications, User Profile */}
        </div>
      </header>
      <main className="shell-main flex">
        <aside className="shell-sidebar w-64 border-r min-h-[calc(100vh-64px)] p-4">
          {/* Global Navigation */}
        </aside>
        <section className="shell-content flex-1 p-6">
          {children}
        </section>
      </main>
    </div>
  );
}
