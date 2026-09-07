const { prisma } = require('../models');
const { ok } = require('../utils/response');

async function listNotifications(req, res) {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });
  return ok(res, notifications, 200, {
    unread: notifications.filter((notification) => !notification.read).length,
  });
}

async function markNotificationsRead(req, res) {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, read: false },
    data: { read: true },
  });
  return ok(res, { read: true });
}

module.exports = { listNotifications, markNotificationsRead };
