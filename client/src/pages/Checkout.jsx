import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api, money } from '../lib/api';
import { useCart } from '../context/CartContext.jsx';
import Field from '../components/Field.jsx';
import Spinner from '../components/Spinner.jsx';

const EMPTY = { name: '', phone: '', line1: '', city: '', state: '', pincode: '' };

export default function Checkout() {
  const { cart, loading, refresh } = useCart();
  const [addr, setAddr] = useState(EMPTY);
  const [code, setCode] = useState('');
  const [applied, setApplied] = useState('');
  const [quote, setQuote] = useState(null);
  const [couponMsg, setCouponMsg] = useState('');
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState(null);

  const loadQuote = async (c) => {
    try { setQuote(await api.post('/checkout/quote', { couponCode: c })); return true; }
    catch (e) { setCouponMsg(e.message); return false; }
  };
  useEffect(() => { if (cart.items.length && !order) loadQuote(applied); /* eslint-disable-next-line */ }, [cart.subtotal, applied]);

  const apply = async (e) => {
    e.preventDefault(); setCouponMsg('');
    const c = code.trim().toUpperCase();
    if (!c) { setApplied(''); return; }
    try {
      const q = await api.post('/checkout/quote', { couponCode: c });
      setQuote(q); setApplied(c); setCouponMsg(`Coupon ${c} applied. You save ${money(q.discount)}.`);
    } catch (err) { setApplied(''); setCouponMsg(err.message); }
  };

  const place = async (e) => {
    e.preventDefault(); setError(''); setErrors({});
    const fe = {};
    if (addr.name.trim().length < 2) fe.name = 'Enter your full name';
    if (!/^[0-9+\s-]{10,15}$/.test(addr.phone)) fe.phone = 'Enter a valid phone number';
    if (addr.line1.trim().length < 5) fe.line1 = 'Enter your street address';
    if (addr.city.trim().length < 2) fe.city = 'Enter your city';
    if (addr.state.trim().length < 2) fe.state = 'Enter your state';
    if (!/^[0-9]{6}$/.test(addr.pincode)) fe.pincode = 'PIN code must be 6 digits';
    if (Object.keys(fe).length) return setErrors(fe);
    setBusy(true);
    try { const d = await api.post('/orders', { address: addr, couponCode: applied }); setOrder(d.order); await refresh(); }
    catch (err) { setError(err.message); setErrors(err.fields || {}); } finally { setBusy(false); }
  };

  if (order) return (
    <div className="container state-box">
      <h1>Order placed</h1>
      <p>Thank you. Your order <strong>{order.number}</strong> for {money(order.total)} is confirmed. Pay cash on delivery.</p>
      <div className="row-gap"><Link className="btn" to="/account">View my orders</Link><Link className="btn btn-ghost" to="/shop">Keep shopping</Link></div>
    </div>
  );
  if (loading && cart.items.length === 0) return <Spinner />;
  if (cart.items.length === 0) return <Navigate to="/cart" replace />;
  const f = (k) => ({ value: addr[k], onChange: (e) => setAddr({ ...addr, [k]: e.target.value }) });

  return (
    <div className="container cart">
      <h1>Checkout</h1>
      {error && <p className="notice error" role="alert">{error}</p>}
      <div className="cart-layout">
        <form onSubmit={place} noValidate className="checkout-form">
          <h2>Delivery address</h2>
          <Field label="Full name" error={errors.name}><input autoComplete="name" {...f('name')} /></Field>
          <Field label="Phone" error={errors.phone}><input autoComplete="tel" inputMode="tel" {...f('phone')} /></Field>
          <Field label="Address" error={errors.line1}><input autoComplete="street-address" {...f('line1')} /></Field>
          <div className="two-col">
            <Field label="City" error={errors.city}><input autoComplete="address-level2" {...f('city')} /></Field>
            <Field label="State" error={errors.state}><input autoComplete="address-level1" {...f('state')} /></Field>
          </div>
          <Field label="PIN code" error={errors.pincode}><input inputMode="numeric" maxLength={6} autoComplete="postal-code" {...f('pincode')} /></Field>
          <h2>Payment</h2>
          <p className="muted">Cash on delivery. No card details are collected in this demo store.</p>
          <button className="btn btn-block" disabled={busy}>{busy ? 'Placing order...' : `Place order${quote ? ` - ${money(quote.total)}` : ''}`}</button>
        </form>
        <aside className="summary" aria-label="Order summary">
          <h2>Summary</h2>
          <ul className="mini-list">
            {cart.items.map((it) => <li key={it.productId}><span>{it.name} x {it.quantity}</span><span>{money(it.lineTotal)}</span></li>)}
          </ul>
          <form className="coupon-form" onSubmit={apply}>
            <input aria-label="Coupon code" placeholder="Coupon code" value={code} onChange={(e) => setCode(e.target.value)} maxLength={20} />
            <button className="btn btn-small btn-ghost">Apply</button>
          </form>
          {couponMsg && <p className={`hint ${applied ? 'ok-text' : 'err-text'}`} role="status">{couponMsg}</p>}
          {quote && (
            <dl>
              <div><dt>Subtotal</dt><dd>{money(quote.subtotal)}</dd></div>
              {quote.discount > 0 && <div><dt>Discount ({quote.couponCode})</dt><dd>&minus;{money(quote.discount)}</dd></div>}
              <div><dt>Shipping</dt><dd>{quote.shipping === 0 ? 'Free' : money(quote.shipping)}</dd></div>
              <div className="total"><dt>Total</dt><dd>{money(quote.total)}</dd></div>
            </dl>
          )}
        </aside>
      </div>
    </div>
  );
}
