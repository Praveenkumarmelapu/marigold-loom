import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, money } from '../../lib/api';
import Spinner from '../../components/Spinner.jsx';

export default function AdminDashboard() {
  const [s, setS] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api.get('/admin/stats').then(setS).catch((e) => setError(e.message)); }, []);
  if (error) return <p className="notice error" role="alert">{error}</p>;
  if (!s) return <Spinner />;
  const cards = [
    ['Revenue', money(s.revenue)], ['Orders', s.orders], ['To fulfil', s.pendingOrders], ['Customers', s.customers],
    ['Products', s.products], ['Low stock', s.lowStock], ['Sold out', s.outOfStock], ['Active coupons', s.coupons],
  ];
  return (
    <section aria-labelledby="dash-h">
      <div className="admin-head"><h1 id="dash-h">Dashboard</h1></div>
      <div className="stats">{cards.map(([l, v]) => <div key={l} className="stat"><strong>{v}</strong><span>{l}</span></div>)}</div>
      <div className="dash-grid">
        <div>
          <h2 className="small-h">Recent orders</h2>
          {s.recentOrders.length === 0 ? <p className="muted">No orders yet.</p> : (
            <div className="table-wrap"><table className="table">
              <thead><tr><th>Order</th><th>Customer</th><th>Status</th><th className="num">Total</th></tr></thead>
              <tbody>{s.recentOrders.map((o) => <tr key={o._id}><td><strong>{o.number}</strong></td><td>{o.customer}</td><td><span className={`status status-${o.status}`}>{o.status}</span></td><td className="num">{money(o.total)}</td></tr>)}</tbody>
            </table></div>
          )}
          <p><Link className="link-arrow" to="/admin/orders">Manage orders</Link></p>
        </div>
        <div>
          <h2 className="small-h">Best sellers</h2>
          {s.topProducts.length === 0 ? <p className="muted">Sales will show here.</p> : (
            <div className="table-wrap"><table className="table">
              <thead><tr><th>Product</th><th className="num">Units</th><th className="num">Revenue</th></tr></thead>
              <tbody>{s.topProducts.map((t) => <tr key={t.name}><td>{t.name}</td><td className="num">{t.units}</td><td className="num">{money(t.revenue)}</td></tr>)}</tbody>
            </table></div>
          )}
        </div>
      </div>
    </section>
  );
}
