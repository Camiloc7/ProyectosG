/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: process.env.NODE_ENV === 'production' ? true : false,
  trailingSlash: true, // Asegúrate de que se mantenga para Netlify
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  compress: true,
  images: {
    domains: ['example.com'],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    scrollRestoration: process.env.NODE_ENV === 'production' ? true : false,
  },
  async headers() {
    if (process.env.NODE_ENV === 'production') {
      return [
        {
          source: '/_next/static/:path*',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=31536000, immutable',
            },
          ],
        },
      ];
    }
    return [];
  },
  webpack(config, { isServer }) {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
      };
    }

    // Desactivar caché en desarrollo
    if (process.env.NODE_ENV === 'development') {
      config.cache = false;
    }

    return config;
  },
};

module.exports = nextConfig;
