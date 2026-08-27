module.exports = (schema) => (req, res, next) => {
  const result = schema.safeParse({ body: req.body || {}, params: req.params || {}, query: req.query || {} });
  if (!result.success)
    return res
      .status(422)
      .json({ success: false, message: 'Validation failed', code: 'VALIDATION_ERROR', errors: result.error.flatten() });
  req.body = result.data.body;
  req.params = result.data.params;
  req.query = result.data.query;
  next();
};
