import type { CookieOptions, Response } from 'express';
import { config } from '../config';

export const ACCESS_COOKIE = 'accessToken';
export const REFRESH_COOKIE = 'refreshToken';

/**
 * Converts a jsonwebtoken/ms-style duration string into milliseconds. Supports
 * the SAME units as jsonwebtoken (`s`/`m`/`h`/`d`) so a token's `exp` and its
 * cookie `maxAge` can never drift. A bare number is treated as milliseconds.
 */
export const parseDurationMs = (value: string): number => {
  const match = /^(\d+)\s*(s|m|h|d)?$/.exec(value.trim());
  if (!match) {
    throw new Error(`Invalid duration: ${value}`);
  }
  const amount = Number(match[1]);
  const unit = match[2];
  const unitMs: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return unit ? amount * unitMs[unit] : amount;
};

/**
 * Shared cookie policy: HTTP-only, path-scoped to the whole app, and — in
 * production — Secure + SameSite=None (cross-site over HTTPS). In development
 * SameSite=Lax keeps localhost flows working without HTTPS.
 */
const baseCookieOptions = (maxAgeMs: number): CookieOptions => ({
  httpOnly: true,
  secure: config.isProduction,
  sameSite: config.isProduction ? 'none' : 'lax',
  path: '/',
  maxAge: maxAgeMs,
});

/** Sets the access-token cookie (used on login and refresh). */
export const setAccessCookie = (res: Response, token: string): void => {
  res.cookie(
    ACCESS_COOKIE,
    token,
    baseCookieOptions(parseDurationMs(config.jwtAccessExpires)),
  );
};

/** Sets both auth cookies (login). */
export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string,
): void => {
  setAccessCookie(res, accessToken);
  res.cookie(
    REFRESH_COOKIE,
    refreshToken,
    baseCookieOptions(parseDurationMs(config.jwtRefreshExpires)),
  );
};

/**
 * Clears both auth cookies (logout). Clearing must use the same attributes the
 * cookies were set with, so we reuse the policy with a zeroed maxAge.
 */
export const clearAuthCookies = (res: Response): void => {
  const opts = baseCookieOptions(0);
  res.clearCookie(ACCESS_COOKIE, opts);
  res.clearCookie(REFRESH_COOKIE, opts);
};
