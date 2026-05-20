"use strict";
// backend/notification-service/src/utils/templateRenderer.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.templateRenderer = exports.TemplateRenderer = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const handlebars_1 = __importDefault(require("handlebars"));
class TemplateRenderer {
    constructor() {
        this.templateCache = new Map();
        this.templatesDir = path_1.default.join(__dirname, '..', 'templates');
        this.registerHelpers();
    }
    /**
     * Render email template with variables
     */
    async renderEmailTemplate(templateName, locale, variables) {
        const template = await this.loadTemplate(templateName, locale);
        return template(variables);
    }
    /**
     * Load and compile template
     */
    async loadTemplate(templateName, locale) {
        const cacheKey = `${locale}-${templateName}`;
        // Return cached template if available
        if (this.templateCache.has(cacheKey)) {
            return this.templateCache.get(cacheKey);
        }
        // Load template file
        const templatePath = path_1.default.join(this.templatesDir, locale, `${templateName}.html`);
        // Check if template exists, fallback to English if not
        let finalPath = templatePath;
        if (!fs_1.default.existsSync(templatePath)) {
            console.warn(`Template not found: ${templatePath}, falling back to English`);
            finalPath = path_1.default.join(this.templatesDir, 'en', `${templateName}.html`);
        }
        if (!fs_1.default.existsSync(finalPath)) {
            throw new Error(`Template not found: ${templateName} for locale: ${locale}`);
        }
        const templateSource = fs_1.default.readFileSync(finalPath, 'utf-8');
        const compiledTemplate = handlebars_1.default.compile(templateSource);
        // Cache the compiled template
        this.templateCache.set(cacheKey, compiledTemplate);
        return compiledTemplate;
    }
    /**
     * Register Handlebars helpers
     */
    registerHelpers() {
        // Format date helper
        handlebars_1.default.registerHelper('formatDate', (date, format) => {
            const d = typeof date === 'string' ? new Date(date) : date;
            if (format === 'short') {
                return d.toLocaleDateString();
            }
            else if (format === 'long') {
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
        handlebars_1.default.registerHelper('formatCurrency', (amount, currency = 'NGN') => {
            const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
            const symbols = {
                NGN: '₦',
                USD: '$',
                EUR: '€',
                GBP: '£'
            };
            const symbol = symbols[currency] || currency;
            return `${symbol}${numAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
        });
        // Uppercase helper
        handlebars_1.default.registerHelper('uppercase', (text) => {
            return text ? text.toUpperCase() : '';
        });
        // Lowercase helper
        handlebars_1.default.registerHelper('lowercase', (text) => {
            return text ? text.toLowerCase() : '';
        });
        // Truncate text helper
        handlebars_1.default.registerHelper('truncate', (text, length) => {
            if (!text)
                return '';
            if (text.length <= length)
                return text;
            return text.substring(0, length) + '...';
        });
        // Conditional helper
        handlebars_1.default.registerHelper('ifEquals', function (arg1, arg2, options) {
            return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
        });
        // Current year helper
        handlebars_1.default.registerHelper('currentYear', () => {
            return new Date().getFullYear();
        });
        // Format phone number helper
        handlebars_1.default.registerHelper('formatPhone', (phone) => {
            if (!phone)
                return '';
            // Format: +234 XXX XXX XXXX
            const cleaned = phone.replace(/\D/g, '');
            if (cleaned.length === 10) {
                return `+234 ${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
            }
            return phone;
        });
        // Format time helper
        handlebars_1.default.registerHelper('formatTime', (date) => {
            const d = typeof date === 'string' ? new Date(date) : date;
            return d.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit'
            });
        });
        // URL encode helper
        handlebars_1.default.registerHelper('urlEncode', (text) => {
            return encodeURIComponent(text);
        });
        // Calculate days remaining helper
        handlebars_1.default.registerHelper('daysRemaining', (targetDate) => {
            const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
            const now = new Date();
            const diffTime = target.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays;
        });
        // Pluralize helper
        handlebars_1.default.registerHelper('pluralize', (count, singular, plural) => {
            return count === 1 ? singular : plural;
        });
    }
    /**
     * Render template from string
     */
    renderFromString(templateString, variables) {
        const template = handlebars_1.default.compile(templateString);
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
    async preloadTemplates(locales, templateNames) {
        const promises = [];
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
    validateTemplate(templateName, locale, requiredVars) {
        try {
            const templatePath = path_1.default.join(this.templatesDir, locale, `${templateName}.html`);
            const templateSource = fs_1.default.readFileSync(templatePath, 'utf-8');
            for (const varName of requiredVars) {
                const regex = new RegExp(`{{${varName}}}`, 'g');
                if (!regex.test(templateSource)) {
                    console.warn(`Variable {{${varName}}} not found in template ${templateName}`);
                    return false;
                }
            }
            return true;
        }
        catch (error) {
            console.error(`Failed to validate template: ${error}`);
            return false;
        }
    }
    /**
     * Get all available templates for a locale
     */
    getAvailableTemplates(locale) {
        const localePath = path_1.default.join(this.templatesDir, locale);
        if (!fs_1.default.existsSync(localePath)) {
            return [];
        }
        return fs_1.default.readdirSync(localePath)
            .filter(file => file.endsWith('.html'))
            .map(file => file.replace('.html', ''));
    }
    /**
     * Check if template exists
     */
    templateExists(templateName, locale) {
        const templatePath = path_1.default.join(this.templatesDir, locale, `${templateName}.html`);
        return fs_1.default.existsSync(templatePath);
    }
}
exports.TemplateRenderer = TemplateRenderer;
exports.templateRenderer = new TemplateRenderer();
// Preload common templates on startup
(async () => {
    try {
        await exports.templateRenderer.preloadTemplates(['en', 'fr', 'pcm'], [
            'verification',
            'payment-confirmation',
            'marking-assignment',
            'property-approved'
        ]);
    }
    catch (error) {
        console.error('Failed to preload templates:', error);
    }
})();
//# sourceMappingURL=templateRenderer.js.map