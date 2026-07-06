import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

// Multipart sends every text field as a string, so numbers are coerced. Boolean
// coercion is done explicitly ('false' must NOT become true).
const multipartBool = z.union([
  z.boolean(),
  z.enum(['true', 'false']).transform((v) => v === 'true'),
]);

// Image is handled by multer (req.file), never by Zod — so it is not a body key.
const create = z.object({
  body: z.strictObject({
    name: z.string().trim().min(1, 'Name is required'),
    sku: z.string().trim().min(1, 'SKU is required'),
    category: z.string().trim().min(1, 'Category is required'),
    purchasePrice: z.coerce.number().nonnegative(),
    sellingPrice: z.coerce.number().nonnegative(),
    stockQuantity: z.coerce.number().int().min(0),
  }),
});

// No "≥1 field" refine: an image-only update (empty body + file) is valid.
const update = z.object({
  params: z.object({ id: objectId }),
  body: z
    .strictObject({
      name: z.string().trim().min(1),
      sku: z.string().trim().min(1),
      category: z.string().trim().min(1),
      purchasePrice: z.coerce.number().nonnegative(),
      sellingPrice: z.coerce.number().nonnegative(),
      stockQuantity: z.coerce.number().int().min(0),
      isActive: multipartBool,
    })
    .partial(),
});

const idParam = z.object({
  params: z.object({ id: objectId }),
});

export const productValidation = { create, update, idParam };
