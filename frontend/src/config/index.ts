
export const APP_CONFIG = {
    API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
    APP_NAME: 'BizzAI Enterprise',
    VERSION: '1.0.0',
    ENV: import.meta.env.MODE || 'development',
    // Feature flags
    ENABLE_DEBUG: import.meta.env.DEV,
};

export default {
    APP_CONFIG
};
