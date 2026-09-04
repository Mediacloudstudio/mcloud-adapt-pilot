/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // pdfkit (used by the invoice PDF route) loads its built-in font metrics
  // (Helvetica etc.) from disk at runtime via fs.readFileSync(path.join(__dirname,
  // 'data', ...)). Next's webpack bundler normally inlines route handler
  // dependencies into a single compiled route.js file, which rewrites
  // __dirname to point at that compiled file's own folder instead of
  // pdfkit's real install location — so pdfkit ends up looking for
  // ".../pdf/data/Helvetica.afm" (doesn't exist) instead of
  // "node_modules/pdfkit/js/data/Helvetica.afm" (does exist), causing an
  // ENOENT 500 in production even though it works in local dev.
  //
  // serverComponentsExternalPackages keeps pdfkit un-bundled (loaded via a
  // normal runtime require from node_modules, preserving its real
  // __dirname); outputFileTracingIncludes then guarantees its data/*.afm
  // files actually get copied into the deployed function, since pdfkit
  // builds those filenames dynamically and Vercel's static file tracer
  // can't always detect dynamic fs paths on its own.
  experimental: {
    serverComponentsExternalPackages: ['pdfkit'],
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
