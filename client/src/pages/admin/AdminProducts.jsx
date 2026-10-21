import { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api, img, money } from '../../lib/api';
import Spinner from '../../components/Spinner.jsx';
import ProductForm from './ProductForm.jsx';

export default function AdminProducts() {
  const { refreshStats } = useOutletContext();
  const [cats, setCats] = useState([]);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [text, setText] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null); // null | 'new' | product
  const [deleting, setDeleting] = useState(null);
  const [delBusy, setDelBusy] = useState(false);
  const [flash, setFlash] = useState('');

  const load = useCallback(() => {
    const qs = new URLSearchParams({ page, limit: 8, sort });
    if (q) qs.set('q', q);
    if (category) qs.set('category', category);
    setError('');
    api.get(`/products?${qs}`).then(setData).catch((e) => setError(e.message));
  }, [q, category, sort, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get('/categories').then((d) => setCats(d.categories)).catch(() => {}); }, []);
  useEffect(() => { if (!flash) return undefined; const t = setTimeout(() => setFlash(''), 3000); return () => clearTimeout(t); }, [flash]);

  const saved = (msg) => { setEditing(null); setFlash(msg); load(); refreshStats(); };

  const confirmDelete = async () => {
    setDelBusy(true);
    try { await api.del(`/admin/products/${deleting._id}`); setDeleting(null); setFlash('Product deleted'); load(); refreshStats(); }
    catch (e) { setError(e.message); setDeleting(null); } finally { setDelBusy(false); }
  };

  return (
    <section aria-labelledby="ap-h">
      <div className="admin-head">
        <h1 id="ap-h">Products</h1>
        <button className="btn" onClick={() => setEditing('new')}>Add product</button>
      </div>
      {flash && <p className="notice ok" role="status">{flash}</p>}
      <div className="admin-filters">
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); setQ(text.trim()); }} role="search">
          <input type="search" aria-label="Search products" placeholder="Search by name" value={text} onChange={(e) => setText(e.target.value)} />
          <button className="btn btn-small">Search</button>
        </form>
        <select aria-label="Filter by category" value={category} onChange={(e) => { setPage(1); setCategory(e.target.value); }}>
          <option value="">All categories</option>
          {cats.map((c) => <option key={c._id} value={c.slug}>{c.name}</option>)}
        </select>
        <select aria-label="Sort" value={sort} onChange={(e) => { setPage(1); setSort(e.target.value); }}>
          <option value="newest">Newest</option>
          <option value="price_asc">Price low to high</option>
          <option value="price_desc">Price high to low</option>
          <option value="name">Name</option>
        </select>
      </div>
      {error && <p className="notice error" role="alert">{error}</p>}
      {!data && !error && <Spinner />}
      {data && data.products.length === 0 && <div className="state-box"><p>No products match. Try different filters or add one.</p></div>}
      {data && data.products.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Product</th><th>Category</th><th className="num">Price</th><th className="num">Stock</th><th>Updated</th><th><span className="sr">Actions</span></th></tr></thead>
            <tbody>
              {data.products.map((p) => (
                <tr key={p._id}>
                  <td><div className="cell-prod">{p.images[0] ? <img src={img(p.images[0].url, 120)} alt="" /> : <span className="noimg sm" />}<strong>{p.name}</strong></div></td>
                  <td>{p.category && p.category.name}</td>
                  <td className="num">{money(p.price)}</td>
                  <td className="num"><span className={p.stock === 0 ? 'stock out' : p.stock <= 5 ? 'stock low' : ''}>{p.stock}</span></td>
                  <td>{new Date(p.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td className="row-actions">
                    <button className="text-btn" onClick={() => setEditing(p)}>Edit</button>
                    <button className="text-btn danger" onClick={() => setDeleting(p)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && data.pages > 1 && (
        <nav className="pager" aria-label="Pagination">
          <button className="btn btn-ghost btn-small" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span>Page {data.page} of {data.pages} ({data.total} products)</span>
          <button className="btn btn-ghost btn-small" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</button>
        </nav>
      )}

      {editing && <ProductForm product={editing === 'new' ? null : editing} categories={cats} onClose={() => setEditing(null)} onSaved={saved} />}

      {deleting && (
        <div className="modal-back" role="presentation" onClick={() => setDeleting(null)}>
          <div className="modal small" role="alertdialog" aria-modal="true" aria-labelledby="del-h" onClick={(e) => e.stopPropagation()}>
            <h2 id="del-h">Delete this product?</h2>
            <p><strong>{deleting.name}</strong> will be removed from the store and from customers' carts. This cannot be undone.</p>
            <div className="row-gap">
              <button className="btn btn-danger" disabled={delBusy} onClick={confirmDelete}>{delBusy ? 'Deleting...' : 'Yes, delete'}</button>
              <button className="btn btn-ghost" onClick={() => setDeleting(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
