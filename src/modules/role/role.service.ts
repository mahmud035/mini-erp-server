import { AppError } from '../../utils/AppError';
import { Permission } from '../permission/permission.model';
import type { IRole } from './role.interface';
import { Role } from './role.model';

interface CreateRoleInput {
  name: string;
  permissions: string[];
}
type UpdateRoleInput = Partial<CreateRoleInput>;

/**
 * Ensures every supplied permission id refers to a real Permission; otherwise
 * the role would reference dangling ids. Throws 400 on any mismatch.
 */
const assertPermissionsExist = async (ids: string[]): Promise<void> => {
  const count = await Permission.countDocuments({ _id: { $in: ids } });
  if (count !== new Set(ids).size) {
    throw new AppError(400, 'One or more permissions do not exist');
  }
};

/** Returns all roles with their permissions populated, ordered by name. */
const getAll = async (): Promise<IRole[]> => {
  return Role.find().populate('permissions').sort({ name: 1 });
};

/** Returns a single role by id with permissions populated; 404 if absent. */
const getById = async (id: string): Promise<IRole> => {
  const role = await Role.findById(id).populate('permissions');
  if (!role) {
    throw new AppError(404, 'Role not found');
  }
  return role;
};

/** Creates a NON-system role after validating the permission ids. */
const create = async (input: CreateRoleInput): Promise<IRole> => {
  await assertPermissionsExist(input.permissions);
  const role = await Role.create({
    name: input.name,
    permissions: input.permissions,
    isSystem: false, // never client-settable
  });
  return role.populate('permissions');
};

/**
 * Updates a role. System roles: permissions CAN be edited but the role CANNOT
 * be renamed. Non-system roles: both fields editable.
 */
const update = async (id: string, input: UpdateRoleInput): Promise<IRole> => {
  const role = await Role.findById(id);
  if (!role) {
    throw new AppError(404, 'Role not found');
  }

  if (input.name !== undefined && input.name !== role.name) {
    if (role.isSystem) {
      throw new AppError(403, 'System roles cannot be renamed');
    }
    role.name = input.name;
  }

  if (input.permissions !== undefined) {
    await assertPermissionsExist(input.permissions);
    role.set('permissions', input.permissions);
  }

  await role.save();
  return role.populate('permissions');
};

/** Deletes a NON-system role. System roles are protected (403). */
const remove = async (id: string): Promise<void> => {
  const role = await Role.findById(id);
  if (!role) {
    throw new AppError(404, 'Role not found');
  }
  if (role.isSystem) {
    throw new AppError(403, 'System roles cannot be deleted');
  }
  await role.deleteOne();
};

export const roleService = { getAll, getById, create, update, remove };
