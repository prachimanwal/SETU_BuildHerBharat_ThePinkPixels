import app from './app';
import { connectDB } from './config/database';
import { ENV } from './config/env';

const DB_RETRY_INTERVAL_MS = 10000;

const connectWithRetry = async () => {
  try {
    await connectDB();
  } catch (error: any) {
    console.error(
      `[Server] Initial MongoDB connection failed (${error?.message || 'unknown error'}).`
    );
    console.error(
      `[Server] API server remains online and will retry MongoDB connection in ${
        DB_RETRY_INTERVAL_MS / 1000
      }s. Check MONGODB_URI in backend/.env (use MongoDB Atlas URI if local mongod is not running).`
    );
    setTimeout(connectWithRetry, DB_RETRY_INTERVAL_MS);
  }
};

const startServer = async () => {
  app.listen(ENV.PORT, () => {
    console.log(`====================================================`);
    console.log(`SETU Backend Server running in [${ENV.NODE_ENV}] mode`);
    console.log(`Listening on: http://127.0.0.1:${ENV.PORT}`);
    console.log(`Allowed Client URL: ${ENV.CLIENT_URL}`);
    console.log(`====================================================`);
  });

  await connectWithRetry();
};

startServer();
