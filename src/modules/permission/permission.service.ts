import type { IPermission } from './permission.interface';
import { Permission } from './permission.model';

/**
 * Returns the full permission catalog, ordered by resource then action, for
 * building role-editing UIs. Read-only — the catalog is seed-owned.
 */
const getAll = async (): Promise<IPermission[]> => {
  return Permission.find().sort({ resource: 1, action: 1 });
};

export const permissionService = { getAll };
