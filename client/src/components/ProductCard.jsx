import { useState } from 'react';
import { Link } from 'react-router-dom';
import { img, money } from '../lib/api';
import { useCart } from '../context/CartContext';
import HeartButton from './HeartButton';
import QuickView from './QuickView';
import Stars from './Stars.jsx';
export default function ProductCard({ product }) {
 const out=product.stock===0,low=product.stock>0&&product.stock<=5;
 const sized=product.sizes?.length>0;
 const tag=out?'Sold out':product.badge||(low?`Only ${product.stock} left`:'');
 const {add,loading}=useCart();const [busy,setBusy]=useState(false),[error,setError]=useState(''),[quick,setQuick]=useState(false);
 return <article className="pcard"><div className="pcard-img"><Link to={`/product/${product._id}`} tabIndex={-1} aria-hidden="true">{product.images[0]?<img src={img(product.images[0].url,600)} alt="" loading="lazy"/>:<div className="noimg">No image</div>}</Link>{tag&&<span className={`tag ${out?'tag-out':''}`}>{tag}</span>}<HeartButton product={product} className="card-heart"/><button className="quick-trigger" onClick={()=>setQuick(true)} aria-label={`Quick view ${product.name}`}>Quick view</button></div><div className="pcard-body"><span className="pcard-cat">{product.category?.name}</span><h3><Link to={`/product/${product._id}`}>{product.name}</Link></h3>{product.ratingCount>0&&<div className="pcard-rate"><Stars value={product.ratingAvg} size={13}/><span>({product.ratingCount})</span></div>}<div className="card-purchase"><span className="price">{money(product.price)}</span><button className="card-add" disabled={out||busy||loading} onClick={async()=>{if(sized){setQuick(true);return;}setBusy(true);setError('');try{await add(product._id);}catch(e){setError(e.message);}finally{setBusy(false);}}}>{out?'Sold out':busy?'Adding...':sized?'Select size':'Add to cart'}</button></div>{error&&<p className="card-error" role="alert">{error}</p>}</div>{quick&&<QuickView product={product} onClose={()=>setQuick(false)}/>}</article>;
}
