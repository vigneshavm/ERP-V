"use client";

import React, { createContext, useContext, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export type View = 'Dashboard' | 'Expenses' | 'Income' | 'Statistics' | 'Goals' | 'Loans' | 'Insights' | 'YearlyOverview' | 'Budget' | 'Settings' | 'Notifications' | 'DataManagement' | 'Appearance' | 'CategoryEditor' | 'Recurring' | 'Reports' | 'AddTransaction' | 'CategoryDetails';

interface CategoryDetailsState {
    categoryId: string;
    categoryName: string;
    categoryValue: number;
    categoryColor: string;
}

interface NavigationContextType {
    currentView: View;
    setCurrentView: (view: View) => void;
    categoryDetailsState: CategoryDetailsState | null;
    setCategoryDetails: (details: CategoryDetailsState) => void;
    navigateToCategoryDetails: (categoryId: string, categoryName: string, categoryValue: number, categoryColor: string) => void;
    
    // Modal States
    isSearching: boolean;
    setIsSearching: (open: boolean) => void;
    isVoiceActive: boolean;
    setIsVoiceActive: (open: boolean) => void;
    isRemindersOpen: boolean;
    setIsRemindersOpen: (open: boolean) => void;
    isCurrencyOpen: boolean;
    setIsCurrencyOpen: (open: boolean) => void;
    isLanguageOpen: boolean;
    setIsLanguageOpen: (open: boolean) => void;
    isSyncStatusOpen: boolean;
    setIsSyncStatusOpen: (open: boolean) => void;
    isBackupOpen: boolean;
    setIsBackupOpen: (open: boolean) => void;
    isEditProfileOpen: boolean;
    setIsEditProfileOpen: (open: boolean) => void;
    isBioLockOpen: boolean;
    setIsBioLockOpen: (open: boolean) => void;
    isAppearanceOpen: boolean;
    setIsAppearanceOpen: (open: boolean) => void;
    isHelpOpen: boolean;
    setIsHelpOpen: (open: boolean) => void;
    isSMSHelperOpen: boolean;
    setIsSMSHelperOpen: (open: boolean) => void;
    isBankStatementOpen: boolean;
    setIsBankStatementOpen: (open: boolean) => void;
    isCategoryEditorOpen: boolean;
    setIsCategoryEditorOpen: (open: boolean) => void;
    isDataManagementOpen: boolean;
    setIsDataManagementOpen: (open: boolean) => void;
    isRateUsOpen: boolean;
    setIsRateUsOpen: (open: boolean) => void;
    isInviteFriendsOpen: boolean;
    setIsInviteFriendsOpen: (open: boolean) => void;
    isReceiptOCROpen: boolean;
    setIsReceiptOCROpen: (open: boolean) => void;
    isPinOverlayOpen: boolean;
    setIsPinOverlayOpen: (open: boolean) => void;
    assetsSubView: 'Accounts' | 'Credit' | 'Debit' | 'Calendar' | 'Details';
    setAssetsSubView: (view: 'Accounts' | 'Credit' | 'Debit' | 'Calendar' | 'Details') => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const router = useRouter();
    const pathname = usePathname();

    // Map path to view
    const getViewFromPath = (path: string): View => {
        if (path === '/') return 'Dashboard';
        if (path === '/expenses') return 'Expenses';
        if (path === '/income') return 'Income';
        if (path === '/statistics') return 'Statistics';
        if (path === '/goals') return 'Goals';
        if (path === '/loans') return 'Loans';
        if (path === '/insights') return 'Insights';
        if (path === '/calendar') return 'YearlyOverview';
        if (path === '/budget') return 'Budget';
        if (path === '/settings') return 'Settings';
        if (path === '/notifications') return 'Notifications';
        return 'Dashboard';
    };

    const currentView = getViewFromPath(pathname);

    const setCurrentView = (view: View) => {
        const viewToPath: Partial<Record<View, string>> = {
            'Dashboard': '/',
            'Expenses': '/expenses',
            'Income': '/income',
            'Statistics': '/statistics',
            'Goals': '/goals',
            'Loans': '/loans',
            'Insights': '/insights',
            'YearlyOverview': '/calendar',
            'Budget': '/budget',
            'Settings': '/settings',
            'Notifications': '/notifications'
        };
        const path = viewToPath[view];
        if (path) {
            router.push(path);
        }
    };

    const [categoryDetailsState, setCategoryDetailsState] = useState<CategoryDetailsState | null>(null);

    const [isSearching, setIsSearching] = useState(false);
    const [isVoiceActive, setIsVoiceActive] = useState(false);
    const [isRemindersOpen, setIsRemindersOpen] = useState(false);
    const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
    const [isLanguageOpen, setIsLanguageOpen] = useState(false);
    const [isSyncStatusOpen, setIsSyncStatusOpen] = useState(false);
    const [isBackupOpen, setIsBackupOpen] = useState(false);
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [isBioLockOpen, setIsBioLockOpen] = useState(false);
    const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [isSMSHelperOpen, setIsSMSHelperOpen] = useState(false);
    const [isBankStatementOpen, setIsBankStatementOpen] = useState(false);
    const [isCategoryEditorOpen, setIsCategoryEditorOpen] = useState(false);
    const [isDataManagementOpen, setIsDataManagementOpen] = useState(false);
    const [isRateUsOpen, setIsRateUsOpen] = useState(false);
    const [isInviteFriendsOpen, setIsInviteFriendsOpen] = useState(false);
    const [isReceiptOCROpen, setIsReceiptOCROpen] = useState(false);
    const [isPinOverlayOpen, setIsPinOverlayOpen] = useState(false);
    const [assetsSubView, setAssetsSubView] = useState<'Accounts' | 'Credit' | 'Debit' | 'Calendar' | 'Details'>('Accounts');

    const navigateToCategoryDetails = (categoryId: string, categoryName: string, categoryValue: number, categoryColor: string) => {
        setCategoryDetailsState({ categoryId, categoryName, categoryValue, categoryColor });
        // In Next.js, we might want to use a dynamic route like /expenses/[id]
        // But for parity with existing logic, we'll use local state for now
        router.push('/expenses?view=CategoryDetails');
    };

    return (
        <NavigationContext.Provider value={{
            currentView, setCurrentView,
            categoryDetailsState, 
            setCategoryDetails: setCategoryDetailsState,
            navigateToCategoryDetails,
            isSearching, setIsSearching,
            isVoiceActive, setIsVoiceActive,
            isRemindersOpen, setIsRemindersOpen,
            isCurrencyOpen, setIsCurrencyOpen,
            isLanguageOpen, setIsLanguageOpen,
            isSyncStatusOpen, setIsSyncStatusOpen,
            isBackupOpen, setIsBackupOpen,
            isEditProfileOpen, setIsEditProfileOpen,
            isBioLockOpen, setIsBioLockOpen,
            isAppearanceOpen, setIsAppearanceOpen,
            isHelpOpen, setIsHelpOpen,
            isSMSHelperOpen, setIsSMSHelperOpen,
            isBankStatementOpen, setIsBankStatementOpen,
            isCategoryEditorOpen, setIsCategoryEditorOpen,
            isDataManagementOpen, setIsDataManagementOpen,
            isRateUsOpen, setIsRateUsOpen,
            isInviteFriendsOpen, setIsInviteFriendsOpen,
            isReceiptOCROpen, setIsReceiptOCROpen,
            isPinOverlayOpen, setIsPinOverlayOpen,
            assetsSubView, setAssetsSubView
        }}>
            {children}
        </NavigationContext.Provider>
    );
};

export const useNavigation = () => {
    const context = useContext(NavigationContext);
    if (context === undefined) {
        throw new Error('useNavigation must be used within a NavigationProvider');
    }
    return context;
};
