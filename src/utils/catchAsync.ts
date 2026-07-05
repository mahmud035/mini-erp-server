import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Wraps an async request handler so a rejected promise is forwarded to the
 * error-handling middleware. Express 5 auto-forwards rejections from handlers
 * that return a promise, but we keep this wrapper for an explicit, uniform
 * contract across every controller and middleware.
 */
export const catchAsync = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
