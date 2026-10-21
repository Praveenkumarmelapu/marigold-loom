import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../../lib/api';
import Field from '../../components/Field.jsx';
import Spinner from '../../components/Spinner.jsx';

export default function AdminCategories() {
  const { refreshStats } = useOutletContext();
  const [cats, setCats] = useState(null);
  const [form, setForm] = useState({ name: '', blurb: '' });
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');

  const load = () => api.get('/categories').then((d) => setCats(d.categories)).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const reset = () => { setForm({ name: '', blurb: '' }); setEditId(null); setErrors({}); };

  const submit = async (e) => {
    e.preventDefault(); setError(''); setErrors({});
    if (form.name.trim().length < 2) return setErrors({ name: 'Name must be at least 2 characters' });
    try {
      if (editId) await api.put(`/admin/categories/${editId}`, form);
      else await api.post('/admin/categories', form);
      setFlash(editId ? 'Category updated' : 'Category added'); reset(); load(); refreshStats();
    } catch (err) { setError(err.message); setErrors(err.fields || {}); }
  };

  const del = async (c) => {
    if (!window.confirm(`Delete the category "${c.name}"?`)) return;
    setError('');
    try { await api.del(`/admin/categories/${c._id}`); setFlash('Category deleted'); load(); refreshStats(); }
    catch (err) { setError(err.message); }
  };

  return (
    <section aria-labelledby="ac-h">
      <div className="admin-head"><h1 id="ac-h">Categories</h1></div>
      {flash && <p className="notice ok" role="status">{flash}</p>}
      {error && <p className="notice error" role="alert">{error}</p>}
      <form className="cat-form" onSubmit={submit} noValidate>
        <Field label="Name" error={errors.name}><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Short description" error={errors.blurb}><input value={form.blurb} onChange={(e) => setForm({ ...form, blurb: e.target.value })} maxLength={200} /></Field>
        <div className="row-gap">
          <button className="btn btn-small">{editId ? 'Save category' : 'Add category'}</button>
          {editId && <button type="button" className="btn btn-ghost btn-small" onClick={reset}>Cancel</button>}
        </div>
      </form>
      {!cats && !error && <Spinner />}
      {cats && (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Name</th><th>Description</th><th className="num">Products</th><th><span className="sr">Actions</span></th></tr></thead>
            <tbody>
              {cats.map((c) => (
                <tr key={c._id}>
                  <td><strong>{c.name}</strong></td><td>{c.blurb}</td><td className="num">{c.productCount}</td>
                  <td className="row-actions">
                    <button className="text-btn" onClick={() => { setEditId(c._id); setForm({ name: c.name, blurb: c.blurb || '' }); }}>Edit</button>
                    <button className="text-btn danger" onClick={() => del(c)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
