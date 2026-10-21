const { z } = require('zod');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const cloudinary = require('../config/cloudinary');
const HttpError = require('../utils/httpError');
const asyncHandler = require('../utils/asyncHandler');
const { safeString, escapeRegex } = require('../utils/sanitize');

const SORTS = {
  newest: { createdAt: -1 },
  price_asc: { price: 1, _id: 1 },
  price_desc: { price: -1, _id: 1 },
  name: { name: 1 },
};

const listQuerySchema = z.object({
  q: z.string().max(80).optional().default(''),
  category: z.string().max(60).optional().default(''), // slug
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'name']).optional().default('newest'),
  page: z.coerce.number().int().min(1).max(1000).optional().default(1),
  limit: z.coerce.number().int().min(1).max(48).optional().default(12),
  featured: z.enum(['true', 'false']).optional(),
  inStock: z.enum(['true', 'false']).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
});

const imageInput = z.object({
  url: z.string().url().max(500).refine((u) => u.startsWith('https://'), 'Image URL must be https'),
  publicId: z.string().max(200).optional().default(''),
  width: z.number().optional(),
  height: z.number().optional(),
  format: z.string().max(10).optional(),
  bytes: z.number().optional(),
});

const productSchema = z.object({
  name: safeString(2, 120, 'Name'),
  description: safeString(10, 2000, 'Description'),
  price: z.coerce.number({ invalid_type_error: 'Price must be a number' }).min(0, 'Price cannot be negative').max(10000000),
  category: z.string().regex(/^[a-f\d]{24}$/i, 'Choose a category'),
  stock: z.coerce.number().int('Stock must be a whole number').min(0, 'Stock cannot be negative').max(100000),
  images: z.array(imageInput).max(6, 'At most 6 images').optional().default([]),
  featured: z.boolean().optional().default(false),
  badge: safeString(0, 30, 'Badge').optional().default(''),
});

function buildFilter(q) {
  return (async () => {
    const filter = {};
    if (q.q) filter.name = { $regex: escapeRegex(q.q), $options: 'i' };
    if (q.category) {
      const cat = await Category.findOne({ slug: q.category }).select('_id');
      filter.category = cat ? cat._id : new mongoose.Types.ObjectId();
    }
    if (q.featured) filter.featured = q.featured === 'true';
    if (q.inStock === 'true') filter.stock = { $gt: 0 };
    if (q.minPrice !== undefined || q.maxPrice !== undefined) {
      filter.price = {};
      if (q.minPrice !== undefined) filter.price.$gte = q.minPrice;
      if (q.maxPrice !== undefined) filter.price.$lte = q.maxPrice;
    }
    return filter;
  })();
}

const list = asyncHandler(async (req, res) => {
  const q = req.query;
  const filter = await buildFilter(q);
  const [items, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .sort(SORTS[q.sort])
      .skip((q.page - 1) * q.limit)
      .limit(q.limit)
      .lean(),
    Product.countDocuments(filter),
  ]);
  res.json({ products: items, page: q.page, limit: q.limit, total, pages: Math.max(1, Math.ceil(total / q.limit)) });
});

const getOne = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category', 'name slug').lean();
  if (!product) throw new HttpError(404, 'Product not found');
  const related = await Product.find({ category: product.category._id, _id: { $ne: product._id } })
    .populate('category', 'name slug')
    .limit(4)
    .lean();
  res.json({ product, related });
});

const create = asyncHandler(async (req, res) => {
  if (!(await Category.exists({ _id: req.body.category }))) throw new HttpError(400, 'Category does not exist', { category: 'Choose a category' });
  const product = await Product.create(req.body);
  res.status(201).json({ product: await product.populate('category', 'name slug') });
});

const update = asyncHandler(async (req, res) => {
  if (!(await Category.exists({ _id: req.body.category }))) throw new HttpError(400, 'Category does not exist', { category: 'Choose a category' });
  const existing = await Product.findById(req.params.id);
  if (!existing) throw new HttpError(404, 'Product not found');
  const keep = new Set(req.body.images.map((i) => i.publicId).filter(Boolean));
  const removed = existing.images.filter((i) => i.publicId && !keep.has(i.publicId));
  existing.set(req.body);
  await existing.save();
  destroyImages(removed);
  res.json({ product: await existing.populate('category', 'name slug') });
});

const remove = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new HttpError(404, 'Product not found');
  destroyImages(product.images);
  res.json({ ok: true });
});

// Best-effort cleanup of Cloudinary assets that belong to this app's folder only.
function destroyImages(images) {
  for (const img of images) {
    if (img.publicId && img.publicId.startsWith('marigold-loom/')) {
      cloudinary.uploader.destroy(img.publicId).catch(() => {});
    }
  }
}

module.exports = { listQuerySchema, productSchema, list, getOne, create, update, remove };
