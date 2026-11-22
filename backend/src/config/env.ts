import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from backend/.env first, then current working directory .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const rawClientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const parsedClientUrls = rawClientUrl
  .split(',')
  .map((url) => url.trim().replace(/\/$/, ''))
  .filter(Boolean);

export const ENV = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI:
    process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/setu_db',
  JWT_SECRET:
    process.env.JWT_SECRET ||
    process.env.SESSION_SECRET ||
    'setu_super_secret_jwt_key_2026_builder_bharat',
  CLIENT_URL: parsedClientUrls[0] || 'http://localhost:5173',
  CLIENT_URLS: parsedClientUrls
};
