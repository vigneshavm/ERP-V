import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from "../../redux/slices/authSlice";
import Login from './Login';
import { RootState } from '../../redux/store';

// Create a mock store for testing
const createMockStore = (preloadedState?: any) => configureStore({
    reducer: authReducer,
    preloadedState: preloadedState?.auth,
});

describe('Login Component', () => {
    it('renders login form', () => {
        const store = createMockStore({
            auth: {
                user: null,
                isLoading: false,
                isError: false,
                isSuccess: false,
                message: '',
                deviceConflict: false,
                conflictMessage: '',
            },
        });

        render(
            <Provider store={store}>
                <BrowserRouter>
                    <Login />
                </BrowserRouter>
            </Provider>
        );

        expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    });
});
