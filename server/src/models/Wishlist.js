const mongoose = require('mongoose');
const schema = new mongoose.Schema({ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true }, products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }] }, { timestamps: true });
module.exports = mongoose.models.Wishlist || mongoose.model('Wishlist', schema);
