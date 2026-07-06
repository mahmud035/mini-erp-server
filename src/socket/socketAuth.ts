import { parse } from 'cookie';
import { ACCESS_COOKIE } from '../utils/cookies';
import { resolveUserFromToken } from '../utils/resolveUserFromToken';
import type { AppSocket } from './socket.types';

/**
 * Socket.io handshake auth middleware. Reads the HTTP-only access-token from the
 * handshake Cookie header, resolves it through the SAME `resolveUserFromToken`
 * helper the HTTP layer uses, and attaches the principal to `socket.data.user`.
 * Any missing cookie, missing token, or resolution failure rejects the
 * connection via `next(Error)` — no duplicated auth logic.
 */
export const socketAuth = async (
  socket: AppSocket,
  next: (err?: Error) => void,
): Promise<void> => {
  try {
    const raw = socket.handshake.headers.cookie;
    if (!raw) {
      next(new Error('Authentication required'));
      return;
    }

    const token = parse(raw)[ACCESS_COOKIE];
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
