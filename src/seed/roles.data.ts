import { permissionCatalog } from './permissions.data';

/**
 * Seed role definitions mapping each system role to the exact set of
 * permission names it holds. Assignments are explicit — admin lists ALL
 * permissions by name; there is no wildcard shortcut.
 */
export interface RoleSeed {
  name: string;
  isSystem: boolean;
  permissions: string[]; // permission names -> resolved to ObjectIds at seed time
}

const allPermissionNames = permissionCatalog.map((p) => p.name);

export const roleSeeds: RoleSeed[] = [
  {
    name: 'admin',
    isSystem: true,
    permissions: allPermissionNames, // every permission, assigned explicitly
  },
  {
    name: 'manager',
    isSystem: true,
    permissions: [
      'product:read',
      'product:create',
      'product:update',
      'product:delete',
      'customer:read',
      'customer:create',
      'customer:update', // NOT customer:delete
      'sale:read',
      'sale:create',
      'dashboard:read',
    ],
  },
  {
    name: 'employee',
    isSystem: true,
    permissions: [
      'product:read',
      'customer:read', // needed for the customer dropdown when creating a sale
      'sale:create',
      'dashboard:read',
    ],
  },
];
