import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';
import { useSettings } from '../context/SettingsContext.jsx';

export default function Footer() {
  const { settings } = useSettings();
  return (
    <footer className="site-footer">
      <div className="selvedge" aria-hidden="true" />
      <div className="container footer-grid">
        <div>
          <div className="brand footer-brand"><Logo size={30} /><span className="brand-text"><span className="brand-name">{settings.storeName}</span><small className="brand-tag">Everyday elegance</small></span></div>
          <p className="muted-light">Contemporary fashion for women and men, designed in Visakhapatnam and made to be worn on repeat.</p>
        </div>
        <div>
          <h3>Shop</h3>
          <ul>
            <li><Link to="/shop">All products</Link></li>
            <li><Link to="/shop?category=women">Women</Link></li>
            <li><Link to="/shop?category=men">Men</Link></li>
            <li><Link to="/shop?category=footwear">Footwear</Link></li>
            <li><Link to="/shop?category=accessories">Accessories</Link></li>
          </ul>
        </div>
        <div>
          <h3>Account</h3>
          <ul>
            <li><Link to="/login">Log in</Link></li>
            <li><Link to="/signup">Create account</Link></li>
            <li><Link to="/cart">Your cart</Link></li>
            <li><Link to="/account">Your orders</Link></li>
          </ul>
        </div>
        <div>
          <h3>Visit and write</h3>
          <address>
            Studio 4, Fashion Street<br />Visakhapatnam, Andhra Pradesh 530003<br />
            <a href="mailto:hello@zaviro.example">hello@zaviro.example</a><br />
            Mon to Sat, 10am to 6pm IST
          </address>
        </div>
      </div>
      <div className="container fine">
        <span>&copy; 2026 {settings.storeName}. All rights reserved.</span>
        <span>Shipping and returns: 7-day easy returns on unused items.</span>
      </div>
    </footer>
  );
}
