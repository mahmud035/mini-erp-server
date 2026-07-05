/**
 * The complete permission catalog — the single source of truth for every
 * grant in the system. Each entry becomes one Permission document.
 * Format is strictly `resource:action`.
 */
export interface PermissionSeed {
  name: string;
  resource: string;
  action: string;
  description: string;
}

const build = (
  resource: string,
  actions: string[],
  describe: (action: string) => string,
): PermissionSeed[] =>
  actions.map((action) => ({
    name: `${resource}:${action}`,
    resource,
    action,
    description: describe(action),
  }));

export const permissionCatalog: PermissionSeed[] = [
  ...build('product', ['read', 'create', 'update', 'delete'], (a) =>
    `${a} products`,
  ),
  ...build('customer', ['read', 'create', 'update', 'delete'], (a) =>
    `${a} customers`,
  ),
  ...build('sale', ['read', 'create'], (a) => `${a} sales`),
  ...build('dashboard', ['read'], () => 'view dashboard'),
  ...build('user', ['read', 'create', 'update', 'delete'], (a) =>
    `${a} users`,
  ),
  ...build('role', ['read', 'create', 'update', 'delete'], (a) => `${a} roles`),
];
