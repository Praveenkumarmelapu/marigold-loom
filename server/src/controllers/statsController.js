const Product = require('../models/Product');
const User = require('../models/User');
const Category = require('../models/Category');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const asyncHandler = require('../utils/asyncHandler');

const stats = asyncHandler(async (req, res) => {
  const [products, categories, customers, lowStock, outOfStock, orders, pendingOrders, coupons, revenueAgg, recentOrders, topAgg] = await Promise.all([
    Product.countDocuments(),
    Category.countDocuments(),
    User.countDocuments({ role: 'customer' }),
    Product.countDocuments({ stock: { $gt: 0, $lte: 5 } }),
    Product.countDocuments({ stock: 0 }),
    Order.countDocuments(),
    Order.countDocuments({ status: { $in: ['placed', 'processing'] } }),
    Coupon.countDocuments({ active: true }),
    Order.aggregate([{ $match: { status: { $ne: 'cancelled' } } }, { $group: { _id: null, revenue: { $sum: '$total' } } }]),
    Order.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name').lean(),
    Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.name', units: { $sum: '$items.quantity' }, revenue: { $sum: '$items.lineTotal' } } },
      { $sort: { units: -1 } },
      { $limit: 5 },
    ]),
  ]);
  res.json({
    products, categories, customers, lowStock, outOfStock, orders, pendingOrders, coupons,
    revenue: revenueAgg[0] ? revenueAgg[0].revenue : 0,
    recentOrders: recentOrders.map((o) => ({ _id: o._id, number: o.number, total: o.total, status: o.status, customer: o.user ? o.user.name : 'Deleted user', createdAt: o.createdAt })),
    topProducts: topAgg.map((t) => ({ name: t._id, units: t.units, revenue: t.revenue })),
  });
});

module.exports = { stats };
