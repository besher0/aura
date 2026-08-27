const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const includeProduct = { store: true, category: true };
const models = {
  user: {
    findByEmail: (email) => prisma.user.findUnique({ where: { email } }),
    findById: (id) =>
      prisma.user.findUnique({
        where: { id },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      }),
  },
  product: {
    list: ({ search, categoryId, page, limit }) => {
      const currentPage = Number(page) || 1;
      const pageSize = Number(limit) || 20;
      return prisma.product.findMany({
        where: {
          active: true,
          ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
          ...(categoryId ? { categoryId } : {}),
        },
        include: includeProduct,
        orderBy: { createdAt: 'desc' },
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
      });
    },
    count: (where) => prisma.product.count({ where }),
    findById: (id) => prisma.product.findUnique({ where: { id }, include: includeProduct }),
    create: (data) => prisma.product.create({ data, include: includeProduct }),
    update: (id, data) => prisma.product.update({ where: { id }, data, include: includeProduct }),
    delete: (id) => prisma.product.update({ where: { id }, data: { active: false } }),
  },
  category: {
    list: () =>
      prisma.category.findMany({
        where: { active: true },
        include: { _count: { select: { products: true } } },
        orderBy: { name: 'asc' },
      }),
    create: (data) => prisma.category.create({ data }),
    update: (id, data) => prisma.category.update({ where: { id }, data }),
    delete: (id) => prisma.category.update({ where: { id }, data: { active: false } }),
  },
  store: {
    list: () =>
      prisma.store.findMany({
        where: { active: true },
        include: { _count: { select: { products: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    create: (data) => prisma.store.create({ data }),
    update: (id, data) => prisma.store.update({ where: { id }, data }),
    delete: (id) => prisma.store.update({ where: { id }, data: { active: false } }),
  },
  prisma,
};
module.exports = models;
