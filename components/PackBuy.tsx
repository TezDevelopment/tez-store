'use client';
import { useCart } from './CartProvider';
export default function PackBuy({ slugs, label }: { slugs: string[]; label: string }) {
  const { checkout, busy } = useCart();
  return <button className="btn primary lg" disabled={busy} onClick={() => checkout(slugs)}>{busy ? 'Opening checkout...' : label}</button>;
}
