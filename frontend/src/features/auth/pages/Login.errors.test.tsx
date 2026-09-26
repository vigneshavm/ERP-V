import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../../redux/slices/authSlice';
import Login from './Login';

// Uses the real useLoginForm (Login.test.tsx mocks it). The page used to read isError/message off
// the react-hook-form object, which never has them, so a rejected login showed no message at all.
const renderWithAuth = (auth: Record<string, unknown>) => {
    const store = configureStore({
        reducer: { auth: authReducer } as any,
        preloadedState: { auth: { user: null, isLoading: false, isError: false, isSuccess: false, message: '', deviceConflict: false, conflictMessage: '', ...auth } } as any,
    });
    return render(<Provider store={store}><MemoryRouter><Login /></MemoryRouter></Provider>);
};

describe('Login errors', () => {
    it('shows the server message when login is rejected', () => {
        renderWithAuth({ isError: true, message: 'Invalid email or password.' });
        expect(screen.getByText('Authentication Failed')).toBeInTheDocument();
        expect(screen.getByText('Invalid email or password.')).toBeInTheDocument();
    });

    it('shows no error alert before a failed attempt', () => {
        renderWithAuth({});
        expect(screen.queryByText('Authentication Failed')).toBeNull();
    });
});
