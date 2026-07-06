import type { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { userService } from './user.service';

/** GET /users — list all users. */
const getAll = catchAsync(async (_req: Request, res: Response) => {
  const users = await userService.getAll();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Users retrieved',
    data: users,
  });
});

/** GET /users/:id — one user. */
const getById = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.getById(req.params.id as string);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User retrieved',
    data: user,
  });
});

/** POST /users — create a user and assign a role. */
const create = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.create(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'User created',
    data: user,
  });
});

/** PATCH /users/:id — update name/role/isActive. */
const update = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.update(req.params.id as string, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User updated',
    data: user,
  });
});

/** DELETE /users/:id — delete a user. */
const remove = catchAsync(async (req: Request, res: Response) => {
  await userService.remove(req.params.id as string);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User deleted',
    data: null,
  });
});

export const userController = { getAll, getById, create, update, remove };
