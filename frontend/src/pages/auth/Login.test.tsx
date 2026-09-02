import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from "../../redux/slices/authSlice";
import Login from './Login';

vi.mock('../../hooks/auth/useLoginForm', () => ({
    useLoginForm: () => ({
        form: {
            register: vi.fn((name: string) => ({ name })),
            formState: { errors: {} },
        },
        onSubmit: vi.fn((e) => e?.preventDefault?.()),
        isLoading: false,
    }),
}));

const createMockStore = (preloadedState?: any) => configureStore({
    reducer: { auth: authReducer } as any,
    preloadedState: preloadedState,
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

        expect(screen.getByPlaceholderText(/you@company.com/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Authenticate Access/i })).toBeInTheDocument();
    });
});
