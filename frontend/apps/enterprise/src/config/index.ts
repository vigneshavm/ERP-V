
export const APP_CONFIG = {
    API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
    APP_NAME: 'BizzAI Enterprise',
    VERSION: '1.0.0',
    ENV: import.meta.env.MODE || 'development',
    IS_DEMO: import.meta.env.VITE_IS_DEMO === 'true' || import.meta.env.MODE === 'demo',
    // Feature flags
    ENABLE_DEBUG: import.meta.env.DEV,
    REQUIRE_TENANT_ID: import.meta.env.VITE_REQUIRE_TENANT_ID === 'true',
    DEPLOY_TENANT_ID: import.meta.env.VITE_DEPLOY_TENANT_ID || '',
};

export default {
    APP_CONFIG
};
