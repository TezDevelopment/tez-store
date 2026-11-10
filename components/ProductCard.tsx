import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/products';
import { money } from '@/lib/format';
import AddButton from './AddButton';

export default function ProductCard({ p, priority }: { p: Product; priority?: boolean }) {
  return (
    <article className="card" data-cat={p.category}>
      <Link href={`/scripts/${p.slug}`} className="card-img" aria-label={p.name}>
        <Image src={`/img/${p.slug}/${p.shots[0]}.webp`} alt={`${p.name} screenshot`} width={640} height={375} sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 380px" priority={priority} />
        {p.badge && <span className="badge">{p.badge}</span>}
      </Link>
      <div className="card-body">
        <small className="cat">{p.category}</small>
        <h3><Link href={`/scripts/${p.slug}`}>{p.name}</Link></h3>
        <p>{p.tagline}</p>
        <div className="tags">{p.frameworks.map((f) => <span key={f}>{f}</span>)}</div>
        <div className="card-foot">
          <b className="price">{money(p.price)}</b>
          <div className="gap">
            <Link href={`/scripts/${p.slug}`} className="btn sm ghost">Details</Link>
            <AddButton slug={p.slug} small />
          </div>
        </div>
      </div>
    </article>
  );
}
