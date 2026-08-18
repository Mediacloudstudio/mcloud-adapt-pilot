/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
