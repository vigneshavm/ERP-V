"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '@repo/shared';


interface AuthGuardProps {
  children: React.ReactNode;
  fallbackUrl?: string;
}

/**
 * A client-side guard component that ensures the user is authenticated.
 * If not authenticated, it redirects to the authentication MFE.
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  fallbackUrl = 'http://localhost:3000' 
}) => {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      if (!isAuthenticated()) {
        console.log('🔒 AuthGuard: User not authenticated, redirecting...');
        if (fallbackUrl.startsWith('http')) {
          window.location.href = fallbackUrl;
        } else {
          navigate(fallbackUrl);
        }
      } else {
        setAuthorized(true);
      }
    };

    checkAuth();

    
    // Optional: Add storage event listener to handle cross-tab logout
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth-storage') {
        checkAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fallbackUrl]);

  // While checking auth state, show nothing or a loading spinner
  if (authorized === null) {
    return (
      <div style={{ 
        display: 'flex', 
        height: '100vh', 
        width: '100vw', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#0a0a0a',
        color: '#ffffff',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '3px solid rgba(255,255,255,0.1)', 
            borderTopColor: '#3b82f6', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.6 }}>
            Verifying Identity...
          </p>
          <style>{`
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
