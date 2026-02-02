import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Toast, ToastContainer, type ToastType } from './Toast';

interface ToastItem {
    id: string;
    type: ToastType;
    message: string;
}

export interface FeedbackContextValue {
    /** Show a success message (green, auto-dismisses in 3s) */
    showSuccess: (message: string) => void;
    /** Show an error message (red, stays until dismissed) */
    showError: (message: string) => void;
    /** Show a loading indicator (indigo spinner) */
    showLoading: (message: string) => string;
    /** Hide a specific loading indicator */
    hideLoading: (id?: string) => void;
    /** Show a warning message (amber, auto-dismisses in 5s) */
    showWarning: (message: string) => void;
    /** Dismiss a specific toast by ID */
    dismiss: (id: string) => void;
    /** Clear all toasts */
    clearAll: () => void;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

/**
 * Provider component that enables toast notifications throughout the app.
 */
export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const idCounter = useRef(0);
    const loadingIdRef = useRef<string | null>(null);

    const generateId = useCallback(() => {
        idCounter.current += 1;
        return `toast-${Date.now()}-${idCounter.current}`;
    }, []);

    const addToast = useCallback((type: ToastType, message: string, autoDismissMs?: number): string => {
        const id = generateId();

        setToasts((prev) => [...prev, { id, type, message }]);

        if (autoDismissMs) {
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, autoDismissMs);
        }

        return id;
    }, [generateId]);

    const dismiss = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const clearAll = useCallback(() => {
        setToasts([]);
    }, []);

    const showSuccess = useCallback((message: string) => {
        addToast('success', message, 3000);
    }, [addToast]);

    const showError = useCallback((message: string) => {
        // Errors stay until dismissed
        addToast('error', message);
    }, [addToast]);

    const showLoading = useCallback((message: string): string => {
        // Remove previous loading toast if exists
        if (loadingIdRef.current) {
            dismiss(loadingIdRef.current);
        }
        const id = addToast('loading', message);
        loadingIdRef.current = id;
        return id;
    }, [addToast, dismiss]);

    const hideLoading = useCallback((id?: string) => {
        const toRemove = id || loadingIdRef.current;
        if (toRemove) {
            dismiss(toRemove);
            if (toRemove === loadingIdRef.current) {
                loadingIdRef.current = null;
            }
        }
    }, [dismiss]);

    const showWarning = useCallback((message: string) => {
        addToast('warning', message, 5000);
    }, [addToast]);

    const value: FeedbackContextValue = {
        showSuccess,
        showError,
        showLoading,
        hideLoading,
        showWarning,
        dismiss,
        clearAll,
    };

    return (
        <FeedbackContext.Provider value={value}>
            {children}
            <ToastContainer>
                {toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        id={toast.id}
                        type={toast.type}
                        message={toast.message}
                        onDismiss={toast.type !== 'loading' ? dismiss : undefined}
                    />
                ))}
            </ToastContainer>
        </FeedbackContext.Provider>
    );
};

/**
 * Hook to access feedback functions.
 * Must be used within a FeedbackProvider.
 * 
 * @example
 * ```tsx
 * const { showSuccess, showError, showLoading, hideLoading } = useFeedback();
 * 
 * async function handleSave() {
 *   showLoading('Saving...');
 *   try {
 *     await saveData();
 *     hideLoading();
 *     showSuccess('Saved successfully!');
 *   } catch (err) {
 *     hideLoading();
 *     showError('Failed to save. Please try again.');
 *   }
 * }
 * ```
 */
export const useFeedback = (): FeedbackContextValue => {
    const context = useContext(FeedbackContext);

    if (!context) {
        throw new Error('useFeedback must be used within a FeedbackProvider');
    }

    return context;
};

export { FeedbackContext };
