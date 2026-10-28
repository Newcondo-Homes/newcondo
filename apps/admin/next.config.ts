// apps/admin/next.config.ts
import type { NextConfig } from "next";
import { PrismaPlugin } from "@prisma/nextjs-monorepo-workaround-plugin";

const config: NextConfig = {
  transpilePackages: ["@newcondo/auth", "@newcondo/backend-shared"],
  // experimental: { optimizePackageImports: ["lucide-react"] },
  webpack: (cfg, { isServer }) => { if (isServer) cfg.plugins = [...cfg.plugins, new PrismaPlugin()]; return cfg; },
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "no-referrer" }, // invite tokens live in the URL path
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "X-Robots-Tag", value: "noindex, nofollow" },
      ],
    }];
  },
};
export default config;
