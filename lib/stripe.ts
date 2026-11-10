import Stripe from 'stripe';

let client: Stripe | null = null;
export function stripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  if (!client) client = new Stripe(key);
  return client;
}

export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

// Everything that proves an order is real: Stripe says it is paid and tells us which scripts it covers.
export async function paidOrder(id: string) {
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(id)) return null;
  try {
    const s = await stripe().checkout.sessions.retrieve(id);
    const slugs = String(s.metadata?.slugs || '').split(',').filter(Boolean);
    return { session: s, slugs, paid: s.payment_status === 'paid' || s.payment_status === 'no_payment_required' };
  } catch {
    return null;
  }
}
