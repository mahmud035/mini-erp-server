import type { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { dashboardService } from './dashboard.service';

/** GET /dashboard — aggregate counts + low-stock product list. */
const getStats = catchAsync(async (_req: Request, res: Response) => {
  const stats = await dashboardService.getStats();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Dashboard stats retrieved',
    data: stats,
  });
});

export const dashboardController = { getStats };
