// apps/platform/components/shared/feedback/EmptyState.tsx
import { cn } from "@/lib/utils"
import { Button } from "@newcondo/ui/components/button"
import { 
  Search, 
  Home, 
  MapPin, 
  Heart,
  AlertCircle,
  RefreshCw
} from "lucide-react"

interface EmptyStateProps {
  variant?: 'search' | 'properties' | 'favorites' | 'error' | 'maintenance'
  title: string
  description: string
  actionText?: string
  onAction?: () => void
  className?: string
  showIcon?: boolean
}

const iconVariants = {
  search: Search,
  properties: Home,
  favorites: Heart,
  error: AlertCircle,
  maintenance: RefreshCw
}

export function EmptyState({
  variant = 'search',
  title,
  description,
  actionText,
  onAction,
  className,
  showIcon = true
}: EmptyStateProps) {
  const Icon = iconVariants[variant]

  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center py-12 px-4",
      className
    )}>
      {showIcon && (
        <div className={cn(
          "rounded-full p-4 mb-6",
          variant === 'error' ? 'bg-destructive/10' : 'bg-muted'
        )}>
          <Icon 
            className={cn(
              "h-8 w-8",
              variant === 'error' ? 'text-destructive' : 'text-muted-foreground'
            )} 
          />
        </div>
      )}
      
      <h3 className="text-lg font-semibold mb-2 text-foreground">
        {title}
      </h3>
      
      <p className="text-muted-foreground mb-6 max-w-md">
        {description}
      </p>
      
      {actionText && onAction && (
        <Button onClick={onAction} variant="outline">
          {actionText}
        </Button>
      )}
    </div>
  )
}

// Preset empty states for common scenarios
export function NoPropertiesFound({ onResetFilters }: { onResetFilters?: () => void }) {
  return (
    <EmptyState
      variant="search"
      title="No properties found"
      description="We couldn't find any properties matching your search criteria. Try adjusting your filters or search terms."
      actionText={onResetFilters ? "Reset filters" : undefined}
      onAction={onResetFilters}
    />
  )
}

export function NoFavoriteProperties({ onBrowseProperties }: { onBrowseProperties?: () => void }) {
  return (
    <EmptyState
      variant="favorites"
      title="No favorite properties yet"
      description="Start browsing properties and save your favorites to see them here."
      actionText={onBrowseProperties ? "Browse properties" : undefined}
      onAction={onBrowseProperties}
    />
  )
}

export function PropertySearchIntro() {
  return (
    <div className="text-center py-16 px-4">
      <MapPin className="h-16 w-16 text-primary mx-auto mb-6" />
      <h2 className="text-2xl font-bold mb-4">Find Your Perfect Home</h2>
      <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
        Search through thousands of verified properties across Nigeria. 
        Use the search box above to find properties by location, price range, or property type.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto text-sm">
        <div className="p-6 rounded-lg border">
          <Search className="h-8 w-8 text-primary mx-auto mb-3" />
          <h3 className="font-medium mb-2">Smart Search</h3>
          <p className="text-muted-foreground">
            Advanced filters to find exactly what you&apos;re looking for
          </p>
        </div>
        <div className="p-6 rounded-lg border">
          <Home className="h-8 w-8 text-primary mx-auto mb-3" />
          <h3 className="font-medium mb-2">Verified Properties</h3>
          <p className="text-muted-foreground">
            All properties are verified with accurate photos and details
          </p>
        </div>
        <div className="p-6 rounded-lg border">
          <MapPin className="h-8 w-8 text-primary mx-auto mb-3" />
          <h3 className="font-medium mb-2">Location Insights</h3>
          <p className="text-muted-foreground">
            View property boundaries and neighborhood information
          </p>
        </div>
      </div>
    </div>
  )
}

export function ServerErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      variant="error"
      title="Something went wrong"
      description="We're having trouble loading the properties. Please try again or check your internet connection."
      actionText={onRetry ? "Try again" : undefined}
      onAction={onRetry}
    />
  )
}

export function MaintenanceState() {
  return (
    <EmptyState
      variant="maintenance"
      title="Under Maintenance"
      description="We're currently updating our property listings. Please check back in a few minutes."
      showIcon={true}
    />
  )
}