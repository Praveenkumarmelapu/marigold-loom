import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { api } from '../../lib/api';

export default function AdminLayout() {
  const [stats, setStats] = useState(null);
  useEffect(() => { api.get('/admin/stats').then(setStats).catch(() => setStats(null)); }, []);
  const items = stats ? [
    ['Products', stats.products], ['Categories', stats.categories], ['Customers', stats.customers], ['Low stock', stats.lowStock], ['Sold out', stats.outOfStock],
  ] : [];
  return (
    <div className="container admin">
      <aside className="admin-side" aria-label="Admin">
        <p className="eyebrow">Store admin</p>
        <nav>
          <NavLink to="/admin/products">Products</NavLink>
          <NavLink to="/admin/categories">Categories</NavLink>
        </nav>
      </aside>
      <div className="admin-main">
        {stats && (
          <div className="stats">
            {items.map(([l, v]) => <div key={l} className="stat"><strong>{v}</strong><span>{l}</span></div>)}
          </div>
        )}
        <Outlet context={{ refreshStats: () => api.get('/admin/stats').then(setStats).catch(() => {}) }} />
      </div>
    </div>
  );
}
