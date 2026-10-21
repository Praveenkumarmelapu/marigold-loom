import { NavLink, Outlet } from 'react-router-dom';

const LINKS = [
  ['/admin', 'Dashboard', true], ['/admin/products', 'Products'], ['/admin/categories', 'Categories'], ['/admin/orders', 'Orders'],
  ['/admin/coupons', 'Coupons'], ['/admin/customers', 'Customers'], ['/admin/reviews', 'Reviews'], ['/admin/settings', 'Settings'],
];

export default function AdminLayout() {
  return (
    <div className="container admin">
      <aside className="admin-side" aria-label="Admin">
        <p className="eyebrow">Store admin</p>
        <nav>
          {LINKS.map(([to, label, end]) => <NavLink key={to} to={to} end={!!end}>{label}</NavLink>)}
        </nav>
      </aside>
      <div className="admin-main">
        <Outlet context={{ refreshStats: () => {} }} />
      </div>
    </div>
  );
}
