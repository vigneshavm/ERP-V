'use client';
/**
 * Layout — Page content area wrapper.
 *
 * Sits inside TenantView's main scrolling column.
 * Provides a consistent z-index layer above the body grid pattern.
 */
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => (
  <div className="w-full relative z-10">
    {children}
  </div>
);

export default Layout;
