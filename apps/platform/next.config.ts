import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const { PrismaPlugin } = require('@prisma/nextjs-monorepo-workaround-plugin');

const withNextIntl = createNextIntlPlugin('./lib/i18n/request.ts');

const nextConfig: NextConfig = {
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
    'lucide-react'
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