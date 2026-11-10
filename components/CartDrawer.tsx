'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from './CartProvider';
import { priceFor, money } from '@/lib/format';
import { SITE } from '@/lib/config';
import { PRODUCTS } from '@/lib/products';
import Icon from './Icon';

export default function CartDrawer() {
  const { slugs, open, setOpen, add, remove, checkout, busy, error } = useCart();
  const { items, subtotal, discount, total, rate } = priceFor(slugs);
  const need = Math.max(0, SITE.bundle.min - items.length);
  const pct = Math.min(100, (items.length / SITE.bundle.min) * 100);
  const more = PRODUCTS.filter((p) => !slugs.includes(p.slug));
  return (
    <>
      <div className={`scrim ${open ? 'on' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`drawer ${open ? 'on' : ''}`} aria-hidden={!open} aria-label="Cart">
        <div className="drawer-head"><b>Your cart</b><button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close cart"><Icon name="x" /></button></div>
        <div className="drawer-body">
          {items.length > 0 && (
            <div className="meter">
              <div className="meter-bar"><i style={{ width: `${pct}%` }} /></div>
              <p>{need > 0 ? <>Add {need} more {need === 1 ? 'script' : 'scripts'} to save {SITE.bundle.percent}%.</> : <b>{SITE.bundle.percent}% pack discount applied.</b>}</p>
            </div>
          )}
          {!items.length && <p className="muted">Your cart is empty. <Link href="/scripts" onClick={() => setOpen(false)}>Browse scripts</Link></p>}
          {items.map((p) => (
            <div className="line" key={p.slug}>
              <Image src={`/img/${p.slug}/${p.shots[0]}.webp`} alt="" width={96} height={56} />
              <div className="grow"><b>{p.name}</b><small>{p.category}</small></div>
              <div className="right"><b>{money(p.price)}</b><button className="link" onClick={() => remove(p.slug)}>Remove</button></div>
            </div>
          ))}
          {items.length > 0 && more.length > 0 && (
            <div className="upsell">
              <small className="muted">Also from {SITE.short}</small>
              {more.map((p) => (
                <div className="line" key={p.slug}>
                  <Image src={`/img/${p.slug}/${p.shots[0]}.webp`} alt="" width={96} height={56} />
                  <div className="grow"><b>{p.name}</b><small>{money(p.price)}</small></div>
                  <button className="btn sm" onClick={() => add(p.slug, true)}><Icon name="plus" size={14} /> Add</button>
                </div>
              ))}
            </div>
          )}
        </div>
        {items.length > 0 && (
          <div className="drawer-foot">
            {rate > 0 && <div className="row"><span>Subtotal</span><span>{money(subtotal)}</span></div>}
            {rate > 0 && <div className="row good"><span>{SITE.bundle.label} ({SITE.bundle.percent}%)</span><span>-{money(discount)}</span></div>}
            <div className="row total"><span>Total</span><span>{money(total)}</span></div>
            {error && <p className="err">{error}</p>}
            <button className="btn primary block" disabled={busy} onClick={() => checkout()}>{busy ? 'Opening checkout...' : 'Checkout securely'}</button>
            <p className="tiny center"><Icon name="shield" size={13} /> Payment is handled by Stripe. We never see your card.</p>
          </div>
        )}
      </aside>
    </>
  );
}
