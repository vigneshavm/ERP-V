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

// Response interceptor to handle token expiration
api.interceptors.response.use(
    (response: AxiosResponse) => {
        // If response is successful, just return it
        return response;
    },
    (error: AxiosError) => {
        // Check if error is due to authentication (401 Unauthorized)
        if (error.response && error.response.status === 401) {
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

        // Return the error for other cases
        return Promise.reject(error);
    }
);

export default api;
