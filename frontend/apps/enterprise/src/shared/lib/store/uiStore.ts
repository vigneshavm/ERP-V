import { create } from 'zustand';
import { AppView } from '@repo/shared-kernel';

interface UiState {
    activeTab: AppView;
    sidebarOpen: boolean;
    desktopCollapsed: boolean;
    isSyncing: boolean;
    isChangePasswordOpen: boolean;
    confirmDialog: {
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    };

    // Actions
    setActiveTab: (tab: AppView) => void;
    setSidebarOpen: (open: boolean) => void;
    setDesktopCollapsed: (collapsed: boolean) => void;
    setSyncing: (syncing: boolean) => void;
    setIsChangePasswordOpen: (open: boolean) => void;
    setConfirmDialog: (dialog: Partial<UiState['confirmDialog']>) => void;
    toggleSidebar: () => void;
}

export const useUiStore = create<UiState>((set: any) => ({
    activeTab: 'DASHBOARD' as AppView,
    sidebarOpen: false,
    desktopCollapsed: false,
    isSyncing: false,
    isChangePasswordOpen: false,
    confirmDialog: {
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    },

    setActiveTab: (tab: AppView) => set({ activeTab: tab }),
    setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
    setDesktopCollapsed: (collapsed: boolean) => set({ desktopCollapsed: collapsed }),
    setSyncing: (syncing: boolean) => set({ isSyncing: syncing }),
    setIsChangePasswordOpen: (open: boolean) => set({ isChangePasswordOpen: open }),
    setConfirmDialog: (dialog: Partial<UiState['confirmDialog']>) => set((state: UiState) => ({
        confirmDialog: { ...state.confirmDialog, ...dialog }
    })),
    toggleSidebar: () => set((state: UiState) => ({ sidebarOpen: !state.sidebarOpen })),
}));
