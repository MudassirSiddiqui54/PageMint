import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Load backend/.env even when npm is invoked from a different working directory.
const currentDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(currentDir, '../../.env') });

const required = ['MONGODB_URI', 'ACCESS_TOKEN_SECRET', 'REFRESH_TOKEN_SECRET'];
const missing = required.filter((key) => !process.env[key] || process.env[key].startsWith('replace_with_'));
if (missing.length) {
  throw new Error(`Missing or placeholder environment variables: ${missing.join(', ')}. Configure backend/.env.`);
}
if (process.env.ACCESS_TOKEN_SECRET === process.env.REFRESH_TOKEN_SECRET) {
  throw new Error('ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET must be different values.');
}
for (const key of ['ACCESS_TOKEN_SECRET', 'REFRESH_TOKEN_SECRET']) {
  if (process.env[key].length < 32) throw new Error(`${key} must contain at least 32 characters. Generate it with: openssl rand -base64 48`);
}

const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer between 1 and 65535.');
const refreshDays = Number(process.env.REFRESH_TOKEN_DAYS || 30);
if (!Number.isInteger(refreshDays) || refreshDays < 1 || refreshDays > 365) throw new Error('REFRESH_TOKEN_DAYS must be an integer between 1 and 365.');
const accessTtl = process.env.ACCESS_TOKEN_TTL || '15m';
const ttlMatch = accessTtl.match(/^(\d+)(s|m|h|d)$/);
if (!ttlMatch || Number(ttlMatch[1]) < 1) throw new Error('ACCESS_TOKEN_TTL must use a duration such as 15m, 1h or 1d.');
const unitMs = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
const accessTtlMs = Number(ttlMatch[1]) * unitMs[ttlMatch[2]];

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  port,
  mongoUri: process.env.MONGODB_URI,
  accessSecret: process.env.ACCESS_TOKEN_SECRET,
  refreshSecret: process.env.REFRESH_TOKEN_SECRET,
  accessTtl,
  accessTtlMs,
  refreshDays,
  frontendOrigins: (process.env.FRONTEND_ORIGIN || 'http://localhost:5173').split(',').map((v) => v.trim()).filter(Boolean),
  imagekitPublicKey: process.env.IMAGEKIT_PUBLIC_KEY || '',
  imagekitPrivateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
  imagekitUrlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || ''
});
