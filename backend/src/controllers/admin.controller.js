const { prisma } = require('../models');
const { ok } = require('../utils/response');
async function dashboard(req, res) {
  const [
    sales,
    orders,
    users,
    products,
    categories,
    stores,
    pendingOrders,
    lowStockProducts,
    recentOrders,
    favoriteProducts,
  ] = await Promise.all([
    prisma.order.aggregate({ _sum: { total: true }, where: { status: { not: 'CANCELLED' } } }),
    prisma.order.count(),
    prisma.user.count({ where: { role: 'USER' } }),
    prisma.product.count({ where: { active: true } }),
    prisma.category.count({ where: { active: true } }),
    prisma.store.count({ where: { active: true } }),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.product.findMany({
      where: { active: true, stock: { lte: 5 } },
      include: { category: true, store: true },
      orderBy: { stock: 'asc' },
      take: 6,
    }),
    prisma.order.findMany({
      include: { user: { select: { name: true, email: true } }, items: true },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
    prisma.product.findMany({
      where: { active: true },
      select: { id: true, name: true, price: true, stock: true, _count: { select: { favorites: true } } },
      orderBy: { favorites: { _count: 'desc' } },
      take: 6,
    }),
  ]);
  return ok(res, {
    sales: Number(sales._sum.total || 0),
    orders,
    users,
    products,
    categories,
    stores,
    pendingOrders,
    lowStockProducts,
    recentOrders,
    favoriteProducts,
  });
}
async function favoriteAnalytics(req, res) {
  const [total, popular] = await Promise.all([
    prisma.favorite.count(),
    prisma.product.findMany({
      where: { active: true },
      select: { id: true, name: true, price: true, _count: { select: { favorites: true } } },
      orderBy: { favorites: { _count: 'desc' } },
      take: 10,
    }),
  ]);
  return ok(res, { total, products: popular });
}
module.exports = { dashboard, favoriteAnalytics };
