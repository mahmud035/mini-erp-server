import type { Request, Response } from 'express';
import { AppError } from '../../utils/AppError';
import { catchAsync } from '../../utils/catchAsync';
import {
  REFRESH_COOKIE,
  clearAuthCookies,
  setAccessCookie,
  setAuthCookies,
} from '../../utils/cookies';
import { sendResponse } from '../../utils/sendResponse';
import { authService } from './auth.service';

/**
 * POST /auth/login — validate credentials, set httpOnly access+refresh cookies,
 * return the single user response shape (no password).
 */
const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.login(
    email,
    password,
  );
  setAuthCookies(res, accessToken, refreshToken);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Logged in successfully',
    data: user,
  });
});

/**
 * POST /auth/logout — clear both auth cookies. Protected so only an
 * authenticated session can log out.
 */
const logout = catchAsync(async (_req: Request, res: Response) => {
  clearAuthCookies(res);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Logged out successfully',
    data: null,
  });
});

/**
 * POST /auth/refresh — mint a new access token from the refresh cookie and set
 * it. A missing cookie is 401; an invalid/expired one maps to 401 centrally.
 */
const refresh = catchAsync(async (req: Request, res: Response) => {
  const token: string | undefined = req.cookies?.[REFRESH_COOKIE];
  if (!token) {
    throw new AppError(401, 'Refresh token required');
  }
  const accessToken = await authService.refresh(token);
  setAccessCookie(res, accessToken);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Token refreshed',
    data: null,
  });
});

/**
 * GET /auth/me — return the current authenticated user in the single user
 * response shape (re-loaded with role → permissions by the service).
 */
const me = catchAsync(async (req: Request, res: Response) => {
  const user = await authService.getMe(req.user!.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Current user',
    data: user,
  });
});

export const authController = { login, logout, refresh, me };
