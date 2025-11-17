// backend/notification-service/src/utils/templateRenderer.ts

import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';

interface TemplateVariables {
  [key: string]: string | number | boolean | undefined;
}

export class TemplateRenderer {
  private templateCache: Map<string, HandlebarsTemplateDelegate> = new Map();
  private templatesDir: string;

  constructor() {
    this.templatesDir = path.join(__dirname, '..', 'templates');
    this.registerHelpers();
  }

  /**
   * Render email template with variables
   */
  async renderEmailTemplate(
    templateName: string,
    locale: string,
    variables: TemplateVariables
  ): Promise<string> {
    const template = await this.loadTemplate(templateName, locale);
    return template(variables);
  }

  /**
   * Load and compile template
   */
  private async loadTemplate(
    templateName: string,
    locale: string
  ): Promise<HandlebarsTemplateDelegate> {
    const cacheKey = `${locale}-${templateName}`;
    
    // Return cached template if available
    if (this.templateCache.has(cacheKey)) {
      return this.templateCache.get(cacheKey)!;
    }

    // Load template file
    const templatePath = path.join(
      this.templatesDir,
      locale,
      `${templateName}.html`
    );

    // Check if template exists, fallback to English if not
    let finalPath = templatePath;
    if (!fs.existsSync(templatePath)) {
      console.warn(`Template not found: ${templatePath}, falling back to English`);
      finalPath = path.join(this.templatesDir, 'en', `${templateName}.html`);
    }

    if (!fs.existsSync(finalPath)) {
      throw new Error(`Template not found: ${templateName} for locale: ${locale}`);
    }

    const templateSource = fs.readFileSync(finalPath, 'utf-8');
    const compiledTemplate = Handlebars.compile(templateSource);
    
    // Cache the compiled template
    this.templateCache.set(cacheKey, compiledTemplate);
    
    return compiledTemplate;
  }

  /**
   * Register Handlebars helpers
   */
  private registerHelpers() {
    // Format date helper
    Handlebars.registerHelper('formatDate', (date: string | Date, format: string) => {
      const d = typeof date === 'string' ? new Date(date) : date;
      
      if (format === 'short') {
        return d.toLocaleDateString();
      } else if (format === 'long') {
        return d.toLocaleDateString(undefined, { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
      
      return d.toISOString();
    });

    // Format currency helper
    Handlebars.registerHelper('formatCurrency', (amount: number | string, currency: string = 'NGN') => {
      const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      
      const symbols: Record<string, string> = {
        NGN: '₦',
        USD: '$',
        EUR: '€',
        GBP: '£'
      };

      const symbol = symbols[currency] || currency;
      return `${symbol}${numAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    });

    // Uppercase helper
    Handlebars.registerHelper('uppercase', (text: string) => {
      return text ? text.toUpperCase() : '';
    });

    // Lowercase helper
    Handlebars.registerHelper('lowercase', (text: string) => {
      return text ? text.toLowerCase() : '';
    });

    // Truncate text helper
    Handlebars.registerHelper('truncate', (text: string, length: number) => {
      if (!text) return '';
      if (text.length <= length) return text;
      return text.substring(0, length) + '...';
    });

    // Conditional helper
    Handlebars.registerHelper('ifEquals', function(this: any, arg1: any, arg2: any, options: any) {
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    });

    // Current year helper
    Handlebars.registerHelper('currentYear', () => {
      return new Date().getFullYear();
    });

    // Format phone number helper
    Handlebars.registerHelper('formatPhone', (phone: string) => {
      if (!phone) return '';
      // Format: +234 XXX XXX XXXX
      const cleaned = phone.replace(/\D/g, '');
      if (cleaned.length === 10) {
        return `+234 ${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
      }
      return phone;
    });

    // Format time helper
    Handlebars.registerHelper('formatTime', (date: string | Date) => {
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toLocaleTimeString(undefined, { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    });

    // URL encode helper
    Handlebars.registerHelper('urlEncode', (text: string) => {
      return encodeURIComponent(text);
    });

    // Calculate days remaining helper
    Handlebars.registerHelper('daysRemaining', (targetDate: string | Date) => {
      const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
      const now = new Date();
      const diffTime = target.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    });

    // Pluralize helper
    Handlebars.registerHelper('pluralize', (count: number, singular: string, plural: string) => {
      return count === 1 ? singular : plural;
    });
  }

  /**
   * Render template from string
   */
  renderFromString(templateString: string, variables: TemplateVariables): string {
    const template = Handlebars.compile(templateString);
    return template(variables);
  }

  /**
   * Clear template cache
   */
  clearCache() {
    this.templateCache.clear();
  }

  /**
   * Preload commonly used templates
   */
  async preloadTemplates(locales: string[], templateNames: string[]) {
    const promises: Promise<any>[] = [];
    
    for (const locale of locales) {
      for (const templateName of templateNames) {
        promises.push(this.loadTemplate(templateName, locale));
      }
    }
    
    await Promise.all(promises);
    console.log(`Preloaded ${promises.length} templates`);
  }

  /**
   * Validate template variables
   */
  validateTemplate(templateName: string, locale: string, requiredVars: string[]): boolean {
    try {
      const templatePath = path.join(this.templatesDir, locale, `${templateName}.html`);
      const templateSource = fs.readFileSync(templatePath, 'utf-8');
      
      for (const varName of requiredVars) {
        const regex = new RegExp(`{{${varName}}}`, 'g');
        if (!regex.test(templateSource)) {
          console.warn(`Variable {{${varName}}} not found in template ${templateName}`);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error(`Failed to validate template: ${error}`);
      return false;
    }
  }

  /**
   * Get all available templates for a locale
   */
  getAvailableTemplates(locale: string): string[] {
    const localePath = path.join(this.templatesDir, locale);
    
    if (!fs.existsSync(localePath)) {
      return [];
    }
    
    return fs.readdirSync(localePath)
      .filter(file => file.endsWith('.html'))
      .map(file => file.replace('.html', ''));
  }

  /**
   * Check if template exists
   */
  templateExists(templateName: string, locale: string): boolean {
    const templatePath = path.join(this.templatesDir, locale, `${templateName}.html`);
    return fs.existsSync(templatePath);
  }
}

export const templateRenderer = new TemplateRenderer();

// Preload common templates on startup
(async () => {
  try {
    await templateRenderer.preloadTemplates(
      ['en', 'fr', 'pcm'],
      [
        'verification',
        'payment-confirmation',
        'marking-assignment',
        'property-approved'
      ]
    );
  } catch (error) {
    console.error('Failed to preload templates:', error);
  }
})();