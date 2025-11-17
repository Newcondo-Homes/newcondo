import type { NextConfig } from "next";
const { PrismaPlugin } = require('@prisma/nextjs-monorepo-workaround-plugin')

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ['@newcondo/db'],
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL
  },
  // Ensure environment variables are available at build time
  serverRuntimeConfig: {
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins = [...config.plugins, new PrismaPlugin()]
    }
    
    return config
  },
};

export default nextConfig;












// const withNextIntl = require('next-intl/plugin')();

// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   reactStrictMode: true,
//   transpilePackages: ['@newcondo/ui', '@newcondo/db', '@newcondo/auth'],
  
//   // Image optimization
//   images: {
//     domains: [
//       'utfs.io', // UploadThing
//       'res.cloudinary.com', // Cloudinary
//       'maps.googleapis.com', // Google Maps
//     ],
//     formats: ['image/avif', 'image/webp'],
//   },

//   // Environment variables validation
//   env: {
//     NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
//     NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,
//     NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
//   },

//   // Webpack configuration
//   webpack: (config, { isServer }) => {
//     if (!isServer) {
//       // Don't resolve 'fs' module on the client
//       config.resolve.fallback = {
//         ...config.resolve.fallback,
//         fs: false,
//         net: false,
//         tls: false,
//       };
//     }
//     return config;
//   },

//   // Experimental features
//   experimental: {
//     serverActions: {
//       bodySizeLimit: '10mb',
//     },
//   },

//   // Headers for CORS and security
//   async headers() {
//     return [
//       {
//         source: '/:path*',
//         headers: [
//           {
//             key: 'X-Frame-Options',
//             value: 'SAMEORIGIN',
//           },
//           {
//             key: 'X-Content-Type-Options',
//             value: 'nosniff',
//           },
//           {
//             key: 'Referrer-Policy',
//             value: 'strict-origin-when-cross-origin',
//           },
//         ],
//       },
//     ];
//   },

//   // Redirects
//   async redirects() {
//     return [
//       {
//         source: '/',
//         destination: '/en',
//         permanent: false,
//       },
//     ];
//   },
// };

// module.exports = withNextIntl(nextConfig);