/**
 * Mongoose and database utilities used across services for common query patterns.
 * Reduces duplication in tenant ID conversion and document filtering.
 */

import mongoose from "mongoose";
import User from "../modules/core/models/User.js";

/**
 * Converts a tenant ID string to a Mongoose ObjectId if valid, otherwise returns the original string.
 * Used in all services that query by tenantId to handle both ObjectId and string tenant formats.
 * @example tenantKey("507f1f77bcf86cd799439011") => ObjectId
 * @example tenantKey("legacy-tenant-key") => "legacy-tenant-key"
 */
export const tenantKey = (tenantId: string): string | mongoose.Types.ObjectId => {
    return mongoose.Types.ObjectId.isValid(tenantId) 
        ? new mongoose.Types.ObjectId(tenantId) 
        : tenantId;
};

/**
 * Creates a date range query filter for MongoDB.
 * Used in report services to filter documents within a date range.
 * @example dateRangeFilter("2026-01-01", "2026-12-31") => { $gte: Date, $lt: Date }
 */
export const dateRangeFilter = (startDate: Date, endDate: Date) => ({
    $gte: startDate,
    $lt: endDate,
});

/**
 * Common invoice/document status filters.
 * Used across sales, finance, and report services.
 */
export const INVOICE_FILTERS = {
    LIVE: { isDeleted: { $ne: true }, fulfillmentStatus: { $nin: ["CANCELLED", "REFUNDED"] } },
    CANCELLED: { isDeleted: { $ne: true }, fulfillmentStatus: "CANCELLED" },
    REFUNDED: { isDeleted: { $ne: true }, fulfillmentStatus: "REFUNDED" },
    NOT_DELETED: { isDeleted: { $ne: true } },
} as const;

/**
 * Creates a query to find users belonging to a tenant.
 * Used in services that need to scope operations to a shop's users.
 */
export const tenantUserQuery = (tenantId: string) => ({
    tenantId: tenantKey(tenantId),
});

/**
 * Fetches all user ObjectIds for a tenant.
 * Used in report services to scope queries to shop users only.
 */
export async function tenantUserIds(tenantId: string): Promise<mongoose.Types.ObjectId[]> {
    const users = await User.find({ tenantId: tenantKey(tenantId) }, { _id: 1 }).lean();
    return users.map((u) => u._id as mongoose.Types.ObjectId);
}

/**
 * Fetches user IDs for a tenant in both ObjectId and string formats.
 * Used in services that need both formats for different query contexts.
 */
export async function tenantUsers(tenantId: string) {
    const users = await User.find({ tenantId: tenantKey(tenantId) }, { _id: 1 }).lean();
    const ids = users.map((u) => u._id as mongoose.Types.ObjectId);
    return { ids, strings: ids.map(String) };
}
