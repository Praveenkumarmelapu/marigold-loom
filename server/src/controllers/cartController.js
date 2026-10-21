const { z } = require('zod');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const HttpError = require('../utils/httpError');
const asyncHandler = require('../utils/asyncHandler');

const MAX_QTY = 20;

const addSchema = z.object({
  productId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid product'),
  quantity: z.coerce.number().int().min(1).max(MAX_QTY).optional().default(1),
});
const setSchema = z.object({ quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1').max(MAX_QTY) });

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
    let quantity = it.quantity;
    if (p.stock === 0) notices.push(`${p.name} is out of stock`);
    else if (quantity > p.stock) {
      notices.push(`Only ${p.stock} of ${p.name} left`);
      quantity = p.stock;
    }
    const lineTotal = p.price * quantity;
    subtotal += p.stock === 0 ? 0 : lineTotal;
    count += p.stock === 0 ? 0 : quantity;
    items.push({
      productId: p._id,
      name: p.name,
      price: p.price,
      image: p.images[0] ? p.images[0].url : null,
      stock: p.stock,
      quantity,
      lineTotal,
      available: p.stock > 0,
    });
  }
  return { items, subtotal, count, notices };
}

const getCart = asyncHandler(async (req, res) => {
  res.json(await present(await Cart.findOne({ user: req.user._id })));
});

const addItem = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  const product = await Product.findById(productId);
  if (!product) throw new HttpError(404, 'Product not found');
  if (product.stock < 1) throw new HttpError(409, 'This product is out of stock');
  const cart = (await Cart.findOne({ user: req.user._id })) || new Cart({ user: req.user._id, items: [] });
  const line = cart.items.find((i) => i.product.equals(product._id));
  const nextQty = (line ? line.quantity : 0) + quantity;
  if (nextQty > product.stock) throw new HttpError(409, `Only ${product.stock} in stock`);
  if (nextQty > MAX_QTY) throw new HttpError(409, `You can order at most ${MAX_QTY} of one item`);
  if (line) line.quantity = nextQty;
  else cart.items.push({ product: product._id, quantity });
  await cart.save();
  res.status(201).json(await present(cart));
});

const setQuantity = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId);
  if (!product) throw new HttpError(404, 'Product not found');
  if (req.body.quantity > product.stock) throw new HttpError(409, `Only ${product.stock} in stock`);
  const cart = await Cart.findOne({ user: req.user._id });
  const line = cart && cart.items.find((i) => i.product.equals(product._id));
  if (!line) throw new HttpError(404, 'Item is not in your cart');
  line.quantity = req.body.quantity;
  await cart.save();
  res.json(await present(cart));
});

const removeItem = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.items = cart.items.filter((i) => String(i.product) !== req.params.productId);
    await cart.save();
  }
  res.json(await present(cart));
});

const clear = asyncHandler(async (req, res) => {
  await Cart.deleteOne({ user: req.user._id });
  res.json(await present(null));
});

module.exports = { addSchema, setSchema, getCart, addItem, setQuantity, removeItem, clear };
