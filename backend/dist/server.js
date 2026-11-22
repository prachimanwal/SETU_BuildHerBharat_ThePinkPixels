"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const database_1 = require("./config/database");
const env_1 = require("./config/env");
const catalogBootstrap_1 = require("./seed/catalogBootstrap");
const DB_RETRY_INTERVAL_MS = 10000;
const connectWithRetry = async () => {
    try {
        await (0, database_1.connectDB)();
        await (0, catalogBootstrap_1.ensurePlatformCatalogs)();
    }
    catch (error) {
        console.error(`[Server] Initial MongoDB connection failed (${error?.message || 'unknown error'}).`);
        console.error(`[Server] API server remains online and will retry MongoDB connection in ${DB_RETRY_INTERVAL_MS / 1000}s. Check MONGODB_URI in backend/.env (use MongoDB Atlas URI if local mongod is not running).`);
        setTimeout(connectWithRetry, DB_RETRY_INTERVAL_MS);
    }
};
const startServer = async () => {
    app_1.default.listen(env_1.ENV.PORT, () => {
        console.log(`====================================================`);
        console.log(`SETU Backend Server running in [${env_1.ENV.NODE_ENV}] mode`);
        console.log(`Listening on: http://127.0.0.1:${env_1.ENV.PORT}`);
        console.log(`Allowed Client URL: ${env_1.ENV.CLIENT_URL}`);
        console.log(`====================================================`);
    });
    await connectWithRetry();
};
startServer();
