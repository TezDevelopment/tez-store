'use client';
import { useMemo, useState } from 'react';
import ProductCard from './ProductCard';
import Icon from './Icon';
import { PRODUCTS, CATEGORIES } from '@/lib/products';

type Sort = 'featured' | 'low' | 'high' | 'name';

export default function ScriptBrowser() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string>('All');
  const [fw, setFw] = useState<string>('Any');
  const [sort, setSort] = useState<Sort>('featured');
  const frameworks = useMemo(() => Array.from(new Set(PRODUCTS.flatMap((p) => p.frameworks))), []);
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    let r = PRODUCTS.filter((p) =>
      (cat === 'All' || p.category === cat) &&
      (fw === 'Any' || p.frameworks.includes(fw)) &&
      (!t || `${p.name} ${p.tagline} ${p.description} ${p.features.map((f) => f.title).join(' ')}`.toLowerCase().includes(t)));
    if (sort === 'low') r = [...r].sort((a, b) => a.price - b.price);
    if (sort === 'high') r = [...r].sort((a, b) => b.price - a.price);
    if (sort === 'name') r = [...r].sort((a, b) => a.name.localeCompare(b.name));
    return r;
  }, [q, cat, fw, sort]);
  const reset = () => { setQ(''); setCat('All'); setFw('Any'); setSort('featured'); };
  return (
    <div id="browser">
      <div className="toolbar">
        <label className="search"><Icon name="search" size={17} /><input id="q" type="search" placeholder="Search scripts and features" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search scripts" /></label>
        <label className="select"><span className="muted tiny">Framework</span>
          <select id="fw" value={fw} onChange={(e) => setFw(e.target.value)}><option>Any</option>{frameworks.map((f) => <option key={f}>{f}</option>)}</select></label>
        <label className="select"><span className="muted tiny">Sort</span>
          <select id="sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="featured">Featured</option><option value="low">Price, low to high</option><option value="high">Price, high to low</option><option value="name">Name</option></select></label>
      </div>
      <div className="chips" role="group" aria-label="Category">
        {['All', ...CATEGORIES].map((c) => (
          <button key={c} className={`chip ${cat === c ? 'on' : ''}`} data-cat={c} aria-pressed={cat === c} onClick={() => setCat(c)}>
            {c}<b>{c === 'All' ? PRODUCTS.length : PRODUCTS.filter((p) => p.category === c).length}</b>
          </button>
        ))}
      </div>
      <p className="tiny muted result-count" aria-live="polite"><span id="rc">{list.length}</span> {list.length === 1 ? 'script' : 'scripts'}</p>
      <div className="grid" id="results">{list.map((p) => <ProductCard key={p.slug} p={p} />)}</div>
      {!list.length && (
        <div className="empty"><b>Nothing matches that search.</b><p className="muted">Try another word, or clear the filters to see every script.</p><button className="btn sm" onClick={reset}>Clear filters</button></div>
      )}
    </div>
  );
}
