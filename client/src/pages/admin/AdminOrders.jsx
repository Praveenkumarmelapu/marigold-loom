import { Fragment, useEffect, useState } from 'react';
import { api, money } from '../../lib/api';
import Spinner from '../../components/Spinner.jsx';

const STATUSES = ['placed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState(null);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(null);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');

  const load = (s = status, query = q) => {
    const p = new URLSearchParams(); if (s) p.set('status', s); if (query.trim()) p.set('q', query.trim());
    api.get(`/admin/orders?${p}`).then((d) => setOrders(d.orders)).catch((e) => setError(e.message));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status]);

  const change = async (o, next) => {
    if (next === 'cancelled' && !window.confirm(`Cancel order ${o.number}? Stock will be returned.`)) return;
    setError(''); setFlash('');
    try { await api.patch(`/admin/orders/${o._id}/status`, { status: next }); setFlash(`${o.number} is now ${next}`); load(); }
    catch (e) { setError(e.message); }
  };

  return (
    <section aria-labelledby="ao-h">
      <div className="admin-head"><h1 id="ao-h">Orders</h1></div>
      {flash && <p className="notice ok" role="status">{flash}</p>}
      {error && <p className="notice error" role="alert">{error}</p>}
      <div className="admin-filters">
        <form onSubmit={(e) => { e.preventDefault(); load(); }}>
          <input aria-label="Search by order number" placeholder="Search order number" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn btn-small">Search</button>
        </form>
        <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {!orders && !error && <Spinner />}
      {orders && orders.length === 0 && <p className="muted">No orders match.</p>}
      {orders && orders.length > 0 && (
        <div className="table-wrap"><table className="table">
          <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Status</th><th className="num">Total</th><th><span className="sr">Actions</span></th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <Fragment key={o._id}>
                <tr>
                  <td><strong>{o.number}</strong></td>
                  <td>{o.user ? o.user.name : 'Deleted user'}<br /><span className="muted small">{o.user && o.user.email}</span></td>
                  <td>{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                  <td>
                    <select aria-label={`Status for ${o.number}`} className="status-select" value={o.status} disabled={o.status === 'cancelled'} onChange={(e) => change(o, e.target.value)}>
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="num">{money(o.total)}</td>
                  <td className="row-actions"><button className="text-btn" onClick={() => setOpen(open === o._id ? null : o._id)}>{open === o._id ? 'Hide' : 'Details'}</button></td>
                </tr>
                {open === o._id && (
                  <tr><td colSpan={6} className="order-detail">
                    <div className="two-col">
                      <div>
                        <strong>Items</strong>
                        <ul className="mini-list">{o.items.map((i) => <li key={i.name}><span>{i.name} x {i.quantity}</span><span>{money(i.lineTotal)}</span></li>)}</ul>
                        <p className="muted small">Subtotal {money(o.subtotal)}{o.discount > 0 && ` | Discount ${money(o.discount)} (${o.couponCode})`} | Shipping {o.shipping ? money(o.shipping) : 'free'} | {o.paymentMethod}</p>
                      </div>
                      <div>
                        <strong>Ship to</strong>
                        <p>{o.address.name}<br />{o.address.line1}<br />{o.address.city}, {o.address.state} {o.address.pincode}<br />{o.address.phone}</p>
                      </div>
                    </div>
                  </td></tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table></div>
      )}
    </section>
  );
}
