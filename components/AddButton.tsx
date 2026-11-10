'use client';
import { useCart } from './CartProvider';
import Icon from './Icon';

export default function AddButton({ slug, buyNow, small }: { slug: string; buyNow?: boolean; small?: boolean }) {
  const { add, slugs, checkout, busy } = useCart();
  const inCart = slugs.includes(slug);
  if (buyNow) {
    return <button className={`btn primary ${small ? 'sm' : ''}`} disabled={busy} onClick={() => checkout([slug])}>{busy ? 'Opening checkout...' : 'Buy now'}</button>;
  }
  return (
    <button className={`btn ${small ? 'sm' : ''}`} onClick={() => add(slug)}>
      {inCart ? <><Icon name="check" size={15} /> In cart</> : <><Icon name="cart" size={15} /> Add to cart</>}
    </button>
  );
}
