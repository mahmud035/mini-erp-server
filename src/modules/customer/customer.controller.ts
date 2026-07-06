import type { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { customerService } from './customer.service';

/** GET /customers — paginated, searchable list. */
const getAll = catchAsync(async (req: Request, res: Response) => {
  const { items, pagination } = await customerService.getAll(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Customers retrieved',
    data: { items, pagination },
  });
});

/** GET /customers/:id — one customer. */
const getById = catchAsync(async (req: Request, res: Response) => {
  const customer = await customerService.getById(req.params.id as string);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Customer retrieved',
    data: customer,
  });
});

/** POST /customers — create a customer. */
const create = catchAsync(async (req: Request, res: Response) => {
  const customer = await customerService.create(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Customer created',
    data: customer,
  });
});

/** PATCH /customers/:id — update provided fields. */
const update = catchAsync(async (req: Request, res: Response) => {
  const customer = await customerService.update(
    req.params.id as string,
    req.body,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Customer updated',
    data: customer,
  });
});

/** DELETE /customers/:id — delete a customer. */
const remove = catchAsync(async (req: Request, res: Response) => {
  await customerService.remove(req.params.id as string);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Customer deleted',
    data: null,
  });
});

export const customerController = { getAll, getById, create, update, remove };
