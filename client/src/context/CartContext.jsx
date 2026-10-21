import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { api } from '../lib/api';
import { stored, save } from '../lib/storage';
import { useAuth } from './AuthContext';
const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);
const EMPTY = { items: [], subtotal: 0, count: 0, notices: [] };
function guestCart(items) { return { items, subtotal: items.reduce((s,i)=>s+(i.available ? i.lineTotal : 0),0), count: items.reduce((s,i)=>s+(i.available ? i.quantity : 0),0), notices: [] }; }
export function CartProvider({ children }) {
 const { user, loading: authLoading } = useAuth();
 const [cart,setCart] = useState(EMPTY), [fetching,setLoading] = useState(true), [toast,setToast] = useState(''), [syncError,setSyncError] = useState('');
 const [owner,setOwner] = useState(undefined);
 const identity = user?.id || 'guest';
 const loading = authLoading || fetching || owner !== identity;
 const lock = useRef(false);
 const refresh = useCallback(async () => {
  if (authLoading) return;
  setLoading(true); setSyncError('');
  try {
   const guest = stored('zaviro-cart');
   if (!user) setCart(guestCart(guest));
   else { const d = guest.length ? await api.post('/cart/merge',{items:guest.map(i=>({productId:i.productId,size:i.size||'',quantity:i.quantity}))}) : await api.get('/cart'); setCart(d); save('zaviro-cart',[]); }
  } catch(e) { setSyncError(e.message); } finally { setOwner(user?.id || 'guest'); setLoading(false); }
 },[user,authLoading]);
 useEffect(()=>{ refresh(); },[refresh]);
 useEffect(()=>{ if(!toast)return; const t=setTimeout(()=>setToast(''),2600);return()=>clearTimeout(t); },[toast]);
 const updateGuest = items => { save('zaviro-cart',items);setCart(guestCart(items)); };
 const keyOf=(id,size)=>`${id}:${size||''}`;
 const add = async(productId,quantity=1,size='') => {
  if(loading || lock.current) throw new Error('Please wait for your cart to finish updating.');
  lock.current=true;
  try {
   if(user) setCart(await api.post('/cart/items',{productId,quantity,size}));
   else {
    const {product:p}=await api.get(`/products/${productId}`);
    const sized=p.sizes?.length>0;
    if(sized&&!size)throw new Error('Please choose a size');
    const stock=sized?(p.sizes.find(s=>s.label===size)?.stock||0):p.stock;
    const items=stored('zaviro-cart'), existing=items.find(i=>keyOf(i.productId,i.size)===keyOf(productId,size)), n=(existing?.quantity||0)+quantity;
    if(n>stock)throw new Error(stock ? `Only ${stock} in stock` : 'This product is sold out');
    if(n>20)throw new Error('You can order at most 20 of one item');
    const line={productId:p._id,size,key:keyOf(p._id,size),name:p.name,price:p.price,image:p.images[0]?.url,stock,quantity:n,lineTotal:p.price*n,available:true};
    updateGuest([...items.filter(i=>keyOf(i.productId,i.size)!==keyOf(productId,size)),line]);
   }
   setToast('Added to your cart');
  } finally {lock.current=false;}
 };
 const setQty=async(id,quantity,size='')=>{
  if(user)return setCart(await api.patch(`/cart/items/${id}`,{quantity,size}));
  const {product:p}=await api.get(`/products/${id}`);const stock=p.sizes?.length?(p.sizes.find(s=>s.label===size)?.stock||0):p.stock;if(quantity>stock||quantity>20||quantity<1)throw new Error('That quantity is unavailable');
  updateGuest(stored('zaviro-cart').map(i=>keyOf(i.productId,i.size)===keyOf(id,size)?{...i,quantity,stock,price:p.price,lineTotal:p.price*quantity}:i));
 };
 const remove=async(id,size='')=>{if(user)setCart(await api.del(`/cart/items/${id}?size=${encodeURIComponent(size)}`));else updateGuest(stored('zaviro-cart').filter(i=>keyOf(i.productId,i.size)!==keyOf(id,size)));};
 const clear=async()=>{if(user)setCart(await api.del('/cart'));else updateGuest([]);};
 return <CartContext.Provider value={{cart,loading,add,setQty,remove,clear,refresh,syncError}}>{children}{toast&&<div className="toast" role="status">{toast}</div>}</CartContext.Provider>;
}
