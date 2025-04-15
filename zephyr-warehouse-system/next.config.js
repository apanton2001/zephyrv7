/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      'firebasestorage.googleapis.com',
      'localhost',
      'zephyr-warehouse-system.vercel.app',
    ],
  },
  eslint: {
    dirs: ['pages', 'components', 'models', 'controllers', 'presenters', 'lib', 'hooks', 'contexts', 'services'],
  },
  webpack(config) {
    // SVG support
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },
  // Environment variables that will be available at build time
  env: {
    NEXT_PUBLIC_APP_NAME: 'Zephyr Warehouse Management System',
    NEXT_PUBLIC_APP_VERSION: '0.1.0',
    NEXT_PUBLIC_APP_DESCRIPTION: 'A comprehensive warehouse management system',
  },
  // Internationalization settings
  i18n: {
    locales: ['en', 'es', 'fr'],
    defaultLocale: 'en',
  },
  // Redirects
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },
  // Headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);