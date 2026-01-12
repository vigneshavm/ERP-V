import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppView } from '../types/common';

interface UIState {
    activeTab: AppView;
    sidebarOpen: boolean;
    desktopCollapsed: boolean;
    isSyncing: boolean;
}

const initialState: UIState = {
    activeTab: 'DASHBOARD',
    sidebarOpen: false,
    desktopCollapsed: false,
    isSyncing: false,
};

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        setActiveTab: (state, action: PayloadAction<AppView>) => {
            state.activeTab = action.payload;
        },
        toggleSidebar: (state) => {
            state.sidebarOpen = !state.sidebarOpen;
        },
        setSidebarOpen: (state, action: PayloadAction<boolean>) => {
            state.sidebarOpen = action.payload;
        },
        setDesktopCollapsed: (state, action: PayloadAction<boolean>) => {
            state.desktopCollapsed = action.payload;
        },
        setSyncing: (state, action: PayloadAction<boolean>) => {
            state.isSyncing = action.payload;
        },
    },
});

export const { setActiveTab, toggleSidebar, setSidebarOpen, setDesktopCollapsed, setSyncing } = uiSlice.actions;
export default uiSlice.reducer;
