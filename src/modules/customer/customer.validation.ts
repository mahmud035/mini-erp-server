import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const create = z.object({
  body: z.strictObject({
    name: z.string().trim().min(1, 'Name is required'),
    phone: z.string().trim().min(1, 'Phone is required'),
    email: z.string().trim().toLowerCase().pipe(z.email()).optional(),
    address: z.string().trim().min(1).optional(),
  }),
});

const update = z.object({
  params: z.object({ id: objectId }),
  body: z
    .strictObject({
      name: z.string().trim().min(1),
      phone: z.string().trim().min(1),
      email: z.string().trim().toLowerCase().pipe(z.email()),
      address: z.string().trim().min(1),
    })
    .partial()
    .refine((b) => Object.keys(b).length > 0, {
      message: 'Provide at least one field to update',
    }),
});

const idParam = z.object({
  params: z.object({ id: objectId }),
});

export const customerValidation = { create, update, idParam };
