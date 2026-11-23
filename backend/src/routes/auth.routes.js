import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';
import { issueTokenPair, clearTokenCookies, rotateRefreshToken, revokeRefreshToken } from '../utils/tokens.js';
import { deleteAccount } from '../controllers/account.controller.js';

const router = Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false, message: { message: 'Too many authentication attempts. Try again later.' } });
const credentialsSchema = z.object({ email: z.string().email().max(254).transform((v) => v.toLowerCase()), password: z.string().min(8).max(72) });
const registerSchema = credentialsSchema.extend({ username: z.string().min(3).max(24).regex(/^[a-zA-Z0-9_]+$/).transform((v) => v.toLowerCase()), displayName: z.string().trim().min(1).max(60).optional() });

function userPayload(user) {
  return { id: user.id, username: user.username, email: user.email, profile: user.profile, createdAt: user.createdAt };
}

router.post('/register', authLimiter, asyncHandler(async (req, res) => {
  const data = registerSchema.parse(req.body);
  const usernameExists = await User.exists({ username: data.username });
  if (usernameExists) throw new HttpError(409, 'That username is already taken.');
  const emailExists = await User.exists({ email: data.email });
  if (emailExists) throw new HttpError(409, 'An account with that email already exists.');
  const passwordHash = await bcrypt.hash(data.password, 12);
  const user = await User.create({
    username: data.username,
    email: data.email,
    passwordHash,
    profile: { alias: data.username, displayName: data.displayName || data.username }
  });
  await issueTokenPair(user.id, res);
  res.status(201).json({ user: userPayload(user) });
}));

router.post('/login', authLimiter, asyncHandler(async (req, res) => {
  const data = credentialsSchema.parse(req.body);
  const user = await User.findOne({ email: data.email }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) throw new HttpError(401, 'Incorrect email or password.');
  await issueTokenPair(user.id, res);
  res.json({ user: userPayload(user) });
}));

router.post('/refresh', asyncHandler(async (req, res) => {
  const token = req.cookies?.pm_refresh;
  if (!token) throw new HttpError(401, 'Refresh token is missing. Sign in again.');
  try {
    const userId = await rotateRefreshToken(token, res);
    const user = await User.findById(userId);
    if (!user) throw new Error('Account no longer exists');
    res.json({ user: userPayload(user) });
  } catch {
    clearTokenCookies(res);
    throw new HttpError(401, 'Your session expired. Please sign in again.');
  }
}));

router.post('/logout', asyncHandler(async (req, res) => {
  if (req.cookies?.pm_refresh) await revokeRefreshToken(req.cookies.pm_refresh);
  clearTokenCookies(res);
  res.status(204).end();
}));

// A quiet bootstrap endpoint: an absent/expired session is an ordinary signed-out
// state, not an HTTP 401 that pollutes the browser console on every public visit.
router.get('/session', asyncHandler(async (req, res) => {
  const token = req.cookies?.pm_refresh;
  if (!token) return res.json({ authenticated: false, user: null });
  try {
    const userId = await rotateRefreshToken(token, res);
    const user = await User.findById(userId);
    if (!user) throw new Error('Account no longer exists');
    return res.json({ authenticated: true, user: userPayload(user) });
  } catch {
    clearTokenCookies(res);
    return res.json({ authenticated: false, user: null });
  }
}));

router.get('/me', requireAuth, (req, res) => res.json({ user: userPayload(req.user) }));

router.delete('/account', requireAuth, asyncHandler(deleteAccount));

export default router;
