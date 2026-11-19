import app from './app';
import { connectDB } from './config/database';
import { ENV } from './config/env';

const startServer = async () => {
  try {
    await connectDB();

    app.listen(ENV.PORT, () => {
      console.log(`====================================================`);
      console.log(`SETU Backend Server running in [${ENV.NODE_ENV}] mode`);
      console.log(`Listening on: http://localhost:${ENV.PORT}`);
      console.log(`Allowed Client URL: ${ENV.CLIENT_URL}`);
      console.log(`====================================================`);
    });
  } catch (error: any) {
    console.error('Fatal error initializing SETU server:', error.message);
    process.exit(1);
  }
};

startServer();
