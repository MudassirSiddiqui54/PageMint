import { ZodError } from 'zod';
import { HttpError } from '../utils/httpError.js';

export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error instanceof SyntaxError && error.status === 400 && Object.hasOwn(error, 'body')) {
    return res.status(400).json({ message: 'Request body contains invalid JSON.' });
  }
  if (error instanceof ZodError) {
    return res.status(400).json({ message: 'Validation failed', errors: error.issues.map(({ path, message }) => ({ path: path.join('.'), message })) });
  }
  if (error?.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || 'field';
    return res.status(409).json({ message: `${field} is already in use.` });
  }
  const status = error instanceof HttpError ? error.status : 500;
  if (status >= 500) console.error('[api] Unhandled error:', error);
  return res.status(status).json({ message: status >= 500 ? 'An unexpected server error occurred.' : error.message, ...(error.details ? { details: error.details } : {}) });
}
