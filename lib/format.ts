import { SITE } from './config';
import { PRODUCTS, bySlug } from './products';

export const money = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: SITE.currency.toUpperCase() }).format(n);

// the bundle discount, used by the cart (display) and by the checkout route (the real price)
export function priceFor(slugs: string[]) {
  const items = slugs.map((s) => bySlug(s)).filter((p): p is NonNullable<ReturnType<typeof bySlug>> => !!p);
  const subtotal = items.reduce((a, p) => a + p.price, 0);
  const rate = items.length >= SITE.bundle.min ? SITE.bundle.percent / 100 : 0;
  const discount = Math.round(subtotal * rate * 100) / 100;
  return { items, subtotal, rate, discount, total: Math.round((subtotal - discount) * 100) / 100 };
}

export const allSlugs = () => PRODUCTS.map((p) => p.slug);
