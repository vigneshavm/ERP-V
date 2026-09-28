import { Types } from "mongoose";

/**
 * A tenant id as it reaches services today: `req.tenantId` is an ObjectId, older callers pass the
 * hex string. Use this for parameters that only feed Mongoose `find`/`update` filters (which cast
 * either form). Aggregation pipelines must convert with `tenantKey()` because `aggregate` does not cast.
 */
export type TenantRef = string | Types.ObjectId;

/** Any document id as it reaches a service: ObjectId from Mongoose, or its hex string. Same casting rules as TenantRef. */
export type IdRef = string | Types.ObjectId;
