const jwt = require('jsonwebtoken');
const env = require('../config/env');
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token)
    return res.status(401).json({ success: false, message: 'Authentication required', code: 'AUTH_REQUIRED' });
  try {
    req.user = jwt.verify(token, env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token', code: 'AUTH_INVALID' });
  }
}
function requireRole(...roles) {
  return (req, res, next) =>
    roles.includes(req.user?.role)
      ? next()
      : res.status(403).json({ success: false, message: 'Forbidden', code: 'FORBIDDEN' });
}
module.exports = { requireAuth, requireRole };
