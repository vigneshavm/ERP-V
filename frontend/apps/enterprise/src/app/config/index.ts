export const APP_CONFIG = {
    API_URL: (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_API_URL || process.env.VITE_API_URL : '') || '/api',
    APP_NAME: 'BizzAI Enterprise',
    VERSION: '1.0.0',
    ENV: (typeof process !== 'undefined' ? process.env.NODE_ENV : 'development'),
    IS_DEMO: (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_IS_DEMO === 'true' : false),
    // Feature flags
    ENABLE_DEBUG: (typeof process !== 'undefined' ? process.env.NODE_ENV === 'development' : false),
    REQUIRE_TENANT_ID: (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_REQUIRE_TENANT_ID === 'true' : false),
    DEPLOY_TENANT_ID: (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_DEPLOY_TENANT_ID : '') || '',
};

export default {
    APP_CONFIG
};
