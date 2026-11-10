import Image from 'next/image';
import Link from 'next/link';
import AddButton from '@/components/AddButton';
import Icon from '@/components/Icon';
import PackBuy from '@/components/PackBuy';
import ReplayHero from '@/components/ReplayHero';
import { PRODUCTS } from '@/lib/products';
import { SITE } from '@/lib/config';
import { money, priceFor, allSlugs } from '@/lib/format';

const lead = (p: (typeof PRODUCTS)[number]) => (p.slug === 'blackbox-reports' ? p.shots[2] : p.shots[0]);

export default function Home() {
  const all = priceFor(allSlugs());
  const fwAll = Array.from(new Set(PRODUCTS.flatMap((p) => p.frameworks)));
  return (
    <>
      <section className="hero">
        <div className="wrap hero-in">
          <div className="hero-copy">
            <h1>{SITE.heroTitle}</h1>
            <p>{SITE.heroText}</p>
            <div className="hero-cta">
              <Link href="/scripts" className="btn primary lg">Browse scripts</Link>
              <Link href="/demo/blackbox-reports" className="btn lg"><Icon name="play" size={16} /> Try a live demo</Link>
            </div>
            <ul className="works" aria-label="Works with">
              {SITE.worksWith.map((w) => <li key={w}>{w}</li>)}
            </ul>
          </div>
          <ReplayHero />
        </div>
      </section>

      <section className="wrap section" id="scripts">
        <div className="section-head"><h2>The scripts</h2><Link href="/scripts" className="link">Search and filter</Link></div>
        <div className="showcase">
          {PRODUCTS.map((p, i) => (
            <article className={`show ${i % 2 ? 'flip' : ''}`} key={p.slug}>
              <Link href={`/scripts/${p.slug}`} className="show-img" aria-label={p.name}>
                <Image src={`/img/${p.slug}/${lead(p)}.webp`} alt={`${p.name} screenshot`} width={1280} height={750} sizes="(max-width: 900px) 100vw, 620px" priority={i === 0} />
              </Link>
              <div className="show-copy">
                <small className="cat">{p.category}{p.badge ? ` · ${p.badge}` : ''}</small>
                <h3><Link href={`/scripts/${p.slug}`}>{p.name}</Link></h3>
                <p className="show-tag">{p.tagline}</p>
                <ul className="ticks">
                  {p.features.slice(0, 3).map((f) => <li key={f.title}><Icon name="check" size={15} /> {f.title}</li>)}
                </ul>
                <div className="show-foot">
                  <b className="price">{money(p.price)}</b>
                  <Link href={`/scripts/${p.slug}`} className="btn ghost">Details</Link>
                  <AddButton slug={p.slug} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="wrap section" id="compare">
        <div className="section-head"><h2>Compare scripts</h2></div>
        <div className="table-wrap">
          <table className="compare">
            <thead><tr><th scope="col"><span className="sr">Feature</span></th>{PRODUCTS.map((p) => <th scope="col" key={p.slug}><Link href={`/scripts/${p.slug}`}>{p.name}</Link></th>)}</tr></thead>
            <tbody>
              <tr><th scope="row">Price</th>{PRODUCTS.map((p) => <td key={p.slug}><b>{money(p.price)}</b></td>)}</tr>
              <tr><th scope="row">Category</th>{PRODUCTS.map((p) => <td key={p.slug}>{p.category}</td>)}</tr>
              {fwAll.map((f) => (
                <tr key={f}><th scope="row">{f}</th>{PRODUCTS.map((p) => <td key={p.slug}>{p.frameworks.includes(f) ? <span className="yes"><Icon name="check" size={16} /><span className="sr">Supported</span></span> : <span className="no">None<span className="sr"> not supported</span></span>}</td>)}</tr>
              ))}
              <tr><th scope="row">Features</th>{PRODUCTS.map((p) => <td key={p.slug}>{p.features.length}</td>)}</tr>
              <tr><th scope="row">Live demo</th>{PRODUCTS.map((p) => <td key={p.slug}>{p.demo ? <Link className="link" href={`/demo/${p.slug}`}>Open</Link> : <span className="no">Video only</span>}</td>)}</tr>
              <tr><th scope="row">Needs</th>{PRODUCTS.map((p) => <td key={p.slug} className="small">{p.requires.join(', ')}</td>)}</tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="wrap section" id="pack">
        <div className="pack">
          <div className="pack-copy">
            <h2>The full pack</h2>
            <p>All {PRODUCTS.length} scripts together. The {SITE.bundle.percent}% discount applies on its own at {SITE.bundle.min} scripts, so there is no code to enter.</p>
            <ul className="pack-list">{PRODUCTS.map((p) => <li key={p.slug}><span>{p.name}</span><span className="muted">{money(p.price)}</span></li>)}</ul>
          </div>
          <div className="pack-buy">
            <div className="was muted">{money(all.subtotal)}</div>
            <div className="price big">{money(all.total)}</div>
            <p className="good tiny">You save {money(all.discount)}</p>
            <PackBuy slugs={allSlugs()} label="Buy the full pack" />
          </div>
        </div>
      </section>

      <section className="wrap section">
        <div className="section-head"><h2>Why servers pick us</h2></div>
        <div className="feat-grid">
          {SITE.features.map((f) => (
            <div className="feat" key={f.title}><span className="feat-ico"><Icon name={f.icon} size={20} /></span><b>{f.title}</b><p>{f.text}</p></div>
          ))}
        </div>
      </section>

      <section className="wrap section">
        <div className="section-head"><h2>Installed in three steps</h2></div>
        <ol className="install">
          <li><b>Buy and download</b><p>You land on your order page right after paying. Each script has its own download button.</p></li>
          <li><b>Drop it in resources</b><p>Unzip the file and put the folder inside your server&apos;s <code>resources</code> directory.</p></li>
          <li><b>Start it</b><p>Add the line below to <code>server.cfg</code> and restart. Every script ships with a README.</p><div className="code"><code>ensure blackbox_reports</code></div></li>
        </ol>
      </section>

      <section className="wrap section">
        <div className="section-head"><h2>Questions</h2></div>
        <div className="faq">
          {SITE.faq.map((f) => (
            <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>
          ))}
        </div>
      </section>

      <section className="wrap section">
        <div className="cta">
          <div><h2>Need something custom?</h2><p>Tell us what your server needs and we will build it.</p></div>
          <a className="btn primary lg" href={SITE.discord} target="_blank" rel="noreferrer">Open a ticket on Discord</a>
        </div>
      </section>
    </>
  );
}
