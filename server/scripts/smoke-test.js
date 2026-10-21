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
  r = await anon('GET', '/api/products?q=mug'); check('search by name', r.data.products.length >= 1 && r.data.products.every((p) => /mug/i.test(p.name)));
  r = await anon('GET', '/api/products?category=ceramics'); check('filter by category', r.data.products.length >= 3 && r.data.products.every((p) => p.category.slug === 'ceramics'));
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
    const good = new FormData(); good.append('image', new Blob([fs.readFileSync(path.join(__dirname, '../seed-images/mug.jpg'))], { type: 'image/jpeg' }), 'mug.jpg');
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
    r = await admin('DELETE', `/api/admin/categories/${cats[0]._id}`); check('cannot delete category that has products (409)', r.status === 409);
  }

  r = await anon('GET', '/api/nope'); check('unknown route 404 JSON', r.status === 404 && r.data.error);
  r = await anon('POST', '/api/auth/login', null, { 'content-type': 'application/json', origin: 'https://evil.example' }); check('cross-origin write blocked (403)', r.status === 403);
  const h = (await fetch(BASE + '/api/health')).headers; check('security headers (helmet)', !!h.get('x-content-type-options') && !!h.get('content-security-policy') && !h.get('x-powered-by'));

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
