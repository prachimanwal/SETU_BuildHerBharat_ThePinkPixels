import mongoose from 'mongoose';
import { ENV } from './env';

const sanitizeMongoUri = (uri: string): string => {
  try {
    return uri.replace(/\/\/(.*):(.*)@/, '//$1:***@');
  } catch {
    return 'mongodb://[credentials-redacted]';
  }
};

export const connectDB = async (): Promise<typeof mongoose> => {
  const safeUri = sanitizeMongoUri(ENV.MONGODB_URI);

  try {
    const conn = await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
      autoIndex: true
    });

    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
    console.log(`[MongoDB] Database target: ${conn.connection.name} (${safeUri})`);

    // Event Listeners for Lifecycle Monitoring
    mongoose.connection.on('error', (err) => {
      console.error('[MongoDB] Connection error encountered:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB] Connection lost. Retrying or awaiting reconnection...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('[MongoDB] Connection successfully re-established.');
    });

    // Graceful process exit handling
    const gracefulExit = async () => {
      try {
        await mongoose.connection.close();
        console.log('[MongoDB] Connection closed through app termination.');
        process.exit(0);
      } catch (err) {
        console.error('[MongoDB] Error during graceful shutdown:', err);
        process.exit(1);
      }
    };

    process.on('SIGINT', gracefulExit);
    process.on('SIGTERM', gracefulExit);

    return conn;
  } catch (error: any) {
    console.error(`[MongoDB] Fatal connection failure to ${safeUri}:`, error.message);
    if (ENV.NODE_ENV === 'production') {
      console.error('[MongoDB] Verify MONGODB_URI in Render / Atlas dashboard Network Access rules (IP whitelist: 0.0.0.0/0).');
    }
    throw error;
  }
};
