import type { RequestHandler } from 'express';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';
import { ACCESS_COOKIE } from '../utils/cookies';
import { resolveUserFromToken } from '../utils/resolveUserFromToken';

/**
 * Authenticates a request from the HTTP-only access-token cookie: reads the
 * token, resolves it to the guard shape via the shared `resolveUserFromToken`
 * helper, and attaches it to `req.user`. A missing cookie throws 401 here;
 * invalid/expired tokens propagate to the global handler, which maps
 * jsonwebtoken errors to 401 centrally.
 */
export const authenticate: RequestHandler = catchAsync(
  async (req, _res, next) => {
    const token: string | undefined = req.cookies?.[ACCESS_COOKIE];
    if (!token) {
      throw new AppError(401, 'Authentication required');
    }

    req.user = await resolveUserFromToken(token);
    next();
  },
);
