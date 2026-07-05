import type { Response } from 'express';

/**
 * The single response envelope shape returned by every endpoint.
 */
export interface ApiResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
}

/**
 * Serialises the standard response envelope and sends it with the given HTTP
 * status. The ONLY sanctioned way to return a success payload — guarantees
 * every response has the { statusCode, success, message, data } shape.
 */
export const sendResponse = <T>(
  res: Response,
  payload: ApiResponse<T>,
): void => {
  res.status(payload.statusCode).json({
    statusCode: payload.statusCode,
    success: payload.success,
    message: payload.message,
    data: payload.data,
  });
};
