'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from './CartProvider';
import { SITE } from '@/lib/config';
import Icon from './Icon';

export default function Nav() {
  const { slugs, setOpen } = useCart();
  return (
    <>
      <div className="promo">
        <div className="wrap">Buy any {SITE.bundle.min} scripts and save {SITE.bundle.percent}% automatically. <Link href="/#pack">See the pack</Link></div>
      </div>
      <header className="nav">
        <div className="wrap nav-in">
          <Link href="/" className="brand" aria-label={SITE.name}>
            <Image src={SITE.logo} alt="" width={34} height={34} priority />
            <span>{SITE.name}</span>
          </Link>
          <nav className="links" aria-label="Main">
            <Link href="/scripts">Scripts</Link>
            <Link href="/#compare">Compare</Link>
            <Link href="/demo/blackbox-reports">Live demos</Link>
            <a href={SITE.discord} target="_blank" rel="noreferrer">Discord</a>
          </nav>
          <button className="btn cart-btn" onClick={() => setOpen(true)} aria-label="Open cart">
            <Icon name="cart" /> <span>Cart</span>{slugs.length > 0 && <i className="count">{slugs.length}</i>}
          </button>
        </div>
      </header>
    </>
  );
}
