import type { AuthUser } from '../modules/auth/auth.interface';
import type { IPermission } from '../modules/permission/permission.interface';
import type { IRole } from '../modules/role/role.interface';
import { User } from '../modules/user/user.model';
import { AppError } from './AppError';
import { verifyAccess } from './jwt';

/**
 * Resolves an access-token string into the internal guard shape (`AuthUser`):
 * verifies the JWT, loads the user with role → permissions populated, and
 * rejects inactive/roleless/missing users with 401. Native jsonwebtoken errors
 * (expired/malformed) propagate to the caller. Shared by the HTTP `authenticate`
 * middleware and the socket.io handshake so auth logic lives in exactly one
 * place. The caller is responsible for checking that a token was supplied.
 */
export const resolveUserFromToken = async (
  token: string,
): Promise<AuthUser> => {
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

  return {
    id: String(user._id),
    email: user.email,
    roleName: role.name,
    permissions: role.permissions.map((p) => p.name),
  };
};
