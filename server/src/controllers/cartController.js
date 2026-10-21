const { z } = require('zod');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const HttpError = require('../utils/httpError');
const asyncHandler = require('../utils/asyncHandler');
const { hasSizes, stockFor } = require('../utils/stock');

const MAX_QTY = 20;

const addSchema = z.object({
  productId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid product'),
  size: z.string().max(12).optional().default(''),
  quantity: z.coerce.number().int().min(1).max(MAX_QTY).optional().default(1),
});
const setSchema = z.object({ quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1').max(MAX_QTY), size: z.string().max(12).optional().default('') });

const sameLine = (i, productId, size) => String(i.product) === String(productId) && (i.size || '') === (size || '');
const sizeFrom = (req) => String((req.body && req.body.size) || req.query.size || '').slice(0, 12);

// Prices always come from the database, never from the client.
async function present(cart) {
  const populated = cart ? await cart.populate('items.product') : null;
  const items = [];
  let subtotal = 0;
  let count = 0;
  const notices = [];
  for (const it of populated ? populated.items : []) {
    const p = it.product;
    if (!p) continue;
    const stock = stockFor(p, it.size);
    const label = it.size ? `${p.name} (${it.size})` : p.name;
    let quantity = it.quantity;
    if (stock === 0) notices.push(`${label} is out of stock`);
    else if (quantity > stock) {
      notices.push(`Only ${stock} of ${label} left`);
      quantity = stock;
    }
    const lineTotal = p.price * quantity;
    subtotal += stock === 0 ? 0 : lineTotal;
    count += stock === 0 ? 0 : quantity;
    items.push({
      productId: p._id,
      size: it.size || '',
      key: `${p._id}:${it.size || ''}`,
      name: p.name,
      price: p.price,
      image: p.images[0] ? p.images[0].url : null,
      stock,
      quantity,
      lineTotal,
      available: stock > 0,
    });
  }
  return { items, subtotal, count, notices };
}

const getCart = asyncHandler(async (req, res) => {
  res.json(await present(await Cart.findOne({ user: req.user._id })));
});

function checkSize(product, size) {
  if (hasSizes(product)) {
    if (!size) throw new HttpError(400, 'Please choose a size');
    if (!product.sizes.some((s) => s.label === size)) throw new HttpError(400, 'That size is not available');
  } else if (size) throw new HttpError(400, 'That size is not available');
}

const addItem = asyncHandler(async (req, res) => {
  const { productId, quantity, size } = req.body;
  const product = await Product.findById(productId);
  if (!product) throw new HttpError(404, 'Product not found');
  checkSize(product, size);
  const stock = stockFor(product, size);
  if (stock < 1) throw new HttpError(409, 'This product is out of stock');
  const cart = (await Cart.findOne({ user: req.user._id })) || new Cart({ user: req.user._id, items: [] });
  const line = cart.items.find((i) => sameLine(i, product._id, size));
  const nextQty = (line ? line.quantity : 0) + quantity;
  if (nextQty > stock) throw new HttpError(409, `Only ${stock} in stock`);
  if (nextQty > MAX_QTY) throw new HttpError(409, `You can order at most ${MAX_QTY} of one item`);
  if (line) line.quantity = nextQty;
  else cart.items.push({ product: product._id, size, quantity });
  await cart.save();
  res.status(201).json(await present(cart));
});

const setQuantity = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId);
  if (!product) throw new HttpError(404, 'Product not found');
  const size = req.body.size || sizeFrom(req);
  const stock = stockFor(product, size);
  if (req.body.quantity > stock) throw new HttpError(409, `Only ${stock} in stock`);
  const cart = await Cart.findOne({ user: req.user._id });
  const line = cart && cart.items.find((i) => sameLine(i, product._id, size));
  if (!line) throw new HttpError(404, 'Item is not in your cart');
  line.quantity = req.body.quantity;
  await cart.save();
  res.json(await present(cart));
});

const removeItem = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    const size = sizeFrom(req);
    cart.items = cart.items.filter((i) => !sameLine(i, req.params.productId, size));
    await cart.save();
  }
  res.json(await present(cart));
});

const clear = asyncHandler(async (req, res) => {
  await Cart.deleteOne({ user: req.user._id });
  res.json(await present(null));
});

// Idempotent guest merge: preserve the larger quantity, never double it on retries.
const mergeSchema = z.object({ items: z.array(addSchema).max(100) });
const merge = asyncHandler(async (req, res) => {
  const cart = (await Cart.findOne({ user: req.user._id })) || new Cart({ user: req.user._id, items: [] });
  const notices = [];
  for (const it of req.body.items) {
    const p = await Product.findById(it.productId);
    const valid = p && (hasSizes(p) ? p.sizes.some((s) => s.label === it.size) : !it.size);
    const stock = valid ? stockFor(p, it.size) : 0;
    if (!stock) { notices.push('An unavailable guest item could not be added.'); continue; }
    const line = cart.items.find((i) => sameLine(i, p._id, it.size));
    const quantity = Math.min(Math.max(line ? line.quantity : 0, it.quantity), stock, MAX_QTY);
    if (line) line.quantity = quantity; else cart.items.push({ product: p._id, size: it.size, quantity });
  }
  await cart.save();
  const result = await present(cart); result.notices.push(...notices); res.json(result);
});
module.exports = { addSchema, setSchema, mergeSchema, merge, getCart, addItem, setQuantity, removeItem, clear };
