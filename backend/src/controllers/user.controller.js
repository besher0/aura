const { prisma } = require('../models');
const { ok } = require('../utils/response');
const { uploadImageBuffer } = require('../utils/cloudinary');

const userSelect = { id: true, name: true, email: true, role: true, avatarUrl: true, createdAt: true };

async function listUsers(req, res) {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  const search = req.query.search;
  const where = {
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: userSelect,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);
  return ok(res, data, 200, { page, limit, total });
}

async function getUser(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: userSelect,
  });
  if (!user) return res.status(404).json({ success: false, message: 'User not found', code: 'USER_NOT_FOUND' });
  return ok(res, user);
}
async function updateUser(req, res) {
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { name: req.body.name, role: req.body.role },
    select: userSelect,
  });
  return ok(res, user);
}

async function updateMe(req, res) {
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      name: req.body.name,
      email: req.body.email,
    },
    select: userSelect,
  });
  return ok(res, user);
}

async function uploadAvatar(req, res) {
  if (!req.file) {
    return res.status(422).json({ success: false, message: 'Image is required', code: 'IMAGE_REQUIRED' });
  }
  const uploaded = await uploadImageBuffer(req.file.buffer, 'aura/avatars');
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { avatarUrl: uploaded.secure_url },
    select: userSelect,
  });
  return ok(res, user);
}
async function deleteUser(req, res) {
  if (req.params.id === req.user.id)
    return res.status(400).json({ success: false, message: 'You cannot delete yourself', code: 'SELF_DELETE' });
  await prisma.user.delete({ where: { id: req.params.id } });
  return res.status(204).send();
}
module.exports = { listUsers, getUser, updateUser, updateMe, uploadAvatar, deleteUser };
