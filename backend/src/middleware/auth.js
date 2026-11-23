import { verifyAccessToken } from '../utils/tokens.js';
import User from '../models/User.js';
import { HttpError } from '../utils/httpError.js';

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.pm_access;
    if (!token) throw new HttpError(401, 'Authentication required. Please sign in.');
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);
    if (!user) throw new HttpError(401, 'Account no longer exists.');
    req.user = user;
    next();
  } catch (error) {
    next(error instanceof HttpError ? error : new HttpError(401, 'Session expired. Please sign in again.'));
  }
}
