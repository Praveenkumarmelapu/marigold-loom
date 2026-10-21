import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { api, img, money } from '../lib/api';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import ProductGrid from '../components/ProductGrid.jsx';
import Spinner from '../components/Spinner.jsx';

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { add } = useCart();
  const nav = useNavigate();
  const loc = useLocation();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setData(null); setError(''); setActive(0); setQty(1); setMsg('');
    api.get(`/products/${id}`).then(setData).catch((e) => setError(e.status === 404 || e.status === 400 ? 'We could not find that product.' : e.message));
  }, [id]);

  if (error) return <div className="container state-box"><h1>Product not found</h1><p>{error}</p><Link className="btn" to="/shop">Back to the shop</Link></div>;
  if (!data) return <Spinner />;
  const p = data.product;
  const out = p.stock === 0;
  const maxQty = Math.min(p.stock, 10);

  const addToCart = async () => {
    if (!user) return nav('/login', { state: { from: loc.pathname } });
    setBusy(true); setMsg('');
    try { await add(p._id, qty); } catch (e) { setMsg(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="container pdp">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/shop">&larr; Back to all products</Link>
        {p.category && <> <span>/</span> <Link to={`/shop?category=${p.category.slug}`}>{p.category.name}</Link></>}
      </nav>
      <div className="pdp-grid">
        <div className="gallery">
          <div className="gallery-main">
            {p.images[active] ? <img src={img(p.images[active].url, 1100)} alt={p.name} /> : <div className="noimg">No image</div>}
          </div>
          {p.images.length > 1 && (
            <div className="thumbs">
              {p.images.map((im, i) => (
                <button key={im.url} className={i === active ? 'on' : ''} onClick={() => setActive(i)} aria-label={`Show image ${i + 1}`}><img src={img(im.url, 160)} alt="" /></button>
              ))}
            </div>
          )}
        </div>
        <div className="pdp-info">
          {p.category && <p className="eyebrow">{p.category.name}</p>}
          <h1>{p.name}</h1>
          <p className="pdp-price">{money(p.price)} <small>incl. taxes</small></p>
          <p className={`stock ${out ? 'out' : p.stock <= 5 ? 'low' : 'in'}`}>
            {out ? 'Sold out' : p.stock <= 5 ? `Only ${p.stock} left` : 'In stock, ships in 2 to 3 days'}
          </p>
          <p className="pdp-desc">{p.description}</p>
          <div className="buy">
            <label className="qty">Quantity
              <select value={qty} disabled={out} onChange={(e) => setQty(Number(e.target.value))}>
                {Array.from({ length: Math.max(maxQty, 1) }, (_, i) => i + 1).map((n) => <option key={n}>{n}</option>)}
              </select>
            </label>
            <button className="btn btn-lg" disabled={out || busy} onClick={addToCart}>{out ? 'Sold out' : busy ? 'Adding...' : 'Add to cart'}</button>
          </div>
          {!user && !out && <p className="hint">You will be asked to log in so your cart is saved.</p>}
          {msg && <p className="notice error" role="alert">{msg}</p>}
          <ul className="pdp-facts">
            <li>Free shipping over &#8377;2,500</li>
            <li>7-day returns on unused items</li>
            <li>Packed in recycled paper</li>
          </ul>
        </div>
      </div>
      {data.related.length > 0 && (
        <section className="section" aria-labelledby="rel-h">
          <div className="section-head"><h2 id="rel-h">More from {p.category && p.category.name}</h2></div>
          <ProductGrid products={data.related} />
        </section>
      )}
    </div>
  );
}
