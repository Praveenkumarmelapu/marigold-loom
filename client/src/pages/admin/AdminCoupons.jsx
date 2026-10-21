import { useEffect, useState } from 'react';
import { api, money } from '../../lib/api';
import Field from '../../components/Field.jsx';
import Spinner from '../../components/Spinner.jsx';

const BLANK = { code: '', description: '', type: 'percent', value: 10, minOrder: 0, usageLimit: 0, expiresAt: '', active: true };

export default function AdminCoupons() {
  const [rows, setRows] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');
  const load = () => api.get('/admin/coupons').then((d) => setRows(d.coupons)).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);
  const reset = () => { setForm(BLANK); setEditId(null); setErrors({}); };

  const submit = async (e) => {
    e.preventDefault(); setError(''); setErrors({}); setFlash('');
    const body = { ...form, value: Number(form.value), minOrder: Number(form.minOrder), usageLimit: Number(form.usageLimit), expiresAt: form.expiresAt || null };
    try {
      if (editId) await api.put(`/admin/coupons/${editId}`, body); else await api.post('/admin/coupons', body);
      setFlash(editId ? 'Coupon updated' : 'Coupon created'); reset(); load();
    } catch (err) { setError(err.message); setErrors(err.fields || {}); }
  };
  const toggle = async (c) => {
    try { await api.put(`/admin/coupons/${c._id}`, { ...c, expiresAt: c.expiresAt || null, active: !c.active }); load(); } catch (e) { setError(e.message); }
  };
  const del = async (c) => {
    if (!window.confirm(`Delete coupon ${c.code}?`)) return;
    try { await api.del(`/admin/coupons/${c._id}`); setFlash('Coupon deleted'); load(); } catch (e) { setError(e.message); }
  };
  const edit = (c) => { setEditId(c._id); setForm({ code: c.code, description: c.description || '', type: c.type, value: c.value, minOrder: c.minOrder, usageLimit: c.usageLimit, expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : '', active: c.active }); window.scrollTo(0, 0); };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <section aria-labelledby="acp-h">
      <div className="admin-head"><h1 id="acp-h">Coupons</h1></div>
      {flash && <p className="notice ok" role="status">{flash}</p>}
      {error && <p className="notice error" role="alert">{error}</p>}
      <form className="coupon-admin-form" onSubmit={submit} noValidate>
        <Field label="Code" error={errors.code}><input value={form.code} onChange={set('code')} maxLength={20} placeholder="SAVE10" /></Field>
        <Field label="Type" error={errors.type}><select value={form.type} onChange={set('type')}><option value="percent">Percent off</option><option value="fixed">Fixed amount off</option></select></Field>
        <Field label={form.type === 'percent' ? 'Percent (max 90)' : 'Amount (Rs.)'} error={errors.value}><input type="number" min="1" value={form.value} onChange={set('value')} /></Field>
        <Field label="Minimum order (Rs.)" error={errors.minOrder}><input type="number" min="0" value={form.minOrder} onChange={set('minOrder')} /></Field>
        <Field label="Usage limit (0 = unlimited)" error={errors.usageLimit}><input type="number" min="0" value={form.usageLimit} onChange={set('usageLimit')} /></Field>
        <Field label="Expires on" error={errors.expiresAt}><input type="date" value={form.expiresAt} onChange={set('expiresAt')} /></Field>
        <Field label="Description" error={errors.description}><input value={form.description} onChange={set('description')} maxLength={120} /></Field>
        <label className="check"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active</label>
        <div className="row-gap">
          <button className="btn btn-small">{editId ? 'Save coupon' : 'Create coupon'}</button>
          {editId && <button type="button" className="btn btn-ghost btn-small" onClick={reset}>Cancel</button>}
        </div>
      </form>
      {!rows && !error && <Spinner />}
      {rows && rows.length === 0 && <p className="muted">No coupons yet.</p>}
      {rows && rows.length > 0 && (
        <div className="table-wrap"><table className="table">
          <thead><tr><th>Code</th><th>Discount</th><th>Min order</th><th>Used</th><th>Expires</th><th>Status</th><th><span className="sr">Actions</span></th></tr></thead>
          <tbody>{rows.map((c) => (
            <tr key={c._id}>
              <td><strong>{c.code}</strong><br /><span className="muted small">{c.description}</span></td>
              <td>{c.type === 'percent' ? `${c.value}%` : money(c.value)}</td>
              <td>{money(c.minOrder)}</td>
              <td>{c.used}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</td>
              <td>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('en-IN') : 'Never'}</td>
              <td><span className={`status ${c.active ? 'status-delivered' : 'status-cancelled'}`}>{c.active ? 'active' : 'off'}</span></td>
              <td className="row-actions">
                <button className="text-btn" onClick={() => edit(c)}>Edit</button>
                <button className="text-btn" onClick={() => toggle(c)}>{c.active ? 'Turn off' : 'Turn on'}</button>
                <button className="text-btn danger" onClick={() => del(c)}>Delete</button>
              </td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </section>
  );
}
