import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { img, money } from '../lib/api';
import { useCart } from '../context/CartContext.jsx';
import { SHIPPING_FREE_OVER } from '../lib/brand';
import Spinner from '../components/Spinner.jsx';

export default function Cart() {
  const { cart, loading, setQty, remove, syncError, refresh } = useCart();
  const [error, setError] = useState('');

  const run = async (fn) => { setError(''); try { await fn(); } catch (e) { setError(e.message); } };

  if (loading && cart.items.length === 0) return <Spinner />;
  const shipping = cart.subtotal === 0 || cart.subtotal >= SHIPPING_FREE_OVER ? 0 : 99;

  if (cart.items.length === 0) return (
    <div className="container state-box">
      <h1>Your cart is empty</h1>
      <p>Nothing here yet. The new arrivals are a good place to start.</p>
      <Link className="btn" to="/shop">Go to the shop</Link>
    </div>
  );

  return (
    <div className="container cart">
      <h1>Your cart</h1>
      {syncError && <p className="notice error" role="alert">{syncError} <button className="text-btn" onClick={refresh}>Retry syncing cart</button></p>}
      <div className="shipping-progress"><p>{shipping > 0 ? <>You are <strong>{money(SHIPPING_FREE_OVER-cart.subtotal)}</strong> away from free shipping.</> : 'Your order qualifies for free shipping.'}</p><progress aria-label="Progress toward free shipping" max={SHIPPING_FREE_OVER} value={Math.min(cart.subtotal,SHIPPING_FREE_OVER)}/></div>
      {error && <p className="notice error" role="alert">{error}</p>}
      {cart.notices.map((n) => <p key={n} className="notice warn">{n}. Quantities were adjusted.</p>)}
      <div className="cart-layout">
        <ul className="cart-list">
          {cart.items.map((it) => (
            <li key={it.key||it.productId} className={`cart-row ${it.available ? '' : 'unavailable'}`}>
              <Link to={`/product/${it.productId}`} className="cart-img">{it.image && <img src={img(it.image, 240)} alt="" />}</Link>
              <div className="cart-info">
                <Link to={`/product/${it.productId}`}><h3>{it.name}</h3></Link>
                {it.size && <span className="muted">Size: {it.size}</span>}
                <span className="muted">{money(it.price)} each</span>
                {!it.available && <span className="stock out">Sold out, remove to continue</span>}
                <button className="text-btn" onClick={() => run(() => remove(it.productId, it.size))}>Remove</button>
              </div>
              <div className="stepper" role="group" aria-label={`Quantity for ${it.name}`}>
                <button aria-label="Decrease quantity" disabled={it.quantity <= 1} onClick={() => run(() => setQty(it.productId, it.quantity - 1, it.size))}>&minus;</button>
                <span aria-live="polite">{it.quantity}</span>
                <button aria-label="Increase quantity" disabled={it.quantity >= it.stock || it.quantity >= 20} onClick={() => run(() => setQty(it.productId, it.quantity + 1, it.size))}>+</button>
              </div>
              <strong className="line-total">{money(it.lineTotal)}</strong>
            </li>
          ))}
        </ul>
        <aside className="summary" aria-label="Order summary">
          <h2>Summary</h2>
          <dl>
            <div><dt>Subtotal</dt><dd>{money(cart.subtotal)}</dd></div>
            <div><dt>Shipping</dt><dd>{shipping === 0 ? 'Free' : money(shipping)}</dd></div>
            <div className="total"><dt>Total</dt><dd>{money(cart.subtotal + shipping)}</dd></div>
          </dl>
          {shipping > 0 && <p className="hint">Add {money(SHIPPING_FREE_OVER - cart.subtotal)} more for free shipping.</p>}
          <Link className="btn btn-block" to="/checkout" aria-disabled={cart.subtotal === 0}>Proceed to checkout</Link>
          <p className="hint">Coupons are applied at checkout. Prices and stock are re-checked on the server.</p>
        </aside>
      </div>
    </div>
  );
}
