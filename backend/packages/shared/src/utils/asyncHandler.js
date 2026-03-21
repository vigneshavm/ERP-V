/**
 * asyncHandler — wraps an async Express route handler so errors are forwarded
 * to next() automatically. Eliminates the 249 repeated try/catch blocks across
 * controllers that all do the same thing: catch err → next(err) or send 500.
 *
 * Usage:
 *   import { asyncHandler } from '@smarterp/shared/utils/asyncHandler.js';
 *
 *   router.get('/', asyncHandler(async (req, res) => {
 *       const data = await service.getAll(req.tenantId!);
 *       ok(res, data);
 *   }));
 *
 * Controllers that use this no longer need try/catch. AppErrors thrown by
 * services propagate cleanly to the global errorHandler.
 *
 * Class method variant:
 *   public getAll = asyncHandler(async (req, res) => { ... });
 */
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
