import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, img } from '../lib/api';
import { HERO_IMAGE } from '../lib/brand';
import ProductGrid from '../components/ProductGrid.jsx';
import Spinner from '../components/Spinner.jsx';
import { ArrowIcon } from '../components/Icons.jsx';

export default function Home() {
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
      .then(([f, n, c]) => { setFeatured(f.products); setFresh(n.products); setCats(c.categories); })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <>
      <section className="hero container">
        <div className="hero-copy">
          <p className="eyebrow">Handloom and stoneware, made slowly</p>
          <h1>Things for the corner of the house you actually sit in.</h1>
          <p className="lede">Indigo throws, speckled mugs and terracotta bowls from small studios we know by name. Made in batches of twenty, never restocked in a hurry.</p>
          <div className="hero-cta">
            <Link to="/shop" className="btn">Shop the collection <ArrowIcon /></Link>
            <Link to="/shop?category=ceramics" className="link-arrow">Browse ceramics</Link>
          </div>
          <ul className="hero-notes">
            <li><strong>14</strong> studios</li>
            <li><strong>7 day</strong> returns</li>
            <li><strong>Free</strong> shipping over &#8377;2,500</li>
          </ul>
        </div>
        <div className="hero-art">
          <div className="hero-block" aria-hidden="true" />
          <img src={img(HERO_IMAGE, 900)} alt="A sunlit corner with an indigo throw on a wooden chair, terracotta bowls and a ceramic vase on a shelf" />
          <div className="hero-stamp"><span>Autumn</span><strong>Indigo season</strong><small>New throws in stock</small></div>
        </div>
      </section>

      <section className="container section" aria-labelledby="cats-h">
        <div className="section-head"><h2 id="cats-h">Shop by room and ritual</h2></div>
        <div className="cat-row">
          {cats.map((c, i) => (
            <Link key={c._id} to={`/shop?category=${c.slug}`} className={`cat-tile cat-${i % 3}`}>
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
          <h2 id="feat-h">Featured this season</h2>
          <Link to="/shop" className="link-arrow">View all <ArrowIcon /></Link>
        </div>
        {error && <p className="notice error" role="alert">{error}</p>}
        {!featured && !error ? <Spinner /> : featured && <ProductGrid products={featured} />}
      </section>

      <section className="promo-band">
        <div className="container promo-inner">
          <div>
            <p className="eyebrow light">Festive offer</p>
            <h2>Pair a throw with a pair of mugs.</h2>
            <p>Free shipping applies to every order above &#8377;2,500, and each parcel carries a handwritten note from the studio that made it.</p>
          </div>
          <Link to="/shop?sort=price_asc" className="btn btn-light">See gifts under &#8377;1,500 <ArrowIcon /></Link>
        </div>
      </section>

      <section className="container section" aria-labelledby="new-h">
        <div className="section-head">
          <h2 id="new-h">New arrivals</h2>
          <Link to="/shop?sort=newest" className="link-arrow">Newest first <ArrowIcon /></Link>
        </div>
        {!fresh && !error ? <Spinner /> : fresh && <ProductGrid products={fresh} />}
      </section>

      <section className="container section story">
        <div>
          <p className="eyebrow">How we work</p>
          <h2>Small batches, named makers, honest finishes.</h2>
        </div>
        <div className="story-cols">
          <p>Every piece is made by a studio we have visited. Glazes pool, weaves vary a little, and that is the point.</p>
          <p>We keep stock low on purpose. When something sells out, the maker gets a few weeks to make it properly again.</p>
        </div>
      </section>
    </>
  );
}
