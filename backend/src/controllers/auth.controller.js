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
    select: { id: true, name: true, email: true, role: true, avatarUrl: true },
  });
  return ok(res, { user: created, token: token(created) }, 201);
}
async function login(req, res) {
  const found = await user.findByEmail(req.body.email);
  if (!found || !(await bcrypt.compare(req.body.password, found.passwordHash)))
    return res.status(401).json({ success: false, message: 'Invalid email or password', code: 'LOGIN_FAILED' });
  return ok(res, {
    user: { id: found.id, name: found.name, email: found.email, role: found.role, avatarUrl: found.avatarUrl },
    token: token(found),
  });
}
async function me(req, res) {
  return ok(res, await user.findById(req.user.id));
}
async function changePassword(req, res) {
  const found = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!found || !(await bcrypt.compare(req.body.currentPassword, found.passwordHash))) {
    return res.status(401).json({ success: false, message: 'Current password is incorrect', code: 'PASSWORD_INVALID' });
  }
  await prisma.user.update({
    where: { id: req.user.id },
    data: { passwordHash: await bcrypt.hash(req.body.newPassword, 12) },
  });
  return ok(res, { changed: true });
}
module.exports = { register, login, me, changePassword };
