import type { RequestHandler } from 'express';
import type { IPermission } from '../modules/permission/permission.interface';
import type { IRole } from '../modules/role/role.interface';
import { User } from '../modules/user/user.model';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';
import { ACCESS_COOKIE } from '../utils/cookies';
import { verifyAccess } from '../utils/jwt';

/**
 * Authenticates a request from the HTTP-only access-token cookie: verifies the
 * JWT, loads the user with role → permissions populated, and rejects inactive
 * or missing users. On success attaches the guard shape to `req.user`.
 * A missing cookie throws 401 here; invalid/expired tokens propagate to the
 * global handler, which maps jsonwebtoken errors to 401 centrally.
 */
export const authenticate: RequestHandler = catchAsync(
  async (req, _res, next) => {
    const token: string | undefined = req.cookies?.[ACCESS_COOKIE];
    if (!token) {
      throw new AppError(401, 'Authentication required');
    }

    const { userId } = verifyAccess(token);

    const user = await User.findById(userId).populate({
      path: 'role',
      populate: { path: 'permissions' },
    });

    if (!user || !user.isActive) {
      throw new AppError(401, 'Authentication required');
    }

    const role = user.role as unknown as
      | (Omit<IRole, 'permissions'> & { permissions: IPermission[] })
      | null;
    if (!role) {
      throw new AppError(401, 'Authentication required');
    }

    req.user = {
      id: String(user._id),
      email: user.email,
      roleName: role.name,
      permissions: role.permissions.map((p) => p.name),
    };

    next();
  },
);
