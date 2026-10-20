import type { NextConfig } from "next";
import { PrismaPlugin } from "@prisma/nextjs-monorepo-workaround-plugin";

const nextConfig: NextConfig = {
  /* config options here */
  // @newcondo/auth ships TS source; backend-shared constants are imported via subpaths only.
  transpilePackages: ["@newcondo/auth", "@newcondo/backend-shared"],
  experimental: { optimizePackageImports: ["lucide-react"] },
  webpack: (cfg, { isServer }) => { if (isServer) cfg.plugins = [...cfg.plugins, new PrismaPlugin()]; return cfg; },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        // camera=self — the QR scanner on the verify screen
        { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(self)" },
      ],
    }];
  },
};

export default nextConfig;
