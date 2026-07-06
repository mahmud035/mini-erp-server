import { z } from 'zod';

/**
 * Validation schemas for the auth module. Only login carries a body; logout,
 * refresh, and me rely on cookies (validated by the auth middleware/service).
 */
const login = z.object({
  body: z.strictObject({
    email: z.string().trim().toLowerCase().pipe(z.email()),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const authValidation = { login };
