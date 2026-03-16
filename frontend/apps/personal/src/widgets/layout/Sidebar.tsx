"use client";

import React from 'react';
import { LayoutGrid, Receipt, Plus, Wallet, PieChart, Settings, Bell, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigation } from '@/shared/contexts/NavigationContext';
import { useLanguage } from '@repo/shared';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
    isCollapsed: boolean;
    setIsCollapsed: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
    const { t } = useLanguage();
    const { setCurrentView } = useNavigation();
    const pathname = usePathname();

    const navItems = [
        { href: '/', icon: <LayoutGrid size={24} />, label: t('nav.home'), id: 'Dashboard' },
        { href: '/budgets', icon: <PieChart size={24} />, label: t('budgets.title'), id: 'Budgets' },
        { href: '/expenses', icon: <Receipt size={24} />, label: t('nav.history'), id: 'Expenses' },
        { href: '/income', icon: <Wallet size={24} />, label: t('nav.assets'), id: 'Income' },
        { href: '/statistics', icon: <PieChart size={24} />, label: t('nav.statistics'), id: 'Statistics' },
        { href: '/notifications', icon: <Bell size={24} />, label: t('nav.notifications'), id: 'Notifications' },
        { href: '/settings', icon: <Settings size={24} />, label: t('nav.settings'), id: 'Settings' },
    ];

    return (
        <aside className={`desktop-sidebar glass-card ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-logo" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: '32px' }}>
                <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, letterSpacing: '2px', cursor: 'pointer', margin: 0, textAlign: 'center', outline: 'none' }}>
                        {isCollapsed ? 'EX' : 'EXPANGER'}
                    </h2>
                </Link>
                <div
                    className="sidebar-toggle-btn clickable"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsCollapsed(!isCollapsed); } }}
                    role="button"
                    tabIndex={0}
                    aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    style={{ position: 'absolute', right: isCollapsed ? 'auto' : '-16px', left: isCollapsed ? '50%' : 'auto', transform: isCollapsed ? 'translateX(-50%)' : 'none', top: '0', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '50%', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, outline: 'none' }}
                >
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </div>
            </div>

            <div className="sidebar-nav-items">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link 
                            key={item.href}
                            href={item.href}
                            className={`sidebar-item clickable ${isActive ? 'active' : ''}`}
                            style={{ textDecoration: 'none', outline: 'none' }}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </div>

            <div style={{ flex: 1 }}></div>

            <div
                onClick={() => setCurrentView('AddTransaction')}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCurrentView('AddTransaction'); } }}
                role="button"
                tabIndex={0}
                aria-label={t('nav.addRecord') || 'Add Record'}
                className="clickable sidebar-add-btn"
                style={{
                    borderRadius: '16px',
                    background: 'var(--primary-color)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '12px',
                    color: 'var(--bg-color)',
                    padding: '16px',
                    boxShadow: '0 8px 25px rgba(var(--primary-color-rgb), 0.3)',
                    transition: 'all 0.3s ease',
                    fontWeight: 'bold',
                    fontSize: 'var(--font-size-base)',
                    outline: 'none'
                }}
            >
                <Plus size={24} strokeWidth={3} />
                <span>{t('nav.addRecord')}</span>
            </div>
        </aside>
    );
};

export default Sidebar;
