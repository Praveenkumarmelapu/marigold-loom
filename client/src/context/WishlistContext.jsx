import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../lib/api';
import { stored, save } from '../lib/storage';
const Context = createContext(null);
export const useWishlist = () => useContext(Context);
export function WishlistProvider({ children }) {
 const { user, loading: authLoading } = useAuth();
 const [products, setProducts] = useState([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState('');
 const [busy, setBusy] = useState(false);
 const lock = useRef(false);
 useEffect(() => {
  if (authLoading) return;
  let alive = true; setLoading(true); setError('');
  const guest = stored('zaviro-wishlist');
  if (!user) { setProducts(guest); setLoading(false); return; }
  (guest.length ? api.post('/wishlist', { productIds: guest.map(p => p._id) }) : api.get('/wishlist'))
   .then(d => { if (alive) { setProducts(d.products); save('zaviro-wishlist', []); } })
   .catch(e => { if (alive) { setProducts([]); setError(e.message); } })
   .finally(() => { if (alive) setLoading(false); });
  return () => { alive = false; };
 }, [user, authLoading]);
 async function toggle(p) {
  if (lock.current || loading) return;
  lock.current = true; setBusy(true); setError('');
  const exists = products.some(x => x._id === p._id);
  try {
   if (user) { const d = exists ? await api.del(`/wishlist/${p._id}`) : await api.post('/wishlist', { productIds: [p._id] }); setProducts(d.products); }
   else { const next = exists ? products.filter(x => x._id !== p._id) : [p, ...products].slice(0,100); save('zaviro-wishlist',next); setProducts(next); }
  } catch(e) { setError(e.message); throw e; }
  finally { lock.current = false; setBusy(false); }
 }
 return <Context.Provider value={{ products, loading, busy, error, toggle, has: id => products.some(p => p._id === id) }}>{children}</Context.Provider>;
}
