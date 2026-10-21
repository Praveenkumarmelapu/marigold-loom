import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);
const EMPTY = { items: [], subtotal: 0, count: 0, notices: [] };

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  const refresh = useCallback(async () => {
    if (!user) return setCart(EMPTY);
    setLoading(true);
    try { setCart(await api.get('/cart')); } catch { setCart(EMPTY); } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { if (!toast) return undefined; const t = setTimeout(() => setToast(''), 2600); return () => clearTimeout(t); }, [toast]);

  const add = async (productId, quantity = 1) => { setCart(await api.post('/cart/items', { productId, quantity })); setToast('Added to your cart'); };
  const setQty = async (productId, quantity) => setCart(await api.patch(`/cart/items/${productId}`, { quantity }));
  const remove = async (productId) => setCart(await api.del(`/cart/items/${productId}`));
  const clear = async () => setCart(await api.del('/cart'));

  return <CartContext.Provider value={{ cart, loading, add, setQty, remove, clear, refresh }}>{children}{toast && <div className="toast" role="status">{toast}</div>}</CartContext.Provider>;
}
