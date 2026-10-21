const { z } = require('zod');
const Category = require('../models/Category');
const Product = require('../models/Product');
const HttpError = require('../utils/httpError');
const asyncHandler = require('../utils/asyncHandler');
const { safeString, slugify } = require('../utils/sanitize');

const categorySchema = z.object({
  name: safeString(2, 60, 'Name'),
  blurb: safeString(0, 200, 'Blurb').optional().default(''),
});

const list = asyncHandler(async (req, res) => {
  const [categories, counts] = await Promise.all([
    Category.find().sort({ name: 1 }).lean(),
    Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
  ]);
  const map = new Map(counts.map((c) => [String(c._id), c.count]));
  res.json({ categories: categories.map((c) => ({ ...c, productCount: map.get(String(c._id)) || 0 })) });
});

const create = asyncHandler(async (req, res) => {
  const slug = slugify(req.body.name);
  if (!slug) throw new HttpError(400, 'Name must contain letters or numbers', { name: 'Invalid name' });
  const category = await Category.create({ ...req.body, slug });
  res.status(201).json({ category });
});

const update = asyncHandler(async (req, res) => {
  const slug = slugify(req.body.name);
  const category = await Category.findByIdAndUpdate(req.params.id, { ...req.body, slug }, { new: true, runValidators: true });
  if (!category) throw new HttpError(404, 'Category not found');
  res.json({ category });
});

const remove = asyncHandler(async (req, res) => {
  if (await Product.exists({ category: req.params.id })) {
    throw new HttpError(409, 'This category still has products. Move or delete them first.');
  }
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw new HttpError(404, 'Category not found');
  res.json({ ok: true });
});

module.exports = { categorySchema, list, create, update, remove };
