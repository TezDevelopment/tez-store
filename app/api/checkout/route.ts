import { NextResponse } from 'next/server';
import { stripe, siteUrl } from '@/lib/stripe';
import { priceFor } from '@/lib/format';
import { SITE } from '@/lib/config';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  let body: { slugs?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Bad request' }, { status: 400 }); }

  const asked = Array.isArray(body.slugs) ? body.slugs.filter((s): s is string => typeof s === 'string') : [];
  const slugs = [...new Set(asked)].slice(0, 20);
  const { items, rate } = priceFor(slugs);
  if (!items.length) return NextResponse.json({ error: 'Your cart is empty.' }, { status: 400 });

  try {
    const base = siteUrl();
    const session = await stripe().checkout.sessions.create({
      mode: 'payment',
      line_items: items.map((p) => ({
        quantity: 1,
        price_data: {
          currency: SITE.currency,
          // the price comes from lib/products.ts, never from the browser
          unit_amount: Math.round(p.price * (1 - rate) * 100),
          product_data: { name: p.name, description: rate ? `${p.tagline} (${SITE.bundle.label} ${SITE.bundle.percent}% off)` : p.tagline, metadata: { slug: p.slug } },
        },
      })),
      metadata: { slugs: items.map((p) => p.slug).join(',') },
      allow_promotion_codes: true,
      customer_creation: 'always',
      custom_fields: [{ key: 'discord', label: { type: 'custom', custom: 'Discord username (for your buyer role)' }, type: 'text', optional: true }],
      success_url: `${base}/order/{CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/scripts`,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error('checkout error', e);
    return NextResponse.json({ error: 'Checkout is not available right now. Please try again or contact us on Discord.' }, { status: 500 });
  }
}
