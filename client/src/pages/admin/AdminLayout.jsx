import { useEffect, useRef } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const LINKS = [
  ['/admin', 'Dashboard', true], ['/admin/products', 'Products'], ['/admin/categories', 'Categories'], ['/admin/orders', 'Orders'],
  ['/admin/coupons', 'Coupons'], ['/admin/customers', 'Customers'], ['/admin/reviews', 'Reviews'], ['/admin/settings', 'Settings'],
];

export default function AdminLayout() {
  const mainRef = useRef(null);
  // Label every table cell with its column heading so tables can stack as cards on phones.
  useEffect(() => {
    const root = mainRef.current;
    if (!root) return undefined;
    const label = () => {
      root.querySelectorAll('table.table').forEach((t) => {
        const heads = [...t.querySelectorAll('thead th')].map((h) => h.textContent.trim());
        t.querySelectorAll('tbody tr').forEach((tr) => {
          [...tr.children].forEach((td, i) => { if (heads[i] && td.dataset.label !== heads[i]) td.dataset.label = heads[i]; });
        });
      });
    };
    label();
    const mo = new MutationObserver(label);
    mo.observe(root, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);
  return (
    <div className="container admin">
      <aside className="admin-side" aria-label="Admin">
        <p className="eyebrow">Store admin</p>
        <nav>
          {LINKS.map(([to, label, end]) => <NavLink key={to} to={to} end={!!end}>{label}</NavLink>)}
        </nav>
      </aside>
      <div className="admin-main" ref={mainRef}>
        <Outlet context={{ refreshStats: () => {} }} />
      </div>
    </div>
  );
}
