const bcrypt = require('bcryptjs');
const { z } = require('zod');
const User = require('../models/User');
const HttpError = require('../utils/httpError');
const asyncHandler = require('../utils/asyncHandler');
const { safeString } = require('../utils/sanitize');
const { setSessionCookie, clearSessionCookie } = require('../middleware/auth');

const emailSchema = z
  .string({ required_error: 'Email is required' })
  .trim()
  .toLowerCase()
  .email('Enter a valid email address')
  .max(120);

const signupSchema = z.object({
  name: safeString(2, 80, 'Name'),
  email: emailSchema,
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters')
    .regex(/[A-Za-z]/, 'Password needs at least one letter')
    .regex(/[0-9]/, 'Password needs at least one number'),
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required').max(72),
});

const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (await User.exists({ email })) throw new HttpError(409, 'An account with this email already exists', { email: 'Already registered' });
  const passwordHash = await bcrypt.hash(password, 12);
  // role is never taken from the request: public signup always creates a customer.
  const user = await User.create({ name, email, passwordHash, role: 'customer' });
  setSessionCookie(res, user);
  res.status(201).json({ user: user.toPublic() });
});

// Pre-computed hash so unknown emails cost the same time as wrong passwords.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+passwordHash');
  const ok = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
  if (!user || !ok) throw new HttpError(401, 'Incorrect email or password');
  setSessionCookie(res, user);
  res.json({ user: user.toPublic() });
});

const logout = (req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
};

const me = (req, res) => {
  res.json({ user: req.user ? req.user.toPublic() : null });
};

module.exports = { signupSchema, loginSchema, signup, login, logout, me };
