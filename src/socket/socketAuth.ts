import { parse } from 'cookie';
import { ACCESS_COOKIE } from '../utils/cookies';
import { resolveUserFromToken } from '../utils/resolveUserFromToken';
import type { AppSocket } from './socket.types';

/**
 * Socket.io handshake auth middleware. Reads the access token from the handshake
 * `auth.token` payload (cross-site clients) OR, failing that, from the HTTP-only
 * `ACCESS_COOKIE` cookie header (same-site clients), and resolves it through the
 * SAME `resolveUserFromToken` helper the HTTP layer uses, attaching the principal
 * to `socket.data.user`. A missing/invalid token on both paths rejects the
 * connection via `next(Error)` — no duplicated auth logic.
 */
export const socketAuth = async (
  socket: AppSocket,
  next: (err?: Error) => void,
): Promise<void> => {
  try {
    // Prefer an explicit handshake auth token (cross-site WebSocket, where the
    // httpOnly cookie can't be read/sent); fall back to the cookie (same-site).
    const authToken = socket.handshake.auth?.token;
    const cookieHeader = socket.handshake.headers.cookie;
    const token =
      (typeof authToken === 'string' && authToken) ||
      (cookieHeader ? parse(cookieHeader)[ACCESS_COOKIE] : undefined);

    if (!token) {
      next(new Error('Authentication required'));
      return;
    }

    socket.data.user = await resolveUserFromToken(token);
    next();
  } catch {
    next(new Error('Authentication required'));
  }
};
