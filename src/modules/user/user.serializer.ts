import type { IPermission } from '../permission/permission.interface';
import type { IRole } from '../role/role.interface';
import type { IUser, UserResponse } from './user.interface';

/** A user document whose `role` (and role.permissions) have been populated. */
type PopulatedUser = Omit<IUser, 'role'> & {
  role: Omit<IRole, 'permissions'> & { permissions: IPermission[] };
};

/**
 * Serialises a populated user document into the single client-facing shape.
 * Built field-by-field ON PURPOSE: enumerating the allowed fields is what
 * strips the password (and any future sensitive field) — we never mutate or
 * delete keys off the document. Requires `role` → `permissions` populated.
 */
export const toUserResponse = (user: IUser): UserResponse => {
  const u = user as unknown as PopulatedUser;
  return {
    id: String(u._id),
    name: u.name,
    email: u.email,
    role: {
      id: String(u.role._id),
      name: u.role.name,
    },
    permissions: u.role.permissions.map((p) => p.name),
    isActive: u.isActive,
  };
};
