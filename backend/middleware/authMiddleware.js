// ESM version
import jwt from 'jsonwebtoken';
import User from '../models/user.js';

export async function protect(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: 'User not found' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Not authorized' });
  }
}

/**
 * maybeAuth: attach req.user if a valid Bearer token is present; otherwise continue.
 * Useful for routes that are public, but may unlock admin-only features (e.g. ?includeAll=1).
 */
export async function maybeAuth(req, _res, next) {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return next();
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (user) req.user = user;
  } catch {
    // ignore — route stays public
  }
  next();
}
