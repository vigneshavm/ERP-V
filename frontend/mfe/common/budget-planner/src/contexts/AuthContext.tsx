"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
    isAuthenticated: boolean;
    userEmail: string | null;
    login: (email: string) => void;
    logout: () => void;
    authScreen: 'login' | 'signup';
    setAuthScreen: (screen: 'login' | 'signup') => void;
    isPinLocked: boolean;
    setIsPinLocked: (isLocked: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [authScreen, setAuthScreen] = useState<'login' | 'signup'>('login');
    const [isPinLocked, setIsPinLocked] = useState<boolean>(false);

    useEffect(() => {
        const auth = localStorage.getItem('app-authenticated') === 'true';
        setIsAuthenticated(auth);
        
        const email = localStorage.getItem('user-email');
        setUserEmail(email);

        const savedPin = localStorage.getItem('app-pin');
        setIsPinLocked(!!savedPin);
    }, []);

    const login = (email: string) => {
        setIsAuthenticated(true);
        setUserEmail(email);
        localStorage.setItem('app-authenticated', 'true');
        localStorage.setItem('user-email', email);
    };

    const logout = () => {
        setIsAuthenticated(false);
        setUserEmail(null);
        localStorage.removeItem('app-authenticated');
        localStorage.removeItem('user-email');
    };

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            userEmail,
            login,
            logout,
            authScreen,
            setAuthScreen,
            isPinLocked,
            setIsPinLocked
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
