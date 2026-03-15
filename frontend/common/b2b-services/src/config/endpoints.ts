const normalizeTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const resolveBaseUrl = () => {
  // Safe environment check
  const env =
    // Node/Next-style (Server & Client with NEXT_PUBLIC)
    (typeof process !== 'undefined' && (process.env?.NEXT_PUBLIC_B2B_API_BASE_URL || process.env?.B2B_API_BASE_URL)) ||
    // Vite-style (Client only)
    (function() {
      try {
        // @ts-ignore
        return import.meta.env?.VITE_B2B_API_BASE_URL;
      } catch (e) {
        return undefined;
      }
    })();

  return env ? normalizeTrailingSlash(env) : '/api';
};

export const B2B_API_BASE_URL = resolveBaseUrl();

export const endpoints = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    forceLogout: '/auth/force-logout',
    profile: '/auth/profile',
  },
  users: {
    byId: (id: string) => `/users/${id}`,
  },
  partners: '/partners',
  partner: (id: string) => `/partners/${id}`,
  orders: '/orders',
  order: (id: string) => `/orders/${id}`,
  catalog: '/catalog/products',
  product: (sku: string) => `/catalog/products/${sku}`,
} as const;
