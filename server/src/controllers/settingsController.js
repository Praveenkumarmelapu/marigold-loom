const { z } = require('zod');
const Setting = require('../models/Setting');
const asyncHandler = require('../utils/asyncHandler');
const { safeString } = require('../utils/sanitize');

const color = (label) => z.string({ required_error: `${label} is required` }).regex(/^#[0-9a-fA-F]{6}$/, `${label} must be a hex colour like #b3263e`);
// Images must be hosted by us or on Cloudinary, never an arbitrary third-party URL.
const image = z
  .string()
  .max(500)
  .refine((v) => v === '' || /^\/[A-Za-z0-9/_.-]+$/.test(v) || /^https:\/\/res\.cloudinary\.com\//.test(v), 'Use an uploaded image');
const link = z.string().max(200).refine((v) => /^\/[A-Za-z0-9/_?=&.-]*$/.test(v), 'Link must start with /');

const slideSchema = z.object({
  eyebrow: safeString(0, 60, 'Banner label'),
  title: safeString(3, 100, 'Banner headline'),
  text: safeString(0, 300, 'Banner text'),
  buttonText: safeString(1, 30, 'Banner button'),
  buttonLink: link,
  imageUrl: image,
});

const settingsSchema = z.object({
  storeName: safeString(2, 40, 'Store name'),
  colors: z.object({ primary: color('Primary colour'), accent: color('Accent colour'), background: color('Background colour') }),
  hero: z.object({
    eyebrow: safeString(0, 60, 'Hero label'),
    title: safeString(3, 100, 'Hero headline'),
    text: safeString(0, 300, 'Hero text'),
    buttonText: safeString(1, 30, 'Hero button'),
    buttonLink: link,
    imageUrl: image,
  }),
  offer: z.object({
    enabled: z.boolean(),
    eyebrow: safeString(0, 60, 'Offer label'),
    title: safeString(3, 100, 'Offer headline'),
    text: safeString(0, 300, 'Offer text'),
    buttonText: safeString(1, 30, 'Offer button'),
    buttonLink: link,
    imageUrl: image,
  }),
});

async function current() {
  return Setting.findOneAndUpdate({ key: 'site' }, { $setOnInsert: { key: 'site' } }, { upsert: true, new: true, setDefaultsOnInsert: true }).lean();
}
// Older documents predate hero.slides: fall back to the single legacy banner so the
// storefront always has something to show, and always hand the client 3+ slides.
const DEFAULT_SLIDES = [
  { eyebrow: 'Autumn Winter 2026', title: 'Dress like the day is already yours.', text: 'New season coats, dresses, tailoring and everyday essentials, designed in India and made to last beyond the trend.', buttonText: 'Shop the collection', buttonLink: '/shop', imageUrl: '/shop/hero.jpg' },
  { eyebrow: 'The dress edit', title: 'Occasion-ready, every single time.', text: 'Midi dresses, wrap silhouettes and prints that carry a room.', buttonText: 'Shop women', buttonLink: '/shop?category=women', imageUrl: '/shop/ruby-dress.jpg' },
  { eyebrow: 'Tailoring for him', title: 'Sharp cuts. Honest prices.', text: 'Blazers, suits and everyday basics built on clean lines.', buttonText: 'Shop men', buttonLink: '/shop?category=men', imageUrl: '/shop/blazer.jpg' },
];
const present = (s) => {
  const hero = s.hero || {};
  let slides = Array.isArray(hero.slides) ? hero.slides.filter((sl) => sl && sl.imageUrl) : [];
  if (!slides.length && hero.imageUrl) slides = [{ eyebrow: hero.eyebrow, title: hero.title, text: hero.text, buttonText: hero.buttonText, buttonLink: hero.buttonLink, imageUrl: hero.imageUrl }];
  slides = slides.slice(0, 6);
  while (slides.length < 3) slides.push(DEFAULT_SLIDES[slides.length]);
  return { storeName: s.storeName, colors: s.colors, hero: { ...hero, slides }, offer: s.offer };
};

const get = asyncHandler(async (req, res) => res.json({ settings: present(await current()) }));
const update = asyncHandler(async (req, res) => {
  await current();
  const s = await Setting.findOneAndUpdate({ key: 'site' }, { $set: req.body }, { new: true, runValidators: true }).lean();
  res.json({ settings: present(s) });
});

module.exports = { settingsSchema, get, update };
