const express = require('express');
const multer = require('multer');
const validate = require('../middlewares/validate.middleware');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');
const schemas = require('../validators/schemas');
const auth = require('../controllers/auth.controller');
const catalog = require('../controllers/catalog.controller');
const users = require('../controllers/user.controller');
const cart = require('../controllers/cart.controller');
const favorites = require('../controllers/favorite.controller');
const orders = require('../controllers/order.controller');
const reviews = require('../controllers/review.controller');
const admin = require('../controllers/admin.controller');

const router = express.Router();
const adminOnly = [requireAuth, requireRole('ADMIN')];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    callback(null, file.mimetype.startsWith('image/'));
  },
});

router.post('/auth/register', validate(schemas.register), auth.register);
router.post('/auth/login', validate(schemas.login), auth.login);
router.get('/auth/me', requireAuth, auth.me);
router.patch('/auth/password', requireAuth, validate(schemas.changePassword), auth.changePassword);
router.patch('/users/me', requireAuth, validate(schemas.profileUpdate), users.updateMe);
router.post('/users/me/avatar', requireAuth, upload.single('avatar'), users.uploadAvatar);

router.get('/products', validate(schemas.listProducts), catalog.listProducts);
router.get('/products/:id', catalog.getProduct);
router.post('/products', ...adminOnly, validate(schemas.productData), catalog.createProduct);
router.patch('/products/:id', ...adminOnly, validate(schemas.productUpdate), catalog.updateProduct);
router.delete('/products/:id', ...adminOnly, validate(schemas.id), catalog.deleteProduct);
router.get('/categories', catalog.listCategories);
router.post('/categories', ...adminOnly, validate(schemas.categoryData), catalog.createCategory);
router.patch('/categories/:id', ...adminOnly, validate(schemas.categoryUpdate), catalog.updateCategory);
router.delete('/categories/:id', ...adminOnly, validate(schemas.id), catalog.deleteCategory);
router.get('/stores', catalog.listStores);
router.post('/stores', ...adminOnly, validate(schemas.storeData), catalog.createStore);
router.patch('/stores/:id', ...adminOnly, validate(schemas.storeUpdate), catalog.updateStore);
router.delete('/stores/:id', ...adminOnly, validate(schemas.id), catalog.deleteStore);

router.get('/cart', requireAuth, cart.listCart);
router.post('/cart/items', requireAuth, validate(schemas.cartAdd), cart.addItem);
router.patch('/cart/items/:productId', requireAuth, validate(schemas.cartUpdate), cart.updateItem);
router.delete('/cart/items/:productId', requireAuth, validate(schemas.cartProduct), cart.removeItem);
router.get('/favorites', requireAuth, favorites.listFavorites);
router.post('/favorites/:productId', requireAuth, validate(schemas.favoriteProduct), favorites.addFavorite);
router.delete('/favorites/:productId', requireAuth, validate(schemas.favoriteProduct), favorites.removeFavorite);
router.get('/orders', requireAuth, orders.listOrders);
router.post('/orders', requireAuth, validate(schemas.order), orders.createOrder);
router.patch('/orders/:id/status', ...adminOnly, validate(schemas.status), orders.updateStatus);
router.get('/reviews', requireAuth, reviews.listMyReviews);
router.post('/reviews', requireAuth, validate(schemas.review), reviews.saveReview);

router.get('/admin/dashboard', ...adminOnly, admin.dashboard);
router.get('/admin/favorites', ...adminOnly, admin.favoriteAnalytics);
router.get('/admin/users', ...adminOnly, validate(schemas.listUsers), users.listUsers);
router.get('/admin/users/:id', ...adminOnly, validate(schemas.id), users.getUser);
router.patch('/admin/users/:id', ...adminOnly, validate(schemas.userUpdate), users.updateUser);
router.delete('/admin/users/:id', ...adminOnly, validate(schemas.id), users.deleteUser);

module.exports = router;
