import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import Stars from '../../components/Stars.jsx';

export default function AdminReviews() {
  const [reviews, setReviews] = useState(null);
  const [error, setError] = useState('');
  const load = () => api.get('/admin/reviews').then((d) => setReviews(d.reviews)).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);
  const del = async (r) => {
    if (!window.confirm('Delete this review? This cannot be undone.')) return;
    try { await api.del(`/admin/reviews/${r._id}`); load(); } catch (e) { setError(e.message); }
  };
  return (
    <>
      <h1>Reviews</h1>
      {error && <p className="notice error" role="alert">{error}</p>}
      {!reviews && !error && <div className="skel skel-line" />}
      {reviews && reviews.length === 0 && <div className="state-box slim"><p>No customer reviews yet. They appear here after logged-in customers post them.</p></div>}
      {reviews && reviews.length > 0 && (
        <ul className="rev-list admin-rev">
          {reviews.map((r) => (
            <li key={r._id}>
              <div className="rev-top"><Stars value={r.rating} size={14} /><strong>{r.product ? r.product.name : 'Deleted product'}</strong></div>
              {r.title && <h3>{r.title}</h3>}
              <p>{r.comment}</p>
              <span className="muted">{r.name} · {new Date(r.createdAt).toLocaleDateString('en-IN')}</span>
              <button className="text-btn danger" onClick={() => del(r)}>Delete review</button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
