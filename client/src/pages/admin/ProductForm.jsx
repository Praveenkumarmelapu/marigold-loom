import { useRef, useState } from 'react';
import { api, img } from '../../lib/api';
import Field from '../../components/Field.jsx';

const MAX_BYTES = 4 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function ProductForm({ product, categories, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: product ? product.name : '',
    description: product ? product.description : '',
    price: product ? String(product.price) : '',
    stock: product ? String(product.stock) : '',
    category: product && product.category ? product.category._id : '',
    badge: product ? product.badge || '' : '',
    featured: product ? product.featured : false,
  });
  const [sizes, setSizes] = useState(product && product.sizes ? product.sizes.map((s) => ({ label: s.label, stock: String(s.stock) })) : []);
  const [images, setImages] = useState(product ? product.images : []);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const onFile = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    setUploadError('');
    if (!file) return;
    if (!TYPES.includes(file.type)) return setUploadError('Only JPG, PNG or WebP images are allowed.');
    if (file.size > MAX_BYTES) return setUploadError('That image is larger than 4 MB. Choose a smaller one.');
    if (images.length >= 6) return setUploadError('You can add up to 6 images.');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { image } = await api.upload('/admin/uploads', fd);
      setImages((prev) => [...prev, image]);
    } catch (err) { setUploadError(err.message); } finally { setUploading(false); }
  };

  const validate = () => {
    const er = {};
    if (form.name.trim().length < 2) er.name = 'Name must be at least 2 characters';
    if (form.description.trim().length < 10) er.description = 'Description must be at least 10 characters';
    if (form.price === '' || Number(form.price) < 0 || Number.isNaN(Number(form.price))) er.price = 'Enter a valid price';
    if (sizes.some((s) => !s.label.trim())) er.stock = 'Every size needs a name';
    if (!sizes.length && (form.stock === '' || !Number.isInteger(Number(form.stock)) || Number(form.stock) < 0)) er.stock = 'Stock must be a whole number, 0 or more';
    if (!form.category) er.category = 'Choose a category';
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setError('');
    if (!validate()) return;
    setBusy(true);
    const body = { ...form, price: Number(form.price), stock: sizes.length ? sizes.reduce((s, x) => s + (Number(x.stock) || 0), 0) : Number(form.stock), images, sizes: sizes.map((s) => ({ label: s.label.trim(), stock: Number(s.stock) || 0 })) };
    try {
      if (product) await api.put(`/admin/products/${product._id}`, body);
      else await api.post('/admin/products', body);
      onSaved(product ? 'Product updated' : 'Product created');
    } catch (err) { setError(err.message); setErrors(err.fields || {}); } finally { setBusy(false); }
  };

  return (
    <div className="modal-back" role="presentation">
      <form className="modal" role="dialog" aria-modal="true" aria-labelledby="pf-h" onSubmit={submit} noValidate>
        <div className="modal-head">
          <h2 id="pf-h">{product ? 'Edit product' : 'Add product'}</h2>
          <button type="button" className="text-btn" onClick={onClose}>Close</button>
        </div>
        {error && <p className="notice error" role="alert">{error}</p>}
        <Field label="Name" error={errors.name}><input value={form.name} onChange={set('name')} maxLength={120} /></Field>
        <Field label="Description" error={errors.description}><textarea rows={4} value={form.description} onChange={set('description')} maxLength={2000} /></Field>
        <div className="two">
          <Field label="Price (INR)" error={errors.price}><input inputMode="decimal" value={form.price} onChange={set('price')} /></Field>
          <Field label="Stock quantity" error={errors.stock}><input inputMode="numeric" value={sizes.length ? String(sizes.reduce((s, x) => s + (Number(x.stock) || 0), 0)) : form.stock} onChange={set('stock')} disabled={sizes.length > 0} /></Field>
        </div>
        <div className="two">
          <Field label="Category" error={errors.category}>
            <select value={form.category} onChange={set('category')}>
              <option value="">Choose...</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Badge (optional)" error={errors.badge}><input value={form.badge} onChange={set('badge')} maxLength={30} placeholder="New, Bestseller" /></Field>
        </div>
        <div className="size-editor">
          <span className="field-label">Sizes and stock per size (optional)</span>
          {sizes.map((s, i) => (
            <div key={i} className="size-row">
              <input aria-label={`Size ${i + 1} name`} placeholder="S, M, 42..." maxLength={12} value={s.label} onChange={(e) => setSizes(sizes.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
              <input aria-label={`Stock for size ${s.label || i + 1}`} inputMode="numeric" placeholder="Stock" value={s.stock} onChange={(e) => setSizes(sizes.map((x, j) => (j === i ? { ...x, stock: e.target.value } : x)))} />
              <button type="button" className="text-btn" onClick={() => setSizes(sizes.filter((_, j) => j !== i))}>Remove</button>
            </div>
          ))}
          <div className="row-gap">
            <button type="button" className="btn btn-ghost btn-small" disabled={sizes.length >= 12} onClick={() => setSizes([...sizes, { label: '', stock: '' }])}>+ Add size</button>
            {sizes.length === 0 && <button type="button" className="text-btn" onClick={() => setSizes(['S', 'M', 'L', 'XL'].map((l) => ({ label: l, stock: '' })))}>Use S / M / L / XL</button>}
          </div>
          <span className="hint">{sizes.length ? 'Total stock is the sum of all sizes.' : 'Leave empty for one-size products. The stock field above is used.'}</span>
        </div>
        <label className="check"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Feature on the home page</label>

        <div className="uploader">
          <span className="field-label">Images ({images.length}/6)</span>
          <div className="upload-grid">
            {images.map((im, i) => (
              <div key={im.url} className="upload-item">
                <img src={img(im.url, 200)} alt={`Product ${i + 1}`} />
                <button type="button" aria-label={`Remove image ${i + 1}`} onClick={() => setImages(images.filter((_, j) => j !== i))}>&times;</button>
              </div>
            ))}
            {images.length < 6 && (
              <button type="button" className="upload-add" disabled={uploading} onClick={() => fileRef.current.click()}>{uploading ? 'Uploading...' : '+ Add image'}</button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={onFile} data-testid="file-input" />
          <span className="hint">JPG, PNG or WebP, up to 4 MB. The first image is the cover.</span>
          {uploadError && <span className="field-error" role="alert">{uploadError}</span>}
        </div>

        <div className="row-gap">
          <button className="btn" disabled={busy || uploading}>{busy ? 'Saving...' : product ? 'Save changes' : 'Create product'}</button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
