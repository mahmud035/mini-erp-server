import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

// JSON body (not multipart) — no coercion. unitPrice/lineTotal/grandTotal are
// NEVER accepted from the client: strictObject rejects any such key with 400.
const create = z.object({
  body: z.strictObject({
    customer: objectId,
    items: z
      .array(
        z.strictObject({
          product: objectId,
          quantity: z.number().int().positive(),
        }),
      )
      .min(1, 'At least one item is required')
      .refine(
        (items) =>
          new Set(items.map((i) => i.product)).size === items.length,
        'Duplicate product in items',
      ),
  }),
});

const idParam = z.object({
  params: z.object({ id: objectId }),
});

export const saleValidation = { create, idParam };
