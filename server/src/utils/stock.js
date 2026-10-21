// Size-aware stock helpers. Products without sizes use the plain stock field.
const hasSizes = (p) => Array.isArray(p.sizes) && p.sizes.length > 0;
const totalStock = (sizes) => sizes.reduce((s, x) => s + x.stock, 0);
function stockFor(p, size) {
  if (!hasSizes(p)) return p.stock;
  const s = p.sizes.find((x) => x.label === size);
  return s ? s.stock : 0;
}
module.exports = { hasSizes, totalStock, stockFor };
