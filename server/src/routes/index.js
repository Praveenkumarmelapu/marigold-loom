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

// Admin only (enforced here, on the server)
router.use('/admin', requireAdmin);
router.get('/admin/stats', stats);
router.post('/admin/products', validate(products.productSchema), products.create);
router.put('/admin/products/:id', validate(products.productSchema), products.update);
router.delete('/admin/products/:id', products.remove);
router.post('/admin/categories', validate(categories.categorySchema), categories.create);
router.put('/admin/categories/:id', validate(categories.categorySchema), categories.update);
router.delete('/admin/categories/:id', categories.remove);
router.post('/admin/uploads', upload.single('image'), uploads.uploadImage);

module.exports = router;
