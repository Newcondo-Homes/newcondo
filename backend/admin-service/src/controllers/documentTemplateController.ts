// backend/admin-service/src/controllers/documentTemplateController.ts

import { Request, Response } from 'express';
import { prisma } from '@newcondo/db';
import { z } from 'zod';
import { AdminActionType, DocumentType } from '@newcondo/db';

// Validation schemas
const createTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
  documentType: z.nativeEnum(DocumentType),
  content: z.string().min(1, 'Template content is required'),
  isActive: z.boolean().default(true),
  requiredFields: z.array(z.string()).default([]),
  category: z.enum(['LEGAL', 'COMPLIANCE', 'VERIFICATION', 'PROPERTY']).default('LEGAL'),
});

const updateTemplateSchema = createTemplateSchema.partial();

interface DocumentTemplate {
  id: string;
  name: string;
  description?: string;
  documentType: DocumentType;
  content: string;
  isActive: boolean;
  requiredFields: string[];
  category: 'LEGAL' | 'COMPLIANCE' | 'VERIFICATION' | 'PROPERTY';
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// In-memory storage for templates (in production, use database)
let documentTemplates: DocumentTemplate[] = [
  {
    id: '1',
    name: 'Property Ownership Consent',
    description: 'Template for property ownership consent document',
    documentType: DocumentType.CONSENT_DOCUMENT,
    content: `
      <h1>PROPERTY OWNERSHIP CONSENT DOCUMENT</h1>
      
      <p>I, <strong>[OWNER_NAME]</strong>, hereby confirm that:</p>
      
      <ol>
        <li>I am the legal owner of the property located at <strong>[PROPERTY_ADDRESS]</strong></li>
        <li>I give my full consent to list this property on the NewCondo platform</li>
        <li>All information provided about this property is accurate and complete</li>
        <li>I understand and agree to the terms and conditions of the platform</li>
      </ol>
      
      <div class="signature-section">
        <p>Owner Name: [OWNER_NAME]</p>
        <p>Date: [DATE]</p>
        <p>Signature: [DIGITAL_SIGNATURE]</p>
      </div>
    `,
    isActive: true,
    requiredFields: ['OWNER_NAME', 'PROPERTY_ADDRESS', 'DATE', 'DIGITAL_SIGNATURE'],
    category: 'LEGAL',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system'
  },
  {
    id: '2',
    name: 'Agent Authorization Document',
    description: 'Template for agent authorization from property owners',
    documentType: DocumentType.CONSENT_DOCUMENT,
    content: `
      <h1>AGENT AUTHORIZATION DOCUMENT</h1>
      
      <p>I, <strong>[OWNER_NAME]</strong>, hereby authorize <strong>[AGENT_NAME]</strong> to:</p>
      
      <ul>
        <li>List my property at <strong>[PROPERTY_ADDRESS]</strong> on the NewCondo platform</li>
        <li>Show the property to potential renters</li>
        <li>Negotiate rental terms on my behalf</li>
        <li>Collect rental payments as agreed</li>
      </ul>
      
      <p><strong>Commission Agreement:</strong> [COMMISSION_PERCENTAGE]% of monthly rent</p>
      <p><strong>Authorization Period:</strong> From [START_DATE] to [END_DATE]</p>
      
      <div class="signature-section">
        <p>Property Owner: [OWNER_NAME]</p>
        <p>Date: [DATE]</p>
        <p>Owner Signature: [OWNER_SIGNATURE]</p>
        
        <p>Authorized Agent: [AGENT_NAME]</p>
        <p>Agent ID: [AGENT_ID]</p>
        <p>Agent Signature: [AGENT_SIGNATURE]</p>
      </div>
    `,
    isActive: true,
    requiredFields: ['OWNER_NAME', 'AGENT_NAME', 'PROPERTY_ADDRESS', 'COMMISSION_PERCENTAGE', 'START_DATE', 'END_DATE', 'DATE', 'OWNER_SIGNATURE', 'AGENT_ID', 'AGENT_SIGNATURE'],
    category: 'LEGAL',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system'
  },
  {
    id: '3',
    name: 'Legal Undertaking Document',
    description: 'Template for legal undertaking by property listers',
    documentType: DocumentType.UNDERTAKING_DOCUMENT,
    content: `
      <h1>LEGAL UNDERTAKING DOCUMENT</h1>
      
      <p>I, <strong>[SIGNATORY_NAME]</strong>, hereby undertake and warrant that:</p>
      
      <ol>
        <li>All information provided regarding the property at <strong>[PROPERTY_ADDRESS]</strong> is true, accurate, and complete</li>
        <li>I have the legal right and authority to list this property</li>
        <li>The property is free from any legal disputes or encumbrances that would affect its rental</li>
        <li>I will comply with all applicable laws and regulations</li>
        <li>I will indemnify NewCondo platform against any losses arising from false information</li>
        <li>I understand that providing false information may result in legal action</li>
      </ol>
      
      <p><strong>Declaration:</strong> I declare that the above statements are true to the best of my knowledge and belief.</p>
      
      <div class="signature-section">
        <p>Name: [SIGNATORY_NAME]</p>
        <p>Role: [SIGNATORY_ROLE]</p>
        <p>Date: [DATE]</p>
        <p>Digital Signature: [DIGITAL_SIGNATURE]</p>
        <p>IP Address: [IP_ADDRESS]</p>
        <p>Timestamp: [TIMESTAMP]</p>
      </div>
    `,
    isActive: true,
    requiredFields: ['SIGNATORY_NAME', 'PROPERTY_ADDRESS', 'SIGNATORY_ROLE', 'DATE', 'DIGITAL_SIGNATURE', 'IP_ADDRESS', 'TIMESTAMP'],
    category: 'COMPLIANCE',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system'
  }
];

export class DocumentTemplateController {
  // Get all document templates
  static async getAllTemplates(req: Request, res: Response) {
    try {
      const { 
        documentType, 
        category, 
        isActive = 'true',
        page = '1',
        limit = '10'
      } = req.query;

      let filteredTemplates = [...documentTemplates];

      // Apply filters
      if (documentType) {
        filteredTemplates = filteredTemplates.filter(t => t.documentType === documentType);
      }

      if (category) {
        filteredTemplates = filteredTemplates.filter(t => t.category === category);
      }

      if (isActive !== 'all') {
        const activeFilter = isActive === 'true';
        filteredTemplates = filteredTemplates.filter(t => t.isActive === activeFilter);
      }

      // Pagination
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;

      const paginatedTemplates = filteredTemplates.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: {
          templates: paginatedTemplates,
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(filteredTemplates.length / limitNum),
            totalItems: filteredTemplates.length,
            itemsPerPage: limitNum
          }
        }
      });
    } catch (error) {
      console.error('Error fetching document templates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch document templates',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get template by ID
  static async getTemplateById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const template = documentTemplates.find(t => t.id === id);

      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Document template not found'
        });
      }

      res.json({
        success: true,
        data: { template }
      });
    } catch (error) {
      console.error('Error fetching document template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch document template',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Create new template
  static async createTemplate(req: Request, res: Response) {
    try {
      const validatedData = createTemplateSchema.parse(req.body);
      const adminId = req.user?.id;

      if (!adminId) {
        return res.status(401).json({
          success: false,
          message: 'Admin authentication required'
        });
      }

      const newTemplate: DocumentTemplate = {
        id: Date.now().toString(), // Simple ID generation
        ...validatedData,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: adminId
      };

      documentTemplates.push(newTemplate);

      // Log admin action
      await prisma.adminAction.create({
        data: {
          adminId,
          action: AdminActionType.PROPERTY_APPROVED, // We'd need a new enum value for template creation
          targetType: 'DocumentTemplate',
          targetId: newTemplate.id,
          description: `Created document template: ${newTemplate.name}`,
          metadata: {
            templateType: newTemplate.documentType,
            category: newTemplate.category
          }
        }
      });

      res.status(201).json({
        success: true,
        message: 'Document template created successfully',
        data: { template: newTemplate }
      });
    } catch (error) {
      console.error('Error creating document template:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create document template',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Update template
  static async updateTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = updateTemplateSchema.parse(req.body);
      const adminId = req.user?.id;

      if (!adminId) {
        return res.status(401).json({
          success: false,
          message: 'Admin authentication required'
        });
      }

      const templateIndex = documentTemplates.findIndex(t => t.id === id);

      if (templateIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Document template not found'
        });
      }

      const updatedTemplate = {
        ...documentTemplates[templateIndex],
        ...validatedData,
        updatedAt: new Date()
      };

      documentTemplates[templateIndex] = updatedTemplate;

      // Log admin action
      await prisma.adminAction.create({
        data: {
          adminId,
          action: AdminActionType.PROPERTY_APPROVED, // We'd need a new enum value
          targetType: 'DocumentTemplate',
          targetId: id,
          description: `Updated document template: ${updatedTemplate.name}`,
          metadata: validatedData
        }
      });

      res.json({
        success: true,
        message: 'Document template updated successfully',
        data: { template: updatedTemplate }
      });
    } catch (error) {
      console.error('Error updating document template:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update document template',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Delete template (soft delete)
  static async deleteTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const adminId = req.user?.id;

      if (!adminId) {
        return res.status(401).json({
          success: false,
          message: 'Admin authentication required'
        });
      }

      const templateIndex = documentTemplates.findIndex(t => t.id === id);

      if (templateIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Document template not found'
        });
      }

      const template = documentTemplates[templateIndex];
      
      // Soft delete by setting isActive to false
      documentTemplates[templateIndex] = {
        ...template,
        isActive: false,
        updatedAt: new Date()
      };

      // Log admin action
      await prisma.adminAction.create({
        data: {
          adminId,
          action: AdminActionType.PROPERTY_REJECTED, // We'd need a new enum value
          targetType: 'DocumentTemplate',
          targetId: id,
          description: `Deleted document template: ${template.name}`
        }
      });

      res.json({
        success: true,
        message: 'Document template deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting document template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete document template',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get templates by document type
  static async getTemplatesByType(req: Request, res: Response) {
    try {
      const { documentType } = req.params;

      if (!Object.values(DocumentType).includes(documentType as DocumentType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid document type'
        });
      }

      const templates = documentTemplates.filter(t => 
        t.documentType === documentType && t.isActive
      );

      res.json({
        success: true,
        data: { templates }
      });
    } catch (error) {
      console.error('Error fetching templates by type:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch templates',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Preview template with sample data
  static async previewTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { sampleData = {} } = req.body;

      const template = documentTemplates.find(t => t.id === id);

      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Document template not found'
        });
      }

      let previewContent = template.content;

      // Replace placeholders with sample data
      template.requiredFields.forEach(field => {
        const placeholder = `[${field}]`;
        const value = sampleData[field] || `<span style="background: yellow;">${field}</span>`;
        previewContent = previewContent.replace(new RegExp(placeholder, 'g'), value);
      });

      res.json({
        success: true,
        data: {
          template: {
            ...template,
            previewContent
          },
          missingFields: template.requiredFields.filter(field => !sampleData[field])
        }
      });
    } catch (error) {
      console.error('Error previewing template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to preview template',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Clone template
  static async cloneTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const adminId = req.user?.id;

      if (!adminId) {
        return res.status(401).json({
          success: false,
          message: 'Admin authentication required'
        });
      }

      const originalTemplate = documentTemplates.find(t => t.id === id);

      if (!originalTemplate) {
        return res.status(404).json({
          success: false,
          message: 'Document template not found'
        });
      }

      const clonedTemplate: DocumentTemplate = {
        ...originalTemplate,
        id: Date.now().toString(),
        name: name || `${originalTemplate.name} (Copy)`,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: adminId
      };

      documentTemplates.push(clonedTemplate);

      res.status(201).json({
        success: true,
        message: 'Document template cloned successfully',
        data: { template: clonedTemplate }
      });
    } catch (error) {
      console.error('Error cloning document template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clone document template',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}