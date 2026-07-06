import type { ErrorRequestHandler } from 'express';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { Error as MongooseError } from 'mongoose';
import { MulterError } from 'multer';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';
import { config } from '../config';

interface MongoServerError {
  code?: number;
  keyValue?: Record<string, unknown>;
}

/**
 * Single global error handler. Maps Zod, Mongoose, and AppError instances onto
 * the standard response envelope with success:false. Registered LAST, after all
 * routes and the 404 handler. Express 5 auto-forwards async rejections here.
 *
 * The 4-argument signature (err, req, res, next) is what marks this as an
 * error-handling middleware to Express — `next` must stay even if unused.
 */
export const globalErrorHandler: ErrorRequestHandler = (
  err,
  _req,
  res,
  _next,
) => {
  let statusCode = 500;
  let message = 'Internal server error';

  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
  } else if (err instanceof MongooseError.ValidationError) {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  } else if (err instanceof MongooseError.CastError) {
    statusCode = 400;
    message = `Invalid ${err.path}: ${String(err.value)}`;
  } else if ((err as MongoServerError)?.code === 11000) {
    statusCode = 409;
    const key = Object.keys((err as MongoServerError).keyValue ?? {})[0];
    message = `Duplicate value for field: ${key ?? 'unknown'}`;
  } else if (err instanceof TokenExpiredError) {
    statusCode = 401;
    message = 'Token expired';
  } else if (err instanceof JsonWebTokenError) {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err instanceof MulterError) {
    statusCode = 400;
    message = err.message; // e.g. 'File too large', 'Unexpected field'
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof Error) {
    message = err.message;
  }

  // Envelope stays exactly { statusCode, success, message, data }. Debug
  // details (validation issues, stack) live inside `data` and only outside
  // production — never as extra top-level keys.
  const data =
    config.isProduction
      ? null
      : {
          ...(err instanceof ZodError ? { errors: err.issues } : {}),
          stack: err instanceof Error ? err.stack : undefined,
        };

  res.status(statusCode).json({
    statusCode,
    success: false,
    message,
    data,
  });
};
