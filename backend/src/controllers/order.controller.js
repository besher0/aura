const { prisma } = require('../models');
const { ok } = require('../utils/response');

const statusLabels = {
  PENDING: 'قيد الانتظار',
  PROCESSING: 'قيد التجهيز',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغي',
};

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
    const inactiveItem = items.find((item) => !item.product?.active);
    if (inactiveItem) {
      const error = new Error('Product not found');
      error.status = 404;
      error.code = 'PRODUCT_NOT_FOUND';
      throw error;
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
  const order = await prisma.$transaction(async (tx) => {
    const current = await tx.order.findUnique({
      where: { id: req.params.id },
      select: { id: true, userId: true, status: true },
    });
    if (!current) {
      const error = new Error('Order not found');
      error.status = 404;
      error.code = 'ORDER_NOT_FOUND';
      throw error;
    }

    const updated = await tx.order.update({
      where: { id: current.id },
      data: { status: req.body.status },
      include: { items: true },
    });

    if (current.status !== req.body.status) {
      await tx.notification.create({
        data: {
          userId: current.userId,
          orderId: current.id,
          title: 'تحديث حالة الطلب',
          body: `تم تغيير حالة طلبك إلى ${statusLabels[req.body.status] || req.body.status}`,
        },
      });
    }

    return updated;
  });
  return ok(res, order);
}
module.exports = { listOrders, createOrder, updateStatus };
