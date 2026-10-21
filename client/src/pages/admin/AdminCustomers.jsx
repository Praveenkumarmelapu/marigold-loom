import { useEffect, useState } from 'react';
import { api, money } from '../../lib/api';
import Spinner from '../../components/Spinner.jsx';

export default function AdminCustomers() {
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { api.get('/admin/customers').then((d) => setRows(d.customers)).catch((e) => setError(e.message)); }, []);
  const shown = rows ? rows.filter((c) => `${c.name} ${c.email}`.toLowerCase().includes(q.trim().toLowerCase())) : null;
  return (
    <section aria-labelledby="acu-h">
      <div className="admin-head"><h1 id="acu-h">Customers</h1></div>
      {error && <p className="notice error" role="alert">{error}</p>}
      <div className="admin-filters"><form onSubmit={(e) => e.preventDefault()}><input aria-label="Search customers" placeholder="Search by name or email" value={q} onChange={(e) => setQ(e.target.value)} /></form></div>
      {!shown && !error && <Spinner />}
      {shown && shown.length === 0 && <p className="muted">No customers found.</p>}
      {shown && shown.length > 0 && (
        <div className="table-wrap"><table className="table">
          <thead><tr><th>Name</th><th>Email</th><th>Joined</th><th className="num">Orders</th><th className="num">Spent</th><th>Last order</th></tr></thead>
          <tbody>{shown.map((c) => (
            <tr key={c._id}><td><strong>{c.name}</strong></td><td>{c.email}</td><td>{new Date(c.joined).toLocaleDateString('en-IN')}</td><td className="num">{c.orders}</td><td className="num">{money(c.spent)}</td><td>{c.lastOrder ? new Date(c.lastOrder).toLocaleDateString('en-IN') : '-'}</td></tr>
          ))}</tbody>
        </table></div>
      )}
    </section>
  );
}
