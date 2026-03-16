import { AppError } from '@smarterp/shared/utils/AppError.js';
export const requirePermission = (_permission) => {
    return (req, _res, next) => {
        const user = req.user;
        // Owner has all permissions by default
        if (user && user.role === 'owner') {
            return next();
        }
        // Logic for other roles can optionally go here
        next(new AppError("You do not have permission to perform this action", 403));
    };
};
