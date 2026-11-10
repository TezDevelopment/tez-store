import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AddButton from '@/components/AddButton';
import { DEMOS, bySlug } from '@/lib/products';
import { money } from '@/lib/format';

export function generateStaticParams() { return Object.keys(DEMOS).map((slug) => ({ slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: `${DEMOS[slug]?.label || 'Demo'} live demo` };
}

export default async function Demo({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const demo = DEMOS[slug];
  const p = bySlug(slug);
  if (!demo || !p) notFound();
  return (
    <div className="demo">
      <div className="wrap demo-bar">
        <div className="demo-tabs">
          {Object.entries(DEMOS).map(([s, d]) => <Link key={s} href={`/demo/${s}`} className={s === slug ? 'on' : ''}>{d.label}</Link>)}
        </div>
        <p className="muted">Real interface, sample data. {demo.hint}</p>
        <div className="demo-buy"><b>{money(p.price)}</b><AddButton slug={p.slug} small /><Link className="btn sm ghost" href={`/scripts/${p.slug}`}>Details</Link></div>
      </div>
      <div className="wrap">
        <div className="frame">
          <iframe src={demo.path} title={`${demo.label} live demo`} loading="lazy" />
        </div>
      </div>
    </div>
  );
}
