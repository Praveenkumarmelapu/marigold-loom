import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import ProductGrid from '../components/ProductGrid';
import { GridSkeleton } from '../components/Skeleton.jsx';
export default function Wishlist(){const {products,loading,error}=useWishlist();const {user}=useAuth();return <div className="container wishlist-page"><nav className="crumbs"><Link to="/shop">← Continue shopping</Link></nav><div className="wishlist-heading"><div><p className="eyebrow">Your personal edit</p><h1>Wishlist <small>({products.length})</small></h1></div><p className="muted">{user?'Saved to your account, ready whenever you are.':'Saved on this device. Log in to keep your favourites across devices.'}</p></div>{error&&<p className="notice error" role="alert">{error}</p>}{loading?<GridSkeleton n={4}/>:products.length?<ProductGrid products={products}/>:<div className="state-box"><h2>A little room for favourites</h2><p>Tap the heart on anything you love. Find it here when you are ready.</p><Link className="btn" to="/shop">Explore the collection</Link></div>}</div>;}
