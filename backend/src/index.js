import { env } from './config/env.js';
import { connectDatabase } from './config/db.js';
import app from './app.js';
import { startMediaCleanupWorker } from './services/mediaCleanupWorker.js';

let server;
let cleanupTimer;

async function start() {
  await connectDatabase();
  cleanupTimer = startMediaCleanupWorker();
  server = app.listen(env.port, '0.0.0.0', () => {
    console.info(`[pagemint] Backend listening on http://localhost:${env.port}`);
    console.info(`[pagemint] Environment: ${env.nodeEnv}`);
  });
}

async function shutdown(signal) {
  console.info(`[pagemint] ${signal} received; shutting down.`);
  if (cleanupTimer) clearInterval(cleanupTimer);
  if (server) await new Promise((resolve) => server.close(resolve));
  const mongoose = await import('mongoose');
  await mongoose.default.disconnect();
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

start().catch((error) => {
  console.error('[pagemint] Startup failed:', error.message);
  // No nodemon or watch process is involved. One failed start exits once with a useful message.
  process.exit(1);
});
