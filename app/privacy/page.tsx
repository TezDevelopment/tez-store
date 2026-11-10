import type { Metadata } from 'next';
import { SITE } from '@/lib/config';
export const metadata: Metadata = { title: 'Privacy' };
export default function Privacy() {
  return (
    <div className="wrap section narrow legal">
      <h1 className="h1">Privacy</h1>
      <p className="muted">Template text. Edit it to match what you really collect.</p>
      <p>Payments are handled by Stripe. We never see or store your card number. Stripe gives us your email, the scripts you bought and, if you give it, your Discord name.</p>
      <p>We use that to deliver your download, send your receipt and give you support. We do not sell your data. The cart is kept in your own browser.</p>
      <p>To ask about your data, contact us on <a href={SITE.discord}>Discord</a>{SITE.supportEmail ? <> or at {SITE.supportEmail}</> : null}.</p>
    </div>
  );
}
