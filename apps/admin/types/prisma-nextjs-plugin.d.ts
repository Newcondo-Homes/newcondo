// apps/admin/types/prisma-nextjs-plugin.d.ts
// @prisma/nextjs-monorepo-workaround-plugin ships plain JS with no types, so
// `strict` TypeScript fails with TS7016 in next.config.ts. This declares the one
// export we use. Self-contained (no `webpack` type import) so it works whether or
// not @types for webpack are installed.
// Picked up automatically by tsconfig "include": ["**/*.ts"].
// Copy the same file into apps/vendors/types/ if its build hits the same error.
declare module "@prisma/nextjs-monorepo-workaround-plugin" {
  /** Copies the generated Prisma query engine next to the server bundle in monorepos. */
  export class PrismaPlugin {
    constructor(options?: Record<string, unknown>);
    apply(compiler: unknown): void;
  }
}
