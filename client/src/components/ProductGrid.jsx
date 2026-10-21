import ProductCard from './ProductCard.jsx';

export default function ProductGrid({ products }) {
  return <div className="grid">{products.map((p) => <ProductCard key={p._id} product={p} />)}</div>;
}
