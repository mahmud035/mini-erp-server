import { AppError } from '../../utils/AppError';
import { Role } from '../role/role.model';
import type { UserResponse } from './user.interface';
import { User } from './user.model';
import { toUserResponse } from './user.serializer';

interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: string;
}
interface UpdateUserInput {
  name?: string;
  role?: string;
  isActive?: boolean;
}

const populateRole = { path: 'role', populate: { path: 'permissions' } };

/** Confirms a role id exists before assigning it to a user (400 otherwise). */
const assertRoleExists = async (roleId: string): Promise<void> => {
  const exists = await Role.exists({ _id: roleId });
  if (!exists) {
    throw new AppError(400, 'Assigned role does not exist');
  }
};

/** Lists all users in the single response shape, ordered by name. */
const getAll = async (): Promise<UserResponse[]> => {
  const users = await User.find().populate(populateRole).sort({ name: 1 });
  return users.map(toUserResponse);
};

/** Returns one user by id in the single response shape; 404 if absent. */
const getById = async (id: string): Promise<UserResponse> => {
  const user = await User.findById(id).populate(populateRole);
  if (!user) {
    throw new AppError(404, 'User not found');
  }
  return toUserResponse(user);
};

/**
 * Creates a user with an assigned role. Uses `new User().save()` (NOT
 * findOneAndUpdate) so the password-hashing pre-save hook runs. Email
 * uniqueness is enforced by the unique index (→ 409 via the error handler).
 */
const create = async (input: CreateUserInput): Promise<UserResponse> => {
  await assertRoleExists(input.role);
  const user = await new User(input).save();
  await user.populate(populateRole);
  return toUserResponse(user);
};

/** Updates name/role/isActive on a user. Password changes are out of scope. */
const update = async (
  id: string,
  input: UpdateUserInput,
): Promise<UserResponse> => {
  const user = await User.findById(id);
  if (!user) {
    throw new AppError(404, 'User not found');
  }
  if (input.role !== undefined) {
    await assertRoleExists(input.role);
    user.set('role', input.role);
  }
  if (input.name !== undefined) user.name = input.name;
  if (input.isActive !== undefined) user.isActive = input.isActive;

  await user.save();
  await user.populate(populateRole);
  return toUserResponse(user);
};

/** Deletes a user by id; 404 if absent. */
const remove = async (id: string): Promise<void> => {
  const deleted = await User.findByIdAndDelete(id);
  if (!deleted) {
    throw new AppError(404, 'User not found');
  }
};

export const userService = { getAll, getById, create, update, remove };
