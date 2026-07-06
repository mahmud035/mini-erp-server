import { z } from 'zod';

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

// strictObject rejects unknown keys (no isSystem-style leakage into user docs).
const create = z.object({
  body: z.strictObject({
    name: z.string().trim().min(1, 'Name is required'),
    email: z.string().trim().toLowerCase().pipe(z.email()),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: objectId,
  }),
});

const update = z.object({
  params: z.object({ id: objectId }),
  body: z
    .strictObject({
      name: z.string().trim().min(1),
      role: objectId,
      isActive: z.boolean(),
    })
    .partial()
    .refine((b) => Object.keys(b).length > 0, {
      message: 'Provide at least one field to update',
    }),
});

const idParam = z.object({
  params: z.object({ id: objectId }),
});

export const userValidation = { create, update, idParam };
