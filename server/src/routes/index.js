const express = require('express');
const rateLimit = require('express-rate-limit');
const validate = require('../middleware/validate');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const auth = require('../controllers/authController');
const products = require('../controllers/productController');
const categories = require('../controllers/categoryController');
const cart = require('../controllers/cartController');
const uploads = require('../controllers/uploadController');
const settings = require('../controllers/settingsController');
const coupons = require('../controllers/couponController');
const orders = require('../controllers/orderController');
const { stats } = require('../controllers/statsController');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please wait a few minutes and try again.' },
});

router.get('/health', (req, res) => res.json({ ok: true }));

// Auth
router.post('/auth/signup', authLimiter, validate(auth.signupSchema), auth.signup);
router.post('/auth/login', authLimiter, validate(auth.loginSchema), auth.login);
router.post('/auth/logout', auth.logout);
router.get('/auth/me', auth.me);

// Catalog (public read)
router.get('/products', validate(products.listQuerySchema, 'query'), products.list);
router.get('/products/:id', products.getOne);
router.get('/categories', categories.list);

// Customer cart
router.get('/cart', requireAuth, cart.getCart);
router.post('/cart/items', requireAuth, validate(cart.addSchema), cart.addItem);
router.patch('/cart/items/:productId', requireAuth, validate(cart.setSchema), cart.setQuantity);
router.delete('/cart/items/:productId', requireAuth, cart.removeItem);
router.delete('/cart', requireAuth, cart.clear);

// Storefront settings (public read), checkout and orders
router.get('/settings', settings.get);
router.post('/checkout/quote', requireAuth, validate(orders.quoteSchema), orders.quote);
router.post('/orders', requireAuth, validate(orders.orderSchema), orders.place);
router.get('/orders', requireAuth, orders.mine);

// Admin only (enforced here, on the server)
router.use('/admin', requireAdmin);
router.get('/admin/stats', stats);
router.post('/admin/products', validate(products.productSchema), products.create);
router.put('/admin/products/:id', validate(products.productSchema), products.update);
router.delete('/admin/products/:id', products.remove);
router.post('/admin/categories', validate(categories.categorySchema), categories.create);
router.put('/admin/categories/:id', validate(categories.categorySchema), categories.update);
router.delete('/admin/categories/:id', categories.remove);
router.put('/admin/settings', validate(settings.settingsSchema), settings.update);
router.get('/admin/orders', orders.adminList);
router.patch('/admin/orders/:id/status', validate(orders.statusSchema), orders.adminStatus);
router.get('/admin/customers', orders.customers);
router.get('/admin/coupons', coupons.list);
router.post('/admin/coupons', validate(coupons.couponSchema), coupons.create);
router.put('/admin/coupons/:id', validate(coupons.couponSchema), coupons.update);
router.delete('/admin/coupons/:id', coupons.remove);
router.post('/admin/uploads', upload.single('image'), uploads.uploadImage);

module.exports = router;
