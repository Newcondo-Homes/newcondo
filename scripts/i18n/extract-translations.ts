#!/usr/bin/env ts-node

/**
 * Extract Translation Keys Script
 * 
 * This script scans the codebase for translation keys used in:
 * - useTranslation() calls
 * - t() function calls
 * - Trans components
 * 
 * It then updates the translation JSON files with any missing keys.
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface TranslationKey {
  key: string;
  namespace: string;
  file: string;
  line: number;
  context?: string;
}

interface TranslationFile {
  [key: string]: string | TranslationFile;
}

class TranslationExtractor {
  private keys: Set<TranslationKey> = new Set();
  private baseLanguage = 'en';
  private localesDir = path.join(__dirname, '../../packages/i18n/src/locales');
  private appsDir = [
    path.join(__dirname, '../../apps/platform'),
    path.join(__dirname, '../../apps/admin'),
  ];
  private backendDir = path.join(__dirname, '../../backend');

  // Regex patterns for finding translation keys
  private patterns = {
    // t('common:welcome')
    tFunction: /\bt\s*\(\s*['"`]([^'"`]+)['"`]/g,
    
    // useTranslation('common')
    useTranslation: /useTranslation\s*\(\s*['"`]([^'"`]+)['"`]/g,
    
    // i18nKey="common:welcome"
    i18nKey: /i18nKey\s*=\s*['"`]([^'"`]+)['"`]/g,
    
    // <Trans i18nKey="common:welcome">
    transComponent: /<Trans[^>]+i18nKey\s*=\s*['"`]([^'"`]+)['"`]/g,
  };

  async extract(): Promise<void> {
    console.log('🔍 Extracting translation keys...\n');

    // Scan frontend apps
    for (const appDir of this.appsDir) {
      if (fs.existsSync(appDir)) {
        await this.scanDirectory(appDir);
      }
    }

    // Scan backend for email/SMS templates
    if (fs.existsSync(this.backendDir)) {
      await this.scanDirectory(this.backendDir, ['email.ts', 'sms.ts']);
    }

    // Update translation files
    await this.updateTranslationFiles();

    console.log(`\n✅ Extraction complete!`);
    console.log(`   Found ${this.keys.size} unique translation keys`);
  }

  private async scanDirectory(
    dir: string,
    filePatterns: string[] = ['**/*.{ts,tsx,js,jsx}']
  ): Promise<void> {
    const files = await glob(filePatterns, {
      cwd: dir,
      ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
      absolute: true,
    });

    console.log(`📂 Scanning ${files.length} files in ${path.basename(dir)}...`);

    for (const file of files) {
      await this.scanFile(file);
    }
  }

  private async scanFile(filePath: string): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        this.extractKeysFromLine(line, filePath, index + 1);
      });
    } catch (error) {
      console.error(`❌ Error scanning ${filePath}:`, error);
    }
  }

  private extractKeysFromLine(
    line: string,
    file: string,
    lineNumber: number
  ): void {
    // Extract from t() function calls
    let match: RegExpExecArray | null;
    
    while ((match = this.patterns.tFunction.exec(line)) !== null) {
      this.addKey(match[1], file, lineNumber);
    }

    // Extract from Trans components
    this.patterns.transComponent.lastIndex = 0;
    while ((match = this.patterns.transComponent.exec(line)) !== null) {
      this.addKey(match[1], file, lineNumber);
    }

    // Extract from i18nKey props
    this.patterns.i18nKey.lastIndex = 0;
    while ((match = this.patterns.i18nKey.exec(line)) !== null) {
      this.addKey(match[1], file, lineNumber);
    }
  }

  private addKey(fullKey: string, file: string, line: number): void {
    // Parse namespace and key
    const [namespace, ...keyParts] = fullKey.split(':');
    const key = keyParts.length > 0 ? keyParts.join(':') : namespace;
    const ns = keyParts.length > 0 ? namespace : 'common';

    this.keys.add({
      key: fullKey,
      namespace: ns,
      file: path.relative(process.cwd(), file),
      line,
    });
  }

  private async updateTranslationFiles(): Promise<void> {
    console.log('\n📝 Updating translation files...');

    // Group keys by namespace
    const keysByNamespace: Map<string, string[]> = new Map();

    this.keys.forEach((keyObj) => {
      if (!keysByNamespace.has(keyObj.namespace)) {
        keysByNamespace.set(keyObj.namespace, []);
      }
      keysByNamespace.get(keyObj.namespace)!.push(keyObj.key);
    });

    // Get all supported languages
    const languages = fs
      .readdirSync(this.localesDir)
      .filter((lang) =>
        fs.statSync(path.join(this.localesDir, lang)).isDirectory()
      );

    for (const [namespace, keys] of keysByNamespace) {
      console.log(`\n  📚 Namespace: ${namespace}`);

      for (const language of languages) {
        const filePath = path.join(this.localesDir, language, `${namespace}.json`);

        // Create file if it doesn't exist
        if (!fs.existsSync(filePath)) {
          fs.writeFileSync(filePath, '{}', 'utf-8');
          console.log(`    ✨ Created ${language}/${namespace}.json`);
        }

        // Load existing translations
        const existingTranslations = JSON.parse(
          fs.readFileSync(filePath, 'utf-8')
        );

        // Add missing keys
        let added = 0;
        for (const fullKey of keys) {
          const keyPath = fullKey.split(':').slice(1).join('.') || fullKey;
          if (!this.hasNestedKey(existingTranslations, keyPath)) {
            this.setNestedKey(
              existingTranslations,
              keyPath,
              language === this.baseLanguage
                ? this.generatePlaceholder(keyPath)
                : `[${language.toUpperCase()}] ${this.generatePlaceholder(keyPath)}`
            );
            added++;
          }
        }

        if (added > 0) {
          // Sort keys alphabetically
          const sorted = this.sortKeys(existingTranslations);

          // Write back to file
          fs.writeFileSync(filePath, JSON.stringify(sorted, null, 2) + '\n', 'utf-8');
          console.log(`    ➕ Added ${added} keys to ${language}/${namespace}.json`);
        } else {
          console.log(`    ✓ ${language}/${namespace}.json up to date`);
        }
      }
    }
  }

  private hasNestedKey(obj: TranslationFile, path: string): boolean {
    const keys = path.split('.');
    let current: any = obj;

    for (const key of keys) {
      if (current[key] === undefined) {
        return false;
      }
      current = current[key];
    }

    return true;
  }

  private setNestedKey(obj: TranslationFile, path: string, value: string): void {
    const keys = path.split('.');
    let current: any = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (current[key] === undefined) {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  }

  private generatePlaceholder(keyPath: string): string {
    // Generate a human-readable placeholder from the key
    const lastKey = keyPath.split('.').pop() || keyPath;
    return lastKey
      .replace(/([A-Z])/g, ' $1')
      .replace(/[_-]/g, ' ')
      .trim()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
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
}

// Run the extractor
const extractor = new TranslationExtractor();
extractor.extract().catch((error) => {
  console.error('❌ Extraction failed:', error);
  process.exit(1);
});