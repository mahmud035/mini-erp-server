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
  /** Compares a plaintext candidate against the stored bcrypt hash. */
  comparePassword(candidate: string): Promise<boolean>;
}

/**
 * The single client-facing user shape. Every endpoint that returns a user
 * (auth login/me, user CRUD) serialises to this via `toUserResponse` so the
 * client has exactly ONE User type — and never sees the password hash.
 */
export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: { id: string; name: string };
  permissions: string[];
  isActive: boolean;
}
