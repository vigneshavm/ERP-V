import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';
import { toast } from 'react-toastify';

interface User {
    token: string;
    [key: string]: any;
}

// Create axios instance
const api: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL as string,
    withCredentials: true, // CRITICAL: Send cookies with every request
});

// Request interceptor to add token to every request
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const user: User = JSON.parse(storedUser);
                if (user && user.token) {
                    config.headers.set('Authorization', `Bearer ${user.token}`);
                }
            } catch (e) {
                console.error("Failed to parse user from local storage", e);
            }
        }
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

// Tracks consecutive 401s across ALL requests (any background poll included).
// A single 401 no longer nukes the whole app -- with several independent
// 30s-interval polls in flight (finance, HR, sales, purchases, products all
// share this one axios instance), one of them can get an isolated 401 (e.g.
// a transient device-cookie mismatch on that one request) while every other
// request keeps succeeding on a perfectly valid session. Only when 401s
// happen back-to-back with no successful request in between do we treat it
// as a real, dead session and force the logout/redirect sequence.
let consecutive401Count = 0;
let isHandlingSessionExpiry = false;
const SESSION_EXPIRY_THRESHOLD = 2;

// Response interceptor to handle token expiration
api.interceptors.response.use(
    (response: AxiosResponse) => {
        // Any successful response proves the session is still good -- reset
        // the counter so an old, unrelated 401 can't combine with a future
        // one to trigger a false-positive logout.
        consecutive401Count = 0;
        return response;
    },
    (error: AxiosError) => {
        // Check if error is due to authentication (401 Unauthorized)
        if (error.response && error.response.status === 401) {
            consecutive401Count += 1;

            if (consecutive401Count < SESSION_EXPIRY_THRESHOLD) {
                // Isolated 401 -- log it for diagnostics but don't treat the
                // whole app session as dead over one failing request.
                console.warn(
                    `[api] Received a 401 from ${error.config?.url} (${consecutive401Count}/${SESSION_EXPIRY_THRESHOLD}) -- not forcing logout yet.`,
                    error.response?.data
                );
                return Promise.reject(error);
            }

            // Guard against every in-flight request's 401 (multiple polling
            // queries can fail in the same tick) each independently trying
            // to clear storage / toast / redirect.
            if (!isHandlingSessionExpiry) {
                isHandlingSessionExpiry = true;

                // Clear all user data from localStorage
                localStorage.removeItem('user');
                localStorage.removeItem('returnDraft');

                // Show professional notification
                toast.error('Your session has expired. Please log in again to continue.', {
                    position: 'top-center',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                });

                // Dispatch custom event to trigger immediate Redux state cleanup in App.tsx
                window.dispatchEvent(new Event('auth:unauthorized'));

                // Redirect to login page after a brief delay
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1000);
            }
        }

        // Return the error for other cases
        return Promise.reject(error);
    }
);

export default api;
