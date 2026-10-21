import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import Logo from './Logo.jsx';
import { SearchIcon, UserIcon, BagIcon, MenuIcon, CloseIcon } from './Icons.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { useCart } from '../context/CartContext.jsx';

export default function Header() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const { settings } = useSettings();
  const nav = useNavigate();
  const loc = useLocation();
  const catLink = (slug, label) => (
    <Link to={`/shop?category=${slug}`} className={loc.pathname === '/shop' && loc.search.includes(`category=${slug}`) ? 'active' : ''} onClick={close}>{label}</Link>
  );
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    nav(`/shop${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);
    setOpen(false);
  };
  const close = () => setOpen(false);

  return (
    <header className="site-header">
      <div className="promo">Free shipping across India on orders over &#8377;2,500 &middot; 7-day easy returns</div>
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
          {user && user.role === 'admin' && <NavLink to="/admin" onClick={close}>Admin</NavLink>}
          <form className="search mobile-search" role="search" onSubmit={submit}>
            <input type="search" aria-label="Search products" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
            <button aria-label="Search"><SearchIcon /></button>
          </form>
        </nav>
        <form className="search desktop-search" role="search" onSubmit={submit}>
          <input type="search" aria-label="Search products" placeholder="Search the shop" value={q} onChange={(e) => setQ(e.target.value)} />
          <button aria-label="Search"><SearchIcon /></button>
        </form>
        <div className="actions">
          {user ? (
            <>
              <Link to="/account" className="icon-link" aria-label="Your account"><UserIcon /><span className="hide-sm">{user.name.split(' ')[0]}</span></Link>
              <button className="text-btn hide-sm" onClick={async () => { await logout(); nav('/'); }}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-btn">Log in</Link>
              <Link to="/signup" className="btn btn-small hide-sm">Sign up</Link>
            </>
          )}
          <Link to="/cart" className="icon-link cart-link" aria-label={`Cart, ${cart.count} items`}>
            <BagIcon />
            {cart.count > 0 && <span className="badge-count">{cart.count}</span>}
          </Link>
        </div>
      </div>
    </header>
  );
}
