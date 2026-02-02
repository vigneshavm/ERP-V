import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from "../../../redux/store";
import { setSidebarOpen } from "../../../redux/slices/uiSlice";
import Sidebar from './Sidebar';
import { useTheme } from "../../../contexts/ThemeContext";
import { ThemeToggle } from '../../core/Display/ThemeToggle';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const dispatch = useDispatch();
    const { sidebarOpen, desktopCollapsed } = useSelector((state: RootState) => state.ui);
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                dispatch(setSidebarOpen(false));
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [dispatch]);

    useEffect(() => {
        document.body.style.overflow = sidebarOpen ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [sidebarOpen]);

    return (
        <div className="min-h-screen bg-[rgb(var(--color-bg))]">
            <Sidebar onLogout={() => { /* handle logout if needed or let Sidebar handle it */ }} />
            <div className={`flex flex-col min-h-screen transition-[margin] duration-300 ease-in-out ${desktopCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
                <header className="flex items-center justify-between bg-white dark:bg-[rgb(var(--color-card))] px-8 py-5 sticky top-0 z-30 transition-all duration-300">
                    <div className="flex items-center gap-4 lg:hidden">
                        <button
                            type="button"
                            onClick={() => dispatch(setSidebarOpen(true))}
                            className="inline-flex items-center justify-center rounded-xl bg-gray-50 dark:bg-slate-800 p-2 text-gray-700 dark:text-slate-200 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                        >
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <span className="text-lg font-bold text-slate-800 dark:text-white">
                            {/* Mobile Brand Name Placeholder if needed, or rely on Page Title */}
                        </span>
                    </div>

                    {/* Global Search Bar - Hidden on mobile, visible on desktop */}
                    <div className="hidden lg:flex items-center flex-1 max-w-2xl">
                        <div className="relative w-full group">
                            <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-slate-400 group-hover:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                className="block w-full pl-12 pr-4 py-3 border-none rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-sm"
                                placeholder="Search orders, customers, or products..."
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <span className="text-slate-400 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5">⌘K</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-6">
                        {/* Date Indicator */}
                        <div className="hidden xl:flex flex-col items-end mr-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today</span>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                {new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </span>
                        </div>

                        {/* Theme Toggle - Styled */}
                        <ThemeToggle />

                        {/* Alerts / Notifications */}
                        <button className="relative p-2 rounded-xl text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all group">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 group-hover:scale-110 transition-transform"></span>
                        </button>

                        {/* User Profile */}
                        <div className="flex items-center gap-3 pl-6 border-l border-slate-200 dark:border-slate-700">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 p-0.5 shadow-lg shadow-emerald-500/20 cursor-pointer hover:scale-105 transition-transform">
                                <div className="w-full h-full rounded-[10px] bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                                    <span className="font-black text-emerald-600 dark:text-emerald-400">OP</span>
                                    {/* Use an actual image tag here if avatar URL exists */}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 w-full p-4 lg:p-6 pb-20">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
