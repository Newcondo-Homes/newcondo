// apps/vendors/next.config.ts
import type { NextConfig } from "next";

const config: NextConfig = {
  // Same as apps/platform: @newcondo/auth ships TS source.
  transpilePackages: ["@newcondo/auth", "@newcondo/db"],
  // No @prisma/nextjs-monorepo-workaround-plugin. It only copies Prisma's
  // engine binary in webpack builds. Prisma 7 with @prisma/adapter-pg (what
  // packages/db uses) has no engine binary, and Next 16 builds with
  // Turbopack, which doesn't run a webpack() config.
  //
  // Not enabled, on purpose:
  //  - cacheComponents: the dashboard layout awaits auth() (cookies) before any
  //    <Suspense>, which Cache Components rejects ("uncached data accessed
  //    outside of <Suspense>"). apps/platform doesn't use it either.
  //  - turbopack.rules for CSS / @tailwindcss/turbopack: Tailwind 4 runs
  //    through postcss.config.mjs (@tailwindcss/postcss), same as platform.
  experimental: {
    optimizePackageImports: ["lucide-react"],
    // Client router cache: once a dashboard page has been prefetched or
    // visited, switching back to it within 5 min renders from memory, with no
    // server round trip. Data freshness is handled by TanStack Query.
    staleTimes: { dynamic: 300, static: 300 },
  },
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        // camera=self: the QR scanner on the verify screen
        { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(self)" },
      ],
    }];
  },
};
export default config;
