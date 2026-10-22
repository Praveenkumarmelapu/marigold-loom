import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import Logo from './Logo.jsx';
import SearchBox from './SearchBox.jsx';
import { HeartIcon } from './HeartButton';
import { useWishlist } from '../context/WishlistContext';
import { SearchIcon, UserIcon, BagIcon, MenuIcon, CloseIcon } from './Icons.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { useCart } from '../context/CartContext.jsx';

export default function Header() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const { products: wishes } = useWishlist();
  const { settings } = useSettings();
  const nav = useNavigate();
  const loc = useLocation();
  const catLink = (slug, label) => (
    <Link to={`/shop?category=${slug}`} className={loc.pathname === '/shop' && loc.search.includes(`category=${slug}`) ? 'active' : ''} onClick={close}>{label}</Link>
  );
  const [open, setOpen] = useState(false);
  const [msearch, setMsearch] = useState(false);
  useEffect(() => { setOpen(false); setMsearch(false); }, [loc.pathname]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
  const close = () => setOpen(false);

  return (
    <header className="site-header">
      <div className="promo"><span>Free shipping across India on orders over &#8377;2,500</span><span className="promo-sep"> &middot; </span><span>7-day easy returns</span></div>
      <div className="bar container">
        <button className="icon-btn menu-btn" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
        <Link to="/" className="brand" onClick={close} aria-label={`${settings.storeName} home`}>
          <Logo />
          <span className="brand-text"><span className="brand-name">{settings.storeName}</span><small className="brand-tag">Everyday elegance</small></span>
        </Link>
        <nav className={`nav ${open ? 'open' : ''}`} aria-label="Main">
          <NavLink to="/shop" end onClick={close} className={() => (loc.pathname === '/shop' && !loc.search.includes('category=') ? 'active' : '')}>Shop all</NavLink>
          {catLink('women', 'Women')}
          {catLink('men', 'Men')}
          {catLink('footwear', 'Footwear')}
          {catLink('accessories', 'Accessories')}
          {!user && <Link to="/login" className="nav-auth" onClick={close}>Log in</Link>}
          {!user && <Link to="/signup" className="nav-auth" onClick={close}>Sign up</Link>}
          {user && <Link to="/account" className="nav-auth" onClick={close}>My account</Link>}
          {user && <button type="button" className="nav-auth nav-logout" onClick={async () => { close(); await logout(); nav('/'); }}>Log out</button>}
          {user && user.role === 'admin' && <NavLink to="/admin" onClick={close}>Admin</NavLink>}
        </nav>
        <SearchBox className="desktop-search" />
        <div className="actions">
          <button className="icon-btn mobile-search-btn" aria-label={msearch ? 'Close search' : 'Search'} aria-expanded={msearch} onClick={() => setMsearch(!msearch)}>{msearch ? <CloseIcon /> : <SearchIcon />}</button>
          {user ? (
            <>
              <Link to="/account" className="icon-link" aria-label="Your account"><UserIcon /><span className="hide-sm">{user.name.split(' ')[0]}</span></Link>
              <button className="text-btn hide-sm" onClick={async () => { await logout(); nav('/'); }}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-btn">Log in</Link>
              <Link to="/signup" className="btn btn-small signup-btn hide-sm">Sign up</Link>
            </>
          )}
          <Link to="/wishlist" className="icon-link wishlist-link" aria-label={`Wishlist, ${wishes.length} items`}><HeartIcon />{wishes.length > 0 && <span className="badge-count">{wishes.length}</span>}</Link>
          <Link to="/cart" className="icon-link cart-link" aria-label={`Cart, ${cart.count} items`}>
            <BagIcon />
            {cart.count > 0 && <span className="badge-count">{cart.count}</span>}
          </Link>
        </div>
      </div>
      {msearch && <div className="mobile-search-row container"><SearchBox autoFocus onDone={() => setMsearch(false)} /></div>}
      {open && <button className="nav-scrim" aria-label="Close menu" tabIndex={-1} onClick={close} />}
    </header>
  );
}
