// backend/admin-service/src/services/documentTemplateService.ts

import { PrismaClient } from '@newcondo/db';
import { z } from 'zod';

const prisma = new PrismaClient();

// Document template types
export interface DocumentTemplate {
  id: string;
  name: string;
  type: 'CONSENT' | 'UNDERTAKING' | 'OWNERSHIP_PROOF' | 'AGENT_PERMISSION' | 'TERMS_CONDITIONS' | 'PRIVACY_POLICY';
  category: 'LEGAL' | 'COMPLIANCE' | 'PROPERTY' | 'USER';
  content: string;
  variables: string[]; // Template variables like {{userName}}, {{propertyAddress}}
  version: number;
  isActive: boolean;
  requiresSignature: boolean;
  metadata?: Record<string, any>;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Template creation schema
const createTemplateSchema = z.object({
  name: z.string().min(3, 'Template name must be at least 3 characters'),
  type: z.enum(['CONSENT', 'UNDERTAKING', 'OWNERSHIP_PROOF', 'AGENT_PERMISSION', 'TERMS_CONDITIONS', 'PRIVACY_POLICY']),
  category: z.enum(['LEGAL', 'COMPLIANCE', 'PROPERTY', 'USER']),
  content: z.string().min(10, 'Template content is required'),
  variables: z.array(z.string()).optional().default([]),
  requiresSignature: z.boolean().default(false),
  metadata: z.record(z.any()).optional(),
});

// Template update schema
const updateTemplateSchema = createTemplateSchema.partial().omit(['type']);

export class DocumentTemplateService {
  /**
   * Create a new document template
   */
  async createTemplate(data: z.infer<typeof createTemplateSchema>, createdBy: string): Promise<DocumentTemplate> {
    const validatedData = createTemplateSchema.parse(data);
    
    // Extract variables from template content
    const extractedVariables = this.extractTemplateVariables(validatedData.content);
    const allVariables = [...new Set([...validatedData.variables, ...extractedVariables])];

    // Create template (This would be stored in a separate templates table in a real implementation)
    const template: DocumentTemplate = {
      id: `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: validatedData.name,
      type: validatedData.type,
      category: validatedData.category,
      content: validatedData.content,
      variables: allVariables,
      version: 1,
      isActive: true,
      requiresSignature: validatedData.requiresSignature,
      metadata: validatedData.metadata || {},
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // In a real implementation, save to database
    // await prisma.documentTemplate.create({ data: template });

    return template;
  }

  /**
   * Get all document templates
   */
  async getTemplates(filters?: {
    type?: string;
    category?: string;
    isActive?: boolean;
  }): Promise<DocumentTemplate[]> {
    // Mock implementation - would query database in real app
    const mockTemplates: DocumentTemplate[] = [
      {
        id: 'tpl_consent_001',
        name: 'Property Consent Document',
        type: 'CONSENT',
        category: 'PROPERTY',
        content: 'I, {{ownerName}}, hereby consent to {{agentName}} listing my property at {{propertyAddress}} for rental purposes.',
        variables: ['ownerName', 'agentName', 'propertyAddress'],
        version: 1,
        isActive: true,
        requiresSignature: true,
        metadata: { language: 'en' },
        createdBy: 'admin_001',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: 'tpl_undertaking_001',
        name: 'Agent Undertaking Document',
        type: 'UNDERTAKING',
        category: 'LEGAL',
        content: 'I, {{agentName}}, undertake to act in good faith and represent the property at {{propertyAddress}} accurately.',
        variables: ['agentName', 'propertyAddress'],
        version: 1,
        isActive: true,
        requiresSignature: true,
        metadata: { language: 'en' },
        createdBy: 'admin_001',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ];

    // Apply filters
    let filtered = mockTemplates;
    if (filters?.type) {
      filtered = filtered.filter(t => t.type === filters.type);
    }
    if (filters?.category) {
      filtered = filtered.filter(t => t.category === filters.category);
    }
    if (filters?.isActive !== undefined) {
      filtered = filtered.filter(t => t.isActive === filters.isActive);
    }

    return filtered;
  }

  /**
   * Get a specific template by ID
   */
  async getTemplateById(id: string): Promise<DocumentTemplate | null> {
    // Mock implementation
    const templates = await this.getTemplates();
    return templates.find(t => t.id === id) || null;
  }

  /**
   * Update a document template
   */
  async updateTemplate(
    id: string, 
    data: z.infer<typeof updateTemplateSchema>, 
    updatedBy: string
  ): Promise<DocumentTemplate | null> {
    const validatedData = updateTemplateSchema.parse(data);
    const existingTemplate = await this.getTemplateById(id);
    
    if (!existingTemplate) {
      return null;
    }

    // Extract variables if content is being updated
    let variables = existingTemplate.variables;
    if (validatedData.content) {
      const extractedVariables = this.extractTemplateVariables(validatedData.content);
      variables = [...new Set([...extractedVariables, ...(validatedData.variables || [])])];
    }

    const updatedTemplate: DocumentTemplate = {
      ...existingTemplate,
      ...validatedData,
      variables,
      version: existingTemplate.version + 1,
      updatedBy,
      updatedAt: new Date(),
    };

    // In real implementation, save to database
    // await prisma.documentTemplate.update({ where: { id }, data: updatedTemplate });

    return updatedTemplate;
  }

  /**
   * Deactivate a template
   */
  async deactivateTemplate(id: string, updatedBy: string): Promise<boolean> {
    const template = await this.getTemplateById(id);
    if (!template) {
      return false;
    }

    // In real implementation:
    // await prisma.documentTemplate.update({
    //   where: { id },
    //   data: { isActive: false, updatedBy, updatedAt: new Date() }
    // });

    return true;
  }

  /**
   * Generate document from template
   */
  async generateDocument(
    templateId: string, 
    variables: Record<string, string>
  ): Promise<{ content: string; requiresSignature: boolean } | null> {
    const template = await this.getTemplateById(templateId);
    if (!template || !template.isActive) {
      return null;
    }

    // Replace template variables with actual values
    let content = template.content;
    template.variables.forEach(variable => {
      const value = variables[variable] || `{{${variable}}}`;
      const regex = new RegExp(`{{${variable}}}`, 'g');
      content = content.replace(regex, value);
    });

    return {
      content,
      requiresSignature: template.requiresSignature,
    };
  }

  /**
   * Get default templates for specific scenarios
   */
  async getDefaultTemplates(): Promise<Record<string, DocumentTemplate>> {
    const templates = await this.getTemplates({ isActive: true });
    
    return {
      consent: templates.find(t => t.type === 'CONSENT') || await this.createDefaultConsentTemplate(),
      undertaking: templates.find(t => t.type === 'UNDERTAKING') || await this.createDefaultUndertakingTemplate(),
      agentPermission: templates.find(t => t.type === 'AGENT_PERMISSION') || await this.createDefaultAgentPermissionTemplate(),
      termsConditions: templates.find(t => t.type === 'TERMS_CONDITIONS') || await this.createDefaultTermsTemplate(),
      privacyPolicy: templates.find(t => t.type === 'PRIVACY_POLICY') || await this.createDefaultPrivacyTemplate(),
    };
  }

  /**
   * Validate template content for required elements
   */
  validateTemplate(content: string, type: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic validations
    if (!content.trim()) {
      errors.push('Template content cannot be empty');
    }

    // Type-specific validations
    switch (type) {
      case 'CONSENT':
        if (!content.includes('consent') && !content.includes('authorize')) {
          errors.push('Consent template must include consent or authorization language');
        }
        break;
      case 'UNDERTAKING':
        if (!content.includes('undertake') && !content.includes('agree')) {
          errors.push('Undertaking template must include commitment language');
        }
        break;
      case 'TERMS_CONDITIONS':
        if (!content.includes('terms') && !content.includes('conditions')) {
          errors.push('Terms template must reference terms and conditions');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Preview template with sample data
   */
  async previewTemplate(templateId: string): Promise<string | null> {
    const template = await this.getTemplateById(templateId);
    if (!template) {
      return null;
    }

    // Sample data for preview
    const sampleData: Record<string, string> = {
      userName: 'John Doe',
      ownerName: 'Jane Smith',
      agentName: 'Mike Johnson',
      propertyAddress: '123 Main Street, Lagos, Nigeria',
      date: new Date().toLocaleDateString(),
      phoneNumber: '+234-xxx-xxx-xxxx',
      email: 'user@example.com',
    };

    const generated = await this.generateDocument(templateId, sampleData);
    return generated?.content || null;
  }

  /**
   * Extract variables from template content
   */
  private extractTemplateVariables(content: string): string[] {
    const variableRegex = /{{(\w+)}}/g;
    const variables: string[] = [];
    let match;

    while ((match = variableRegex.exec(content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    return variables;
  }

  /**
   * Create default consent template
   */
  private async createDefaultConsentTemplate(): Promise<DocumentTemplate> {
    const content = `
CONSENT TO LIST PROPERTY

I, {{ownerName}}, being the lawful owner of the property located at {{propertyAddress}}, 
do hereby consent to {{agentName}} listing and marketing the said property for rental purposes.

This consent is valid from {{date}} and may be revoked with written notice.

Owner's Signature: _______________________
Date: {{date}}
    `.trim();

    return this.createTemplate({
      name: 'Default Property Consent',
      type: 'CONSENT',
      category: 'PROPERTY',
      content,
      requiresSignature: true,
    }, 'system');
  }

  /**
   * Create default undertaking template
   */
  private async createDefaultUndertakingTemplate(): Promise<DocumentTemplate> {
    const content = `
AGENT UNDERTAKING

I, {{agentName}}, undertake to:
1. Represent the property at {{propertyAddress}} accurately and honestly
2. Act in the best interests of the property owner
3. Comply with all applicable laws and regulations
4. Maintain confidentiality of all parties involved

Agent's Signature: _______________________
Date: {{date}}
    `.trim();

    return this.createTemplate({
      name: 'Default Agent Undertaking',
      type: 'UNDERTAKING',
      category: 'LEGAL',
      content,
      requiresSignature: true,
    }, 'system');
  }

  /**
   * Create default agent permission template
   */
  private async createDefaultAgentPermissionTemplate(): Promise<DocumentTemplate> {
    const content = `
AGENT PERMISSION DOCUMENT

I, {{ownerName}}, hereby grant permission to {{agentName}} to:
1. Show the property at {{propertyAddress}} to potential tenants
2. Collect rental applications and documentation
3. Negotiate rental terms within agreed parameters
4. Act as my representative in rental matters

This permission is subject to the terms agreed upon separately.

Owner's Signature: _______________________
Date: {{date}}
    `.trim();

    return this.createTemplate({
      name: 'Default Agent Permission',
      type: 'AGENT_PERMISSION',
      category: 'LEGAL',
      content,
      requiresSignature: true,
    }, 'system');
  }

  /**
   * Create default terms and conditions template
   */
  private async createDefaultTermsTemplate(): Promise<DocumentTemplate> {
    const content = `
TERMS AND CONDITIONS

By using NewCondo platform, you agree to:
1. Provide accurate and truthful information
2. Comply with all applicable laws
3. Respect the rights of other users
4. Use the platform only for legitimate purposes

For complete terms, visit our website.

I have read and agree to these terms.

User's Signature: _______________________
Date: {{date}}
    `.trim();

    return this.createTemplate({
      name: 'Default Terms and Conditions',
      type: 'TERMS_CONDITIONS',
      category: 'COMPLIANCE',
      content,
      requiresSignature: true,
    }, 'system');
  }

  /**
   * Create default privacy policy template
   */
  private async createDefaultPrivacyTemplate(): Promise<DocumentTemplate> {
    const content = `
PRIVACY POLICY ACKNOWLEDGMENT

I acknowledge that I have read and understood NewCondo's Privacy Policy, 
which explains how my personal data is collected, used, and protected.

I consent to the processing of my personal data as described in the Privacy Policy.

User's Signature: _______________________
Date: {{date}}
    `.trim();

    return this.createTemplate({
      name: 'Default Privacy Policy Acknowledgment',
      type: 'PRIVACY_POLICY',
      category: 'COMPLIANCE',
      content,
      requiresSignature: true,
    }, 'system');
  }
}

export const documentTemplateService = new DocumentTemplateService();