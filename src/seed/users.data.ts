/**
 * One development user per system role, with known credentials. Passwords are
 * hashed by the User model's pre-save hook. These are DEV seeds only — never
 * ship these to production.
 */
export interface UserSeed {
  name: string;
  email: string;
  password: string;
  roleName: string; // resolved to a Role ObjectId at seed time
}

export const DEV_PASSWORD = 'Password123!';

export const userSeeds: UserSeed[] = [
  {
    name: 'Admin User',
    email: 'admin@erp.test',
    password: DEV_PASSWORD,
    roleName: 'admin',
  },
  {
    name: 'Manager User',
    email: 'manager@erp.test',
    password: DEV_PASSWORD,
    roleName: 'manager',
  },
  {
    name: 'Employee User',
    email: 'employee@erp.test',
    password: DEV_PASSWORD,
    roleName: 'employee',
  },
];
