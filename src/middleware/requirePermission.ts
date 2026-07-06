import type { RequestHandler } from 'express';
import { AppError } from '../utils/AppError';

/**
 * The single authorization guard used everywhere. Given a required
 * `resource:action` permission, it checks the authenticated user's resolved
 * permission set (built from role → permissions in `authenticate`). Grants
 * proceed; anything else is 403. Deliberately knows NOTHING about role names —
 * authorization is entirely DB-driven.
 */
export const requirePermission = (permission: string): RequestHandler => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError(401, 'Authentication required'));
    }
    const granted = new Set(req.user.permissions);
    if (!granted.has(permission)) {
      return next(
        new AppError(403, 'You do not have permission to perform this action'),
      );
    }
    next();
  };
};
