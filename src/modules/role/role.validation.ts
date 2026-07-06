import { z } from 'zod';

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

// `.strict` (via strictObject) rejects unknown keys — notably `isSystem`, which
// is seed-only and must never be settable through the API.
const create = z.object({
  body: z.strictObject({
    name: z.string().trim().toLowerCase().min(1, 'Name is required'),
    permissions: z.array(objectId).min(1, 'At least one permission is required'),
  }),
});

const update = z.object({
  params: z.object({ id: objectId }),
  body: z
    .strictObject({
      name: z.string().trim().toLowerCase().min(1),
      permissions: z.array(objectId).min(1),
    })
    .partial()
    .refine((b) => Object.keys(b).length > 0, {
      message: 'Provide at least one field to update',
    }),
});

const idParam = z.object({
  params: z.object({ id: objectId }),
});

export const roleValidation = { create, update, idParam };
