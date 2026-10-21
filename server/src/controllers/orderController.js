const { z } = require('zod');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const Order = require('../models/Order');
const User = require('../models/User');
const HttpError = require('../utils/httpError');
const asyncHandler = require('../utils/asyncHandler');
const { safeString, escapeRegex } = require('../utils/sanitize');
const { applyCoupon } = require('./couponController');
const { hasSizes, stockFor } = require('../utils/stock');

const FREE_SHIPPING_OVER = 2500;
const SHIPPING_FEE = 99;
const STATUSES = ['placed', 'processing', 'shipped', 'delivered', 'cancelled'];

const couponField = z.string().max(20).optional().default('').transform((v) => v.trim().toUpperCase());
const quoteSchema = z.object({ couponCode: couponField });
const orderSchema = z.object({
  couponCode: couponField,
  address: z.object({
    name: safeString(2, 80, 'Full name'),
    phone: z.string({ required_error: 'Phone is required' }).regex(/^[0-9+\s-]{10,15}$/, 'Enter a valid phone number'),
    line1: safeString(5, 200, 'Address'),
    city: safeString(2, 60, 'City'),
    state: safeString(2, 60, 'State'),
    pincode: z.string({ required_error: 'PIN code is required' }).regex(/^[0-9]{6}$/, 'PIN code must be 6 digits'),
  }),
});
const statusSchema = z.object({ status: z.enum(STATUSES, { errorMap: () => ({ message: 'Invalid status' }) }) });

// Atomically change stock for a product, or for one size (keeping the total in step).
async function adjustStock(productId, size, delta, guard = false) {
  if (size) {
    const cond = { _id: productId, sizes: { $elemMatch: guard ? { label: size, stock: { $gte: -delta } } : { label: size } } };
    return Product.updateOne(cond, { $inc: { 'sizes.$.stock': delta, stock: delta } });
  }
  return Product.updateOne(guard ? { _id: productId, stock: { $gte: -delta } } : { _id: productId }, { $inc: { stock: delta } });
}

// Prices and stock always come from the database.
async function priceCart(userId, couponCode) {
  const cart = await Cart.findOne({ user: userId }).populate('items.product');
  const lines = [];
  for (const it of cart ? cart.items : []) {
    const p = it.product;
    if (!p) continue;
    const stock = stockFor(p, it.size);
    const label = it.size ? `${p.name} (${it.size})` : p.name;
    if (stock < it.quantity) throw new HttpError(409, stock === 0 ? `${label} is sold out. Remove it from your cart.` : `Only ${stock} of ${label} left. Update your cart.`);
    lines.push({ product: p._id, size: it.size || '', name: p.name, image: p.images[0] ? p.images[0].url : '', price: p.price, quantity: it.quantity, lineTotal: p.price * it.quantity });
  }
  if (!lines.length) throw new HttpError(400, 'Your cart is empty');
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  let discount = 0;
  let coupon = null;
  if (couponCode) {
    coupon = await Coupon.findOne({ code: couponCode });
    discount = applyCoupon(coupon, subtotal);
  }
  const shipping = subtotal - discount >= FREE_SHIPPING_OVER ? 0 : SHIPPING_FEE;
  return { lines, subtotal, discount, shipping, total: subtotal - discount + shipping, coupon };
}

const quote = asyncHandler(async (req, res) => {
  const q = await priceCart(req.user._id, req.body.couponCode);
  res.json({ subtotal: q.subtotal, discount: q.discount, shipping: q.shipping, total: q.total, couponCode: q.coupon ? q.coupon.code : '' });
});

const place = asyncHandler(async (req, res) => {
  const q = await priceCart(req.user._id, req.body.couponCode);
  // Reserve stock atomically; roll back if any line fails.
  const reserved = [];
  try {
    for (const l of q.lines) {
      const r = await adjustStock(l.product, l.size, -l.quantity, true);
      if (r.modifiedCount !== 1) throw new HttpError(409, `${l.name} just sold out. Please review your cart.`);
      reserved.push(l);
    }
    if (q.coupon) {
      const r = await Coupon.updateOne(
        { _id: q.coupon._id, $or: [{ usageLimit: 0 }, { $expr: { $lt: ['$used', '$usageLimit'] } }] },
        { $inc: { used: 1 } }
      );
      if (r.modifiedCount !== 1) throw new HttpError(400, 'That coupon has been fully used');
    }
  } catch (err) {
    for (const l of reserved) await adjustStock(l.product, l.size, l.quantity);
    throw err;
  }
  const number = `ML-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
  const order = await Order.create({
    number, user: req.user._id, items: q.lines, subtotal: q.subtotal, discount: q.discount,
    couponCode: q.coupon ? q.coupon.code : '', shipping: q.shipping, total: q.total, address: req.body.address,
  });
  await Cart.deleteOne({ user: req.user._id });
  res.status(201).json({ order });
});

const mine = asyncHandler(async (req, res) => res.json({ orders: await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50).lean() }));

// Admin
const adminList = asyncHandler(async (req, res) => {
  const filter = {};
  if (STATUSES.includes(req.query.status)) filter.status = req.query.status;
  const q = String(req.query.q || '').trim().slice(0, 40);
  if (q) filter.number = new RegExp(escapeRegex(q), 'i');
  const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(200).populate('user', 'name email').lean();
  res.json({ orders });
});

const adminStatus = asyncHandler(async (req, res) => {
  if (!/^[a-f\d]{24}$/i.test(req.params.id)) throw new HttpError(404, 'Order not found');
  const order = await Order.findById(req.params.id);
  if (!order) throw new HttpError(404, 'Order not found');
  const next = req.body.status;
  if (order.status === 'cancelled') throw new HttpError(409, 'A cancelled order cannot be changed');
  if (next === 'cancelled') {
    for (const it of order.items) await adjustStock(it.product, it.size, it.quantity);
    if (order.couponCode) await Coupon.updateOne({ code: order.couponCode, used: { $gt: 0 } }, { $inc: { used: -1 } });
  }
  order.status = next;
  await order.save();
  res.json({ order });
});

const customers = asyncHandler(async (req, res) => {
  const [users, agg] = await Promise.all([
    User.find({ role: 'customer' }).sort({ createdAt: -1 }).lean(),
    Order.aggregate([{ $match: { status: { $ne: 'cancelled' } } }, { $group: { _id: '$user', orders: { $sum: 1 }, spent: { $sum: '$total' }, last: { $max: '$createdAt' } } }]),
  ]);
  const m = new Map(agg.map((a) => [String(a._id), a]));
  res.json({
    customers: users.map((u) => {
      const a = m.get(String(u._id)) || {};
      return { _id: u._id, name: u.name, email: u.email, joined: u.createdAt, orders: a.orders || 0, spent: a.spent || 0, lastOrder: a.last || null };
    }),
  });
});

module.exports = { quoteSchema, orderSchema, statusSchema, quote, place, mine, adminList, adminStatus, customers };
