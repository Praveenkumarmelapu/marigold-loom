import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { api, money } from '../lib/api';

export default function Account() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const nav = useNavigate();
  const [orders, setOrders] = useState(null);
  useEffect(() => { api.get('/orders').then((d) => setOrders(d.orders)).catch(() => setOrders([])); }, []);
  return (
    <div className="container account">
      <p className="eyebrow">Your account</p>
      <h1>Hello, {user.name.split(' ')[0]}</h1>
      <dl className="profile">
        <div><dt>Name</dt><dd>{user.name}</dd></div>
        <div><dt>Email</dt><dd>{user.email}</dd></div>
        <div><dt>Account type</dt><dd className="cap">{user.role}</dd></div>
        <div><dt>Cart</dt><dd>{cart.count} items, {money(cart.subtotal)}</dd></div>
      </dl>
      <div className="row-gap">
        <Link className="btn" to="/cart">View cart</Link>
        {user.role === 'admin' && <Link className="btn btn-ghost" to="/admin">Open admin dashboard</Link>}
        <button className="btn btn-ghost" onClick={async () => { await logout(); nav('/'); }}>Log out</button>
      </div>
      <h2 className="orders-h">Your orders</h2>
      {orders && orders.length === 0 && <p className="muted">No orders yet. <Link to="/shop">Start shopping</Link>.</p>}
      {orders && orders.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Order</th><th>Date</th><th>Items</th><th>Status</th><th className="num">Total</th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id}>
                  <td><strong>{o.number}</strong></td>
                  <td>{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                  <td>{o.items.map((i) => `${i.name}${i.size?` (${i.size})`:''} x ${i.quantity}`).join(', ')}</td>
                  <td><span className={`status status-${o.status}`}>{o.status}</span></td>
                  <td className="num">{money(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
