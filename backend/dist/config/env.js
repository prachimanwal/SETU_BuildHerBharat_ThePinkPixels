"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isGoogleClientIdValid = exports.ENV = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables from backend/.env first, then current working directory .env
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '.env') });
const rawClientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const parsedClientUrls = rawClientUrl
    .split(',')
    .map((url) => url.trim().replace(/\/$/, ''))
    .filter(Boolean);
const PLACEHOLDER_GOOGLE_IDS = [
    'your_google_client_id',
    'setu-demo-client-id',
    'example',
    'placeholder'
];
exports.ENV = {
    PORT: parseInt(process.env.PORT || '5000', 10),
    NODE_ENV: process.env.NODE_ENV || 'development',
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/setu_db',
    JWT_SECRET: process.env.JWT_SECRET || process.env.SESSION_SECRET || 'setu_super_secret_jwt_key_2026_builder_bharat',
    CLIENT_URL: parsedClientUrls[0] || 'http://localhost:5173',
    CLIENT_URLS: parsedClientUrls,
    GOOGLE_CLIENT_ID: (process.env.GOOGLE_CLIENT_ID || '').trim(),
    GOOGLE_CLIENT_SECRET: (process.env.GOOGLE_CLIENT_SECRET || '').trim(),
    GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
};
const isGoogleClientIdValid = (clientId = exports.ENV.GOOGLE_CLIENT_ID) => {
    if (!clientId || !clientId.endsWith('.apps.googleusercontent.com')) {
        return false;
    }
    const lower = clientId.toLowerCase();
    return !PLACEHOLDER_GOOGLE_IDS.some((p) => lower.includes(p));
};
exports.isGoogleClientIdValid = isGoogleClientIdValid;
