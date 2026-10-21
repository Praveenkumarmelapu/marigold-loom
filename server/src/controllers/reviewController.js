const { z } = require('zod');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const HttpError = require('../utils/httpError');
const asyncHandler = require('../utils/asyncHandler');
const { safeString } = require('../utils/sanitize');

const reviewSchema = z.object({
  rating: z.coerce.number().int('Choose a star rating').min(1, 'Choose a star rating').max(5),
  title: safeString(0, 80, 'Title').optional().default(''),
  comment: safeString(10, 1000, 'Review'),
});

const validId = (id) => /^[a-f\d]{24}$/i.test(id);

async function recalc(productId) {
  const [agg] = await Review.aggregate([
    { $match: { product: new (require('mongoose').Types.ObjectId)(String(productId)) } },
    { $group: { _id: null, avg: { $avg: '$rating' }, n: { $sum: 1 } } },
  ]);
  await Product.updateOne({ _id: productId }, { ratingAvg: agg ? Math.round(agg.avg * 10) / 10 : 0, ratingCount: agg ? agg.n : 0 });
}

const list = asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) throw new HttpError(404, 'Product not found');
  const reviews = await Review.find({ product: req.params.id }).sort({ createdAt: -1 }).limit(50).select('-user').lean();
  const product = await Product.findById(req.params.id).select('ratingAvg ratingCount').lean();
  if (!product) throw new HttpError(404, 'Product not found');
  const breakdown = [5, 4, 3, 2, 1].map((s) => ({ stars: s, count: reviews.filter((r) => r.rating === s).length }));
  let mine = null;
  if (req.user) mine = await Review.findOne({ product: req.params.id, user: req.user._id }).select('rating title comment').lean();
  let purchased = false;
  if (req.user) purchased = !!(await Order.exists({ user: req.user._id, 'items.product': req.params.id, status: { $ne: 'cancelled' } }));
  res.json({ reviews, average: product.ratingAvg || 0, count: product.ratingCount || 0, breakdown, mine, purchased });
});

const save = asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) throw new HttpError(404, 'Product not found');
  if (!(await Product.exists({ _id: req.params.id }))) throw new HttpError(404, 'Product not found');
  const verified = !!(await Order.exists({ user: req.user._id, 'items.product': req.params.id, status: { $ne: 'cancelled' } }));
  await Review.findOneAndUpdate(
    { product: req.params.id, user: req.user._id },
    { $set: { ...req.body, name: req.user.name.slice(0, 60), verified } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  await recalc(req.params.id);
  res.status(201).json({ ok: true });
});

const removeMine = asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) throw new HttpError(404, 'Product not found');
  await Review.deleteOne({ product: req.params.id, user: req.user._id });
  await recalc(req.params.id);
  res.json({ ok: true });
});

// Admin moderation
const adminList = asyncHandler(async (req, res) => {
  const reviews = await Review.find().sort({ createdAt: -1 }).limit(200).populate('product', 'name').lean();
  res.json({ reviews });
});
const adminRemove = asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) throw new HttpError(404, 'Review not found');
  const r = await Review.findByIdAndDelete(req.params.id);
  if (!r) throw new HttpError(404, 'Review not found');
  await recalc(r.product);
  res.json({ ok: true });
});

module.exports = { reviewSchema, list, save, removeMine, adminList, adminRemove };
