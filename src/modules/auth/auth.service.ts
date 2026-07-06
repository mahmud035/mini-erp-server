import { AppError } from '../../utils/AppError';
import { signAccess, signRefresh, verifyRefresh } from '../../utils/jwt';
import type { IUser, UserResponse } from '../user/user.interface';
import { User } from '../user/user.model';
import { toUserResponse } from '../user/user.serializer';

const populateRole = { path: 'role', populate: { path: 'permissions' } };

/**
 * Authenticates a user by email + password and issues a fresh access/refresh
 * token pair. The password is explicitly selected (it is `select:false` by
 * default) for the comparison only. Invalid email OR password yields the same
 * 401 so we don't leak which accounts exist.
 */
const login = async (
  email: string,
  password: string,
): Promise<{
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
}> => {
  const user = await User.findOne({ email })
    .select('+password')
    .populate(populateRole);

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError(401, 'Invalid credentials');
  }
  if (!user.isActive) {
    throw new AppError(401, 'Account is inactive');
  }

  const userId = String((user as IUser)._id);
  return {
    user: toUserResponse(user),
    accessToken: signAccess(userId),
    refreshToken: signRefresh(userId),
  };
};

/**
 * Issues a new access token from a valid refresh token (stateless — no stored
 * tokens). The refresh token's signature/expiry is verified by `verifyRefresh`
 * (jwt errors map to 401 centrally); we also confirm the user still exists and
 * is active before minting a new access token.
 */
const refresh = async (refreshToken: string): Promise<string> => {
  const { userId } = verifyRefresh(refreshToken);
  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    throw new AppError(401, 'Invalid refresh token');
  }
  return signAccess(userId);
};

/**
 * Loads the current user in the single response shape. The `authenticate`
 * guard already proved the session; here we re-load with role → permissions
 * populated so `/me` and `/login` return identical `UserResponse` bodies.
 */
const getMe = async (userId: string): Promise<UserResponse> => {
  const user = await User.findById(userId).populate(populateRole);
  if (!user) {
    throw new AppError(401, 'Authentication required');
  }
  return toUserResponse(user);
};

export const authService = { login, refresh, getMe };
