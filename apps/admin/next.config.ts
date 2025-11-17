import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;


// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   reactStrictMode: true,
  
//   // Transpile shared packages from monorepo
//   transpilePackages: ['@newcondo/ui', '@newcondo/auth', '@newcondo/db'],
  
//   // Image optimization
//   images: {
//     domains: [
//       'uploadthing.com',
//       'utfs.io',
//       'res.cloudinary.com',
//       's3.amazonaws.com',
//       'lh3.googleusercontent.com',
//     ],
//     formats: ['image/avif', 'image/webp'],
//   },
  
//   // Environment variables available to the browser
//   env: {
//     NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
//     NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
//   },
  
//   // Webpack configuration
//   webpack: (config, { isServer }) => {
//     if (!isServer) {
//       // Don't resolve 'fs' module on the client to prevent build errors
//       config.resolve.fallback = {
//         ...config.resolve.fallback,
//         fs: false,
//         net: false,
//         tls: false,
//       };
//     }
//     return config;
//   },
  
//   // Headers for security
//   async headers() {
//     return [
//       {
//         source: '/(.*)',
//         headers: [
//           {
//             key: 'X-Frame-Options',
//             value: 'DENY',
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
//         destination: '/dashboard',
//         permanent: false,
//       },
//     ];
//   },
  
//   // Output configuration for production
//   output: 'standalone',
  
//   // Experimental features
//   experimental: {
//     serverActions: {
//       bodySizeLimit: '2mb',
//     },
//   },
// };

// module.exports = nextConfig;










// const createNextIntlPlugin = require('next-intl/plugin');

// const withNextIntl = createNextIntlPlugin('./i18n.ts');

// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   // Enable React strict mode for better development experience
//   reactStrictMode: true,

//   // Image optimization configuration
//   images: {
//     domains: [
//       'res.cloudinary.com', // Cloudinary for property images
//       'utfs.io', // UploadThing
//       'lh3.googleusercontent.com', // Google profile images
//     ],
//     formats: ['image/avif', 'image/webp'],
//   },

//   // Environment variables to expose to the browser
//   env: {
//     NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
//     NEXT_PUBLIC_ADMIN_SERVICE_URL: process.env.NEXT_PUBLIC_ADMIN_SERVICE_URL,
//   },

//   // Internationalization
//   i18n: {
//     locales: ['en', 'fr', 'pcm'],
//     defaultLocale: 'en',
//   },

//   // Webpack configuration
//   webpack: (config, { isServer }) => {
//     // Fix for canvas package issues
//     if (!isServer) {
//       config.resolve.fallback = {
//         ...config.resolve.fallback,
//         canvas: false,
//       };
//     }
//     return config;
//   },

//   // Experimental features
//   experimental: {
//     // Enable server actions
//     serverActions: {
//       bodySizeLimit: '10mb',
//     },
//   },

//   // Security headers
//   async headers() {
//     return [
//       {
//         source: '/:path*',
//         headers: [
//           {
//             key: 'X-Frame-Options',
//             value: 'DENY',
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
//         destination: '/en/dashboard',
//         permanent: false,
//       },
//     ];
//   },
// };

// module.exports = withNextIntl(nextConfig);