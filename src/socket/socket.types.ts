import type { Server, Socket } from 'socket.io';
import type { AuthUser } from '../modules/auth/auth.interface';

/** A product that has crossed below the low-stock threshold after a sale. */
export interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  stockQuantity: number;
}

/** Payload of the `low-stock-alert` event pushed to the `inventory` room. */
export interface LowStockPayload {
  products: LowStockProduct[];
  saleId: string;
}

/** Events the server emits to clients. */
export interface ServerToClientEvents {
  'low-stock-alert': (payload: LowStockPayload) => void;
}

/** Clients emit nothing in this batch. */
export type ClientToServerEvents = Record<string, never>;

/** Per-socket state populated by the handshake auth middleware. */
export interface SocketData {
  user: AuthUser;
}

// Fully-typed server/socket aliases so `socket.data.user` and emit payloads are
// checked at compile time (no `any`).
export type AppServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;
export type AppSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;
