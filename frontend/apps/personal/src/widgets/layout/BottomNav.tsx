"use client";

import React from 'react';
import { LayoutGrid, Receipt, Plus, Wallet, PieChart } from 'lucide-react';
import { useNavigation } from '@/shared/contexts/NavigationContext';
import { useLanguage } from '@repo/shared';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const BottomNav: React.FC = () => {
    const { t } = useLanguage();
    const { setCurrentView } = useNavigation();
    const pathname = usePathname();

    const navItems = [
        { href: '/', icon: <LayoutGrid size={24} />, label: t('nav.home') },
        { href: '/expenses', icon: <Receipt size={24} />, label: t('nav.history') },
        { href: '/income', icon: <Wallet size={24} />, label: t('nav.assets') },
        { href: '/statistics', icon: <PieChart size={24} />, label: t('nav.statistics') },
    ];

    return (
        <nav className="mobile-bottom-nav">
            {navItems.slice(0, 2).map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link 
                        key={item.href}
                        href={item.href}
                        className="clickable"
                        style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            gap: '4px', 
                            color: isActive ? 'var(--primary-color)' : 'var(--text-secondary)',
                            textDecoration: 'none'
                        }}
                    >
                        {item.icon}
                        <span style={{ fontSize: '10px', fontWeight: 600 }}>{item.label}</span>
                    </Link>
                );
            })}
            
            <div
                onClick={() => setCurrentView('AddTransaction')}
                className="clickable"
                style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '20px',
                    background: 'var(--primary-color)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: 'var(--bg-color)',
                    marginTop: '-28px',
                    boxShadow: '0 8px 25px rgba(var(--primary-color-rgb), 0.3)',
                    transition: 'all 0.3s ease'
                }}
            >
                <Plus size={32} strokeWidth={3} />
            </div>

            {navItems.slice(2).map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link 
                        key={item.href}
                        href={item.href}
                        className="clickable"
                        style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            gap: '4px', 
                            color: isActive ? 'var(--primary-color)' : 'var(--text-secondary)',
                            textDecoration: 'none'
                        }}
                    >
                        {item.icon}
                        <span style={{ fontSize: '10px', fontWeight: 600 }}>{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
};

export default BottomNav;
