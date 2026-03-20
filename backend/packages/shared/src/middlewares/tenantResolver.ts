import { Request, Response, NextFunction } from 'express';
import Tenant, { ITenant } from '@smarterp/core/modules/core/models/Tenant.js';
import { info, warn } from '@smarterp/shared/config/logger.js';

declare global {
    namespace Express {
        interface Request {
            tenant?:     ITenant;
            tenantId?:   string;
            tenantSlug?: string;
        }
    }
}

const RESERVED_SLUGS = new Set(['www', 'api', 'admin', 'app', 'dev', 'staging']);

/**
 * Resolve the active tenant from the request's Host / Origin header.
 *
 * Resolution order:
 *   1. Exact custom domain match  (ecommerce.domain)
 *   2. Subdomain slug match       ({slug}.bizzai.com)
 *
 * Two serial Tenant.findOne calls in the original code have been merged
 * into a single query with $or so only one round-trip is needed.
 */
export const tenantResolver = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
        const origin = req.get('origin');
        const host   = req.get('host') ?? '';

        const domainToMatch = origin
            ? origin.replace(/^https?:\/\//, '').split(':')[0]
            : host.split(':')[0];

        const parts = domainToMatch.split('.');
        const slug  = parts[0]?.toLowerCase();

        // Build a single $or query — no serial lookups
        const conditions: object[] = [{ 'ecommerce.domain': domainToMatch }];

        if (
            slug &&
            !RESERVED_SLUGS.has(slug) &&
            (parts.length >= 3 || (parts.length === 2 && domainToMatch.endsWith('.me')))
        ) {
            conditions.push({ slug });
        }

        const tenant = await Tenant.findOne({
            $or: conditions,
            status: 'ACTIVE',
        });

        if (tenant) {
            req.tenant     = tenant;
            req.tenantId   = tenant._id.toString();
            req.tenantSlug = tenant.slug;

            if (process.env.NODE_ENV !== 'production') {
                info(`[TenantResolver] ${tenant.slug} (${tenant._id}) from ${domainToMatch}`);
            }
        } else if (
            domainToMatch !== process.env.ROOT_DOMAIN &&
            !domainToMatch.includes('localhost') &&
            !domainToMatch.includes('127.0.0.1')
        ) {
            warn(`[TenantResolver] No active tenant for domain: ${domainToMatch}`);
        }

        next();
    } catch (error: any) {
        warn(`[TenantResolver] Error: ${error.message} — proceeding without tenant context`);
        next(); // Never block the request for routing infrastructure errors
    }
};

export default tenantResolver;
