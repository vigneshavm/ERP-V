import axios from 'axios';

const api = axios.create({
    baseURL: (import.meta as any).env.VITE_BACKEND_URL || '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const tenantId = user.tenantId || localStorage.getItem('tenantId');

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
