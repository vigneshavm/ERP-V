/**
 * Zod validation middleware.
 *
 * Changes from original:
 *  - Returns structured error array under `errors` key so clients can map
 *    field-level errors without parsing a concatenated string.
 *  - Supports partial schemas (body-only, query-only, params-only) via options.
 *  - Type is narrowed to avoid the `ZodError as any` cast.
 */
import { ZodError } from 'zod';
import { AppError } from '@smarterp/shared/utils/AppError.js';
export const validate = (schema, options = {}) => async (req, _res, next) => {
    try {
        const target = options.target ?? 'all';
        const payload = target === 'body' ? { body: req.body } :
            target === 'query' ? { query: req.query } :
                target === 'params' ? { params: req.params } :
                    { body: req.body, query: req.query, params: req.params };
        await schema.parseAsync(payload);
        next();
    }
    catch (error) {
        if (error instanceof ZodError) {
            const errors = error.issues.map((issue) => ({
                field: issue.path.join('.'),
                message: issue.message,
            }));
            const summary = errors.map((e) => `${e.field}: ${e.message}`).join(', ');
            const err = new AppError(`Validation failed: ${summary}`, 400);
            err.errors = errors;
            next(err);
        }
        else {
            next(error);
        }
    }
};
