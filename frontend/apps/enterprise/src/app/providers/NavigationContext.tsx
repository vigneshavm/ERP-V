"use client";

import React, { createContext, useContext, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppView } from '@repo/shared';
import { MENU_ITEMS } from '@/app/config/menu.config';

// ─── Build a single view → path map from menu.config (one source of truth) ───

function buildViewToPath(): Record<string, string> {
    const map: Record<string, string> = {
        LANDING: '/',
        DASHBOARD: '/dashboard',
        DASHBOARD_OVERVIEW: '/dashboard',
    };
    const walk = (items: typeof MENU_ITEMS) => {
        for (const item of items) {
            if (item.path) map[item.id] = item.path;
            if (item.children) walk(item.children as typeof MENU_ITEMS);
        }
    };
    walk(MENU_ITEMS);
    return map;
}

const VIEW_TO_PATH = buildViewToPath();

// Reverse map: path prefix → AppView (longest match wins)
const PATH_TO_VIEW = (Object.entries(VIEW_TO_PATH) as Array<[AppView, string]>)
    .map(([view, path]) => [path, view] as [string, AppView])
    .sort((a, b) => b[0].length - a[0].length); // longest path first

export function getViewFromPath(pathname: string): AppView {
    // Strip basepath prefix if running under /enterprise
    const clean = pathname.replace(/^\/enterprise/, '') || '/';
    for (const [path, view] of PATH_TO_VIEW) {
        if (clean === path || clean.startsWith(path === '/' ? '/_never_' : path + '/') || clean === path) {
            return view;
        }
    }
    return 'DASHBOARD';
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface NavigationContextType {
    currentView: AppView;
    navigate: (view: AppView) => void;
    /** @deprecated use navigate(view) */
    setCurrentView: (view: AppView) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const routerNavigate = useNavigate();
    const location = useLocation();

    const currentView = getViewFromPath(location.pathname);

    const navigate = useCallback((view: AppView) => {
        const path = VIEW_TO_PATH[view];
        if (!path) return;
        const clean = location.pathname.replace(/^\/enterprise/, '') || '/';
        if (clean !== path) routerNavigate(path);
    }, [routerNavigate, location.pathname]);

    return (
        <NavigationContext.Provider value={{ currentView, navigate, setCurrentView: navigate }}>
            {children}
        </NavigationContext.Provider>
    );
};

export const useNavigation = () => {
    const ctx = useContext(NavigationContext);
    if (!ctx) throw new Error('useNavigation must be used within a NavigationProvider');
    return ctx;
};
