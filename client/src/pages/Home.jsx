import RecentlyViewed from '../components/RecentlyViewed';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, img } from '../lib/api';
import { useSettings } from '../context/SettingsContext.jsx';
import ProductGrid from '../components/ProductGrid.jsx';
import HeroCarousel from '../components/HeroCarousel.jsx';
import Spinner from '../components/Spinner.jsx';
import { ArrowIcon } from '../components/Icons.jsx';

const CAT_IMAGES = { women: '/shop/plaid-coat.jpg', men: '/shop/blazer.jpg', footwear: '/shop/runner.jpg', accessories: '/shop/handbag.jpg' };
const ORDER = ['women', 'men', 'footwear', 'accessories'];

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
      .then(([f, n, c]) => { setFeatured(f.products); setFresh(n.products); setCats(ORDER.map((slug) => c.categories.find((x) => x.slug === slug)).filter(Boolean).concat(c.categories.filter((x) => !ORDER.includes(x.slug)))); })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <>
      <HeroCarousel slides={hero.slides} storeName={settings.storeName} />

      <section className="container service-strip" aria-label="Store promises">
        <div><strong>20+</strong><span>new styles this season</span></div>
        <div><strong>7 day</strong><span>easy returns, no questions</span></div>
        <div><strong>Free</strong><span>shipping over &#8377;2,500</span></div>
      </section>

      <section className="container section" aria-labelledby="cats-h">
        <div className="section-head">
          <div><p className="eyebrow">The collections</p><h2 id="cats-h">Shop by category</h2></div>
          <Link to="/shop" className="link-arrow">View everything <ArrowIcon /></Link>
        </div>
        <div className="cat-grid">
          {cats.map((c) => (
            <Link key={c._id} to={`/shop?category=${c.slug}`} className="cat-card">
              <span className="cat-media"><img src={CAT_IMAGES[c.slug] || '/shop/hero.jpg'} alt="" loading="lazy" /></span>
              <span className="cat-body">
                <span className="cat-top"><span className="cat-name">{c.name}</span><span className="cat-count">{String(c.productCount).padStart(2, '0')} pieces</span></span>
                <span className="cat-blurb">{c.blurb}</span>
                <span className="link-arrow">Explore <ArrowIcon /></span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container section" aria-labelledby="feat-h">
        <div className="section-head">
          <div><p className="eyebrow">Handpicked</p><h2 id="feat-h">Featured styles</h2></div>
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
          <div><p className="eyebrow">Just in</p><h2 id="new-h">New arrivals</h2></div>
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
    <RecentlyViewed />
</>
  );
}
