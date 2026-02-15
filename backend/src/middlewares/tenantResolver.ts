import { Request, Response, NextFunction } from "express";
import Tenant, { ITenant } from "../modules/core/models/Tenant.js";
import { AppError } from "../utils/AppError.js";
import { info, warn } from "../config/logger.js";

declare global {
    namespace Express {
        interface Request {
            tenant?: ITenant;
            tenantId?: string;
            tenantSlug?: string;
        }
    }
}

/**
 * Middleware to resolve tenant from Host or Origin header
 * Supports:
 * 1. Subdomains (e.g., tenant1.bizzai.com)
 * 2. Custom domains (e.g., portal.customer.com)
 * 3. Local development (e.g., tenant1.lvh.me)
 */
export const tenantResolver = async (req: Request, _res: Response, next: NextFunction) => {
    try {
        const host = req.get('host') || '';
        const origin = req.get('origin');

        // Extract host for matching (remove protocol and port if present in origin)
        let domainToMatch = host;
        if (origin) {
            domainToMatch = origin.replace(/^https?:\/\//, '').split(':')[0];
        } else {
            domainToMatch = host.split(':')[0];
        }

        // 1. Check for specific custom domain first
        let tenant = await Tenant.findOne({
            'ecommerce.domain': domainToMatch,
            status: 'ACTIVE'
        });

        if (!tenant) {
            // 2. Fallback to subdomain resolution
            // Assumes format: {slug}.domain.com or {slug}.lvh.me
            const parts = domainToMatch.split('.');

            // If it's a subdomain (at least 3 parts for .com, or 2 for .me/local)
            // For production: bizzai.com (2 parts), tenant1.bizzai.com (3 parts)
            // For local: lvh.me (2 parts), tenant1.lvh.me (3 parts)
            if (parts.length >= 3 || (parts.length === 2 && domainToMatch.endsWith('.me'))) {
                const slug = parts[0];

                // Skip common subdomains
                const reservedSlugs = ['www', 'api', 'admin', 'app', 'dev', 'staging'];
                if (!reservedSlugs.includes(slug)) {
                    tenant = await Tenant.findOne({
                        slug: slug.toLowerCase(),
                        status: 'ACTIVE'
                    });
                }
            }
        }

        if (tenant) {
            // Attach tenant info to request
            req.tenant = tenant;
            req.tenantId = tenant._id.toString();
            req.tenantSlug = tenant.slug;

            if (process.env.NODE_ENV !== 'production') {
                info(`[TenantResolver] Resolved tenant: ${tenant.slug} (${tenant._id}) from ${domainToMatch}`);
            }

            return next();
        }

        // If no tenant found, we allow it to proceed to global routes (like home or register)
        // But we log it if it's not a root domain access
        if (domainToMatch !== process.env.ROOT_DOMAIN && !domainToMatch.includes('localhost') && !domainToMatch.includes('127.0.0.1')) {
            warn(`[TenantResolver] No active tenant found for domain: ${domainToMatch}`);
        }

        next();
    } catch (error: any) {
        warn(`[TenantResolver] Error resolving tenant: ${error.message} - Proceeding without tenant context`);
        // Do not block the request, just proceed without tenant
        next();
    }
};

export default tenantResolver;
