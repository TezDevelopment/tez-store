/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: { formats: ['image/webp'], deviceSizes: [480, 768, 1080, 1280, 1600], minimumCacheTTL: 31536000 },
  // the script zips live in /private and are only ever sent by the download route after Stripe confirms payment
  outputFileTracingIncludes: { '/api/download/[id]/[slug]': ['./private/downloads/**/*'] },
  async headers() {
    const longCache = [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }];
    return [
      { source: '/img/:path*', headers: longCache },
      { source: '/video/:path*', headers: longCache },
      { source: '/demos/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }] },
      { source: '/(.*)', headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      ] },
    ];
  },
};
export default nextConfig;
