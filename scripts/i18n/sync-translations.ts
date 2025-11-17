#!/usr/bin/env ts-node

/**
 * Sync Translations Script
 * 
 * This script synchronizes translation files across all languages:
 * - Adds missing keys from base language to other languages
 * - Removes keys that no longer exist in base language
 * - Maintains consistent structure across all languages
 * - Preserves existing translations
 */

import * as fs from 'fs';
import * as path from 'path';

interface TranslationFile {
  [key: string]: string | TranslationFile;
}

interface SyncStats {
  language: string;
  added: number;
  removed: number;
  updated: number;
}

class TranslationSynchronizer {
  private localesDir = path.join(__dirname, '../../packages/i18n/src/locales');
  private baseLanguage = 'en';
  private stats: SyncStats[] = [];

  async sync(options: {
    dryRun?: boolean;
    removeUnused?: boolean;
  } = {}): Promise<void> {
    console.log('🔄 Synchronizing translations across languages...\n');

    const { dryRun = false, removeUnused = false } = options;

    // Get all languages
    const languages = this.getLanguages().filter(lang => lang !== this.baseLanguage);

    if (languages.length === 0) {
      console.log('⚠️  No additional languages found to sync');
      return;
    }

    console.log(`📚 Languages to sync: ${languages.join(', ')}`);
    console.log(`🔧 Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}\n`);

    // Get all namespaces from base language
    const namespaces = this.getNamespaces(this.baseLanguage);

    for (const namespace of namespaces) {
      console.log(`\n📝 Syncing namespace: ${namespace}`);
      
      // Load base language file
      const baseTranslations = this.loadTranslations(this.baseLanguage, namespace);

      if (!baseTranslations) {
        console.log(`  ⚠️  Base file not found, skipping...`);
        continue;
      }

      // Sync each language
      for (const language of languages) {
        await this.syncLanguage(
          language,
          namespace,
          baseTranslations,
          { dryRun, removeUnused }
        );
      }
    }

    // Print summary
    this.printSummary();
  }

  private getLanguages(): string[] {
    return fs
      .readdirSync(this.localesDir)
      .filter((lang) =>
        fs.statSync(path.join(this.localesDir, lang)).isDirectory()
      );
  }

  private getNamespaces(language: string): string[] {
    const langDir = path.join(this.localesDir, language);

    if (!fs.existsSync(langDir)) {
      return [];
    }

    return fs
      .readdirSync(langDir)
      .filter((file) => file.endsWith('.json'))
      .map((file) => path.basename(file, '.json'));
  }

  private loadTranslations(
    language: string,
    namespace: string
  ): TranslationFile | null {
    const filePath = path.join(this.localesDir, language, `${namespace}.json`);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (error) {
      console.error(`  ❌ Error loading ${language}/${namespace}.json:`, error);
      return null;
    }
  }

  private async syncLanguage(
    language: string,
    namespace: string,
    baseTranslations: TranslationFile,
    options: { dryRun: boolean; removeUnused: boolean }
  ): Promise<void> {
    console.log(`  🔄 Syncing ${language}/${namespace}.json`);

    // Load or create target language file
    let targetTranslations = this.loadTranslations(language, namespace) || {};

    const stats: SyncStats = {
      language,
      added: 0,
      removed: 0,
      updated: 0,
    };

    // Add missing keys
    this.addMissingKeys(
      baseTranslations,
      targetTranslations,
      language,
      stats,
      ''
    );

    // Remove unused keys (if enabled)
    if (options.removeUnused) {
      this.removeUnusedKeys(
        baseTranslations,
        targetTranslations,
        stats,
        ''
      );
    }

    // Save if not dry run
    if (!options.dryRun && (stats.added > 0 || stats.removed > 0)) {
      const filePath = path.join(this.localesDir, language, `${namespace}.json`);
      const sorted = this.sortKeys(targetTranslations);
      fs.writeFileSync(filePath, JSON.stringify(sorted, null, 2) + '\n', 'utf-8');
    }

    // Log stats
    if (stats.added > 0 || stats.removed > 0) {
      console.log(
        `    ➕ Added: ${stats.added} | ➖ Removed: ${stats.removed}`
      );
      this.stats.push(stats);
    } else {
      console.log(`    ✓ Already in sync`);
    }
  }

  private addMissingKeys(
    source: TranslationFile,
    target: TranslationFile,
    language: string,
    stats: SyncStats,
    keyPath: string
  ): void {
    for (const [key, value] of Object.entries(source)) {
      const fullKey = keyPath ? `${keyPath}.${key}` : key;

      if (typeof value === 'object' && value !== null) {
        // Nested object
        if (!target[key] || typeof target[key] !== 'object') {
          target[key] = {};
          stats.added++;
        }
        this.addMissingKeys(
          value as TranslationFile,
          target[key] as TranslationFile,
          language,
          stats,
          fullKey
        );
      } else if (typeof value === 'string') {
        // String value
        if (target[key] === undefined) {
          // Add placeholder for non-base languages
          target[key] = language === this.baseLanguage
            ? value
            : `[${language.toUpperCase()}] ${value}`;
          stats.added++;
        }
      }
    }
  }

  private removeUnusedKeys(
    source: TranslationFile,
    target: TranslationFile,
    stats: SyncStats,
    keyPath: string
  ): void {
    for (const [key, value] of Object.entries(target)) {
      const fullKey = keyPath ? `${keyPath}.${key}` : key;

      if (source[key] === undefined) {
        // Key doesn't exist in base language
        delete target[key];
        stats.removed++;
      } else if (
        typeof value === 'object' &&
        value !== null &&
        typeof source[key] === 'object'
      ) {
        // Recursively check nested objects
        this.removeUnusedKeys(
          source[key] as TranslationFile,
          value as TranslationFile,
          stats,
          fullKey
        );

        // Remove empty objects
        if (Object.keys(value).length === 0) {
          delete target[key];
          stats.removed++;
        }
      }
    }
  }

  private sortKeys(obj: TranslationFile): TranslationFile {
    const sorted: TranslationFile = {};
    const keys = Object.keys(obj).sort();

    for (const key of keys) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        sorted[key] = this.sortKeys(obj[key] as TranslationFile);
      } else {
        sorted[key] = obj[key];
      }
    }

    return sorted;
  }

  private printSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 Synchronization Summary');
    console.log('='.repeat(60));

    if (this.stats.length === 0) {
      console.log('\n✅ All languages are already in sync!\n');
      return;
    }

    const totalAdded = this.stats.reduce((sum, s) => sum + s.added, 0);
    const totalRemoved = this.stats.reduce((sum, s) => sum + s.removed, 0);

    console.log(`\nTotal changes:`);
    console.log(`  ➕ Added: ${totalAdded} keys`);
    console.log(`  ➖ Removed: ${totalRemoved} keys`);

    console.log('\nPer language:');
    for (const stat of this.stats) {
      console.log(
        `  ${stat.language}: +${stat.added} -${stat.removed}`
      );
    }

    console.log('\n' + '='.repeat(60) + '\n');
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run') || args.includes('-d'),
  removeUnused: args.includes('--remove-unused') || args.includes('-r'),
};

// Run the synchronizer
const synchronizer = new TranslationSynchronizer();
synchronizer.sync(options).catch((error) => {
  console.error('❌ Synchronization failed:', error);
  process.exit(1);
});