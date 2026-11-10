import Image from 'next/image';
import Link from 'next/link';
import { SITE } from '@/lib/config';

export default function Footer() {
  return (
    <footer className="foot">
      <div className="wrap foot-in">
        <div>
          <Link href="/" className="brand"><Image src={SITE.logo} alt="" width={30} height={30} /><span>{SITE.name}</span></Link>
          <p className="muted">{SITE.tagline}.</p>
        </div>
        <div className="foot-cols">
          <div><b>Store</b><Link href="/scripts">All scripts</Link><Link href="/demo/blackbox-reports">Live demos</Link></div>
          <div><b>Help</b><a href={SITE.discord} target="_blank" rel="noreferrer">Discord</a>{SITE.supportEmail && <a href={`mailto:${SITE.supportEmail}`}>Email</a>}</div>
          <div><b>Legal</b><Link href="/terms">Terms and licence</Link><Link href="/refunds">Refund policy</Link><Link href="/privacy">Privacy</Link></div>
        </div>
      </div>
      <div className="wrap foot-end">© {new Date().getFullYear()} {SITE.name}. Not affiliated with Rockstar Games or Cfx.re.</div>
    </footer>
  );
}
