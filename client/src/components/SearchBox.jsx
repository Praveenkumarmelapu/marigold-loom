import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, img, money } from '../lib/api';
import { stored, save } from '../lib/storage';
import { SearchIcon, CloseIcon } from './Icons.jsx';

const RECENT = 'zaviro-searches';

function Mark({ text, q }) {
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i < 0) return text;
  return <>{text.slice(0, i)}<mark>{text.slice(i, i + q.length)}</mark>{text.slice(i + q.length)}</>;
}

export default function SearchBox({ className = '', autoFocus = false, onDone }) {
  const nav = useNavigate();
  const id = useId();
  const box = useRef(null);
  const input = useRef(null);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [active, setActive] = useState(-1);
  const term = q.trim();

  useEffect(() => { if (autoFocus) input.current?.focus(); }, [autoFocus]);
  useEffect(() => {
    const off = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', off);
    return () => document.removeEventListener('pointerdown', off);
  }, []);

  useEffect(() => {
    if (!term) { setRes(null); setLoading(false); setError(false); return undefined; }
    setLoading(true); setError(false);
    let alive = true;
    const t = setTimeout(() => {
      api.get(`/products/suggest?q=${encodeURIComponent(term)}`)
        .then((d) => { if (alive) { setRes(d); setActive(-1); } })
        .catch(() => { if (alive) setError(true); })
        .finally(() => { if (alive) setLoading(false); });
    }, 220);
    return () => { alive = false; clearTimeout(t); };
  }, [term]);

  const recent = stored(RECENT);
  const rows = term
    ? [...(res ? res.categories.map((c) => ({ type: 'cat', c })) : []), ...(res ? res.products.map((p) => ({ type: 'p', p })) : [])]
    : recent.map((r) => ({ type: 'recent', r }));
  const showAll = term && res && res.total > 0;
  const count = rows.length + (showAll ? 1 : 0);

  const finish = () => { setOpen(false); input.current?.blur(); onDone && onDone(); };
  const remember = (t) => save(RECENT, [t, ...stored(RECENT).filter((x) => x !== t)].slice(0, 5));
  const go = (row) => {
    if (row === 'all') { remember(term); nav(`/shop?q=${encodeURIComponent(term)}`); setQ(''); }
    else if (row.type === 'p') { remember(term); nav(`/product/${row.p._id}`); setQ(''); }
    else if (row.type === 'cat') nav(`/shop?category=${row.c.slug}`);
    else { setQ(row.r); nav(`/shop?q=${encodeURIComponent(row.r)}`); }
    finish();
  };
  const submit = (e) => {
    e.preventDefault();
    if (active >= 0 && active < rows.length) return go(rows[active]);
    if (active === rows.length && showAll) return go('all');
    if (term) { remember(term); nav(`/shop?q=${encodeURIComponent(term)}`); } else nav('/shop');
    finish();
  };
  const onKey = (e) => {
    if (e.key === 'Escape') { if (open) { setOpen(false); } else { setQ(''); } return; }
    if (!count) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => (a + 1) % count); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setOpen(true); setActive((a) => (a <= 0 ? count - 1 : a - 1)); }
  };

  const listId = `${id}-list`;
  const optId = (i) => `${id}-opt-${i}`;
  const panel = open && (term || recent.length > 0);

  return (
    <div className={`searchbox ${className}`} ref={box}>
      <form className="search" role="search" onSubmit={submit}>
        <input
          ref={input} type="text" inputMode="search" enterKeyHint="search" autoComplete="off" spellCheck="false"
          role="combobox" aria-expanded={!!panel} aria-controls={listId} aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? optId(active) : undefined}
          aria-label="Search products" placeholder="Search dresses, shirts, bags..."
          value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={onKey}
        />
        {q && <button type="button" className="search-clear" aria-label="Clear search" onClick={() => { setQ(''); input.current?.focus(); }}><CloseIcon /></button>}
        <button aria-label="Search"><SearchIcon /></button>
      </form>
      {panel && (
        <div className="suggest" id={listId} role="listbox" aria-label="Search suggestions">
          {!term && <p className="suggest-label">Recent searches</p>}
          {term && loading && !res && <p className="suggest-note">Searching...</p>}
          {term && error && <p className="suggest-note">Search is unavailable right now. Press Enter to search the shop.</p>}
          {term && res && res.products.length === 0 && res.categories.length === 0 && !loading && (
            <div className="suggest-empty"><strong>No matches for "{term}"</strong><span>Try a shorter word, or browse a category.</span>
              <div className="suggest-chips">{['women', 'men', 'footwear', 'accessories'].map((s) => <button type="button" key={s} onClick={() => { nav(`/shop?category=${s}`); finish(); }}>{s}</button>)}</div>
            </div>
          )}
          {rows.map((row, i) => (
            <div key={row.type + (row.p?._id || row.c?.slug || row.r)} id={optId(i)} role="option" aria-selected={active === i}
              className={`suggest-row ${active === i ? 'on' : ''}`} onMouseEnter={() => setActive(i)} onMouseDown={(e) => e.preventDefault()} onClick={() => go(row)}>
              {row.type === 'p' && (<>
                <span className="suggest-img">{row.p.image ? <img src={img(row.p.image, 96)} alt="" /> : null}</span>
                <span className="suggest-main"><span className="suggest-name"><Mark text={row.p.name} q={term} /></span><span className="suggest-sub">{row.p.category?.name}{row.p.soldOut ? ' · Sold out' : ''}</span></span>
                <span className="suggest-price">{money(row.p.price)}</span>
              </>)}
              {row.type === 'cat' && (<><span className="suggest-img cat"><SearchIcon /></span><span className="suggest-main"><span className="suggest-name">Browse <Mark text={row.c.name} q={term} /></span><span className="suggest-sub">Category</span></span></>)}
              {row.type === 'recent' && (<><span className="suggest-img cat"><SearchIcon /></span><span className="suggest-main"><span className="suggest-name">{row.r}</span></span></>)}
            </div>
          ))}
          {showAll && (
            <div id={optId(rows.length)} role="option" aria-selected={active === rows.length} className={`suggest-all ${active === rows.length ? 'on' : ''}`} onMouseDown={(e) => e.preventDefault()} onClick={() => go('all')}>
              See all {res.total} {res.total === 1 ? 'result' : 'results'} for "{term}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
