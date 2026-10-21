const env = require('../config/env');
const HttpError = require('../utils/httpError');

function notFound(req, res, next) {
  next(new HttpError(404, 'Route not found'));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let message = err.message;
  let details = err.details;

  if (err.name === 'MulterError') {
    status = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'Image is too large (max 4 MB)' : 'Upload failed';
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid identifier';
  } else if (err.code === 11000) {
    status = 409;
    message = 'That value already exists';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON body';
  }

  if (status >= 500 && !err.status) {
    console.error(err);
    // Never leak internals to the client.
    message = 'Something went wrong on our side. Please try again.';
    details = undefined;
  }
  const body = { error: message };
  if (details) body.fields = details;
  if (!env.isProd && status >= 500) body.debug = String(err.message);
  res.status(status).json(body);
}

module.exports = { notFound, errorHandler };
