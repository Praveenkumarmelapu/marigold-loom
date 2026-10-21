const HttpError = require('../utils/httpError');

// validate(schema, 'body' | 'query' | 'params') -> replaces the source with parsed data
module.exports = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const fields = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join('.') || '_';
      if (!fields[key]) fields[key] = issue.message;
    }
    return next(new HttpError(400, 'Please check the highlighted fields', fields));
  }
  if (source === 'query') {
    // Express 4 allows reassigning query
    req.query = result.data;
  } else {
    req[source] = result.data;
  }
  next();
};
