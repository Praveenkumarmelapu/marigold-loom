import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';

export const DEFAULTS = {
  storeName: 'Marigold Atelier',
  colors: { primary: '#141414', accent: '#b3263e', background: '#faf7f2' },
  hero: { eyebrow: 'Autumn Winter 2026', title: 'Dress like the day is already yours.', text: 'New season coats, dresses, tailoring and everyday essentials.', buttonText: 'Shop the collection', buttonLink: '/shop', imageUrl: '/shop/hero.jpg' },
  offer: { enabled: true, eyebrow: 'Festive offer', title: 'Flat 20% off your first order.', text: 'Use the code WELCOME20 at checkout.', buttonText: 'Start shopping', buttonLink: '/shop', imageUrl: '/shop/banner.jpg' },
};

const SettingsContext = createContext(null);
export const useSettings = () => useContext(SettingsContext);

export function applyTheme(colors) {
  const r = document.documentElement.style;
  r.setProperty('--ink', colors.primary);
  r.setProperty('--clay', colors.accent);
  r.setProperty('--cream', colors.background);
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);
  const set = useCallback((s) => { setSettings(s); applyTheme(s.colors); document.title = `${s.storeName} | Fashion for every day`; }, []);
  useEffect(() => { api.get('/settings').then((d) => set(d.settings)).catch(() => {}); }, [set]);
  return <SettingsContext.Provider value={{ settings, setSettings: set }}>{children}</SettingsContext.Provider>;
}
