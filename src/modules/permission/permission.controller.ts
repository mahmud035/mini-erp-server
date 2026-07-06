import type { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { permissionService } from './permission.service';

/**
 * GET /permissions — list the full permission catalog.
 */
const getAll = catchAsync(async (_req: Request, res: Response) => {
  const permissions = await permissionService.getAll();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Permissions retrieved',
    data: permissions,
  });
});

export const permissionController = { getAll };
