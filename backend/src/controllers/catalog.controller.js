const { product, category, store } = require('../models');
const { ok } = require('../utils/response');
const { uploadImageBuffer } = require('../utils/cloudinary');
const data = (body) => ({ ...body, imageUrl: body.imageUrl || null });
async function listProducts(req, res) {
  const { page, limit, search, categoryId } = req.query;
  const where = {
    active: true,
    ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    ...(categoryId ? { categoryId } : {}),
  };
  return ok(res, await product.list({ page, limit, search, categoryId }), 200, {
    page,
    limit,
    total: await product.count(where),
  });
}
async function getProduct(req, res) {
  const item = await product.findById(req.params.id);
  if (!item || !item.active)
    return res.status(404).json({
      success: false,
      message: 'Product not found',
      code: 'PRODUCT_NOT_FOUND',
    });
  return ok(res, item);
}
async function createProduct(req, res) {
  return ok(res, await product.create(data(req.body)), 201);
}
async function updateProduct(req, res) {
  return ok(res, await product.update(req.params.id, data(req.body)));
}
async function deleteProduct(req, res) {
  await product.delete(req.params.id);
  return res.status(204).send();
}
async function listCategories(req, res) {
  return ok(res, await category.list());
}
async function createCategory(req, res) {
  return ok(res, await category.create(data(req.body)), 201);
}
async function updateCategory(req, res) {
  return ok(res, await category.update(req.params.id, data(req.body)));
}
async function deleteCategory(req, res) {
  await category.delete(req.params.id);
  return res.status(204).send();
}
async function listStores(req, res) {
  return ok(res, await store.list());
}
async function createStore(req, res) {
  return ok(res, await store.create(data(req.body)), 201);
}
async function updateStore(req, res) {
  return ok(res, await store.update(req.params.id, data(req.body)));
}
async function deleteStore(req, res) {
  await store.delete(req.params.id);
  return res.status(204).send();
}
async function uploadCatalogImage(req, res) {
  const file = req.file || req.files?.image?.[0] || req.files?.file?.[0] || req.files?.photo?.[0];
  if (!file) {
    return res.status(422).json({
      success: false,
      message: 'لم تصل الصورة للسيرفر. اختاري ملف صورة من زر الرفع وحاولي مرة ثانية.',
      code: 'IMAGE_REQUIRED',
    });
  }
  const uploaded = await uploadImageBuffer(file.buffer, 'aura/catalog');
  return ok(res, { imageUrl: uploaded.secure_url });
}
module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listStores,
  createStore,
  updateStore,
  deleteStore,
  uploadCatalogImage,
};
