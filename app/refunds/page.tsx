import type { Metadata } from 'next';
import { SITE } from '@/lib/config';
export const metadata: Metadata = { title: 'Refund policy' };
export default function Refunds() {
  return (
    <div className="wrap section narrow legal">
      <h1 className="h1">Refund policy</h1>
      <p className="muted">Template text. Edit it to match the policy you want to follow.</p>
      <p>Scripts are digital downloads, so all sales are final once the files have been downloaded.</p>
      <h2>When we will help</h2>
      <p>If a script does not work and we cannot fix it for you after a reasonable try in a Discord ticket, contact us within 7 days of buying and we will look at a refund.</p>
      <h2>When we will not refund</h2>
      <p>Changes of mind, servers that do not meet the listed requirements, conflicts caused by other scripts you installed, or purchases where the files were shared.</p>
      <h2>How to ask</h2>
      <p>Open a ticket on <a href={SITE.discord}>Discord</a> {SITE.supportEmail ? <> or email {SITE.supportEmail}</> : null} with your order link.</p>
    </div>
  );
}
