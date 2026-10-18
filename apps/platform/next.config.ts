import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const { PrismaPlugin } = require('@prisma/nextjs-monorepo-workaround-plugin');

const withNextIntl = createNextIntlPlugin('./lib/i18n/request.ts');

const nextConfig: NextConfig = {
  // Next 15 defaults dynamic routes to a 0s client router cache, so every
  // sidebar click re-requested the page from the server and flashed its
  // loading.tsx. Every (dashboard) route is dynamic (auth() in the layout).
  // Keep visited/prefetched route payloads for 5 minutes — same window as
  // the TanStack staleTime, so data and routes age together.
  experimental: {
    staleTimes: { dynamic: 300, static: 300 },
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'your-bucket.s3.amazonaws.com' },
    ],
  },

  transpilePackages: [
    '@newcondo/ui',
    '@newcondo/i18n',
    '@newcondo/auth',
    '@newcondo/db',
  ],


  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
  },

  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins = [...config.plugins, new PrismaPlugin()];
    }

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        'fs/promises': false,
        module: false,
        child_process: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },
};

export default withNextIntl(nextConfig);