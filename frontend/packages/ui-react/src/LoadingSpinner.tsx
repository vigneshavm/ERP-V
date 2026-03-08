import React from 'react';

export const LoadingSpinner: React.FC = () => {
    return (
        <div className="loading-spinner-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div 
                className="spinner" 
                style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid var(--surface-border)',
                    borderTop: '4px solid var(--primary-color)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}
            />
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};
