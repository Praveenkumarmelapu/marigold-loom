import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { money } from '../lib/api';

export default function Account() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const nav = useNavigate();
  return (
    <div className="container account">
      <p className="eyebrow">Your account</p>
      <h1>Hello, {user.name.split(' ')[0]}</h1>
      <dl className="profile">
        <div><dt>Name</dt><dd>{user.name}</dd></div>
        <div><dt>Email</dt><dd>{user.email}</dd></div>
        <div><dt>Account type</dt><dd className="cap">{user.role}</dd></div>
        <div><dt>Cart</dt><dd>{cart.count} items, {money(cart.subtotal)}</dd></div>
      </dl>
      <div className="row-gap">
        <Link className="btn" to="/cart">View cart</Link>
        {user.role === 'admin' && <Link className="btn btn-ghost" to="/admin">Open admin dashboard</Link>}
        <button className="btn btn-ghost" onClick={async () => { await logout(); nav('/'); }}>Log out</button>
      </div>
    </div>
  );
}
