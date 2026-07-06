/**
 * The authenticated principal attached to `req.user` by the `authenticate`
 * middleware. This is the internal GUARD shape (used by requirePermission) —
 * distinct from the client-facing user response built by `toUserResponse`.
 */
export interface AuthUser {
  id: string;
  email: string;
  roleName: string;
  permissions: string[]; // permission names, e.g. `product:read`
}

/** Validated body of POST /auth/login. */
export interface LoginInput {
  email: string;
  password: string;
}
