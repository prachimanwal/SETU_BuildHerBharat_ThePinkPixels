"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const database_1 = require("./config/database");
const env_1 = require("./config/env");
const startServer = async () => {
    try {
        await (0, database_1.connectDB)();
        app_1.default.listen(env_1.ENV.PORT, () => {
            console.log(`====================================================`);
            console.log(`SETU Backend Server running in [${env_1.ENV.NODE_ENV}] mode`);
            console.log(`Listening on: http://localhost:${env_1.ENV.PORT}`);
            console.log(`Allowed Client URL: ${env_1.ENV.CLIENT_URL}`);
            console.log(`====================================================`);
        });
    }
    catch (error) {
        console.error('Fatal error initializing SETU server:', error.message);
        process.exit(1);
    }
};
startServer();
