import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, img } from '../lib/api';
import { useSettings } from '../context/SettingsContext.jsx';
import ProductGrid from '../components/ProductGrid.jsx';
import Spinner from '../components/Spinner.jsx';
import { ArrowIcon } from '../components/Icons.jsx';

export default function Home() {
  const { settings } = useSettings();
  const { hero, offer } = settings;
  const [featured, setFeatured] = useState(null);
  const [fresh, setFresh] = useState(null);
  const [cats, setCats] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/products?featured=true&limit=4'),
      api.get('/products?sort=newest&limit=4'),
      api.get('/categories'),
    ])
      .then(([f, n, c]) => { setFeatured(f.products); setFresh(n.products); setCats(['women', 'men', 'footwear', 'accessories'].map((slug) => c.categories.find((x) => x.slug === slug)).filter(Boolean).concat(c.categories.filter((x) => !['women', 'men', 'footwear', 'accessories'].includes(x.slug)))); })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <>
      <section className="hero container">
        <div className="hero-copy">
          <p className="eyebrow">{hero.eyebrow}</p>
          <h1>{hero.title}</h1>
          <p className="lede">{hero.text}</p>
          <div className="hero-cta">
            <Link to={hero.buttonLink} className="btn">{hero.buttonText} <ArrowIcon /></Link>
            <Link to="/shop?sort=newest" className="link-arrow">See what is new</Link>
          </div>
          <ul className="hero-notes">
            <li><strong>20</strong> new styles</li>
            <li><strong>7 day</strong> returns</li>
            <li><strong>Free</strong> shipping over &#8377;2,500</li>
          </ul>
        </div>
        <div className="hero-art">
          <div className="hero-block" aria-hidden="true" />
          <img src={img(hero.imageUrl, 1000)} alt="Featured look from the new collection" />
          <div className="hero-stamp"><span>New in</span><strong>The Autumn Edit</strong><small>Coats, dresses and tailoring</small></div>
        </div>
      </section>

      <section className="container section" aria-labelledby="cats-h">
        <div className="section-head"><h2 id="cats-h">Shop by category</h2></div>
        <div className="cat-row">
          {cats.map((c) => (
            <Link key={c._id} to={`/shop?category=${c.slug}`} className={`cat-tile cat-${c.slug}`}>
              <span className="cat-count">{String(c.productCount).padStart(2, '0')} pieces</span>
              <h3>{c.name}</h3>
              <p>{c.blurb}</p>
              <span className="link-arrow">Explore <ArrowIcon /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container section" aria-labelledby="feat-h">
        <div className="section-head">
          <h2 id="feat-h">Featured styles</h2>
          <Link to="/shop" className="link-arrow">View all <ArrowIcon /></Link>
        </div>
        {error && <p className="notice error" role="alert">{error}</p>}
        {!featured && !error ? <Spinner /> : featured && <ProductGrid products={featured} />}
      </section>

      {offer.enabled && (
        <section className="promo-band" style={offer.imageUrl ? { backgroundImage: `linear-gradient(90deg, rgba(0,0,0,.78), rgba(0,0,0,.35)), url(${img(offer.imageUrl, 1600)})` } : undefined}>
          <div className="container promo-inner">
            <div>
              <p className="eyebrow light">{offer.eyebrow}</p>
              <h2>{offer.title}</h2>
              <p>{offer.text}</p>
            </div>
            <Link to={offer.buttonLink} className="btn btn-light">{offer.buttonText} <ArrowIcon /></Link>
          </div>
        </section>
      )}

      <section className="container section" aria-labelledby="new-h">
        <div className="section-head">
          <h2 id="new-h">New arrivals</h2>
          <Link to="/shop?sort=newest" className="link-arrow">Newest first <ArrowIcon /></Link>
        </div>
        {!fresh && !error ? <Spinner /> : fresh && <ProductGrid products={fresh} />}
      </section>

      <section className="container section story">
        <div>
          <p className="eyebrow">Our promise</p>
          <h2>Good cloth, clean cuts, clothes that last.</h2>
        </div>
        <div className="story-cols">
          <p>Every piece is cut from fabrics we have tested ourselves: washed, worn and washed again. If it does not hold its shape, it does not ship.</p>
          <p>Order by 4pm for dispatch the same day. If the fit is off, send it back within seven days for an exchange or a refund.</p>
        </div>
      </section>
    </>
  );
}
