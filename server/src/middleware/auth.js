const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const HttpError = require('../utils/httpError');
const asyncHandler = require('../utils/asyncHandler');

const COOKIE_NAME = 'ml_session';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function signToken(user) {
  return jwt.sign({ sub: user._id.toString() }, env.jwtSecret, { expiresIn: '7d', algorithm: 'HS256' });
}

function setSessionCookie(res, user) {
  res.cookie(COOKIE_NAME, signToken(user), {
    httpOnly: true,
    secure: env.isProd,
    sameSite: 'lax',
    maxAge: MAX_AGE_MS,
    path: '/',
  });
}

function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, secure: env.isProd, sameSite: 'lax', path: '/' });
}

// Loads the user from the DB on every request, so role changes and deletions apply immediately.
const attachUser = asyncHandler(async (req, res, next) => {
  const token = req.cookies && req.cookies[COOKIE_NAME];
  if (!token) return next();
  try {
    const payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
    const user = await User.findById(payload.sub);
    if (user) req.user = user;
  } catch (_) {
    // invalid or expired token: treat as signed out
  }
  next();
});

const requireAuth = (req, res, next) => {
  if (!req.user) return next(new HttpError(401, 'Please sign in to continue'));
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user) return next(new HttpError(401, 'Please sign in to continue'));
  if (req.user.role !== 'admin') return next(new HttpError(403, 'Admin access required'));
  next();
};

module.exports = { attachUser, requireAuth, requireAdmin, setSessionCookie, clearSessionCookie };
