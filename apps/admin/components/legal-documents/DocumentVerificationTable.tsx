'use client';

import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@newcondo/ui/components/ui/table';
import { Badge } from '@newcondo/ui/components/ui/badge';
import { Button } from '@newcondo/ui/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@newcondo/ui/components/ui/dropdown-menu';
import { Input } from '@newcondo/ui/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@newcondo/ui/components/ui/select';
import { 
  Eye,
  MoreVertical,
  Search,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { formatDistance, format } from 'date-fns';

interface Document {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  documentType: string;
  documentSide?: string;
  fileName?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  verificationNotes?: string;
  createdAt: string;
  updatedAt: string;
  isRequired: boolean;
  expiresAt?: string;
}

interface DocumentVerificationTableProps {
  documents: Document[];
  loading?: boolean;
  onViewDocument: (documentId: string) => void;
  onApproveDocument: (documentId: string) => void;
  onRejectDocument: (documentId: string, reason: string) => void;
  onBulkAction: (documentIds: string[], action: string) => void;
}

const DocumentVerificationTable: React.FC<DocumentVerificationTableProps> = ({
  documents,
  loading = false,
  onViewDocument,
  onApproveDocument,
  onRejectDocument,
  onBulkAction
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter documents based on search and filters
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = 
      doc.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.documentType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    const matchesType = typeFilter === 'all' || doc.documentType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Sort documents
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'date':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'type':
        comparison = a.documentType.localeCompare(b.documentType);
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: React.ReactNode }> = {
      PENDING: { 
        variant: 'secondary' as const, 
        icon: <Clock className="w-3 h-3" /> 
      },
      APPROVED: { 
        variant: 'default' as const, 
        icon: <CheckCircle className="w-3 h-3" /> 
      },
      REJECTED: { 
        variant: 'destructive' as const, 
        icon: <XCircle className="w-3 h-3" /> 
      },
      EXPIRED: { 
        variant: 'outline' as const, 
        icon: <AlertCircle className="w-3 h-3" /> 
      }
    };

    const config = variants[status] || variants.PENDING;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {status}
      </Badge>
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDocuments(sortedDocuments.map(doc => doc.id));
    } else {
      setSelectedDocuments([]);
    }
  };

  const handleSelectDocument = (documentId: string, checked: boolean) => {
    if (checked) {
      setSelectedDocuments(prev => [...prev, documentId]);
    } else {
      setSelectedDocuments(prev => prev.filter(id => id !== documentId));
    }
  };

  const handleBulkApprove = () => {
    onBulkAction(selectedDocuments, 'approve');
    setSelectedDocuments([]);
  };

  const handleBulkReject = () => {
    onBulkAction(selectedDocuments, 'reject');
    setSelectedDocuments([]);
  };

  const uniqueDocumentTypes = [...new Set(documents.map(doc => doc.documentType))];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-10 bg-gray-200 rounded animate-pulse flex-1" />
          <div className="h-10 bg-gray-200 rounded animate-pulse w-32" />
          <div className="h-10 bg-gray-200 rounded animate-pulse w-32" />
        </div>
        <div className="border rounded-lg">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 border-b last:border-b-0">
              <div className="flex items-center gap-4">
                <div className="h-4 bg-gray-200 rounded animate-pulse flex-1" />
                <div className="h-6 bg-gray-200 rounded animate-pulse w-20" />
                <div className="h-8 bg-gray-200 rounded animate-pulse w-8" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by user, email, or document type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {uniqueDocumentTypes.map(type => (
              <SelectItem key={type} value={type}>
                {type.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm">
          <Filter className="w-4 h-4 mr-2" />
          More Filters
        </Button>
      </div>

      {/* Bulk Actions */}
      {selectedDocuments.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <span className="text-sm text-blue-700">
            {selectedDocuments.length} document(s) selected
          </span>
          <Button 
            size="sm" 
            onClick={handleBulkApprove}
            className="ml-auto"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Approve Selected
          </Button>
          <Button 
            size="sm" 
            variant="destructive"
            onClick={handleBulkReject}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Reject Selected
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={selectedDocuments.length === sortedDocuments.length && sortedDocuments.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300"
                />
              </TableHead>
              <TableHead>User</TableHead>
              <TableHead>Document Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Required</TableHead>
              <TableHead className="w-12">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedDocuments.map((document) => (
              <TableRow key={document.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedDocuments.includes(document.id)}
                    onChange={(e) => handleSelectDocument(document.id, e.target.checked)}
                    className="rounded border-gray-300"
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{document.userName}</div>
                    <div className="text-sm text-gray-500">{document.userEmail}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {document.documentType.replace(/_/g, ' ')}
                    </div>
                    {document.documentSide && (
                      <div className="text-sm text-gray-500">
                        {document.documentSide}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(document.status)}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {formatDistance(new Date(document.createdAt), new Date(), { addSuffix: true })}
                  </div>
                </TableCell>
                <TableCell>
                  {document.expiresAt ? (
                    <div className="text-sm">
                      {format(new Date(document.expiresAt), 'MMM dd, yyyy')}
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={document.isRequired ? 'default' : 'secondary'}>
                    {document.isRequired ? 'Required' : 'Optional'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewDocument(document.id)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Document
                      </DropdownMenuItem>
                      {document.status === 'PENDING' && (
                        <>
                          <DropdownMenuItem onClick={() => onApproveDocument(document.id)}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onRejectDocument(document.id, 'Manual rejection')}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuItem>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {sortedDocuments.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
            ? 'No documents match your filters.' 
            : 'No documents to review.'
          }
        </div>
      )}
    </div>
  );
};

export default DocumentVerificationTable;