import React from 'react';

interface PageContainerProps {
    children: React.ReactNode;
    className?: string;
    fullWidth?: boolean;
}

const PageContainer: React.FC<PageContainerProps> = ({ children, className = '', fullWidth = false }) => (
    <div className={`${fullWidth ? 'w-full' : 'w-full max-w-7xl mx-auto'} ${className}`}>
        {children}
    </div>
);

export default PageContainer;
