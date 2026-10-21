import { useEffect, useRef, useState } from 'react';
import { api, img } from '../../lib/api';
import { useSettings, applyTheme } from '../../context/SettingsContext.jsx';
import Field from '../../components/Field.jsx';

const PRESETS = [
  ['Noir and ruby', { primary: '#141414', accent: '#b3263e', background: '#faf7f2' }],
  ['Navy and gold', { primary: '#14213d', accent: '#b8860b', background: '#f8f6f0' }],
  ['Forest and clay', { primary: '#1f3a2e', accent: '#b5532f', background: '#f6f1e7' }],
  ['Plum and rose', { primary: '#3b1f3a', accent: '#d1507a', background: '#fbf4f6' }],
];

function ImagePicker({ label, value, onChange }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const pick = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setBusy(true); setErr('');
    try { const fd = new FormData(); fd.append('image', file); const d = await api.upload('/admin/uploads', fd); onChange(d.image.url); }
    catch (x) { setErr(x.message); } finally { setBusy(false); e.target.value = ''; }
  };
  return (
    <div className="img-picker">
      <span className="field-label">{label}</span>
      {value && <img src={img(value, 500)} alt="" />}
      <div className="row-gap">
        <button type="button" className="btn btn-ghost btn-small" disabled={busy} onClick={() => ref.current.click()}>{busy ? 'Uploading...' : 'Upload new image'}</button>
        <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={pick} />
      </div>
      {err && <span className="field-error" role="alert">{err}</span>}
    </div>
  );
}

export default function AdminSettings() {
  const { settings, setSettings } = useSettings();
  const [f, setF] = useState(settings);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');
  useEffect(() => { setF(settings); }, [settings]);
  useEffect(() => () => applyTheme(settings.colors), [settings.colors]); // drop unsaved preview on leave

  const color = (k, v) => { const colors = { ...f.colors, [k]: v }; setF({ ...f, colors }); applyTheme(colors); };
  const sec = (s, k) => (e) => setF({ ...f, [s]: { ...f[s], [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value } });
  const err = (k) => errors[k];

  const save = async (e) => {
    e.preventDefault(); setError(''); setErrors({}); setFlash('');
    try { const d = await api.put('/admin/settings', f); setSettings(d.settings); setFlash('Settings saved. Your storefront is updated.'); window.scrollTo(0, 0); }
    catch (x) { setError(x.message); setErrors(x.fields || {}); }
  };

  return (
    <section aria-labelledby="as-h">
      <div className="admin-head"><h1 id="as-h">Settings</h1></div>
      {flash && <p className="notice ok" role="status">{flash}</p>}
      {error && <p className="notice error" role="alert">{error}</p>}
      <form onSubmit={save} noValidate className="settings-form">
        <fieldset>
          <legend>Store and colours</legend>
          <Field label="Store name" error={err('storeName')}><input value={f.storeName} onChange={(e) => setF({ ...f, storeName: e.target.value })} maxLength={40} /></Field>
          <div className="presets" role="group" aria-label="Colour presets">
            {PRESETS.map(([n, c]) => (
              <button type="button" key={n} className="preset" onClick={() => { setF({ ...f, colors: c }); applyTheme(c); }}>
                <span style={{ background: c.primary }} /><span style={{ background: c.accent }} /><span style={{ background: c.background }} />{n}
              </button>
            ))}
          </div>
          <div className="color-row">
            {[['primary', 'Main colour (text, buttons)'], ['accent', 'Accent colour'], ['background', 'Page background']].map(([k, l]) => (
              <Field key={k} label={l} error={err(`colors.${k}`)}>
                <span className="color-input"><input type="color" value={f.colors[k]} onChange={(e) => color(k, e.target.value)} aria-label={l} /><code>{f.colors[k]}</code></span>
              </Field>
            ))}
          </div>
          <p className="hint">Colours preview instantly. Click Save to publish them to every visitor.</p>
        </fieldset>

        <fieldset>
          <legend>Hero banner (top of the home page)</legend>
          <Field label="Small label" error={err('hero.eyebrow')}><input value={f.hero.eyebrow} onChange={sec('hero', 'eyebrow')} /></Field>
          <Field label="Headline" error={err('hero.title')}><input value={f.hero.title} onChange={sec('hero', 'title')} /></Field>
          <Field label="Text" error={err('hero.text')}><textarea rows="3" value={f.hero.text} onChange={sec('hero', 'text')} /></Field>
          <div className="two-col">
            <Field label="Button text" error={err('hero.buttonText')}><input value={f.hero.buttonText} onChange={sec('hero', 'buttonText')} /></Field>
            <Field label="Button link" error={err('hero.buttonLink')}><input value={f.hero.buttonLink} onChange={sec('hero', 'buttonLink')} /></Field>
          </div>
          <ImagePicker label="Hero image" value={f.hero.imageUrl} onChange={(u) => setF({ ...f, hero: { ...f.hero, imageUrl: u } })} />
          {err('hero.imageUrl') && <span className="field-error">{err('hero.imageUrl')}</span>}
        </fieldset>

        <fieldset>
          <legend>Offer banner (middle of the home page)</legend>
          <label className="check"><input type="checkbox" checked={f.offer.enabled} onChange={sec('offer', 'enabled')} /> Show the offer banner</label>
          <Field label="Small label" error={err('offer.eyebrow')}><input value={f.offer.eyebrow} onChange={sec('offer', 'eyebrow')} /></Field>
          <Field label="Headline" error={err('offer.title')}><input value={f.offer.title} onChange={sec('offer', 'title')} /></Field>
          <Field label="Text" error={err('offer.text')}><textarea rows="3" value={f.offer.text} onChange={sec('offer', 'text')} /></Field>
          <div className="two-col">
            <Field label="Button text" error={err('offer.buttonText')}><input value={f.offer.buttonText} onChange={sec('offer', 'buttonText')} /></Field>
            <Field label="Button link" error={err('offer.buttonLink')}><input value={f.offer.buttonLink} onChange={sec('offer', 'buttonLink')} /></Field>
          </div>
          <ImagePicker label="Offer background image" value={f.offer.imageUrl} onChange={(u) => setF({ ...f, offer: { ...f.offer, imageUrl: u } })} />
        </fieldset>
        <button className="btn">Save settings</button>
      </form>
    </section>
  );
}
