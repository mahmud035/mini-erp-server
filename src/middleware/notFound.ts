import type { Request, Response } from 'express';
import { sendResponse } from '../utils/sendResponse';

/**
 * Terminal 404 handler. Registered PATHLESS via `app.use(notFound)` — Express 5
 * (path-to-regexp v8) no longer accepts a bare `*` route path. Any request that
 * reaches here matched no route.
 */
export const notFound = (req: Request, res: Response): void => {
  sendResponse(res, {
    statusCode: 404,
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    data: null,
  });
};
