/* Seeds categories, products (images are served from client/public/shop), an admin and a demo customer.
   Usage: ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run seed
   Re-running is safe: existing records are updated, not duplicated. */
const path = require('path');
const bcrypt = require('bcryptjs');
const env = require('../src/config/env');
const connectDB = require('../src/config/db');
const Coupon = require('../src/models/Coupon');
const Order = require('../src/models/Order');
const Setting = require('../src/models/Setting');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');

const categories = [
  { name: 'Women', slug: 'women', blurb: 'Dresses, coats, knitwear and tailoring cut for movement.' },
  { name: 'Men', slug: 'men', blurb: 'Sharp blazers, denim, outerwear and everyday basics.' },
  { name: 'Footwear', slug: 'footwear', blurb: 'Runners and trainers that go from the street to the gym.' },
  { name: 'Accessories', slug: 'accessories', blurb: 'Bags, watches and finishing pieces to complete the look.' },
];

const products = [
  { file: 'trench', cat: 'women', name: 'Sky Blue Belted Trench', price: 5990, stock: 12, featured: true, badge: 'Bestseller', description: 'A long water-resistant trench in soft sky blue with a tie belt and storm flap. Cut relaxed so it layers over knitwear. Available in sizes XS to XL.' },
  { file: 'ruby-dress', cat: 'women', name: 'Ruby Flare Midi Dress', price: 3990, stock: 18, featured: true, badge: 'New', description: 'A fit-and-flare midi dress in a red floral print with a defined waist and a full skirt. Breathable cotton blend, lined. Sizes XS to XL.' },
  { file: 'wrapdress', cat: 'women', name: 'Coastal Floral Wrap Dress', price: 3290, stock: 20, featured: false, badge: '', description: 'A lightweight wrap dress with a soft floral print and a side tie. Falls just below the knee. Made for long summer evenings.' },
  { file: 'plaid-coat', cat: 'women', name: 'Midnight Plaid Wool Coat', price: 6490, stock: 8, featured: true, badge: '', description: 'A tailored wool-blend coat in a deep navy and green plaid. Notch lapel, two pockets and a satin lining. Sizes XS to L.' },
  { file: 'poncho', cat: 'women', name: 'Cream Fringe Knit Poncho', price: 2490, stock: 4, featured: false, badge: 'Low stock', description: 'An open-knit poncho with a hand-finished fringe hem. One size, drapes over dresses and denim alike.' },
  { file: 'stripe-pants', cat: 'women', name: 'Striped Wide-Leg Trousers', price: 2290, stock: 25, featured: false, badge: 'New', description: 'High-waisted wide-leg trousers in a bold black and white stripe. Side zip, flowing crepe fabric.' },
  { file: 'tracksuit', cat: 'women', name: 'Sunshine Co-ord Set', price: 3490, stock: 16, featured: false, badge: '', description: 'A cropped hoodie and jogger set in brushed fleece, dyed a bright sunshine yellow. Sold as a set.' },
  { file: 'blazer', cat: 'men', name: 'Midnight Navy Blazer', price: 7490, stock: 10, featured: true, badge: 'Bestseller', description: 'A half-canvassed navy blazer in a wool blend with a slim, modern cut. Two buttons, working cuffs. Sizes 38 to 46.' },
  { file: 'suit', cat: 'men', name: 'Blue Check Three-Piece Suit', price: 11990, stock: 6, featured: false, badge: '', description: 'A three-piece suit in a blue windowpane check: jacket, waistcoat and trousers. Wool blend, fully lined. Sizes 38 to 46.' },
  { file: 'white-tee', cat: 'men', name: 'Essential White Tee', price: 790, stock: 80, featured: true, badge: 'New', description: 'A heavyweight 220 GSM cotton tee with a clean crew neck and a straight fit. The one you will buy in multiples.' },
  { file: 'graphic-tee', cat: 'men', name: 'Original Print Graphic Tee', price: 1190, stock: 45, featured: false, badge: '', description: 'A soft cotton tee in stone with a bold blue front print. Regular fit, pre-washed so it keeps its shape.' },
  { file: 'denim', cat: 'men', name: 'Washed Straight Denim', price: 2490, stock: 30, featured: false, badge: '', description: 'Straight-leg jeans in a mid-weight stretch denim with a soft stonewash. Five-pocket styling. Waist 28 to 38.' },
  { file: 'bomber', cat: 'men', name: 'Terracotta Bomber Jacket', price: 3990, stock: 14, featured: false, badge: 'New', description: 'A lightweight bomber in a warm terracotta shade with ribbed cuffs and a zip front. Easy over a tee or a shirt.' },
  { file: 'biker', cat: 'men', name: 'Black Leather Biker Jacket', price: 8990, stock: 5, featured: false, badge: 'Low stock', description: 'A classic biker jacket in supple black leather with an asymmetric zip and quilted lining. Gets better with wear.' },
  { file: 'runner', cat: 'footwear', name: 'Crimson Knit Runner', price: 4990, stock: 22, featured: true, badge: 'Bestseller', description: 'A breathable knit running shoe in deep crimson with a cushioned, flexible sole. UK sizes 6 to 11.' },
  { file: 'trainer', cat: 'footwear', name: 'Volt Studio Trainer', price: 5490, stock: 15, featured: false, badge: '', description: 'A stable training shoe in neon volt with a grippy outsole for gym floors. UK sizes 6 to 11.' },
  { file: 'crossbody', cat: 'accessories', name: 'Quilted Chain Crossbody', price: 6990, stock: 9, featured: true, badge: '', description: 'A black quilted leather crossbody with a gold-tone chain strap. Fits a phone, cards and keys.' },
  { file: 'handbag', cat: 'accessories', name: 'Scarlet Top-Handle Bag', price: 5490, stock: 7, featured: false, badge: 'New', description: 'A structured top-handle bag in scarlet with a polished clasp and a detachable strap.' },
  { file: 'watch', cat: 'accessories', name: 'Minimal Smart Watch', price: 3990, stock: 28, featured: false, badge: '', description: 'A slim digital watch with a round face and a soft white silicone strap. Water resistant to 30 m.' },
  { file: 'backpack', cat: 'accessories', name: 'Navy Day Backpack', price: 2290, stock: 0, featured: false, badge: 'Sold out', description: 'A clean, minimal backpack in navy with a padded laptop sleeve and two zip pockets.' },
];

async function main() {
  await connectDB();

  const catIds = {};
  for (const c of categories) {
    const doc = await Category.findOneAndUpdate({ slug: c.slug }, c, { upsert: true, new: true, setDefaultsOnInsert: true });
    catIds[c.slug] = doc._id;
  }

  const names = products.map((p) => p.name);
  const old = await Product.deleteMany({ name: { $nin: names } });
  const oldCats = await Category.deleteMany({ slug: { $nin: categories.map((c) => c.slug) } });
  console.log('removed old products', old.deletedCount, 'categories', oldCats.deletedCount);

  const byName = {};
  for (const p of products) {
    const existing = await Product.findOne({ name: p.name });
    const image = { url: `/shop/${p.file}.jpg`, publicId: '', format: 'jpg' };
    const data = { name: p.name, description: p.description, price: p.price, stock: p.stock, featured: p.featured, badge: p.badge, category: catIds[p.cat], images: [image] };
    if (existing) { existing.set(data); await existing.save(); byName[p.name] = existing; } else byName[p.name] = await Product.create(data);
    console.log('product', p.name);
  }

  await Setting.findOneAndUpdate({ key: 'site' }, { $set: { key: 'site', storeName: 'Marigold Atelier', colors: { primary: '#141414', accent: '#b3263e', background: '#faf7f2' }, hero: { eyebrow: 'Autumn Winter 2026', title: 'Dress like the day is already yours.', text: 'New season coats, dresses, tailoring and everyday essentials, designed in India and made to last beyond the trend.', buttonText: 'Shop the collection', buttonLink: '/shop', imageUrl: '/shop/hero.jpg' }, offer: { enabled: true, eyebrow: 'Festive offer', title: 'Flat 20% off your first order.', text: 'Use the code WELCOME20 at checkout. Free shipping on every order above Rs. 2,500.', buttonText: 'Start shopping', buttonLink: '/shop', imageUrl: '/shop/banner.jpg' } } }, { upsert: true });
  const coupons = [
    { code: 'WELCOME20', description: '20% off your order', type: 'percent', value: 20, minOrder: 1000 },
    { code: 'FLAT500', description: 'Rs. 500 off orders above Rs. 4,000', type: 'fixed', value: 500, minOrder: 4000 },
  ];
  for (const c of coupons) await Coupon.findOneAndUpdate({ code: c.code }, { $setOnInsert: c }, { upsert: true });

  const { ADMIN_EMAIL, ADMIN_PASSWORD, DEMO_EMAIL, DEMO_PASSWORD } = process.env;
  const ensure = async (email, password, name, role) => {
    if (!email || !password) return console.log(`skipped ${role} (no credentials in env)`);
    const passwordHash = await bcrypt.hash(password, 12);
    await User.findOneAndUpdate({ email: email.toLowerCase() }, { name, email: email.toLowerCase(), passwordHash, role }, { upsert: true, setDefaultsOnInsert: true });
    console.log(`${role} ready:`, email);
  };
  await ensure(ADMIN_EMAIL, ADMIN_PASSWORD, 'Store Admin', 'admin');
  await ensure(DEMO_EMAIL, DEMO_PASSWORD, 'Demo Customer', 'customer');

  const demo = DEMO_EMAIL && (await User.findOne({ email: DEMO_EMAIL.toLowerCase() }));
  if (demo && !(await Order.countDocuments({ user: demo._id }))) {
    const addr = { name: 'Demo Customer', phone: '9876543210', line1: '12 Beach Road, Siripuram', city: 'Visakhapatnam', state: 'Andhra Pradesh', pincode: '530003' };
    const mk = (n, status, lines, coupon, days) => {
      const items = lines.map(([name, q]) => ({ product: byName[name]._id, name, image: `/shop/${products.find((p) => p.name === name).file}.jpg`, price: byName[name].price, quantity: q, lineTotal: byName[name].price * q }));
      const subtotal = items.reduce((t, i) => t + i.lineTotal, 0);
      const discount = coupon ? Math.round(subtotal * 0.2) : 0;
      const shipping = subtotal - discount >= 2500 ? 0 : 99;
      const created = new Date(Date.now() - days * 86400000);
      return { number: `ML-DEMO${n}`, user: demo._id, items, subtotal, discount, couponCode: coupon ? 'WELCOME20' : '', shipping, total: subtotal - discount + shipping, status, address: addr, createdAt: created, updatedAt: created };
    };
    await Order.insertMany([
      mk(1, 'delivered', [['Essential White Tee', 2], ['Washed Straight Denim', 1]], false, 12),
      mk(2, 'shipped', [['Ruby Flare Midi Dress', 1]], true, 4),
      mk(3, 'placed', [['Crimson Knit Runner', 1], ['Navy Day Backpack', 1]].slice(0, 1), false, 1),
    ]);
    console.log('demo orders added');
  }
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
