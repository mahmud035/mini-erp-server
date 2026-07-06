import dns from 'node:dns';
import http from 'node:http';
import app from './app';
import { config } from './config';
import { connectDB, disconnectDB } from './config/db';
import { getIO, initSocket } from './socket';

// Resilient DNS on hosts whose IPv6 route to external APIs blackholes (Happy-Eyeballs hang); harmless where IPv6 works.
dns.setDefaultResultOrder('ipv4first');

/**
 * Process entry point: connect to MongoDB first, then start accepting HTTP +
 * WebSocket traffic on a single HTTP server. If the database is unreachable at
 * boot we exit non-zero rather than serve requests against a dead connection.
 */
const bootstrap = async (): Promise<void> => {
  try {
    await connectDB();

    // Wrap the Express app so socket.io shares the same server/port.
    const httpServer = http.createServer(app);
    initSocket(httpServer);

    httpServer.listen(config.port, () => {
      console.log(
        `🚀 Server running on port ${config.port} [${config.nodeEnv}]`,
      );
    });

    const shutdown = (signal: string) => {
      console.log(`\n${signal} received — shutting down.`);
      // io.close() disconnects clients AND closes the underlying HTTP server;
      // do not also call httpServer.close(). Then release the DB connection.
      getIO().close(() => {
        void disconnectDB().finally(() => process.exit(0));
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

void bootstrap();
