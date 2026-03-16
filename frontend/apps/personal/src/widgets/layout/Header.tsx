"use client";

import React from 'react';
import { Search, Bell, LayoutGrid, Sun, Moon, Mic, Camera } from 'lucide-react';
import { useNavigation } from '@/shared/contexts/NavigationContext';
import { useLanguage } from '@repo/shared';
import { useSettings } from '@/shared/contexts/SettingsContext';

const Header: React.FC = () => {
    const { t } = useLanguage();
    const { theme, setTheme } = useSettings();
    const { 
        currentView, 
        setCurrentView, 
        setIsSearching, 
        setIsVoiceActive, 
        setIsReceiptOCROpen 
    } = useNavigation();

    const isDark = theme === 'Dark' || (theme === 'System' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const handleToggleTheme = () => {
        setTheme(isDark ? 'Light' : 'Dark');
    };

    // Human-readable label for each view
    const VIEW_LABELS: Partial<Record<string, string>> = {
        Dashboard: t('views.dashboard'),
        Expenses: t('views.expenses'),
        Income: t('views.income'),
        Statistics: t('views.analytics'),
        Goals: t('views.goals'),
        Loans: t('views.loans'),
        Insights: t('views.yearlyInsights'),
        YearlyOverview: t('views.yearlyOverview'),
        Budget: t('views.budget'),
        Settings: t('views.settings'),
        Notifications: t('views.notifications'),
        DataManagement: t('views.dataManagement'),
        Appearance: t('views.appearance'),
        CategoryEditor: t('views.categories'),
        Recurring: t('views.recurringBills'),
        Reports: t('views.detailedReports'),
        AddTransaction: t('views.addTransaction'),
    };

    return (
        <header className="app-header">
            {/* Mobile: logo + title | Desktop: current page title */}
            <div className="header-title-container" style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                <h1 className="header-logo" onClick={() => setCurrentView('Dashboard')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCurrentView('Dashboard'); } }} role="button" tabIndex={0} aria-label="Go to Dashboard" style={{ outline: 'none' }}>EX</h1>
                <span className="header-page-title" style={{ display: 'block' }}>
                    {VIEW_LABELS[currentView as string] ?? currentView}
                </span>
            </div>

            <div className="header-actions">
                <div className="clickable" onClick={() => setIsVoiceActive(true)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsVoiceActive(true); } }} role="button" tabIndex={0} aria-label="Voice input" style={{ outline: 'none' }}>
                    <Mic size={22} style={{ color: 'var(--primary-color)' }} />
                </div>
                <div className="clickable" onClick={() => setIsReceiptOCROpen(true)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsReceiptOCROpen(true); } }} role="button" tabIndex={0} aria-label="Scan receipt" style={{ outline: 'none' }}>
                    <Camera size={22} style={{ color: 'var(--primary-color)' }} />
                </div>
                <div className="clickable" onClick={() => setIsSearching(true)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsSearching(true); } }} role="button" tabIndex={0} aria-label="Search transactions" style={{ outline: 'none' }}>
                    <Search size={22} style={{ color: 'var(--icon-color)' }} />
                </div>
                <div className="clickable" onClick={handleToggleTheme} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleToggleTheme(); } }} role="button" tabIndex={0} aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`} title={`Switch to ${isDark ? 'light' : 'dark'} mode`} style={{ outline: 'none' }}>
                    {isDark ? (
                        <Sun size={22} style={{ color: 'var(--icon-color)' }} />
                    ) : (
                        <Moon size={22} style={{ color: 'var(--icon-color)' }} />
                    )}
                </div>
                <div style={{ position: 'relative', outline: 'none' }} className="clickable" onClick={() => setCurrentView('Notifications')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCurrentView('Notifications'); } }} role="button" tabIndex={0} aria-label="View notifications">
                    <Bell size={22} style={{ color: currentView === 'Notifications' ? 'var(--primary-color)' : 'var(--icon-color)' }} />
                    <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', background: 'var(--danger-color)', borderRadius: '50%', border: `2px solid var(--bg-color)` }}></div>
                </div>
                <div className="clickable" onClick={() => setCurrentView('Settings')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCurrentView('Settings'); } }} role="button" tabIndex={0} aria-label="Settings" style={{ outline: 'none' }}>
                    <LayoutGrid size={22} style={{ color: currentView === 'Settings' ? 'var(--primary-color)' : 'var(--icon-color)' }} />
                </div>
            </div>
        </header>
    );
};


export default Header;
