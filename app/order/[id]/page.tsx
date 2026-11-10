import type { Metadata } from 'next';
import Link from 'next/link';
import ClearCart from '@/components/ClearCart';
import Icon from '@/components/Icon';
import { paidOrder } from '@/lib/stripe';
import { bySlug } from '@/lib/products';
import { money } from '@/lib/format';
import { SITE } from '@/lib/config';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Your order', robots: { index: false, follow: false } };

export default async function Order({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let order = null;
  try { order = await paidOrder(id); } catch { order = null; }

  if (!order) {
    return (
      <div className="wrap section narrow">
        <h1 className="h1">Order not found</h1>
        <p className="muted">We could not find that order. Check the link in your email, or contact us on <a href={SITE.discord}>Discord</a> with your receipt.</p>
        <Link href="/scripts" className="btn">Back to the store</Link>
      </div>
    );
  }
  if (!order.paid) {
    return (
      <div className="wrap section narrow">
        <h1 className="h1">Waiting for your payment</h1>
        <p className="muted">Your payment has not been confirmed yet. Some payment methods take a moment. Refresh this page in a minute.</p>
        <Link href={`/order/${id}`} className="btn primary">Refresh</Link>
      </div>
    );
  }
  const items = order.slugs.map((s) => bySlug(s)).filter((p): p is NonNullable<ReturnType<typeof bySlug>> => !!p);
  const total = (order.session.amount_total || 0) / 100;
  return (
    <div className="wrap section narrow">
      <ClearCart />
      <div className="ok-badge"><Icon name="check" size={22} /></div>
      <h1 className="h1">Thank you for your order</h1>
      <p className="muted">Your scripts are ready. Bookmark this page. The link works any time{order.session.customer_details?.email ? ` and a copy goes to ${order.session.customer_details.email}` : ''}.</p>

      <div className="orders">
        {items.map((p) => (
          <div className="order-line" key={p.slug}>
            <div className="grow"><b>{p.name}</b><small>Version {p.version}</small></div>
            <a className="btn primary" href={`/api/download/${id}/${p.slug}`}><Icon name="download" size={16} /> Download</a>
          </div>
        ))}
      </div>
      <p className="tiny muted">Order total {money(total)}</p>

      <h2 className="h2">Install in 3 steps</h2>
      <ol className="steps">
        <li>Unzip the download and drop the folder into your server&apos;s <code>resources</code> folder. The <code>fxmanifest.lua</code> must be directly inside it.</li>
        <li>Add <code>ensure folder_name</code> to your <code>server.cfg</code>, below your framework and <code>oxmysql</code>.</li>
        <li>Restart the server. Each script has a README with its commands and setup.</li>
      </ol>
      <div className="cta slim">
        <div><b>Need help or want your buyer role?</b><p>Join our Discord and open a ticket with your order link.</p></div>
        <a className="btn primary" href={SITE.discord} target="_blank" rel="noreferrer">Join Discord</a>
      </div>
    </div>
  );
}
