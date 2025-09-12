'use client';

import { useState, useMemo } from 'react';
import { Button } from '@newcondo/ui/button';
import { Input } from '@newcondo/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/card';
import { Badge } from '@newcondo/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@newcondo/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@newcondo/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@newcondo/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@newcondo/ui/alert-dialog';
import { Checkbox } from '@newcondo/ui/checkbox';
import { ScrollArea } from '@newcondo/ui/scroll-area';
import { 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal,
  Edit,
  Copy,
  Archive,
  Trash2,
  Eye,
  Download,
  FileText,
  Calendar,
  User,
  Building,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  documentType: string;
  category: string;
  isActive: boolean;
  requiresSignature: boolean;
  version: number;
  variableCount: number;
  usageCount: number;
  expirationDays?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
}

interface DocumentTemplateListProps {
  templates: DocumentTemplate[];
  isLoading?: boolean;
  onAdd: () => void;
  onEdit: (template: DocumentTemplate) => void;
  onView: (template: DocumentTemplate) => void;
  onDuplicate: (template: DocumentTemplate) => void;
  onArchive: (templateIds: string[]) => void;
  onDelete: (templateIds: string[]) => void;
  onExport: (template: DocumentTemplate) => void;
  onRefresh: () => void;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  OWNERSHIP_DOCUMENT: 'Ownership Document',
  CONSENT_DOCUMENT: 'Consent Document',
  UNDERTAKING_DOCUMENT: 'Undertaking Document',
  AGENT_PERMISSION: 'Agent Permission',
  TERMS_CONDITIONS: 'Terms & Conditions',
  PRIVACY_POLICY: 'Privacy Policy',
  RENTAL_AGREEMENT: 'Rental Agreement',
  OTHER: 'Other'
};

const CATEGORY_LABELS: Record<string, string> = {
  PROPERTY: 'Property Related',
  USER: 'User Related',
  LEGAL: 'Legal Compliance',
  BUSINESS: 'Business',
  SYSTEM: 'System Generated'
};

const STATUS_FILTERS = [
  { value: 'all', label: 'All Templates' },
  { value: 'active', label: 'Active Only' },
  { value: 'inactive', label: 'Inactive Only' },
  { value: 'signature_required', label: 'Signature Required' },
  { value: 'recently_used', label: 'Recently Used' }
];

export default function DocumentTemplateList({
  templates,
  isLoading = false,
  onAdd,
  onEdit,
  onView,
  onDuplicate,
  onArchive,
  onDelete,
  onExport,
  onRefresh
}: DocumentTemplateListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);

  // Filter and search templates
  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      // Search filter
      const searchMatch = searchQuery === '' || 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const categoryMatch = selectedCategory === 'all' || template.category === selectedCategory;

      // Type filter
      const typeMatch = selectedType === 'all' || template.documentType === selectedType;

      // Status filter
      const statusMatch = statusFilter === 'all' ||
        (statusFilter === 'active' && template.isActive) ||
        (statusFilter === 'inactive' && !template.isActive) ||
        (statusFilter === 'signature_required' && template.requiresSignature) ||
        (statusFilter === 'recently_used' && !!template.lastUsedAt);

      return searchMatch && categoryMatch && typeMatch && statusMatch;
    });
  }, [templates, searchQuery, selectedCategory, selectedType, statusFilter]);

  // Handle single item selection
  const handleSelectItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Handle all items selection
  const handleSelectAll = () => {
    if (selectedItems.length === filteredTemplates.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredTemplates.map(template => template.id));
    }
  };

  // Handle bulk delete
  const handleDelete = () => {
    onDelete(selectedItems);
    setSelectedItems([]);
    setDeleteDialogOpen(false);
  };

  // Handle bulk archive
  const handleArchive = () => {
    onArchive(selectedItems);
    setSelectedItems([]);
    setArchiveDialogOpen(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center mb-4">
          <CardTitle>Document Templates</CardTitle>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button size="sm" onClick={onAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Template
            </Button>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex w-full md:w-2/3 gap-4">
            <Select onValueChange={setSelectedCategory} value={selectedCategory}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={setSelectedType} value={selectedType}>
              <SelectTrigger>
                <FileText className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Document Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={setStatusFilter} value={statusFilter}>
              <SelectTrigger>
                <Clock className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map(filter => (
                  <SelectItem key={filter.value} value={filter.value}>{filter.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {selectedItems.length > 0 && (
          <div className="mb-4 flex items-center space-x-2">
            <Badge variant="secondary">
              {selectedItems.length} selected
            </Badge>
            <Button variant="outline" size="sm" onClick={() => setArchiveDialogOpen(true)}>
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        )}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedItems.length === filteredTemplates.length && filteredTemplates.length > 0}
                    onCheckedChange={handleSelectAll}
                    disabled={isLoading || filteredTemplates.length === 0}
                  />
                </TableHead>
                <TableHead>Template Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Version</TableHead>
                <TableHead className="text-right">Usage</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    Loading templates...
                  </TableCell>
                </TableRow>
              ) : filteredTemplates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No templates found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTemplates.map(template => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedItems.includes(template.id)}
                        onCheckedChange={() => handleSelectItem(template.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>{DOCUMENT_TYPE_LABELS[template.documentType] || template.documentType}</TableCell>
                    <TableCell>{CATEGORY_LABELS[template.category] || template.category}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={template.isActive ? 'default' : 'secondary'}>
                          {template.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {template.requiresSignature && (
                          <Badge variant="outline">Signature</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{`v${template.version}`}</TableCell>
                    <TableCell className="text-right">{template.usageCount}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => onView(template)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(template)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDuplicate(template)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onExport(template)}>
                            <Download className="h-4 w-4 mr-2" />
                            Export
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600" onClick={() => onDelete([template.id])}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected templates
              and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to archive these templates?</AlertDialogTitle>
            <AlertDialogDescription>
              Archiving will make these templates inactive, but they will not be permanently deleted.
              You can restore them later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}