import type { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { roleService } from './role.service';

/** GET /roles — list all roles with permissions. */
const getAll = catchAsync(async (_req: Request, res: Response) => {
  const roles = await roleService.getAll();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Roles retrieved',
    data: roles,
  });
});

/** GET /roles/:id — one role with permissions. */
const getById = catchAsync(async (req: Request, res: Response) => {
  const role = await roleService.getById(req.params.id as string);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Role retrieved',
    data: role,
  });
});

/** POST /roles — create a non-system role. */
const create = catchAsync(async (req: Request, res: Response) => {
  const role = await roleService.create(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Role created',
    data: role,
  });
});

/** PATCH /roles/:id — edit name (non-system) and/or permissions. */
const update = catchAsync(async (req: Request, res: Response) => {
  const role = await roleService.update(req.params.id as string, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Role updated',
    data: role,
  });
});

/** DELETE /roles/:id — delete a non-system role. */
const remove = catchAsync(async (req: Request, res: Response) => {
  await roleService.remove(req.params.id as string);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Role deleted',
    data: null,
  });
});

export const roleController = { getAll, getById, create, update, remove };
