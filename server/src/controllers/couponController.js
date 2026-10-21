const { z } = require('zod');
const Coupon = require('../models/Coupon');
const HttpError = require('../utils/httpError');
const asyncHandler = require('../utils/asyncHandler');
const { safeString } = require('../utils/sanitize');

const couponSchema = z
  .object({
    code: safeString(3, 20, 'Code').transform((v) => v.toUpperCase().replace(/\s+/g, '')).pipe(z.string().regex(/^[A-Z0-9_-]+$/, 'Use letters, numbers, - or _')),
    description: safeString(0, 120, 'Description').optional().default(''),
    type: z.enum(['percent', 'fixed'], { errorMap: () => ({ message: 'Choose percent or fixed' }) }),
    value: z.coerce.number().min(1, 'Value must be at least 1').max(100000),
    minOrder: z.coerce.number().min(0).max(1000000).optional().default(0),
    usageLimit: z.coerce.number().int().min(0).max(1000000).optional().default(0),
    expiresAt: z.union([z.string().max(30), z.null()]).optional().transform((v) => (v ? new Date(v) : null)),
    active: z.boolean().optional().default(true),
  })
  .refine((c) => c.type !== 'percent' || c.value <= 90, { path: ['value'], message: 'Percent discount cannot exceed 90' })
  .refine((c) => !c.expiresAt || !Number.isNaN(c.expiresAt.getTime()), { path: ['expiresAt'], message: 'Invalid date' });

// Returns the discount in whole rupees, or throws a friendly error.
function applyCoupon(coupon, subtotal) {
  if (!coupon || !coupon.active) throw new HttpError(400, 'That coupon code is not valid');
  if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new HttpError(400, 'That coupon has expired');
  if (coupon.usageLimit > 0 && coupon.used >= coupon.usageLimit) throw new HttpError(400, 'That coupon has been fully used');
  if (subtotal < coupon.minOrder) throw new HttpError(400, `Spend at least Rs. ${coupon.minOrder} to use this coupon`);
  const raw = coupon.type === 'percent' ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
  return Math.min(raw, subtotal);
}

const list = asyncHandler(async (req, res) => res.json({ coupons: await Coupon.find().sort({ createdAt: -1 }).lean() }));
const create = asyncHandler(async (req, res) => {
  if (await Coupon.findOne({ code: req.body.code })) throw new HttpError(409, 'A coupon with that code already exists', { code: 'Code already exists' });
  res.status(201).json({ coupon: await Coupon.create(req.body) });
});
const update = asyncHandler(async (req, res) => {
  const dupe = await Coupon.findOne({ code: req.body.code, _id: { $ne: req.params.id } });
  if (dupe) throw new HttpError(409, 'A coupon with that code already exists', { code: 'Code already exists' });
  const c = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!c) throw new HttpError(404, 'Coupon not found');
  res.json({ coupon: c });
});
const remove = asyncHandler(async (req, res) => {
  const c = await Coupon.findByIdAndDelete(req.params.id);
  if (!c) throw new HttpError(404, 'Coupon not found');
  res.json({ ok: true });
});

module.exports = { couponSchema, applyCoupon, list, create, update, remove };
