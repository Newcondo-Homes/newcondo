#!/usr/bin/env ts-node

/**
 * Validate Translations Script
 * 
 * This script validates translation files for:
 * - Missing keys across languages
 * - Invalid JSON syntax
 * - Placeholder mismatches
 * - Pluralization issues
 * - Unused translation keys
 * - Empty translations
 */

import * as fs from 'fs';
import * as path from 'path';
import * as chalk from 'chalk';

interface ValidationError {
  type: 'error' | 'warning' | 'info';
  language: string;
  namespace: string;
  key?: string;
  message: string;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  info: ValidationError[];
  stats: {
    totalKeys: number;
    translatedKeys: number;
    missingKeys: number;
    emptyValues: number;
  };
}

class TranslationValidator {
  private localesDir = path.join(__dirname, '../../packages/i18n/src/locales');
  private baseLanguage = 'en';
  private errors: ValidationError[] = [];
  private warnings: ValidationError[] = [];
  private info: ValidationError[] = [];

  async validate(options: {
    checkUnused?: boolean;
    checkEmpty?: boolean;
    strictMode?: boolean;
  } = {}): Promise<ValidationResult> {
    console.log(chalk.blue('🔍 Validating translations...\n'));

    // Get all supported languages
    const languages = this.getLanguages();

    if (languages.length === 0) {
      this.addError('error', '', '', undefined, 'No language directories found');
      return this.buildResult();
    }

    console.log(chalk.cyan(`Found languages: ${languages.join(', ')}\n`));

    // Validate each language
    for (const language of languages) {
      await this.validateLanguage(language);
    }

    // Check for missing translations across languages
    await this.checkMissingTranslations(languages);

    // Check for placeholder consistency
    await this.checkPlaceholders(languages);

    // Check pluralization
    await this.checkPluralization(languages);

    // Check for empty values
    if (options.checkEmpty) {
      await this.checkEmptyValues(languages);
    }

    // Check for unused keys
    if (options.checkUnused) {
      await this.checkUnusedKeys();
    }

    return this.buildResult();
  }

  private getLanguages(): string[] {
    return fs
      .readdirSync(this.localesDir)
      .filter((lang) =>
        fs.statSync(path.join(this.localesDir, lang)).isDirectory()
      );
  }

  private async validateLanguage(language: string): Promise<void> {
    console.log(chalk.yellow(`📋 Validating ${language}...`));

    const langDir = path.join(this.localesDir, language);
    const files = fs
      .readdirSync(langDir)
      .filter((file) => file.endsWith('.json'));

    for (const file of files) {
      const namespace = path.basename(file, '.json');
      const filePath = path.join(langDir, file);

      try {
        // Check JSON validity
        const content = fs.readFileSync(filePath, 'utf-8');
        const translations = JSON.parse(content);

        // Validate structure
        this.validateStructure(translations, language, namespace);

        console.log(chalk.green(`  ✓ ${namespace}.json`));
      } catch (error) {
        if (error instanceof SyntaxError) {
          this.addError(
            'error',
            language,
            namespace,
            undefined,
            `Invalid JSON syntax: ${error.message}`
          );
          console.log(chalk.red(`  ✗ ${namespace}.json - Invalid JSON`));
        } else {
          this.addError(
            'error',
            language,
            namespace,
            undefined,
            `Error reading file: ${error}`
          );
        }
      }
    }
  }

  private validateStructure(
    obj: any,
    language: string,
    namespace: string,
    keyPath: string = ''
  ): void {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = keyPath ? `${keyPath}.${key}` : key;

      if (typeof value === 'object' && value !== null) {
        // Recursively validate nested objects
        this.validateStructure(value, language, namespace, fullKey);
      } else if (typeof value === 'string') {
        // Validate string translations
        if (value.trim() === '') {
          this.addError(
            'warning',
            language,
            namespace,
            fullKey,
            'Empty translation value'
          );
        }

        // Check for untranslated placeholders (e.g., [EN] or [FR])
        if (language !== this.baseLanguage && /^\[[\w]+\]/.test(value)) {
          this.addError(
            'warning',
            language,
            namespace,
            fullKey,
            'Translation appears to be a placeholder'
          );
        }
      } else {
        this.addError(
          'error',
          language,
          namespace,
          fullKey,
          `Invalid value type: ${typeof value}`
        );
      }
    }
  }

  private async checkMissingTranslations(languages: string[]): Promise<void> {
    console.log(chalk.yellow('\n📊 Checking for missing translations...'));

    const baseTranslations = this.getAllKeys(this.baseLanguage);

    for (const language of languages) {
      if (language === this.baseLanguage) continue;

      const langTranslations = this.getAllKeys(language);
      const missing: string[] = [];

      for (const [namespace, keys] of baseTranslations) {
        const langKeys = langTranslations.get(namespace) || new Set();

        for (const key of keys) {
          if (!langKeys.has(key)) {
            missing.push(`${namespace}:${key}`);
            this.addError(
              'error',
              language,
              namespace,
              key,
              'Missing translation'
            );
          }
        }
      }

      if (missing.length > 0) {
        console.log(
          chalk.red(`  ✗ ${language}: ${missing.length} missing translations`)
        );
      } else {
        console.log(chalk.green(`  ✓ ${language}: All translations present`));
      }
    }
  }

  private getAllKeys(language: string): Map<string, Set<string>> {
    const keys = new Map<string, Set<string>>();
    const langDir = path.join(this.localesDir, language);

    if (!fs.existsSync(langDir)) {
      return keys;
    }

    const files = fs
      .readdirSync(langDir)
      .filter((file) => file.endsWith('.json'));

    for (const file of files) {
      const namespace = path.basename(file, '.json');
      const filePath = path.join(langDir, file);

      try {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const namespaceKeys = new Set<string>();
        this.collectKeys(content, '', namespaceKeys);
        keys.set(namespace, namespaceKeys);
      } catch (error) {
        // Error already logged in validateLanguage
      }
    }

    return keys;
  }

  private collectKeys(
    obj: any,
    prefix: string,
    keys: Set<string>
  ): void {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (typeof value === 'object' && value !== null) {
        this.collectKeys(value, fullKey, keys);
      } else {
        keys.add(fullKey);
      }
    }
  }

  private async checkPlaceholders(languages: string[]): Promise<void> {
    console.log(chalk.yellow('\n🔤 Checking placeholder consistency...'));

    const baseTranslations = this.getTranslations(this.baseLanguage);

    for (const language of languages) {
      if (language === this.baseLanguage) continue;

      const langTranslations = this.getTranslations(language);
      let inconsistencies = 0;

      for (const [namespace, baseKeys] of baseTranslations) {
        const langKeys = langTranslations.get(namespace);
        if (!langKeys) continue;

        for (const [key, baseValue] of baseKeys) {
          const langValue = langKeys.get(key);
          if (!langValue) continue;

          const basePlaceholders = this.extractPlaceholders(baseValue);
          const langPlaceholders = this.extractPlaceholders(langValue);

          if (!this.arraysEqual(basePlaceholders, langPlaceholders)) {
            inconsistencies++;
            this.addError(
              'error',
              language,
              namespace,
              key,
              `Placeholder mismatch. Expected: ${basePlaceholders.join(', ')} | Found: ${langPlaceholders.join(', ')}`
            );
          }
        }
      }

      if (inconsistencies > 0) {
        console.log(
          chalk.red(
            `  ✗ ${language}: ${inconsistencies} placeholder inconsistencies`
          )
        );
      } else {
        console.log(chalk.green(`  ✓ ${language}: Placeholders consistent`));
      }
    }
  }

  private extractPlaceholders(text: string): string[] {
    const matches = text.match(/\{\{([^}]+)\}\}/g) || [];
    return matches.map((m) => m.replace(/[{}]/g, '').trim()).sort();
  }

  private arraysEqual(arr1: string[], arr2: string[]): boolean {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((val, idx) => val === arr2[idx]);
  }

  private async checkPluralization(languages: string[]): Promise<void> {
    console.log(chalk.yellow('\n🔢 Checking pluralization rules...'));

    const pluralSuffixes = ['_zero', '_one', '_two', '_few', '_many', '_other'];

    for (const language of languages) {
      const translations = this.getTranslations(language);
      let pluralIssues = 0;

      for (const [namespace, keys] of translations) {
        const pluralKeys = new Map<string, Set<string>>();

        // Group plural keys
        for (const key of keys.keys()) {
          const baseName = key.replace(/_(?:zero|one|two|few|many|other)$/, '');
          if (key !== baseName) {
            if (!pluralKeys.has(baseName)) {
              pluralKeys.set(baseName, new Set());
            }
            pluralKeys.get(baseName)!.add(key);
          }
        }

        // Check for missing plural forms
        for (const [baseName, forms] of pluralKeys) {
          // At minimum, should have _one and _other
          if (!forms.has(`${baseName}_one`) || !forms.has(`${baseName}_other`)) {
            pluralIssues++;
            this.addError(
              'warning',
              language,
              namespace,
              baseName,
              'Incomplete pluralization (missing _one or _other)'
            );
          }
        }
      }

      if (pluralIssues > 0) {
        console.log(
          chalk.yellow(`  ⚠ ${language}: ${pluralIssues} pluralization issues`)
        );
      } else {
        console.log(chalk.green(`  ✓ ${language}: Pluralization OK`));
      }
    }
  }

  private async checkEmptyValues(languages: string[]): Promise<void> {
    console.log(chalk.yellow('\n📭 Checking for empty values...'));

    for (const language of languages) {
      const translations = this.getTranslations(language);
      let emptyCount = 0;

      for (const [namespace, keys] of translations) {
        for (const [key, value] of keys) {
          if (value.trim() === '') {
            emptyCount++;
            this.addError(
              'warning',
              language,
              namespace,
              key,
              'Empty translation value'
            );
          }
        }
      }

      if (emptyCount > 0) {
        console.log(chalk.yellow(`  ⚠ ${language}: ${emptyCount} empty values`));
      } else {
        console.log(chalk.green(`  ✓ ${language}: No empty values`));
      }
    }
  }

  private async checkUnusedKeys(): Promise<void> {
    console.log(chalk.yellow('\n🗑️  Checking for unused keys...'));
    // This would require scanning the codebase, similar to extract-translations
    // For now, just log info
    this.addError(
      'info',
      '',
      '',
      undefined,
      'Unused key detection requires full codebase scan (use extract-translations script)'
    );
  }

  private getTranslations(language: string): Map<string, Map<string, string>> {
    const translations = new Map<string, Map<string, string>>();
    const langDir = path.join(this.localesDir, language);

    if (!fs.existsSync(langDir)) {
      return translations;
    }

    const files = fs
      .readdirSync(langDir)
      .filter((file) => file.endsWith('.json'));

    for (const file of files) {
      const namespace = path.basename(file, '.json');
      const filePath = path.join(langDir, file);

      try {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const keyMap = new Map<string, string>();
        this.flattenTranslations(content, '', keyMap);
        translations.set(namespace, keyMap);
      } catch (error) {
        // Error already logged
      }
    }

    return translations;
  }

  private flattenTranslations(
    obj: any,
    prefix: string,
    map: Map<string, string>
  ): void {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (typeof value === 'object' && value !== null) {
        this.flattenTranslations(value, fullKey, map);
      } else if (typeof value === 'string') {
        map.set(fullKey, value);
      }
    }
  }

  private addError(
    type: 'error' | 'warning' | 'info',
    language: string,
    namespace: string,
    key: string | undefined,
    message: string
  ): void {
    const error: ValidationError = {
      type,
      language,
      namespace,
      key,
      message,
    };

    if (type === 'error') {
      this.errors.push(error);
    } else if (type === 'warning') {
      this.warnings.push(error);
    } else {
      this.info.push(error);
    }
  }

  private buildResult(): ValidationResult {
    const totalKeys = this.getAllKeys(this.baseLanguage)
      .values()
      .reduce((acc, keys) => acc + keys.size, 0);

    const missingKeys = this.errors.filter((e) => e.message === 'Missing translation').length;
    const emptyValues = this.warnings.filter((e) => e.message.includes('Empty')).length;

    console.log('\n' + chalk.blue('═'.repeat(60)));
    console.log(chalk.blue.bold('📊 Validation Summary'));
    console.log(chalk.blue('═'.repeat(60)));

    console.log(chalk.white(`\nTotal keys: ${totalKeys}`));
    console.log(chalk.red(`Errors: ${this.errors.length}`));
    console.log(chalk.yellow(`Warnings: ${this.warnings.length}`));
    console.log(chalk.cyan(`Info: ${this.info.length}`));

    if (this.errors.length > 0) {
      console.log(chalk.red('\n❌ Errors:'));
      this.errors.slice(0, 10).forEach((error) => {
        console.log(
          chalk.red(
            `  • ${error.language}/${error.namespace}${error.key ? `:${error.key}` : ''} - ${error.message}`
          )
        );
      });
      if (this.errors.length > 10) {
        console.log(chalk.red(`  ... and ${this.errors.length - 10} more`));
      }
    }

    if (this.warnings.length > 0) {
      console.log(chalk.yellow('\n⚠️  Warnings:'));
      this.warnings.slice(0, 10).forEach((warning) => {
        console.log(
          chalk.yellow(
            `  • ${warning.language}/${warning.namespace}${warning.key ? `:${warning.key}` : ''} - ${warning.message}`
          )
        );
      });
      if (this.warnings.length > 10) {
        console.log(
          chalk.yellow(`  ... and ${this.warnings.length - 10} more`)
        );
      }
    }

    const valid = this.errors.length === 0;
    console.log('\n' + chalk.blue('═'.repeat(60)));
    console.log(
      valid
        ? chalk.green.bold('✅ Validation passed!')
        : chalk.red.bold('❌ Validation failed!')
    );
    console.log(chalk.blue('═'.repeat(60)) + '\n');

    return {
      valid,
      errors: this.errors,
      warnings: this.warnings,
      info: this.info,
      stats: {
        totalKeys,
        translatedKeys: totalKeys - missingKeys,
        missingKeys,
        emptyValues,
      },
    };
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  checkUnused: args.includes('--unused'),
  checkEmpty: args.includes('--empty') || args.includes('--strict'),
  strictMode: args.includes('--strict'),
};

// Run the validator
const validator = new TranslationValidator();
validator.validate(options).then((result) => {
  if (!result.valid) {
    process.exit(1);
  }
}).catch((error) => {
  console.error(chalk.red('❌ Validation failed:'), error);
  process.exit(1);
});