const mongoose = require('mongoose');

// One document (key "site") holds the storefront look: theme colours, hero banner, offer banner.
const settingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'site' },
    storeName: { type: String, default: 'Marigold Atelier' },
    colors: {
      primary: { type: String, default: '#141414' },
      accent: { type: String, default: '#b3263e' },
      background: { type: String, default: '#faf7f2' },
    },
    hero: {
      eyebrow: { type: String, default: 'Autumn Winter 2026' },
      title: { type: String, default: 'Dress like the day is already yours.' },
      text: { type: String, default: 'New season coats, dresses, tailoring and everyday essentials, designed in India and made to last beyond the trend.' },
      buttonText: { type: String, default: 'Shop the collection' },
      buttonLink: { type: String, default: '/shop' },
      imageUrl: { type: String, default: '/shop/hero.jpg' },
    },
    offer: {
      enabled: { type: Boolean, default: true },
      eyebrow: { type: String, default: 'Festive offer' },
      title: { type: String, default: 'Flat 20% off your first order.' },
      text: { type: String, default: 'Use the code WELCOME20 at checkout. Free shipping on every order above Rs. 2,500.' },
      buttonText: { type: String, default: 'Start shopping' },
      buttonLink: { type: String, default: '/shop' },
      imageUrl: { type: String, default: '/shop/banner.jpg' },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Setting || mongoose.model('Setting', settingSchema);
