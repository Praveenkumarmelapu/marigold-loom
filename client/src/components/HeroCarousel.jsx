import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { img } from '../lib/api';
import { ArrowIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons.jsx';

const AUTOPLAY_MS = 5500;

export default function HeroCarousel({ slides, storeName }) {
  const items = (slides || []).filter((s) => s && s.imageUrl);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const touchX = useRef(null);
  const count = items.length;
  const go = useCallback((n) => setIdx((i) => ((n % count) + count) % count), [count]);
  const next = useCallback(() => go(idx + 1), [go, idx]);
  const prev = useCallback(() => go(idx - 1), [go, idx]);

  useEffect(() => {
    if (!playing || count < 2) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const t = setInterval(() => setIdx((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [playing, count]);

  if (!count) return null;
  const swipeStart = (x) => { touchX.current = x; };
  const swipeEnd = (x) => {
    if (touchX.current == null) return;
    const dx = x - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) > 48) (dx < 0 ? next : prev)();
  };

  return (
    <section
      className="hero-carousel"
      aria-roledescription="carousel"
      aria-label="Featured banners"
      onMouseEnter={() => setPlaying(false)}
      onMouseLeave={() => setPlaying(true)}
      onFocus={() => setPlaying(false)}
      onBlur={() => setPlaying(true)}
      onTouchStart={(e) => swipeStart(e.touches[0].clientX)}
      onTouchEnd={(e) => swipeEnd(e.changedTouches[0].clientX)}
      onPointerDown={(e) => e.pointerType === 'mouse' && swipeStart(e.clientX)}
      onPointerUp={(e) => e.pointerType === 'mouse' && swipeEnd(e.clientX)}
    >
      <h1 className="sr">{storeName} - fashion for every day</h1>
      {items.map((s, i) => (
        <div className={`hc-slide${i === idx ? ' on' : ''}`} key={i} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${count}`} aria-hidden={i !== idx}>
          <img src={img(s.imageUrl, 1800)} alt="" loading={i === 0 ? 'eager' : 'lazy'} draggable="false" />
          <div className="hc-scrim" aria-hidden="true" />
          <div className="container hc-content">
            {s.eyebrow && <p className="eyebrow light">{s.eyebrow}</p>}
            <p className="hc-title">{s.title}</p>
            {s.text && <p className="hc-text">{s.text}</p>}
            <div><Link to={s.buttonLink || '/shop'} className="btn btn-light" tabIndex={i === idx ? 0 : -1}>{s.buttonText || 'Shop now'} <ArrowIcon /></Link></div>
          </div>
        </div>
      ))}
      {count > 1 && (
        <>
          <button type="button" className="hc-arrow hc-prev" onClick={prev} aria-label="Previous banner"><ChevronLeftIcon /></button>
          <button type="button" className="hc-arrow hc-next" onClick={next} aria-label="Next banner"><ChevronRightIcon /></button>
          <div className="hc-dots" role="tablist" aria-label="Choose banner">
            {items.map((_, i) => (
              <button type="button" key={i} role="tab" aria-selected={i === idx} className={i === idx ? 'on' : ''} onClick={() => go(i)} aria-label={`Banner ${i + 1}`} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
