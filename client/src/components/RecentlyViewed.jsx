import { stored } from '../lib/storage';
import ProductGrid from './ProductGrid';
export default function RecentlyViewed(){const products=stored('zaviro-recent').slice(0,4);if(!products.length)return null;return <section className="section container"><div className="section-head"><div><p className="eyebrow">Pick up where you left off</p><h2>Recently viewed</h2></div></div><ProductGrid products={products}/></section>;}
