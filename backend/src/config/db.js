import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase() {
  mongoose.set('strictQuery', true);
  mongoose.connection.on('connected', () => console.info('[database] MongoDB connected'));
  mongoose.connection.on('disconnected', () => console.warn('[database] MongoDB disconnected'));
  mongoose.connection.on('error', (error) => console.error('[database] MongoDB error:', error.message));
  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 10
  });
}
