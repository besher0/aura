const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { user, prisma } = require('../models');
const env = require('../config/env');
const { ok } = require('../utils/response');
const token = (u) => jwt.sign({ id: u.id, role: u.role, name: u.name }, env.JWT_SECRET, { expiresIn: '7d' });
async function register(req, res) {
  const { name, email, password } = req.body;
  if (await user.findByEmail(email))
    return res.status(409).json({ success: false, message: 'Email already registered', code: 'EMAIL_EXISTS' });
  const created = await prisma.user.create({
    data: { name, email, passwordHash: await bcrypt.hash(password, 12) },
    select: { id: true, name: true, email: true, role: true },
  });
  return ok(res, { user: created, token: token(created) }, 201);
}
async function login(req, res) {
  const found = await user.findByEmail(req.body.email);
  if (!found || !(await bcrypt.compare(req.body.password, found.passwordHash)))
    return res.status(401).json({ success: false, message: 'Invalid email or password', code: 'LOGIN_FAILED' });
  return ok(res, {
    user: { id: found.id, name: found.name, email: found.email, role: found.role },
    token: token(found),
  });
}
async function me(req, res) {
  return ok(res, await user.findById(req.user.id));
}
module.exports = { register, login, me };
