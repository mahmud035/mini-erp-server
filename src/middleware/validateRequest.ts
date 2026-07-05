import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { catchAsync } from '../utils/catchAsync';

/**
 * Builds a middleware that validates the incoming request against a Zod schema
 * shaped as { body?, query?, params?, cookies? }. On success the parsed values
 * replace the raw ones so downstream handlers consume typed, sanitised input;
 * on failure the ZodError propagates to the global error handler.
 */
export const validateRequest = (
  schema: ZodType<{
    body?: unknown;
    query?: unknown;
    params?: unknown;
    cookies?: unknown;
  }>,
): RequestHandler => {
  return catchAsync(async (req, _res, next) => {
    const parsed = await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
      cookies: req.cookies,
    });

    if (parsed.body !== undefined) req.body = parsed.body;
    if (parsed.params !== undefined) {
      req.params = parsed.params as typeof req.params;
    }
    if (parsed.cookies !== undefined) {
      req.cookies = parsed.cookies as typeof req.cookies;
    }
    // req.query is a read-only getter in Express 5; validated query values are
    // re-parsed by handlers as needed rather than reassigned here.

    next();
  });
};
