import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import Logo from './Logo.jsx';
import { SearchIcon, UserIcon, BagIcon, MenuIcon, CloseIcon } from './Icons.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

export default function Header() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const nav = useNavigate();
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
      <div className="promo">Free shipping across India on orders over &#8377;2,500</div>
      <div className="bar container">
        <button className="icon-btn menu-btn" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
        <Link to="/" className="brand" onClick={close} aria-label="Marigold Loom home">
          <Logo />
          <span>Marigold <em>Loom</em></span>
        </Link>
        <nav className={`nav ${open ? 'open' : ''}`} aria-label="Main">
          <NavLink to="/shop" end onClick={close}>Shop all</NavLink>
          <NavLink to="/shop?category=textiles" onClick={close}>Textiles</NavLink>
          <NavLink to="/shop?category=ceramics" onClick={close}>Ceramics</NavLink>
          <NavLink to="/shop?category=living" onClick={close}>Living</NavLink>
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
