import { CorsOptions } from "cors";
import { warn } from './logger.js';

/**
 * Enhanced CORS configuration for production
 */

const allowedOrigins: string[] = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
];

// Add production origins from environment
if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
}

// Add additional allowed origins from environment (comma-separated)
if (process.env.ALLOWED_ORIGINS) {
    const additionalOrigins = process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim());
    allowedOrigins.push(...additionalOrigins);
}

/**
 * Check if origin is allowed
 */
const isAllowedOrigin = async (origin: string | undefined): Promise<boolean> => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return true;

    // In development, allow any localhost
    if (
        process.env.NODE_ENV !== "production" &&
        (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:"))
    ) {
        return true;
    }

    // Allow Vercel preview deployments if prefix is configured
    const vercelPrefix = process.env.VERCEL_PREVIEW_PREFIX;
    if (vercelPrefix) {
        const vercelPattern = new RegExp(`^https:\\/\\/${vercelPrefix}[\\w-]*\\.vercel\\.app$`);
        if (vercelPattern.test(origin)) {
            return true;
        }
    }

    // Check against static whitelist
    if (allowedOrigins.includes(origin)) {
        return true;
    }

    // Tenant-specific origins must be explicitly configured; origin checks do not query a database.
    return false;
};

/**
 * CORS options with enhanced security
 */
export const corsOptions: CorsOptions = {
    origin: async function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
        try {
            const allowed = await isAllowedOrigin(origin);
            if (allowed) {
                callback(null, true);
            } else {
                warn(`CORS blocked request from origin: ${origin}`);
                callback(new Error(`CORS not allowed from origin: ${origin}`));
            }
        } catch (error: any) {
            callback(error);
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
    exposedHeaders: ["X-Request-ID", "X-RateLimit-Limit", "X-RateLimit-Remaining"],
    maxAge: 86400, // 24 hours
    optionsSuccessStatus: 204,
};

export default { corsOptions, isAllowedOrigin };
