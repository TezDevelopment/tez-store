import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Gallery from '@/components/Gallery';
import AddButton from '@/components/AddButton';
import Icon from '@/components/Icon';
import CopyCode from '@/components/CopyCode';
import MobileBuyBar from '@/components/MobileBuyBar';
import ProductCard from '@/components/ProductCard';
import { PRODUCTS, bySlug } from '@/lib/products';
import { money } from '@/lib/format';
import { SITE } from '@/lib/config';

export function generateStaticParams() { return PRODUCTS.map((p) => ({ slug: p.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = bySlug(slug);
  if (!p) return {};
  return {
    title: p.name,
    description: p.tagline,
    openGraph: { title: `${p.name} | ${SITE.name}`, description: p.tagline, images: [`/img/${p.slug}/${p.shots[0]}.webp`] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = bySlug(slug);
  if (!p) notFound();
  const ld = {
    '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: p.tagline,
    brand: { '@type': 'Brand', name: SITE.name },
    offers: { '@type': 'Offer', price: p.price.toFixed(2), priceCurrency: SITE.currency.toUpperCase(), availability: 'https://schema.org/InStock' },
  };
  return (
    <div className="wrap section">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <nav className="crumbs" aria-label="Breadcrumb"><Link href="/scripts">Scripts</Link><span>/</span><span>{p.name}</span></nav>
      <header className="pdp-head">
        <small className="cat">{p.category}</small>
        <h1 className="h1">{p.name}</h1>
        <p className="lead">{p.description}</p>
      </header>
      <nav className="subnav" aria-label="On this page">
        <a href="#overview">Overview</a><a href="#features">Features</a><a href="#install">Install</a><a href="#specs">Requirements</a><a href="#changelog">Changelog</a>
      </nav>
      <div className="pdp">
        <div className="pdp-main">
          <section id="overview">
            <Gallery slug={p.slug} shots={p.shots} name={p.name} />
            <h2 className="h2">Watch it in action</h2>
            <video className="video" controls preload="none" poster={p.poster} playsInline>
              <source src={p.video} type="video/mp4" />
            </video>
          </section>

          <section id="features">
            <h2 className="h2">What is inside</h2>
            <div className="feat-list">
              {p.features.map((f) => (
                <div key={f.title} className="feat-item"><span className="tick"><Icon name="check" size={14} /></span><div><b>{f.title}</b><p>{f.text}</p></div></div>
              ))}
            </div>
          </section>

          <section id="install">
            <h2 className="h2">Install</h2>
            <ol className="install compact">
              <li><b>Download</b><p>Your order page has the zip as soon as you pay.</p></li>
              <li><b>Unzip into resources</b><p>Put the <code>{p.resource}</code> folder in your server&apos;s <code>resources</code> directory.</p></li>
              <li><b>Start it</b><p>Add this to <code>server.cfg</code> after {p.requires[0].split(',')[0]} and restart.</p><CopyCode text={`ensure ${p.resource}`} /></li>
            </ol>
          </section>

          <section id="specs">
            <h2 className="h2">Requirements</h2>
            <dl className="specs">
              <div><dt>Frameworks</dt><dd>{p.frameworks.map((f) => <span className="chip static" key={f}>{f}</span>)}</dd></div>
              <div><dt>Needs</dt><dd>{p.requires.map((f) => <span className="chip static" key={f}>{f}</span>)}</dd></div>
              <div><dt>Licence</dt><dd>One live server and one test server</dd></div>
            </dl>
          </section>

          <section id="changelog">
            <h2 className="h2">Changelog</h2>
            <div className="log">
              {p.changelog.map((c) => (
                <div className="log-item" key={c.v}>
                  <div className="log-head"><b>{c.v}</b><span className="muted">{c.date}</span></div>
                  <ul>{c.notes.map((n) => <li key={n}>{n}</li>)}</ul>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="buybox">
          <div className="price big">{money(p.price)}</div>
          <p className="tiny muted">One-time payment. Instant download after checkout.</p>
          <div className="stack">
            <AddButton slug={p.slug} buyNow />
            <AddButton slug={p.slug} />
            {p.demo && <Link className="btn" href={`/demo/${p.slug}`}><Icon name="play" size={15} /> Try the live demo</Link>}
          </div>
          <dl className="meta">
            <div><dt>Version</dt><dd>{p.version}</dd></div>
            <div><dt>Updated</dt><dd>{p.updated}</dd></div>
            <div><dt>Frameworks</dt><dd>{p.frameworks.join(', ')}</dd></div>
            <div><dt>Needs</dt><dd>{p.requires.join(', ')}</dd></div>
            <div><dt>Licence</dt><dd>One live server and one test server</dd></div>
          </dl>
          <p className="tiny muted"><Icon name="shield" size={13} /> Secure payment by Stripe.</p>
        </aside>
      </div>

      <section className="related">
        <h2 className="h2">More from {SITE.short}</h2>
        <div className="grid">{PRODUCTS.filter((x) => x.slug !== p.slug).map((x) => <ProductCard key={x.slug} p={x} />)}</div>
      </section>
      <MobileBuyBar p={p} />
    </div>
  );
}
