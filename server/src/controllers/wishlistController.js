const { z } = require('zod');
const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/httpError');
const schema = z.object({ productIds: z.array(z.string().regex(/^[a-f\d]{24}$/i)).max(100) });
async function present(user) {
 const w = await Wishlist.findOne({ user }).populate({ path: 'products', populate: { path: 'category', select: 'name slug' } });
 return { products: w ? w.products.filter(Boolean) : [] };
}
const get = asyncHandler(async (req,res) => res.json(await present(req.user._id)));
const merge = asyncHandler(async (req,res) => {
 const products = await Product.find({ _id: { $in: req.body.productIds } }).select('_id');
 await Wishlist.updateOne({ user: req.user._id }, { $addToSet: { products: { $each: products.map(p=>p._id) } } }, { upsert: true });
 res.json(await present(req.user._id));
});
const remove = asyncHandler(async (req,res) => {
 if (!/^[a-f\d]{24}$/i.test(req.params.id)) throw new HttpError(400,'Invalid product');
 await Wishlist.updateOne({ user: req.user._id }, { $pull: { products: req.params.id } });
 res.json(await present(req.user._id));
});
module.exports = { schema, get, merge, remove };
