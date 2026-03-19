/**
 * Zod validation middleware.
 *
 * Changes from original:
 *  - Returns structured error array under `errors` key so clients can map
 *    field-level errors without parsing a concatenated string.
 *  - Supports partial schemas (body-only, query-only, params-only) via options.
 *  - Type is narrowed to avoid the `ZodError as any` cast.
 */

import type { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '@smarterp/shared/utils/AppError.js';

export interface ValidationOptions {
    /** Which parts of the request to validate. Defaults to body + query + params. */
    target?: 'body' | 'query' | 'params' | 'all';
}

export const validate = (schema: ZodSchema, options: ValidationOptions = {}) =>
    async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
        try {
            const target = options.target ?? 'all';
            const payload =
                target === 'body'   ? { body:   req.body }   :
                target === 'query'  ? { query:  req.query }  :
                target === 'params' ? { params: req.params } :
                { body: req.body, query: req.query, params: req.params };

            await schema.parseAsync(payload);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors = error.issues.map((issue) => ({
                    field:   issue.path.join('.'),
                    message: issue.message,
                }));
                const summary = errors.map((e) => `${e.field}: ${e.message}`).join(', ');
                const err = new AppError(`Validation failed: ${summary}`, 400) as any;
                err.errors = errors;
                next(err);
            } else {
                next(error);
            }
        }
    };
