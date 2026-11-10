import AddButton from './AddButton';
import { money } from '@/lib/format';
import type { Product } from '@/lib/products';
export default function MobileBuyBar({ p }: { p: Product }) {
  return (
    <div className="buybar" role="region" aria-label="Buy">
      <div><b>{money(p.price)}</b><small className="muted">{p.name}</small></div>
      <AddButton slug={p.slug} buyNow />
    </div>
  );
}
