import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { config } from '../config';
import { AppError } from '../utils/AppError';
import { socketAuth } from './socketAuth';
import type { AppServer, LowStockProduct } from './socket.types';

// Singleton — set by initSocket, read via getIO. Kept module-private so services
// emit through getIO() without importing server.ts (no circular dependency).
let io: AppServer | undefined;

// Room that receives inventory alerts. Membership is permission-driven.
const INVENTORY_ROOM = 'inventory';

/**
 * Attaches a socket.io server to the given HTTP server: CORS matching the REST
 * app, the handshake auth middleware, and a connection handler that joins the
 * `inventory` room ONLY for principals holding `product:update` (permission-
 * driven, never a role-name check). Returns the initialized server.
 */
export const initSocket = (httpServer: HttpServer): AppServer => {
  io = new Server(httpServer, {
    cors: { origin: config.corsOrigin, credentials: true },
  });

  io.use(socketAuth);

  io.on('connection', (socket) => {
    if (socket.data.user.permissions.includes('product:update')) {
      void socket.join(INVENTORY_ROOM);
    }

    socket.on('disconnect', () => {
      // No teardown needed — socket.io removes the socket from its rooms.
    });
  });

  return io;
};

/**
 * Returns the initialized socket.io server. Throws if called before initSocket
 * so a missing bootstrap surfaces loudly rather than silently dropping emits.
 */
export const getIO = (): AppServer => {
  if (!io) {
    throw new AppError(500, 'Socket.io not initialized');
  }
  return io;
};

/**
 * Best-effort push of a `low-stock-alert` to the `inventory` room. Wrapped so a
 * socket failure (or an uninitialized server) NEVER propagates to the caller —
 * this runs after a sale commits and must not affect the sale path.
 */
export const emitLowStock = (
  products: LowStockProduct[],
  saleId: string,
): void => {
  try {
    getIO().to(INVENTORY_ROOM).emit('low-stock-alert', { products, saleId });
  } catch (err) {
    console.warn('low-stock-alert emit failed:', err);
  }
};
