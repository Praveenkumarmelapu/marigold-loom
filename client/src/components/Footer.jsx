import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="selvedge" aria-hidden="true" />
      <div className="container footer-grid">
        <div>
          <div className="brand footer-brand"><Logo size={30} /><span>Marigold <em>Loom</em></span></div>
          <p className="muted-light">Handloom textiles and stoneware, made slowly by small studios in Andhra Pradesh, Odisha and Rajasthan.</p>
        </div>
        <div>
          <h3>Shop</h3>
          <ul>
            <li><Link to="/shop">All products</Link></li>
            <li><Link to="/shop?category=textiles">Textiles</Link></li>
            <li><Link to="/shop?category=ceramics">Ceramics</Link></li>
            <li><Link to="/shop?category=living">Living</Link></li>
          </ul>
        </div>
        <div>
          <h3>Account</h3>
          <ul>
            <li><Link to="/login">Log in</Link></li>
            <li><Link to="/signup">Create account</Link></li>
            <li><Link to="/cart">Your cart</Link></li>
          </ul>
        </div>
        <div>
          <h3>Visit and write</h3>
          <address>
            Studio 4, Weavers Lane<br />Visakhapatnam, Andhra Pradesh 530003<br />
            <a href="mailto:hello@marigoldloom.example">hello@marigoldloom.example</a><br />
            Mon to Sat, 10am to 6pm IST
          </address>
        </div>
      </div>
      <div className="container fine">
        <span>&copy; 2026 Marigold Loom. A demo storefront built for a hiring assignment.</span>
        <span>Shipping and returns: 7-day easy returns on unused items.</span>
      </div>
    </footer>
  );
}
