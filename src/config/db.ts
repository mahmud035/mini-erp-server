import mongoose from 'mongoose';
import { config } from './index';

/**
 * Establishes the singleton Mongoose connection. Callers should await this
 * before starting the HTTP server so the app never accepts traffic without a
 * live database. Throws on failure — the bootstrap layer decides how to exit.
 */
export const connectDB = async (): Promise<void> => {
  await mongoose.connect(config.databaseUrl);
  console.log('✅ MongoDB connected');
};

/**
 * Closes the Mongoose connection. Used by the seed script and graceful
 * shutdown so short-lived processes do not hang on an open socket.
 */
export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
};
