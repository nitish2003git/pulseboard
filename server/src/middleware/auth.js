import { verifyToken } from '../utils/token.js';
import User from '../models/User.js';

/**
 * Wrap async route handlers so thrown errors reach the error middleware
 * without a try/catch in every controller.
 */
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Require a valid JWT. Attaches the user document to req.user.
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) token = header.split(' ')[1];

  if (!token) {
    res.status(401);
    throw new Error('Not authorized — no token provided');
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    res.status(401);
    throw new Error('Not authorized — token invalid or expired');
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    res.status(401);
    throw new Error('Not authorized — user no longer exists');
  }

  req.user = user;
  next();
});

/**
 * Restrict a route to global platform admins.
 */
export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    res.status(403);
    throw new Error('Forbidden — admin access required');
  }
  next();
};
