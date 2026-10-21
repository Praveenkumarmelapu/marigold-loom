/* End-to-end API checks against a running server.
   BASE_URL=http://localhost:4000 ADMIN_EMAIL=.. ADMIN_PASSWORD=.. node server/scripts/smoke-test.js */
const fs = require('fs');
const path = require('path');
const BASE = process.env.BASE_URL || 'http://localhost:4000';
const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
let pass = 0, fail = 0;

function jar() {
  let cookie = '';
  return async (method, url, body, extra = {}) => {
    const headers = { ...(cookie ? { cookie } : {}), ...extra };
    let payload = body;
    if (body && !(body instanceof FormData)) { headers['content-type'] = 'application/json'; payload = JSON.stringify(body); }
    const res = await fetch(BASE + url, { method, headers, body: payload });
    const sc = res.headers.get('set-cookie');
    if (sc) cookie = sc.split(';')[0].includes('=;') ? '' : sc.split(';')[0];
    let data = null; try { data = await res.json(); } catch { /* none */ }
    return { status: res.status, data, headers: res.headers };
  };
}
function check(name, cond, info = '') { if (cond) { pass++; console.log('PASS', name); } else { fail++; console.log('FAIL', name, info); } }

(async () => {
  const anon = jar(), cust = jar(), admin = jar();
  const email = `t${Date.now()}@example.com`;

  let r = await anon('GET', '/api/health'); check('health', r.status === 200);
  r = await anon('GET', '/api/products?limit=3'); check('public product list from DB', r.status === 200 && r.data.products.length > 0 && r.data.total >= 10);
  const first = (await anon('GET', '/api/products?limit=48')).data.products.find((p) => p.stock > 3);
  r = await anon('GET', '/api/products?q=trench'); check('search by name', r.data.products.length >= 1 && r.data.products.every((p) => /trench/i.test(p.name)));
  r = await anon('GET', '/api/products?category=women'); check('filter by category', r.data.products.length >= 3 && r.data.products.every((p) => p.category.slug === 'women'));
  r = await anon('GET', '/api/products?sort=price_asc&limit=20'); const prices = r.data.products.map((p) => p.price); check('sort by price asc', prices.every((p, i) => i === 0 || p >= prices[i - 1]));
  r = await anon('GET', '/api/products?limit=4&page=2'); check('pagination', r.data.page === 2 && r.data.pages >= 3 && r.data.products.length === 4);
  r = await anon('GET', `/api/products/${first._id}`); check('product detail', r.status === 200 && r.data.product.name === first.name && typeof r.data.product.stock === 'number');
  r = await anon('GET', '/api/products/zzz'); check('invalid id handled (400)', r.status === 400);
  r = await anon('GET', '/api/products?q[$ne]=x'); check('operator injection in query is neutralised', r.status === 200 || r.status === 400);

  // signup validation
  r = await anon('POST', '/api/auth/signup', { name: 'A', email: 'bad', password: 'short' }); check('signup validation errors', r.status === 400 && r.data.fields && r.data.fields.email);
  r = await cust('POST', '/api/auth/signup', { name: 'Test <b>User</b>', email, password: 'Passw0rd!x', role: 'admin' }); check('signup ok, role forced to customer, tags stripped', r.status === 201 && r.data.user.role === 'customer' && r.data.user.name === 'Test User', JSON.stringify(r.data));
  r = await anon('POST', '/api/auth/signup', { name: 'Dup', email, password: 'Passw0rd!x' }); check('duplicate email rejected (409)', r.status === 409);
  r = await cust('GET', '/api/auth/me'); check('session cookie works', r.data.user && r.data.user.email === email);
  r = await anon('POST', '/api/auth/login', { email, password: 'wrongpass1' }); check('wrong password 401 safe message', r.status === 401 && r.data.error === 'Incorrect email or password');
  r = await anon('POST', '/api/auth/login', { email: { $gt: '' }, password: { $gt: '' } }); check('NoSQL injection login rejected', r.status === 400 || r.status === 401);
  const set = (await fetch(BASE + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: 'Passw0rd!x' }) })).headers.get('set-cookie') || '';
  check('cookie is HttpOnly + SameSite', /HttpOnly/i.test(set) && /SameSite=Lax/i.test(set), set);

  // authorization
  r = await anon('POST', '/api/admin/products', {}); check('anon cannot hit admin API (401)', r.status === 401);
  r = await cust('POST', '/api/admin/products', {}); check('customer cannot hit admin API (403)', r.status === 403);
  r = await cust('DELETE', `/api/admin/products/${first._id}`); check('customer cannot delete product (403)', r.status === 403);
  r = await cust('GET', '/api/admin/stats'); check('customer cannot read admin stats (403)', r.status === 403);
  r = await anon('POST', '/api/admin/uploads'); check('anon cannot upload (401)', r.status === 401);
  const fd0 = new FormData(); fd0.append('image', new Blob([Buffer.from('x')], { type: 'image/png' }), 'x.png');
  r = await cust('POST', '/api/admin/uploads', fd0); check('customer cannot upload (403)', r.status === 403);

  // cart
  r = await anon('GET', '/api/cart'); check('cart requires login', r.status === 401);
  r = await cust('POST', '/api/cart/items', { productId: first._id, quantity: 2, price: 1 }); check('add to cart; client price ignored', r.status === 201 && r.data.items[0].price === first.price && r.data.subtotal === first.price * 2, JSON.stringify(r.data));
  r = await cust('PATCH', `/api/cart/items/${first._id}`, { quantity: 3 }); check('increase quantity', r.status === 200 && r.data.items[0].quantity === 3 && r.data.count === 3);
  r = await cust('PATCH', `/api/cart/items/${first._id}`, { quantity: 999 }); check('quantity above stock/limit rejected', r.status === 400 || r.status === 409);
  r = await cust('GET', '/api/cart'); check('cart persisted server-side', r.data.items.length === 1);
  const all = (await anon('GET', '/api/products?limit=48')).data.products; const sold = all.find((p) => p.stock === 0);
  r = await cust('POST', '/api/cart/items', { productId: sold._id, quantity: 1 }); check('out-of-stock product cannot be added (409)', r.status === 409);
  r = await cust('DELETE', `/api/cart/items/${first._id}`); check('remove from cart', r.status === 200 && r.data.items.length === 0);

  if (ADMIN_EMAIL) {
    r = await admin('POST', '/api/auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }); check('admin login', r.status === 200 && r.data.user.role === 'admin');
    r = await admin('GET', '/api/admin/stats'); check('admin stats', r.status === 200 && r.data.products >= 10);
    const cats = (await anon('GET', '/api/categories')).data.categories;
    r = await admin('POST', '/api/admin/products', { name: 'x', description: 'short', price: -5, category: 'nope', stock: 1.5 }); check('product validation (400 + field errors)', r.status === 400 && r.data.fields);
    r = await admin('POST', '/api/admin/products', { name: 'Smoke <script>alert(1)</script> Cup', description: 'A cup created by the smoke test.', price: 499, category: cats[0]._id, stock: 7 }); check('admin create product, html stripped', r.status === 201 && !/<script>/.test(r.data.product.name), JSON.stringify(r.data));
    const pid = r.data.product._id;
    r = await admin('PUT', `/api/admin/products/${pid}`, { name: 'Smoke Cup', description: 'An updated cup from the smoke test.', price: 599, category: cats[1]._id, stock: 3 }); check('admin update product', r.status === 200 && r.data.product.price === 599 && r.data.product.stock === 3 && r.data.product.category.slug === cats[1].slug);

    // upload validation
    const bad = new FormData(); bad.append('image', new Blob([Buffer.from('not an image at all, just text bytes')], { type: 'image/png' }), 'fake.png');
    r = await admin('POST', '/api/admin/uploads', bad); check('fake image (bad signature) rejected', r.status === 400, JSON.stringify(r.data));
    const txt = new FormData(); txt.append('image', new Blob([Buffer.from('hello')], { type: 'text/plain' }), 'a.txt');
    r = await admin('POST', '/api/admin/uploads', txt); check('non-image type rejected', r.status === 400);
    const big = new FormData(); big.append('image', new Blob([Buffer.alloc(5 * 1024 * 1024, 1)], { type: 'image/png' }), 'big.png');
    r = await admin('POST', '/api/admin/uploads', big); check('oversize image rejected', r.status === 400, JSON.stringify(r.data));
    const good = new FormData(); good.append('image', new Blob([fs.readFileSync(path.join(__dirname, '../../client/public/shop/white-tee.jpg'))], { type: 'image/jpeg' }), 'tee.jpg');
    r = await admin('POST', '/api/admin/uploads', good); check('valid image uploaded to Cloudinary', r.status === 201 && /res\.cloudinary\.com/.test(r.data.image.url), JSON.stringify(r.data));
    if (r.status === 201) {
      const image = r.data.image;
      r = await admin('PUT', `/api/admin/products/${pid}`, { name: 'Smoke Cup', description: 'An updated cup from the smoke test.', price: 599, category: cats[1]._id, stock: 3, images: [image] });
      check('image URL + metadata stored on product', r.status === 200 && r.data.product.images[0].publicId === image.publicId && r.data.product.images[0].bytes > 0);
    }
    r = await admin('DELETE', `/api/admin/products/${pid}`); check('admin delete product', r.status === 200);
    r = await anon('GET', `/api/products/${pid}`); check('deleted product is gone (404)', r.status === 404);
    r = await admin('POST', '/api/admin/categories', { name: 'Smoke Cat' }); check('admin create category', r.status === 201);
    if (r.status === 201) { r = await admin('DELETE', `/api/admin/categories/${r.data.category._id}`); check('admin delete empty category', r.status === 200); }
    // settings, coupons, orders, customers
    r = await anon('GET', '/api/settings'); check('public settings readable', r.status === 200 && /^#/.test(r.data.settings.colors.primary));
    r = await cust('PUT', '/api/admin/settings', r.data.settings); check('customer cannot change settings (403)', r.status === 403);
    const st = (await anon('GET', '/api/settings')).data.settings;
    r = await admin('PUT', '/api/admin/settings', { ...st, colors: { ...st.colors, accent: 'red' } }); check('settings reject bad colour (400)', r.status === 400);
    r = await admin('PUT', '/api/admin/settings', { ...st, hero: { ...st.hero, imageUrl: 'https://evil.example/x.jpg' } }); check('settings reject foreign image host (400)', r.status === 400);
    r = await admin('PUT', '/api/admin/settings', { ...st, colors: { ...st.colors, accent: '#112233' } }); check('admin changes site colour', r.status === 200 && r.data.settings.colors.accent === '#112233');
    r = await admin('PUT', '/api/admin/settings', st); check('settings restored', r.status === 200 && r.data.settings.colors.accent === st.colors.accent);
    r = await cust('GET', '/api/admin/orders'); check('customer cannot list admin orders (403)', r.status === 403);
    r = await cust('GET', '/api/admin/coupons'); check('customer cannot list coupons (403)', r.status === 403);
    r = await cust('GET', '/api/admin/customers'); check('customer cannot list customers (403)', r.status === 403);
    r = await admin('POST', '/api/admin/coupons', { code: 'smoke10', type: 'percent', value: 10, minOrder: 0 }); check('admin create coupon', r.status === 201 && r.data.coupon.code === 'SMOKE10');
    const cid = r.data.coupon && r.data.coupon._id;
    r = await admin('POST', '/api/admin/coupons', { code: 'SMOKE10', type: 'percent', value: 10 }); check('duplicate coupon rejected (409)', r.status === 409);
    r = await admin('POST', '/api/admin/coupons', { code: 'BAD', type: 'percent', value: 200 }); check('coupon validation (400)', r.status === 400);
    const buy = all.find((p) => p.stock > 5 && p.price > 500);
    await cust('POST', '/api/cart/items', { productId: buy._id, quantity: 2 });
    r = await cust('POST', '/api/checkout/quote', { couponCode: 'nonexistent' }); check('unknown coupon rejected (400)', r.status === 400);
    r = await cust('POST', '/api/checkout/quote', { couponCode: 'smoke10' }); check('coupon discount computed server-side', r.status === 200 && r.data.discount === Math.round(buy.price * 2 * 0.1));
    r = await cust('POST', '/api/orders', { couponCode: '', address: { name: 'T', phone: '1', line1: 'x', city: '', state: '', pincode: 'abc' } }); check('order address validation (400)', r.status === 400 && r.data.fields);
    const addr = { name: 'Test Buyer', phone: '9876543210', line1: '12 Test Street, Vizag', city: 'Visakhapatnam', state: 'Andhra Pradesh', pincode: '530003' };
    r = await cust('POST', '/api/orders', { couponCode: 'smoke10', address: addr, total: 1 }); check('place order with coupon', r.status === 201 && r.data.order.status === 'placed' && r.data.order.discount > 0 && r.data.order.total !== 1);
    const oid = r.data.order && r.data.order._id;
    r = await cust('GET', '/api/cart'); check('cart cleared after order', r.data.items.length === 0);
    r = await anon('GET', `/api/products/${buy._id}`); check('stock decremented', r.data.product.stock === buy.stock - 2);
    r = await cust('GET', '/api/orders'); check('customer sees own order', r.data.orders.length === 1);
    r = await cust('PATCH', `/api/admin/orders/${oid}/status`, { status: 'shipped' }); check('customer cannot change order status (403)', r.status === 403);
    r = await admin('GET', '/api/admin/orders?status=placed'); check('admin lists orders', r.status === 200 && r.data.orders.some((o) => o._id === oid));
    r = await admin('PATCH', `/api/admin/orders/${oid}/status`, { status: 'bogus' }); check('invalid status rejected (400)', r.status === 400);
    r = await admin('PATCH', `/api/admin/orders/${oid}/status`, { status: 'shipped' }); check('admin updates order status', r.status === 200 && r.data.order.status === 'shipped');
    r = await admin('PATCH', `/api/admin/orders/${oid}/status`, { status: 'cancelled' }); check('cancel order', r.status === 200);
    r = await anon('GET', `/api/products/${buy._id}`); check('cancel restores stock', r.data.product.stock === buy.stock);
    r = await admin('GET', '/api/admin/customers'); check('admin lists customers with order totals', r.status === 200 && r.data.customers.some((c) => c.email === email));
    r = await admin('GET', '/api/admin/stats'); check('dashboard stats include orders and revenue', typeof r.data.orders === 'number' && typeof r.data.revenue === 'number' && Array.isArray(r.data.recentOrders));
    if (cid) { r = await admin('DELETE', `/api/admin/coupons/${cid}`); check('admin delete coupon', r.status === 200); }
    r = await admin('DELETE', `/api/admin/categories/${cats[0]._id}`); check('cannot delete category that has products (409)', r.status === 409);
  }

  r = await anon('GET', '/api/nope'); check('unknown route 404 JSON', r.status === 404 && r.data.error);
  r = await anon('POST', '/api/auth/login', null, { 'content-type': 'application/json', origin: 'https://evil.example' }); check('cross-origin write blocked (403)', r.status === 403);
  const h = (await fetch(BASE + '/api/health')).headers; check('security headers (helmet)', !!h.get('x-content-type-options') && !!h.get('content-security-policy') && !h.get('x-powered-by'));

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
