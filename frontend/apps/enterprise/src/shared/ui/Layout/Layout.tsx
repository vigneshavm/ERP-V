import React from 'react';

interface LayoutProps {
    children: React.ReactNode;
}

/**
 * Layout wrapper for pages rendered inside TenantView.
 * Note: Sidebar is NOT included here since App.tsx TenantView already provides the main layout with sidebar.
 * This component is a simple content wrapper for consistency across pages.
 */
export const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="w-full">
            {children}
        </div>
    );
};

export default Layout;

