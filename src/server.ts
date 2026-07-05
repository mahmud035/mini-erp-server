import app from './app';
import { config } from './config';
import { connectDB } from './config/db';

/**
 * Process entry point: connect to MongoDB first, then start accepting HTTP
 * traffic. If the database is unreachable at boot we exit non-zero rather than
 * serve requests against a dead connection.
 */
const bootstrap = async (): Promise<void> => {
  try {
    await connectDB();
    const server = app.listen(config.port, () => {
      console.log(
        `🚀 Server running on port ${config.port} [${config.nodeEnv}]`,
      );
    });

    const shutdown = (signal: string) => {
      console.log(`\n${signal} received — shutting down.`);
      server.close(() => process.exit(0));
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

void bootstrap();
