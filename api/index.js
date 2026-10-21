// Vercel serverless entry: all /api/* requests are rewritten here.
const app = require('../server/src/app');
module.exports = app;
