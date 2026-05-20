interface TemplateVariables {
    [key: string]: string | number | boolean | undefined;
}
export declare class TemplateRenderer {
    private templateCache;
    private templatesDir;
    constructor();
    /**
     * Render email template with variables
     */
    renderEmailTemplate(templateName: string, locale: string, variables: TemplateVariables): Promise<string>;
    /**
     * Load and compile template
     */
    private loadTemplate;
    /**
     * Register Handlebars helpers
     */
    private registerHelpers;
    /**
     * Render template from string
     */
    renderFromString(templateString: string, variables: TemplateVariables): string;
    /**
     * Clear template cache
     */
    clearCache(): void;
    /**
     * Preload commonly used templates
     */
    preloadTemplates(locales: string[], templateNames: string[]): Promise<void>;
    /**
     * Validate template variables
     */
    validateTemplate(templateName: string, locale: string, requiredVars: string[]): boolean;
    /**
     * Get all available templates for a locale
     */
    getAvailableTemplates(locale: string): string[];
    /**
     * Check if template exists
     */
    templateExists(templateName: string, locale: string): boolean;
}
export declare const templateRenderer: TemplateRenderer;
export {};
//# sourceMappingURL=templateRenderer.d.ts.map