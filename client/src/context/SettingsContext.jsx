import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';

const DEFAULT_SLIDES = [
  { eyebrow: 'Autumn Winter 2026', title: 'Dress like the day is already yours.', text: 'New season coats, dresses, tailoring and everyday essentials, designed in India and made to last beyond the trend.', buttonText: 'Shop the collection', buttonLink: '/shop', imageUrl: '/shop/hero.jpg' },
  { eyebrow: 'The dress edit', title: 'Occasion-ready, every single time.', text: 'Midi dresses, wrap silhouettes and prints that carry a room.', buttonText: 'Shop women', buttonLink: '/shop?category=women', imageUrl: '/shop/ruby-dress.jpg' },
  { eyebrow: 'Tailoring for him', title: 'Sharp cuts. Honest prices.', text: 'Blazers, suits and everyday basics built on clean lines.', buttonText: 'Shop men', buttonLink: '/shop?category=men', imageUrl: '/shop/blazer.jpg' },
];

export const DEFAULTS = {
  storeName: 'ZAVIRO',
  colors: { primary: '#141414', accent: '#b3263e', background: '#faf7f2' },
  hero: { eyebrow: DEFAULT_SLIDES[0].eyebrow, title: DEFAULT_SLIDES[0].title, text: DEFAULT_SLIDES[0].text, buttonText: DEFAULT_SLIDES[0].buttonText, buttonLink: DEFAULT_SLIDES[0].buttonLink, imageUrl: DEFAULT_SLIDES[0].imageUrl, slides: DEFAULT_SLIDES },
  offer: { enabled: true, eyebrow: 'Festive offer', title: 'Flat 20% off your first order.', text: 'Use the code WELCOME20 at checkout.', buttonText: 'Start shopping', buttonLink: '/shop', imageUrl: '/shop/banner.jpg' },
};

// Guarantee the storefront always has at least 3 hero banners to slide through.
export function normalizeSlides(hero) {
  const h = hero || {};
  let slides = Array.isArray(h.slides) ? h.slides.filter((s) => s && s.imageUrl) : [];
  if (!slides.length && h.imageUrl) slides = [{ eyebrow: h.eyebrow, title: h.title, text: h.text, buttonText: h.buttonText, buttonLink: h.buttonLink, imageUrl: h.imageUrl }];
  const out = slides.slice(0, 6);
  while (out.length < 3) out.push(DEFAULT_SLIDES[out.length]);
  return out;
}

const SettingsContext = createContext(null);
export const useSettings = () => useContext(SettingsContext);

export function applyTheme(colors) {
  const r = document.documentElement.style;
  r.setProperty('--ink', colors.primary);
  r.setProperty('--clay', colors.accent);
  r.setProperty('--cream', colors.background);
}

export function SettingsProvider({ children }) {
  const [settings, setSettingsState] = useState(DEFAULTS);
  const set = useCallback((s) => {
    const merged = { ...s, hero: { ...s.hero, slides: normalizeSlides(s.hero) } };
    setSettingsState(merged); applyTheme(merged.colors); document.title = `${merged.storeName} | Fashion for every day`;
  }, []);
  useEffect(() => { api.get('/settings').then((d) => set(d.settings)).catch(() => {}); }, [set]);
  return <SettingsContext.Provider value={{ settings, setSettings: set }}>{children}</SettingsContext.Provider>;
}
