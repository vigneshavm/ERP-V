import { CorsOptions } from 'cors';
import Tenant from '@smarterp/core/modules/core/models/Tenant.js'; // static top-level import

/**
 * Static origin whitelist — built once at startup from env vars.
 */
const staticOrigins = new Set<string>([
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
]);

if (process.env.FRONTEND_URL) staticOrigins.add(process.env.FRONTEND_URL);
if (process.env.ALLOWED_ORIGINS) {
    process.env.ALLOWED_ORIGINS.split(',').forEach((o) => staticOrigins.add(o.trim()));
}

/**
 * Short-lived in-process cache for dynamic tenant domain lookups.
 * Avoids a Tenant.findOne on every CORS preflight and cross-origin request.
 */
interface DomainCacheEntry { allowed: boolean; expiresAt: number }
const domainCache = new Map<string, DomainCacheEntry>();
const DOMAIN_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const checkTenantDomain = async (domain: string): Promise<boolean> => {
    const cached = domainCache.get(domain);
    if (cached && cached.expiresAt > Date.now()) return cached.allowed;

    try {
        const tenant = await Tenant.findOne({
            $or: [
                { 'ecommerce.domain': domain },
                { slug: domain.split('.')[0] },
            ],
            status: 'ACTIVE',
        }).select('_id').lean();

        const allowed = !!tenant;
        domainCache.set(domain, { allowed, expiresAt: Date.now() + DOMAIN_CACHE_TTL });
        return allowed;
    } catch {
        return false;
    }
};

const isAllowedOrigin = async (origin: string | undefined): Promise<boolean> => {
    // No origin header — allow (CLI tools, mobile apps, server-to-server)
    if (!origin) return true;

    // In development, allow any localhost port
    if (
        process.env.NODE_ENV !== 'production' &&
        (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))
    ) return true;

    // Static whitelist
    if (staticOrigins.has(origin)) return true;

    // Vercel preview deployments
    const vercelPrefix = process.env.VERCEL_PREVIEW_PREFIX;
    if (vercelPrefix) {
        const pattern = new RegExp(`^https://${vercelPrefix}[\\w-]*\\.vercel\\.app$`);
        if (pattern.test(origin)) return true;
    }

    // Dynamic tenant domain lookup (cached)
    const domain = origin.replace(/^https?:\/\//, '').split(':')[0];
    return checkTenantDomain(domain);
};

export const corsOptions: CorsOptions = {
    origin: async (origin, callback) => {
        try {
            const allowed = await isAllowedOrigin(origin);
            if (allowed) {
                callback(null, true);
            } else {
                console.warn(`CORS blocked: ${origin}`);
                callback(new Error(`CORS not allowed from origin: ${origin}`));
            }
        } catch (err: any) {
            callback(err);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    maxAge: 86400,
    optionsSuccessStatus: 204,
};

export default { corsOptions, isAllowedOrigin };
