import { create } from 'zustand';

interface UiState {
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
    setSidebarOpen: (open: boolean) => void;
    setDesktopCollapsed: (collapsed: boolean) => void;
    setSyncing: (syncing: boolean) => void;
    setIsChangePasswordOpen: (open: boolean) => void;
    setConfirmDialog: (dialog: Partial<UiState['confirmDialog']>) => void;
    toggleSidebar: () => void;
}

export const useUiStore = create<UiState>((set) => ({
    sidebarOpen: false,
    desktopCollapsed: false,
    isSyncing: false,
    isChangePasswordOpen: false,
    confirmDialog: {
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
    },

    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    setDesktopCollapsed: (collapsed) => set({ desktopCollapsed: collapsed }),
    setSyncing: (syncing) => set({ isSyncing: syncing }),
    setIsChangePasswordOpen: (open) => set({ isChangePasswordOpen: open }),
    setConfirmDialog: (dialog) => set((state) => ({
        confirmDialog: { ...state.confirmDialog, ...dialog },
    })),
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));

