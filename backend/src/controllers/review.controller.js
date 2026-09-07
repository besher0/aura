const { prisma } = require('../models');
const { ok } = require('../utils/response');

const includeProduct = { product: { include: { category: true, store: true } } };

async function listProductReviews(req, res) {
  const reviews = await prisma.review.findMany({
    where: { productId: req.params.productId },
    include: { user: { select: { name: true, avatarUrl: true } } },
    orderBy: { updatedAt: 'desc' },
  });
  return ok(res, reviews);
}

async function listMyReviews(req, res) {
  return ok(
    res,
    await prisma.review.findMany({
      where: { userId: req.user.id },
      include: includeProduct,
      orderBy: { updatedAt: 'desc' },
    })
  );
}

async function saveReview(req, res) {
  const review = await prisma.review.upsert({
    where: {
      userId_productId: {
        userId: req.user.id,
        productId: req.body.productId,
      },
    },
    update: {
      rating: req.body.rating,
      comment: req.body.comment || null,
    },
    create: {
      userId: req.user.id,
      productId: req.body.productId,
      rating: req.body.rating,
      comment: req.body.comment || null,
    },
    include: includeProduct,
  });

  return ok(res, review, 201);
}

module.exports = { listProductReviews, listMyReviews, saveReview };
