const { prisma } = require('../models');
const { ok } = require('../utils/response');
async function listFavorites(req, res) {
  return ok(
    res,
    await prisma.favorite.findMany({
      where: { userId: req.user.id },
      include: { product: { include: { category: true, store: true } } },
      orderBy: { createdAt: 'desc' },
    })
  );
}
async function addFavorite(req, res) {
  const favorite = await prisma.favorite.upsert({
    where: { userId_productId: { userId: req.user.id, productId: req.params.productId } },
    update: {},
    create: { userId: req.user.id, productId: req.params.productId },
  });
  return ok(res, favorite, 201);
}
async function removeFavorite(req, res) {
  await prisma.favorite.deleteMany({
    where: { userId: req.user.id, productId: req.params.productId },
  });
  return res.status(204).send();
}
module.exports = { listFavorites, addFavorite, removeFavorite };
