"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENV = void 0;
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
exports.ENV = {
    PORT: parseInt(process.env.PORT || '5000', 10),
    NODE_ENV: process.env.NODE_ENV || 'development',
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/setu_db',
    JWT_SECRET: process.env.JWT_SECRET ||
        process.env.SESSION_SECRET ||
        'setu_super_secret_jwt_key_2026_builder_bharat',
    CLIENT_URL: parsedClientUrls[0] || 'http://localhost:5173',
    CLIENT_URLS: parsedClientUrls,
    // Configurable real AI provider for CANE (kept strictly on backend; never exposed to frontend)
    CANE_AI_PROVIDER: (process.env.CANE_AI_PROVIDER || 'auto').toLowerCase(),
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
    GEMINI_MODEL: process.env.GEMINI_MODEL || '',
    GEMINI_FALLBACK_MODEL: process.env.GEMINI_FALLBACK_MODEL || '',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    OPENAI_BASE_URL: (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, ''),
    CANE_AI_MODEL: process.env.CANE_AI_MODEL || ''
};
