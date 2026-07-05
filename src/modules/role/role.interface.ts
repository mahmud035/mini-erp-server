import type { Document, Types } from 'mongoose';

/**
 * A named bundle of permissions. `isSystem` marks the seeded roles
 * (admin/manager/employee) that may not be deleted via the API, though their
 * permission set can still be edited.
 */
export interface IRole extends Document {
  name: string; // unique
  permissions: Types.ObjectId[]; // refs -> Permission
  isSystem: boolean;
}
