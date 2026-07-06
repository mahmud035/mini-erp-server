import type { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { saleService } from './sale.service';

/**
 * POST /sales — records a sale transactionally. `soldBy` is taken from the
 * authenticated user, never the request body; grandTotal/unitPrice are computed
 * server-side. Responds 201 with the populated sale.
 */
const create = catchAsync(async (req: Request, res: Response) => {
  const sale = await saleService.create(req.body, req.user!.id);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Sale created',
    data: sale,
  });
});

/** GET /sales — paginated list of sales, newest first. */
const getAll = catchAsync(async (req: Request, res: Response) => {
  const { items, pagination } = await saleService.getAll(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Sales retrieved',
    data: { items, pagination },
  });
});

/** GET /sales/:id — one populated sale. */
const getById = catchAsync(async (req: Request, res: Response) => {
  const sale = await saleService.getById(req.params.id as string);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Sale retrieved',
    data: sale,
  });
});

export const saleController = { create, getAll, getById };
