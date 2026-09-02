/**
 * Standardized Pagination and API Response Envelope Utility
 */

export interface PaginationParams {
    page: number;
    limit: number;
    skip: number;
}

export interface PaginatedMeta {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export interface ApiResponse<T = any> {
    success: boolean;
    data: T;
    message?: string;
    pagination?: PaginatedMeta;
}

/**
 * Extracts and sanitizes pagination parameters from HTTP request query objects.
 */
export const extractPaginationParams = (
    query: Record<string, any>,
    defaultLimit = 20,
    maxLimit = 100
): PaginationParams => {
    const page = Math.max(1, parseInt(query.page as string, 10) || 1);
    const rawLimit = parseInt(query.limit as string, 10) || defaultLimit;
    const limit = Math.min(Math.max(1, rawLimit), maxLimit);
    const skip = (page - 1) * limit;

    return { page, limit, skip };
};

/**
 * Wraps data into a standardized API success envelope.
 */
export const buildSuccessResponse = <T>(
    data: T,
    message?: string,
    pagination?: PaginatedMeta
): ApiResponse<T> => {
    const response: ApiResponse<T> = {
        success: true,
        data,
    };
    if (message) response.message = message;
    if (pagination) response.pagination = pagination;
    return response;
};

/**
 * Builds paginated metadata object for list endpoints.
 */
export const buildPaginatedMeta = (
    totalItems: number,
    page: number,
    limit: number
): PaginatedMeta => {
    const totalPages = Math.ceil(totalItems / limit) || 1;
    return {
        totalItems,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
    };
};
