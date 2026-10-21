import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import ProductGrid from '../components/ProductGrid.jsx';
import { GridSkeleton } from '../components/Skeleton.jsx';

const SORTS = [
  ['newest', 'Newest'],
  ['price_asc', 'Price: low to high'],
  ['price_desc', 'Price: high to low'],
  ['name', 'Name A to Z'],
];

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const category = params.get('category') || '';
  const sort = params.get('sort') || 'newest';
  const page = Number(params.get('page') || 1);
  const inStock = params.get('inStock') === 'true';

  const [cats, setCats] = useState([]);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [text, setText] = useState(q);

  useEffect(() => { api.get('/categories').then((d) => setCats(d.categories)).catch(() => {}); }, []);
  useEffect(() => { setText(q); }, [q]);

  useEffect(() => {
    setData(null); setError('');
    const qs = new URLSearchParams({ sort, page, limit: 9 });
    if (q) qs.set('q', q);
    if (category) qs.set('category', category);
    if (inStock) qs.set('inStock', 'true');
    api.get(`/products?${qs}`).then(setData).catch((e) => setError(e.message));
  }, [q, category, sort, page, inStock]);

  const update = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!('page' in patch)) next.delete('page');
    setParams(next);
  };

  const current = cats.find((c) => c.slug === category);

  return (
    <div className="container shop">
      <div className="shop-head">
        <p className="eyebrow">{current ? 'Collection' : 'The shop'}</p>
        <h1>{current ? current.name : q ? `Results for "${q}"` : 'All products'}</h1>
        {current && <p className="lede small">{current.blurb}</p>}
      </div>

      <div className="shop-layout">
        <aside className="filters" aria-label="Filters">
          <form onSubmit={(e) => { e.preventDefault(); update({ q: text.trim() }); }} role="search">
            <label className="field"><span className="field-label">Search by name</span>
              <input type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder="Dress, tee, bag" />
            </label>
            <button className="btn btn-small btn-block">Search</button>
          </form>
          <fieldset>
            <legend>Category</legend>
            <button className={`chip ${!category ? 'on' : ''}`} onClick={() => update({ category: '' })}>All</button>
            {cats.map((c) => (
              <button key={c._id} className={`chip ${category === c.slug ? 'on' : ''}`} onClick={() => update({ category: c.slug })}>
                {c.name} <span className="chip-n">{c.productCount}</span>
              </button>
            ))}
          </fieldset>
          <label className="check"><input type="checkbox" checked={inStock} onChange={(e) => update({ inStock: e.target.checked ? 'true' : '' })} /> In stock only</label>
          {(q || category || inStock) && <button className="text-btn" onClick={() => setParams({})}>Clear all filters</button>}
        </aside>

        <section aria-live="polite">
          <div className="toolbar">
            <span className="muted">{data ? `${data.total} ${data.total === 1 ? 'product' : 'products'}${q ? ` for "${q}"` : ''}` : ' '}</span>
            <label className="sort">Sort by
              <select value={sort} onChange={(e) => update({ sort: e.target.value === 'newest' ? '' : e.target.value })}>
                {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
          </div>
          {error && <p className="notice error" role="alert">{error} <button className="text-btn" onClick={() => update({})}>Retry</button></p>}
          {!data && !error && <GridSkeleton n={6} />}
          {data && data.products.length === 0 && (
            <div className="state-box"><h2>{q ? `No results for "${q}"` : 'Nothing matches that'}</h2><p>Check the spelling, try a shorter word like "shirt", or clear the filters.</p><button className="btn btn-small" onClick={() => setParams({})}>Clear filters</button></div>
          )}
          {data && data.products.length > 0 && <ProductGrid products={data.products} />}
          {data && data.pages > 1 && (
            <nav className="pager" aria-label="Pagination">
              <button className="btn btn-ghost btn-small" disabled={page <= 1} onClick={() => update({ page: String(page - 1) })}>Previous</button>
              <span>Page {data.page} of {data.pages}</span>
              <button className="btn btn-ghost btn-small" disabled={page >= data.pages} onClick={() => update({ page: String(page + 1) })}>Next</button>
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}
