import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '@smarterp/shared/utils/AppError.js';

export const validate = (schema: ZodSchema) => {
    return async (req: Request, _res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const zodError = error as any;
                const messages = zodError.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`);
                const combinedMessage = messages.join(', ');
                next(new AppError(`Validation Error: ${combinedMessage}`, 400));
            } else {
                next(error);
            }
        }
    };
};
