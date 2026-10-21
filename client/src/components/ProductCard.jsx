import { Link } from 'react-router-dom';
import { img, money } from '../lib/api';

export default function ProductCard({ product }) {
  const out = product.stock === 0;
  const low = product.stock > 0 && product.stock <= 5;
  const tag = out ? 'Sold out' : product.badge || (low ? `Only ${product.stock} left` : '');
  return (
    <Link to={`/product/${product._id}`} className="pcard">
      <div className="pcard-img">
        {product.images[0] ? <img src={img(product.images[0].url, 600)} alt={product.name} loading="lazy" /> : <div className="noimg">No image</div>}
        {tag && <span className={`tag ${out ? 'tag-out' : ''}`}>{tag}</span>}
      </div>
      <div className="pcard-body">
        <span className="pcard-cat">{product.category && product.category.name}</span>
        <h3>{product.name}</h3>
        <span className="price">{money(product.price)}</span>
      </div>
    </Link>
  );
}
