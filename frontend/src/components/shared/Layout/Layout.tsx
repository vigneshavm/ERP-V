import React from 'react';
import PageContainer from './PageContainer';

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
            <PageContainer fullWidth={fullWidth} className="h-full pb-10">
                {children}
            </PageContainer>
        </div>
    );
};

export default Layout;

