const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./config/db');
const env = require('./config/env');
const { attachUser } = require('./middleware/auth');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const routes = require('./routes');

if (!env.jwtSecret || env.jwtSecret.length < 24) {
  console.warn('JWT_SECRET is missing or too short (use 24+ characters)');
}

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'img-src': ["'self'", 'data:', 'https://res.cloudinary.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      },
    },
  })
);
app.use(express.json({ limit: '50kb' }));
app.use(cookieParser());
app.use(mongoSanitize()); // strips $ and . operators from input (NoSQL injection)

// Same-origin only: reject cross-site state-changing requests.
app.use((req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.get('origin');
  if (origin && new URL(origin).host !== req.get('host')) return res.status(403).json({ error: 'Cross-site request blocked' });
  next();
});

app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});
app.use('/api', attachUser, routes);
app.use('/api', notFound);
app.use(errorHandler);

module.exports = app;
