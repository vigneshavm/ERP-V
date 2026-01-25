import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
    activeTab: string;
}

const initialState: UiState = {
    activeTab: 'DASHBOARD',
};

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        setActiveTab: (state, action: PayloadAction<string>) => {
            state.activeTab = action.payload;
        },
    },
});

export const { setActiveTab } = uiSlice.actions;

export default uiSlice.reducer;
