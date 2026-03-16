"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from '@/widgets/layout/Sidebar';
import Header from '@/widgets/layout/Header';
import BottomNav from '@/widgets/layout/BottomNav';
import { useAuthStore } from '@repo/shared';
import { useNavigation } from '@/shared/contexts/NavigationContext';

// Settings Overlays
import LanguageSettings from '@/features/settings/components/LanguageSettings';
import CurrencySettings from '@/features/settings/components/CurrencySettings';
import AppearanceSettings from '@/features/settings/components/AppearanceSettings';
import HelpSupport from '@/features/settings/components/HelpSupport';
import BackupRestore from '@/features/settings/components/BackupRestore';
import DataManagement from '@/features/settings/components/DataManagement';
import InviteFriends from '@/features/settings/components/InviteFriends';
import EditProfile from '@/features/settings/components/EditProfile';
import SyncStatus from '@/features/settings/components/SyncStatus';
import SecurityPin from '@/features/auth/components/SecurityPin';
import SecurityLock from '@/features/auth/components/SecurityLock';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    useAuthStore();
    const navigation = useNavigation();
    const { 
        isLanguageOpen, setIsLanguageOpen,
        isCurrencyOpen, setIsCurrencyOpen,
        isAppearanceOpen, setIsAppearanceOpen,
        isHelpOpen, setIsHelpOpen,
        isBackupOpen, setIsBackupOpen,
        isDataManagementOpen, setIsDataManagementOpen,
        isInviteFriendsOpen, setIsInviteFriendsOpen,
        isEditProfileOpen, setIsEditProfileOpen,
        isSyncStatusOpen, setIsSyncStatusOpen,
        isPinOverlayOpen, setIsPinOverlayOpen,
        isBioLockOpen, setIsBioLockOpen
    } = navigation;

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

    useEffect(() => {
        // Run only on client after mount to prevent hydration mismatch
        const saved = localStorage.getItem('sidebar-collapsed');
        if (saved !== null) {
            setIsSidebarCollapsed(saved === 'true');
        } else if (window.innerWidth < 1024) {
            setIsSidebarCollapsed(true);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('sidebar-collapsed', String(isSidebarCollapsed));
    }, [isSidebarCollapsed]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setIsSidebarCollapsed(true);
            } else {
                const saved = localStorage.getItem('sidebar-collapsed');
                if (saved !== 'true') {
                    setIsSidebarCollapsed(false);
                }
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Placeholder for Auth/Pin overlays
    // We'll port those components later
    
    return (
        <div className={`app-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            <Sidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />

            <div className="main-layout-wrapper">
                <Header />

                <main className="main-content-area">
                    <div className="view-content-wrapper">
                        {children}
                    </div>
                </main>
            </div>

            <BottomNav />

            {/* Global Overlays */}
            {isLanguageOpen && <LanguageSettings onClose={() => setIsLanguageOpen(false)} />}
            {isCurrencyOpen && <CurrencySettings onClose={() => setIsCurrencyOpen(false)} />}
            {isAppearanceOpen && <AppearanceSettings onClose={() => setIsAppearanceOpen(false)} />}
            {isHelpOpen && <HelpSupport onClose={() => setIsHelpOpen(false)} />}
            {isBackupOpen && <BackupRestore onClose={() => setIsBackupOpen(false)} />}
            {isDataManagementOpen && <DataManagement onClose={() => setIsDataManagementOpen(false)} />}
            {isInviteFriendsOpen && <InviteFriends onClose={() => setIsInviteFriendsOpen(false)} />}
            {isEditProfileOpen && <EditProfile onClose={() => setIsEditProfileOpen(false)} />}
            {isSyncStatusOpen && <SyncStatus onClose={() => setIsSyncStatusOpen(false)} />}
            {isBioLockOpen && <SecurityLock onClose={() => setIsBioLockOpen(false)} />}
            {isPinOverlayOpen && (
                <SecurityPin 
                    mode="ENTER" 
                    onClose={() => setIsPinOverlayOpen(false)} 
                    onSuccess={() => setIsPinOverlayOpen(false)} 
                    existingPin={typeof window !== 'undefined' ? localStorage.getItem('app-pin') || undefined : undefined}
                />
            )}
        </div>
    );
}
