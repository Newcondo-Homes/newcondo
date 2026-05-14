import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
      client: 'src/client.ts',                              // ← added
      'middleware/languageDetection': 'src/middleware/languageDetection.ts', // ← added
    },
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    outDir: 'dist',
    external: ['react', 'react-dom', 'next'],
  },
  {
    entry: {
      'hooks/useCurrency': 'src/hooks/useCurrency.ts',
      'hooks/useLocale': 'src/hooks/useLocale.ts',
      'hooks/useTranslation': 'src/hooks/useTranslation.ts',
    },
    format: ['cjs', 'esm'],
    dts: true,
    outDir: 'dist',
    external: ['react', 'react-dom', 'next', 'react-i18next', 'i18next'],
    banner: {
      js: "'use client';",
    },
  },
]);