import type { Request, Response } from 'express';
import { AppError } from '../../utils/AppError';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { productService } from './product.service';

/** GET /products — paginated, searchable list. */
const getAll = catchAsync(async (req: Request, res: Response) => {
  const { items, pagination } = await productService.getAll(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Products retrieved',
    data: { items, pagination },
  });
});

/** GET /products/:id — one product. */
const getById = catchAsync(async (req: Request, res: Response) => {
  const product = await productService.getById(req.params.id as string);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Product retrieved',
    data: product,
  });
});

/** POST /products — create with a REQUIRED image (multipart field 'image'). */
const create = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError(400, 'Product image is required');
  }
  const product = await productService.create(req.body, req.file.buffer);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Product created',
    data: product,
  });
});

/** PATCH /products/:id — update fields and/or replace the image (optional). */
const update = catchAsync(async (req: Request, res: Response) => {
  const product = await productService.update(
    req.params.id as string,
    req.body,
    req.file?.buffer,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Product updated',
    data: product,
  });
});

/** DELETE /products/:id — delete the product (and its image best-effort). */
const remove = catchAsync(async (req: Request, res: Response) => {
  await productService.remove(req.params.id as string);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Product deleted',
    data: null,
  });
});

export const productController = { getAll, getById, create, update, remove };
