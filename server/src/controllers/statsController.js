const Product = require('../models/Product');
const User = require('../models/User');
const Category = require('../models/Category');
const asyncHandler = require('../utils/asyncHandler');

const stats = asyncHandler(async (req, res) => {
  const [products, categories, customers, lowStock, outOfStock] = await Promise.all([
    Product.countDocuments(),
    Category.countDocuments(),
    User.countDocuments({ role: 'customer' }),
    Product.countDocuments({ stock: { $gt: 0, $lte: 5 } }),
    Product.countDocuments({ stock: 0 }),
  ]);
  res.json({ products, categories, customers, lowStock, outOfStock });
});

module.exports = { stats };
