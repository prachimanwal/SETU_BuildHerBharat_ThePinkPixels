"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
const sanitizeMongoUri = (uri) => {
    try {
        return uri.replace(/\/\/(.*):(.*)@/, '//$1:***@');
    }
    catch {
        return 'mongodb://[credentials-redacted]';
    }
};
const connectDB = async () => {
    const safeUri = sanitizeMongoUri(env_1.ENV.MONGODB_URI);
    try {
        const conn = await mongoose_1.default.connect(env_1.ENV.MONGODB_URI, {
            serverSelectionTimeoutMS: 8000,
            autoIndex: true
        });
        console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
        console.log(`[MongoDB] Database target: ${conn.connection.name} (${safeUri})`);
        // Event Listeners for Lifecycle Monitoring
        mongoose_1.default.connection.on('error', (err) => {
            console.error('[MongoDB] Connection error encountered:', err.message);
        });
        mongoose_1.default.connection.on('disconnected', () => {
            console.warn('[MongoDB] Connection lost. Retrying or awaiting reconnection...');
        });
        mongoose_1.default.connection.on('reconnected', () => {
            console.log('[MongoDB] Connection successfully re-established.');
        });
        // Graceful process exit handling
        const gracefulExit = async () => {
            try {
                await mongoose_1.default.connection.close();
                console.log('[MongoDB] Connection closed through app termination.');
                process.exit(0);
            }
            catch (err) {
                console.error('[MongoDB] Error during graceful shutdown:', err);
                process.exit(1);
            }
        };
        process.on('SIGINT', gracefulExit);
        process.on('SIGTERM', gracefulExit);
        return conn;
    }
    catch (error) {
        console.error(`[MongoDB] Fatal connection failure to ${safeUri}:`, error.message);
        if (env_1.ENV.NODE_ENV === 'production') {
            console.error('[MongoDB] Verify MONGODB_URI in Render / Atlas dashboard Network Access rules (IP whitelist: 0.0.0.0/0).');
        }
        throw error;
    }
};
exports.connectDB = connectDB;
