import { useState } from 'react';
import { useWishlist } from '../context/WishlistContext';
export function HeartIcon({ filled = false }) { return <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" /></svg>; }
export default function HeartButton({ product, className = '' }) {
 const { has, toggle, busy, loading } = useWishlist(); const [error,setError] = useState(''); const saved=has(product._id);
 return <><button className={`heart-btn ${saved ? 'is-saved' : ''} ${className}`} disabled={busy||loading} aria-pressed={saved} aria-label={`${saved?'Remove':'Save'} ${product.name} ${saved?'from':'to'} wishlist`} onClick={async()=>{setError('');try{await toggle(product);}catch(e){setError(e.message);}}}><HeartIcon filled={saved}/></button>{error&&<span className="card-error" role="alert">{error}</span>}</>;
}
