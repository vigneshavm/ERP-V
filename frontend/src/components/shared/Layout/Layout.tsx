import React from 'react';

interface LayoutProps {
    children: React.ReactNode;
    fullWidth?: boolean;
}

/**
 * Layout wrapper for pages rendered inside TenantView.
 * Note: Sidebar is NOT included here since App.tsx TenantView already provides the main layout with sidebar.
 * This component is a simple content wrapper for consistency across pages.
 */
const Layout: React.FC<LayoutProps> = ({ children, fullWidth = false }) => {
    return (
        <div className="w-full min-h-full animate-in fade-in duration-500">
            <div className={`${fullWidth ? 'w-full' : 'max-w-7xl mx-auto px-4 lg:px-8'} w-full h-full pb-10`}>
                {children}
            </div>
        </div>
    );
};

export default Layout;

