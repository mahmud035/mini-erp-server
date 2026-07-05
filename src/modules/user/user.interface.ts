import type { Document, Types } from 'mongoose';

/**
 * An authenticated principal. `password` is hashed on save and excluded from
 * queries by default (`select: false`). `role` references the single Role whose
 * permissions govern what this user may do.
 */
export interface IUser extends Document {
  name: string;
  email: string; // unique
  password: string; // bcrypt hash, select:false
  role: Types.ObjectId; // ref -> Role
  isActive: boolean;
}
