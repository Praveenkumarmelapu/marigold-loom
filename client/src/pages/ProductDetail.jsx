import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, img, money } from '../lib/api';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import ProductGrid from '../components/ProductGrid.jsx';
import Spinner from '../components/Spinner.jsx';
import HeartButton from '../components/HeartButton';
import { stored,save } from '../lib/storage';

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { add, loading: cartLoading } = useCart();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setData(null); setError(''); setActive(0); setQty(1); setMsg('');
    api.get(`/products/${id}`).then(d => { setData(d); save('zaviro-recent', [d.product, ...stored('zaviro-recent').filter(p=>p._id!==id)].slice(0,8)); }).catch((e) => setError(e.status === 404 || e.status === 400 ? 'We could not find that product.' : e.message));
  }, [id]);

  if (error) return <div className="container state-box"><h1>Product not found</h1><p>{error}</p><Link className="btn" to="/shop">Back to the shop</Link></div>;
  if (!data) return <Spinner />;
  const p = data.product;
  const out = p.stock === 0;
  const maxQty = Math.min(p.stock, 10);

  const addToCart = async () => {
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
            <button className="btn btn-lg" disabled={out || busy || cartLoading} onClick={addToCart}>{out ? 'Sold out' : busy ? 'Adding...' : 'Add to cart'}</button>
          <HeartButton product={p} />
          </div>
          {!user && !out && <p className="hint">Add to your bag now. Log in only when you are ready to check out.</p>}
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
