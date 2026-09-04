/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // pdfkit (used by the invoice PDF route) loads its built-in font metrics
  // (Helvetica etc.) from disk at runtime via fs.readFileSync rather than a
  // static import/require, so Next's serverless file tracer doesn't detect
  // those files automatically and they go missing from the deployed
  // function on Vercel (works fine in local dev where the full
  // node_modules tree is on disk). This explicitly forces those data files
  // into the bundled function.
  experimental: {
    outputFileTracingIncludes: {
      '/api/v1/portal/invoices/[id]/pdf/route': ['./node_modules/pdfkit/js/data/**/*'],
    },
  },
  // Portal and admin pages must never be indexed (PART 60).
  // Robots rules live in src/app/robots.ts and per-route metadata;
  // this header is a defense-in-depth backstop for /portal and /admin.
  async headers() {
    return [
      {
        source: '/portal/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/admin/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },
};

export default nextConfig;
