/**
 * Reads the backend's error body (docs/backend-architecture.md §3):
 *   { success: false, error: { code, message, details? }, message, code, data? }
 * Use these instead of `err.response?.data?.message` so pages keep working once the backend
 * drops the legacy top-level `message` / `code` / `data` mirrors.
 */

interface ApiErrorBody {
    error?: { code?: string; message?: string; details?: unknown };
    message?: string;
    code?: string;
    data?: unknown;
}

const bodyOf = (err: unknown): ApiErrorBody | undefined =>
    (err as { response?: { data?: ApiErrorBody } })?.response?.data;

/** Message to show the user. */
export const getApiErrorMessage = (err: unknown, fallback = "Something went wrong. Please try again."): string => {
    const body = bodyOf(err);
    return body?.error?.message || body?.message || (err instanceof Error ? err.message : "") || fallback;
};

/** Machine-readable code, e.g. "CREDIT_LIMIT_EXCEEDED" (undefined when absent). */
export const getApiErrorCode = (err: unknown): string | undefined => {
    const body = bodyOf(err);
    return body?.error?.code || body?.code;
};

/** Structured details (validation failures, credit-limit figures, ...). */
export const getApiErrorDetails = <T = unknown>(err: unknown): T | undefined => {
    const body = bodyOf(err);
    return (body?.error?.details ?? body?.data) as T | undefined;
};

/** HTTP status, when the request reached the server. */
export const getApiErrorStatus = (err: unknown): number | undefined =>
    (err as { response?: { status?: number } })?.response?.status;
