const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: '' },
    width: Number,
    height: Number,
    format: String,
    bytes: Number,
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120, index: true },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    price: { type: Number, required: true, min: 0 }, // INR, whole rupees
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    images: { type: [imageSchema], default: [] },
    stock: { type: Number, required: true, min: 0, default: 0 },
    sizes: { type: [{ _id: false, label: { type: String, trim: true, maxlength: 12 }, stock: { type: Number, min: 0, default: 0 } }], default: [] },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    badge: { type: String, trim: true, maxlength: 30, default: '' },
  },
  { timestamps: true }
);

productSchema.index({ createdAt: -1 });
productSchema.index({ price: 1 });

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);
