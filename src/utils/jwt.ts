import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { config } from '../config';

/**
 * The only claim we carry. Both access and refresh tokens encode the user id;
 * everything else (role, permissions) is resolved live from the DB on each
 * request so authorization always reflects the current catalog.
 */
export interface TokenPayload {
  userId: string;
}

/** Signs a short-lived access token for the given user id. */
export const signAccess = (userId: string): string =>
  jwt.sign({ userId }, config.jwtAccessSecret, {
    expiresIn: config.jwtAccessExpires as SignOptions['expiresIn'],
  });

/** Signs a long-lived refresh token for the given user id. */
export const signRefresh = (userId: string): string =>
  jwt.sign({ userId }, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpires as SignOptions['expiresIn'],
  });

/**
 * Verifies an access token. Native jsonwebtoken errors (TokenExpiredError /
 * JsonWebTokenError) are allowed to propagate — the global error handler maps
 * them to 401 centrally.
 */
export const verifyAccess = (token: string): TokenPayload =>
  jwt.verify(token, config.jwtAccessSecret) as TokenPayload;

/** Verifies a refresh token; errors propagate to the central 401 map. */
export const verifyRefresh = (token: string): TokenPayload =>
  jwt.verify(token, config.jwtRefreshSecret) as TokenPayload;
