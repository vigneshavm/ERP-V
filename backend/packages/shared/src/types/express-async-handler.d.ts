declare module 'express-async-handler' {
    import { Request, Response, NextFunction } from 'express';

    function asyncHandler(
        fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
    ): (req: Request, res: Response, next: NextFunction) => void;

    export = asyncHandler;
}
