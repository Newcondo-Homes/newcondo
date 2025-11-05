// apps/platform/components/properties/PropertyActionMenu.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Share2,
  Copy,
  BarChart,
  EyeOff,
  CheckCircle,
  MapPin,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Property {
  id: string;
  title: string;
  status: string;
  isAvailable: boolean;
  shareableLink?: string;
}

interface PropertyActionMenuProps {
  property: Property;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onViewBoundary?: () => void;
  onViewAnalytics?: () => void;
  onToggleAvailability?: () => void;
  onDelist?: () => void;
}

export function PropertyActionMenu({
  property,
  onView,
  onEdit,
  onDelete,
  onViewBoundary,
  onViewAnalytics,
  onToggleAvailability,
  onDelist,
}: PropertyActionMenuProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDelistDialog, setShowDelistDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleCopyLink = async () => {
    if (!property.shareableLink) {
      toast({
        title: 'No shareable link',
        description: 'This property does not have a shareable link yet',
        variant: 'destructive',
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(property.shareableLink);
      toast({
        title: 'Link copied',
        description: 'Property link copied to clipboard',
      });
    } catch (error) {
      console.error('Copy error:', error);
      toast({
        title: 'Copy failed',
        description: 'Failed to copy link to clipboard',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete();
      setShowDeleteDialog(false);
      toast({
        title: 'Property deleted',
        description: 'The property has been deleted successfully',
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Delete failed',
        description: 'Failed to delete the property',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDelist = async () => {
    if (!onDelist) return;

    try {
      await onDelist();
      setShowDelistDialog(false);
      toast({
        title: 'Property delisted',
        description: 'The property has been removed from public listings',
      });
    } catch (error) {
      console.error('Delist error:', error);
      toast({
        title: 'Delist failed',
        description: 'Failed to delist the property',
        variant: 'destructive',
      });
    }
  };

  const canEdit = property.status !== 'RENTED';
  const canDelist = property.status === 'PUBLISHED';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={onView}>
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </DropdownMenuItem>

          {canEdit && (
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Property
            </DropdownMenuItem>
          )}

          {onViewBoundary && (
            <DropdownMenuItem onClick={onViewBoundary}>
              <MapPin className="h-4 w-4 mr-2" />
              View Boundary
            </DropdownMenuItem>
          )}

          {onViewAnalytics && (
            <DropdownMenuItem onClick={onViewAnalytics}>
              <BarChart className="h-4 w-4 mr-2" />
              View Analytics
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleCopyLink}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Link
          </DropdownMenuItem>

          <DropdownMenuItem>
            <Share2 className="h-4 w-4 mr-2" />
            Share Property
          </DropdownMenuItem>

          {onToggleAvailability && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onToggleAvailability}>
                {property.isAvailable ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Mark Unavailable
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark Available
                  </>
                )}
              </DropdownMenuItem>
            </>
          )}

          {canDelist && onDelist && (
            <DropdownMenuItem
              onClick={() => setShowDelistDialog(true)}
              className="text-orange-600"
            >
              <EyeOff className="h-4 w-4 mr-2" />
              Delist Property
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Property
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Property"
        description={`Are you sure you want to delete "${property.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        variant="destructive"
        loading={isDeleting}
      />

      {/* Delist Confirmation Dialog */}
      <ConfirmDialog
        open={showDelistDialog}
        onOpenChange={setShowDelistDialog}
        title="Delist Property"
        description={`Are you sure you want to delist "${property.title}"? It will be removed from public listings.`}
        confirmText="Delist"
        cancelText="Cancel"
        onConfirm={handleDelist}
      />
    </>
  );
}