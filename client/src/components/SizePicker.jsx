export default function SizePicker({ sizes = [], value, onChange, error }) {
  if (!sizes.length) return null;
  return (
    <div className="size-picker" role="radiogroup" aria-label="Choose a size">
      <span className="field-label">Size{value ? `: ${value}` : ''}</span>
      <div className="size-options">
        {sizes.map((s) => (
          <button type="button" key={s.label} role="radio" aria-checked={value === s.label} disabled={s.stock === 0}
            className={`size-opt ${value === s.label ? 'on' : ''}`} onClick={() => onChange(s.label)}
            title={s.stock === 0 ? 'Sold out' : s.stock <= 3 ? `Only ${s.stock} left` : ''}>
            {s.label}{s.stock > 0 && s.stock <= 3 && <small>{s.stock} left</small>}
          </button>
        ))}
      </div>
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  );
}
