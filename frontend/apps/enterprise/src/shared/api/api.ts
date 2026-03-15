import { logger } from '@/shared/lib/logger';
import axios from 'axios';

import { APP_CONFIG } from '@/app/config/index';

const api = axios.create({
    baseURL: APP_CONFIG.API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    if (typeof window === 'undefined') return config;
    
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
            logger.error('Error parsing auth-storage', e);
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
