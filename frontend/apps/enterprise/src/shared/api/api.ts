import axios from 'axios';

const api = axios.create({
    baseURL: (import.meta as any).env.VITE_BACKEND_URL || '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    let token = localStorage.getItem('token');
    let tenantId = localStorage.getItem('tenantId');

    // Fallback to auth-storage if direct keys are missing
    if (!token) {
        try {
            const authStorage = JSON.parse(localStorage.getItem('auth-storage') || '{}');
            token = authStorage.state?.token;
            if (authStorage.state?.user?.tenantId) {
                tenantId = authStorage.state.user.tenantId;
            }
        } catch (e) {
            console.error('Error parsing auth-storage', e);
        }
    }

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    if (tenantId) {
        config.headers['x-tenant-id'] = tenantId;
    }

    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;
