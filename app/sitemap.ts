import type { MetadataRoute } from 'next';
import { PRODUCTS, DEMOS } from '@/lib/products';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  return [
    { url: base, priority: 1 },
    { url: `${base}/scripts`, priority: 0.9 },
    ...PRODUCTS.map((p) => ({ url: `${base}/scripts/${p.slug}`, priority: 0.8 })),
    ...Object.keys(DEMOS).map((s) => ({ url: `${base}/demo/${s}`, priority: 0.6 })),
  ];
}
