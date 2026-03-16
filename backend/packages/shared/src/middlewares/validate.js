import { ZodError } from 'zod';
import { AppError } from '@smarterp/shared/utils/AppError.js';
export const validate = (schema) => {
    return async (req, _res, next) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        }
        catch (error) {
            if (error instanceof ZodError) {
                const zodError = error;
                const messages = zodError.issues.map((e) => `${e.path.join('.')}: ${e.message}`);
                const combinedMessage = messages.join(', ');
                next(new AppError(`Validation Error: ${combinedMessage}`, 400));
            }
            else {
                next(error);
            }
        }
    };
};
