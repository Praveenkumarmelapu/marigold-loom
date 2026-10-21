/* Seeds categories, products (images uploaded to Cloudinary), an admin and a demo customer.
   Usage: ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run seed
   Re-running is safe: existing records are updated, not duplicated. */
const path = require('path');
const bcrypt = require('bcryptjs');
const env = require('../src/config/env');
const connectDB = require('../src/config/db');
const cloudinary = require('../src/config/cloudinary');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');

const categories = [
  { name: 'Textiles', slug: 'textiles', blurb: 'Handloom throws, cushions, towels and runners woven in small batches.' },
  { name: 'Ceramics', slug: 'ceramics', blurb: 'Wheel-thrown mugs, bowls and vases with honest, uneven glazes.' },
  { name: 'Living', slug: 'living', blurb: 'Baskets, candles and kitchen linen for everyday rituals.' },
];

const products = [
  { file: 'throw', cat: 'textiles', name: 'Neel Indigo Throw', price: 3490, stock: 14, featured: true, badge: 'Bestseller', description: 'A loose-weave cotton throw dyed in natural indigo, finished with a hand-knotted fringe. Soft after the first wash and better after the tenth. 130 x 180 cm.' },
  { file: 'cushion', cat: 'textiles', name: 'Rangoli Cushion Cover', price: 1190, stock: 40, featured: true, badge: 'New', description: 'Geometric handloom cushion cover in terracotta and mustard. Concealed zip, fits a 45 x 45 cm insert. Insert not included.' },
  { file: 'towel', cat: 'textiles', name: 'Waffle Bath Towel Set of 3', price: 2790, stock: 22, featured: false, badge: '', description: 'Heavy waffle-weave cotton towels in sage, clay and ivory. Quick drying, lint free, 500 GSM. Set of three bath towels.' },
  { file: 'runner', cat: 'textiles', name: 'Jute and Cotton Table Runner', price: 1590, stock: 18, featured: false, badge: 'New', description: 'A hand-loomed runner with a rust centre stripe on natural jute. Wipe clean, 40 x 180 cm.' },
  { file: 'mug', cat: 'ceramics', name: 'Speckle Stoneware Mug (Pair)', price: 1290, stock: 35, featured: true, badge: 'Bestseller', description: 'Two wheel-thrown mugs with a cream speckle glaze and a dark rim. Each holds about 300 ml. Dishwasher and microwave safe.' },
  { file: 'bowl', cat: 'ceramics', name: 'Terracotta Serving Bowls, Nest of 3', price: 2190, stock: 12, featured: true, badge: '', description: 'Three matte terracotta bowls that nest together. Food safe inside, left raw outside so the clay breathes. Hand wash recommended.' },
  { file: 'vase', cat: 'ceramics', name: 'Ribbed Indigo Bud Vase', price: 1490, stock: 4, featured: false, badge: 'Low stock', description: 'A tall ribbed vase in deep indigo glaze. Made for dried grasses or a single stem. Holds water. 26 cm tall.' },
  { file: 'plate', cat: 'ceramics', name: 'Marigold Rim Dinner Plates, Set of 4', price: 3290, stock: 9, featured: false, badge: '', description: 'Hand-painted rims in marigold yellow on a warm white body. 26 cm across. Oven and dishwasher safe.' },
  { file: 'basket', cat: 'living', name: 'Seagrass Storage Basket', price: 1890, stock: 25, featured: false, badge: '', description: 'Tightly woven seagrass basket with soft leather handles. Holds blankets, toys or firewood. 38 cm wide.' },
  { file: 'candle', cat: 'living', name: 'Sandalwood Clay Candle', price: 890, stock: 60, featured: true, badge: 'New', description: 'Hand-poured soy wax in a reusable clay vessel with a wooden lid. About 40 hours of burn time.' },
  { file: 'apron', cat: 'living', name: 'Rust Linen Kitchen Apron', price: 1390, stock: 0, featured: false, badge: 'Sold out', description: 'Washed linen apron with cross-back straps and a deep front pocket. One size, adjustable.' },
];

async function upload(file, name) {
  const res = await cloudinary.uploader.upload(path.join(__dirname, '../seed-images', `${file}.jpg`), {
    folder: 'marigold-loom/seed',
    public_id: name,
    overwrite: true,
  });
  return { url: res.secure_url, publicId: res.public_id, width: res.width, height: res.height, format: res.format, bytes: res.bytes };
}

async function main() {
  await connectDB();

  const catIds = {};
  for (const c of categories) {
    const doc = await Category.findOneAndUpdate({ slug: c.slug }, c, { upsert: true, new: true, setDefaultsOnInsert: true });
    catIds[c.slug] = doc._id;
  }

  for (const p of products) {
    const existing = await Product.findOne({ name: p.name });
    const image = existing && existing.images[0] ? existing.images[0] : await upload(p.file, p.file);
    const data = { name: p.name, description: p.description, price: p.price, stock: p.stock, featured: p.featured, badge: p.badge, category: catIds[p.cat], images: [image] };
    if (existing) { existing.set(data); await existing.save(); } else await Product.create(data);
    console.log('product', p.name);
  }

  if (process.env.UPLOAD_HERO !== 'false') {
    const hero = await upload('hero', 'hero');
    console.log('HERO_URL', hero.url);
  }

  const { ADMIN_EMAIL, ADMIN_PASSWORD, DEMO_EMAIL, DEMO_PASSWORD } = process.env;
  const ensure = async (email, password, name, role) => {
    if (!email || !password) return console.log(`skipped ${role} (no credentials in env)`);
    const passwordHash = await bcrypt.hash(password, 12);
    await User.findOneAndUpdate({ email: email.toLowerCase() }, { name, email: email.toLowerCase(), passwordHash, role }, { upsert: true, setDefaultsOnInsert: true });
    console.log(`${role} ready:`, email);
  };
  await ensure(ADMIN_EMAIL, ADMIN_PASSWORD, 'Store Admin', 'admin');
  await ensure(DEMO_EMAIL, DEMO_PASSWORD, 'Demo Customer', 'customer');
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
