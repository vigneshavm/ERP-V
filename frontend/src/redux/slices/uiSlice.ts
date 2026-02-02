import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
    activeTab: string;
    sidebarOpen: boolean;
    desktopCollapsed: boolean;
    isSyncing: boolean;
}

const initialState: UiState = {
    activeTab: 'DASHBOARD',
    sidebarOpen: false,
    desktopCollapsed: false,
    isSyncing: false,
};

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        setActiveTab: (state, action: PayloadAction<string>) => {
            state.activeTab = action.payload;
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

export const { setActiveTab, setSidebarOpen, setDesktopCollapsed, setSyncing } = uiSlice.actions;

export default uiSlice.reducer;
