import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe, siteUrl } from '@/lib/stripe';
import { bySlug } from '@/lib/products';
import { SITE } from '@/lib/config';
import { money } from '@/lib/format';

export const runtime = 'nodejs';

async function discord(session: Stripe.Checkout.Session, names: string[]) {
  const url = process.env.DISCORD_SALES_WEBHOOK;
  if (!url) return;
  const handle = session.custom_fields?.find((f) => f.key === 'discord')?.text?.value || 'not given';
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [{
        title: 'New sale',
        color: 0x2f6df6,
        fields: [
          { name: 'Scripts', value: names.join('\n') || '-' },
          { name: 'Total', value: money((session.amount_total || 0) / 100), inline: true },
          { name: 'Customer', value: session.customer_details?.email || 'unknown', inline: true },
          { name: 'Discord', value: handle, inline: true },
        ],
        timestamp: new Date().toISOString(),
      }],
    }),
  }).catch(() => {});
}

async function email(session: Stripe.Checkout.Session, names: string[]) {
  const key = process.env.RESEND_API_KEY;
  const to = session.customer_details?.email;
  if (!key || !to) return;
  const link = `${siteUrl()}/order/${session.id}`;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || `${SITE.name} <onboarding@resend.dev>`,
      to,
      subject: `Your ${SITE.name} download is ready`,
      html: `<p>Thanks for your order!</p><p>${names.map((n) => `<b>${n}</b>`).join('<br>')}</p><p><a href="${link}">Open your order and download</a></p><p>Keep this email. The link works any time. Need help? ${SITE.discord}</p>`,
    }),
  }).catch(() => {});
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get('stripe-signature');
  if (!secret || !sig) return new NextResponse('Not configured', { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(await req.text(), sig, secret);
  } catch {
    return new NextResponse('Bad signature', { status: 400 });
  }

  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status === 'paid' || session.payment_status === 'no_payment_required') {
      const names = String(session.metadata?.slugs || '').split(',').map((s) => bySlug(s)?.name).filter((n): n is string => !!n);
      await Promise.all([discord(session, names), email(session, names)]);
    }
  }
  return NextResponse.json({ received: true });
}
