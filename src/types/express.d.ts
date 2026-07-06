import type { AuthUser } from '../modules/auth/auth.interface';

// Declaration-merge `req.user` onto Express's Request. The top-level import
// makes this file a module, which is required for `declare global` to augment
// the ambient Express namespace rather than redeclare it.
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
