const { prisma } = require('../models');
const { ok } = require('../utils/response');
async function listOrders(req, res) {
  const where = req.user.role === 'ADMIN' ? {} : { userId: req.user.id };
  return ok(
    res,
    await prisma.order.findMany({
      where,
      include: { user: { select: { name: true, email: true } }, items: true },
      orderBy: { createdAt: 'desc' },
    })
  );
}
async function createOrder(req, res) {
  const order = await prisma.$transaction(async (tx) => {
    const items = await tx.cartItem.findMany({ where: { userId: req.user.id }, include: { product: true } });
    if (!items.length) {
      const error = new Error('Cart is empty');
      error.status = 400;
      error.code = 'CART_EMPTY';
      throw error;
    }
    for (const item of items) {
      const updated = await tx.product.updateMany({
        where: { id: item.productId, active: true, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (updated.count !== 1) {
        const error = new Error('Insufficient stock');
        error.status = 409;
        error.code = 'INSUFFICIENT_STOCK';
        throw error;
      }
    }
    const total = items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
    const created = await tx.order.create({
      data: {
        userId: req.user.id,
        total,
        address: req.body.address,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            name: item.product.name,
            unitPrice: item.product.price,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: true },
    });
    await tx.cartItem.deleteMany({ where: { userId: req.user.id } });
    return created;
  });
  return ok(res, order, 201);
}
async function updateStatus(req, res) {
  return ok(
    res,
    await prisma.order.update({
      where: { id: req.params.id },
      data: { status: req.body.status },
      include: { items: true },
    })
  );
}
module.exports = { listOrders, createOrder, updateStatus };
