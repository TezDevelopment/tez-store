'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type Ctx = {
  slugs: string[];
  open: boolean;
  busy: boolean;
  error: string;
  add: (slug: string, keepOpen?: boolean) => void;
  remove: (slug: string) => void;
  setOpen: (v: boolean) => void;
  checkout: (only?: string[]) => Promise<void>;
};

const C = createContext<Ctx | null>(null);
const KEY = 'tez-cart-v1';

export function useCart() {
  const v = useContext(C);
  if (!v) throw new Error('useCart outside provider');
  return v;
}

export default function CartProvider({ children }: { children: React.ReactNode }) {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    try { const s = JSON.parse(localStorage.getItem(KEY) || '[]'); if (Array.isArray(s)) setSlugs(s.filter((x) => typeof x === 'string')); } catch {}
  }, []);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(slugs)); } catch {} }, [slugs]);

  const add = useCallback((slug: string, _keepOpen?: boolean) => { setSlugs((s) => (s.includes(slug) ? s : [...s, slug])); setOpen(true); }, []);
  const remove = useCallback((slug: string) => setSlugs((s) => s.filter((x) => x !== slug)), []);

  const checkout = useCallback(async (only?: string[]) => {
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slugs: only || slugs }) });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Something went wrong.');
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setBusy(false);
    }
  }, [slugs]);

  const value = useMemo(() => ({ slugs, open, busy, error, add, remove, setOpen, checkout }), [slugs, open, busy, error, add, remove, checkout]);
  return <C.Provider value={value}>{children}</C.Provider>;
}
