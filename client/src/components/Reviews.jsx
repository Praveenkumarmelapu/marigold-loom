import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext.jsx';
import Stars from './Stars.jsx';

export default function Reviews({ productId, onChange }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [editing, setEditing] = useState(false);

  const load = useCallback(() => api.get(`/products/${productId}/reviews`).then((d) => {
    setData(d);
    if (d.mine) { setRating(d.mine.rating); setTitle(d.mine.title || ''); setComment(d.mine.comment); }
  }).catch((e) => setError(e.message)), [productId]);
  useEffect(() => { setData(null); setRating(0); setTitle(''); setComment(''); setEditing(false); load(); }, [load, user?.id]);

  const submit = async (e) => {
    e.preventDefault(); setMsg(''); setError('');
    if (!rating) return setError('Choose a star rating');
    if (comment.trim().length < 10) return setError('Please write at least 10 characters');
    setBusy(true);
    try { await api.post(`/products/${productId}/reviews`, { rating, title, comment }); setMsg('Thanks, your review is live.'); setEditing(false); await load(); onChange && onChange(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  const del = async () => {
    setBusy(true);
    try { await api.del(`/products/${productId}/reviews`); setRating(0); setTitle(''); setComment(''); setMsg('Your review was removed.'); await load(); onChange && onChange(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const showForm = user && (!data?.mine || editing);
  return (
    <section className="section reviews" aria-labelledby="rev-h">
      <div className="section-head"><h2 id="rev-h">Customer reviews</h2></div>
      {!data && !error && <div className="skel skel-line" />}
      {data && (
        <div className="rev-summary">
          <div className="rev-score"><strong>{data.count ? data.average.toFixed(1) : '-'}</strong><Stars value={data.average} /><span className="muted">{data.count} {data.count === 1 ? 'review' : 'reviews'}</span></div>
          {data.count > 0 && (
            <ul className="rev-bars">{data.breakdown.map((b) => (
              <li key={b.stars}><span>{b.stars}★</span><span className="bar"><span style={{ width: `${(b.count / Math.max(1, data.reviews.length)) * 100}%` }} /></span><span>{b.count}</span></li>
            ))}</ul>
          )}
        </div>
      )}
      {msg && <p className="notice ok" role="status">{msg}</p>}
      {error && <p className="notice error" role="alert">{error}</p>}
      {!user && <p className="hint">Want to share your thoughts? <Link to="/login" state={{ from: `/product/${productId}` }}>Log in</Link> to write a review.</p>}
      {showForm && (
        <form className="rev-form" onSubmit={submit} noValidate>
          <span className="field-label">Your rating</span>
          <div className="star-input" role="radiogroup" aria-label="Your rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button type="button" key={n} role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} className={n <= rating ? 'on' : ''} onClick={() => setRating(n)}>★</button>
            ))}
          </div>
          <label className="field"><span className="field-label">Title (optional)</span><input value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} /></label>
          <label className="field"><span className="field-label">Your review</span><textarea rows={4} maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How is the fit, fabric and quality?" /></label>
          <div className="row-gap"><button className="btn btn-small" disabled={busy}>{busy ? 'Saving...' : data?.mine ? 'Update review' : 'Post review'}</button>{editing && <button type="button" className="btn btn-ghost btn-small" onClick={() => setEditing(false)}>Cancel</button>}</div>
        </form>
      )}
      {user && data?.mine && !editing && (
        <p className="hint">You reviewed this product. <button className="text-btn" onClick={() => setEditing(true)}>Edit</button> <button className="text-btn" onClick={del} disabled={busy}>Delete</button></p>
      )}
      {data && data.count === 0 && <div className="state-box slim"><p>No reviews yet. Be the first to review this product.</p></div>}
      {data && data.reviews.length > 0 && (
        <ul className="rev-list">
          {data.reviews.map((r) => (
            <li key={r._id}>
              <div className="rev-top"><Stars value={r.rating} size={14} />{r.verified && <span className="verified">Verified buyer</span>}</div>
              {r.title && <h3>{r.title}</h3>}
              <p>{r.comment}</p>
              <span className="muted">{r.name} · {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
