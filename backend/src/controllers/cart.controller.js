const { prisma } = require('../models');
const { ok } = require('../utils/response');
async function listCart(req, res) {
  return ok(
    res,
    await prisma.cartItem.findMany({
      where: { userId: req.user.id },
      include: { product: { include: { category: true, store: true } } },
      orderBy: { product: { name: 'asc' } },
    })
  );
}
async function addItem(req, res) {
  const quantity = req.body.quantity || 1;
  const product = await prisma.product.findFirst({ where: { id: req.body.productId, active: true } });
  if (!product)
    return res.status(404).json({ success: false, message: 'Product not found', code: 'PRODUCT_NOT_FOUND' });
  const current = await prisma.cartItem.findUnique({
    where: { userId_productId: { userId: req.user.id, productId: product.id } },
  });
  if ((current?.quantity || 0) + quantity > product.stock)
    return res.status(409).json({ success: false, message: 'Insufficient stock', code: 'INSUFFICIENT_STOCK' });
  const item = current
    ? await prisma.cartItem.update({
        where: { userId_productId: { userId: req.user.id, productId: product.id } },
        data: { quantity: { increment: quantity } },
        include: { product: true },
      })
    : await prisma.cartItem.create({
        data: { userId: req.user.id, productId: product.id, quantity },
        include: { product: true },
      });
  return ok(res, item, 201);
}
async function updateItem(req, res) {
  const product = await prisma.product.findFirst({ where: { id: req.params.productId, active: true } });
  if (!product)
    return res.status(404).json({ success: false, message: 'Product not found', code: 'PRODUCT_NOT_FOUND' });
  if (req.body.quantity > product.stock)
    return res.status(409).json({ success: false, message: 'Insufficient stock', code: 'INSUFFICIENT_STOCK' });
  const item = await prisma.cartItem.update({
    where: { userId_productId: { userId: req.user.id, productId: req.params.productId } },
    data: { quantity: req.body.quantity },
    include: { product: true },
  });
  return ok(res, item);
}
async function removeItem(req, res) {
  await prisma.cartItem.delete({
    where: { userId_productId: { userId: req.user.id, productId: req.params.productId } },
  });
  return res.status(204).send();
}
module.exports = { listCart, addItem, updateItem, removeItem };
