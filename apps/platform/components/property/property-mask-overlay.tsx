'use client'

import React, { useEffect, useRef, useState } from 'react'
import { GoogleMap, Polygon, Marker, InfoWindow } from '@react-google-maps/api'
import { cn } from '@/lib/utils'
import { Badge } from '@newcondo/ui'
import { AlertTriangle, MapPin, User, Clock } from 'lucide-react'

interface PropertyMask {
  id: string
  coordinates: { lat: number; lng: number }[]
  ownerId: string
  ownerName: string
  propertyId: string
  propertyTitle: string
  markedAt: string
  status: 'VERIFIED' | 'PENDING' | 'DISPUTED'
  boundaryType: 'OWNER_MARKED' | 'AGENT_MARKED' | 'SYSTEM_GENERATED'
}

interface PropertyMaskOverlayProps {
  center: { lat: number; lng: number }
  zoom: number
  existingMasks: PropertyMask[]
  userLocation?: { lat: number; lng: number }
  isDrawing?: boolean
  onMaskClick?: (mask: PropertyMask) => void
  onMapClick?: (event: google.maps.MapMouseEvent) => void
  className?: string
}

const PropertyMaskOverlay: React.FC<PropertyMaskOverlayProps> = ({
  center,
  zoom,
  existingMasks,
  userLocation,
  isDrawing = false,
  onMaskClick,
  onMapClick,
  className,
}) => {
  const mapRef = useRef<google.maps.Map | null>(null)
  const [selectedMask, setSelectedMask] = useState<PropertyMask | null>(null)
  const [hoveredMask, setHoveredMask] = useState<PropertyMask | null>(null)
  const [mapType, setMapType] = useState<'satellite' | 'roadmap'>('satellite')

  // Map options for satellite view with property marking
  const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: true,
    scaleControl: true,
    streetViewControl: true,
    rotateControl: false,
    fullscreenControl: true,
    mapTypeId: mapType,
    gestureHandling: 'cooperative' as const,
    styles: mapType === 'satellite' ? [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      }
    ] : [],
  }

  // Get polygon options based on mask status
  const getPolygonOptions = (mask: PropertyMask) => {
    const isHovered = hoveredMask?.id === mask.id
    const isSelected = selectedMask?.id === mask.id
    
    const baseOptions = {
      strokeWeight: isHovered || isSelected ? 3 : 2,
      fillOpacity: isHovered ? 0.4 : 0.2,
      strokeOpacity: isHovered || isSelected ? 0.9 : 0.7,
      clickable: true,
      editable: false,
      draggable: false,
    }

    switch (mask.status) {
      case 'VERIFIED':
        return {
          ...baseOptions,
          strokeColor: '#22c55e', // green
          fillColor: '#22c55e',
        }
      case 'PENDING':
        return {
          ...baseOptions,
          strokeColor: '#f59e0b', // amber
          fillColor: '#f59e0b',
        }
      case 'DISPUTED':
        return {
          ...baseOptions,
          strokeColor: '#ef4444', // red
          fillColor: '#ef4444',
        }
      default:
        return {
          ...baseOptions,
          strokeColor: '#6b7280', // gray
          fillColor: '#6b7280',
        }
    }
  }

  // Handle mask selection
  const handleMaskClick = (mask: PropertyMask) => {
    setSelectedMask(mask)
    onMaskClick?.(mask)
  }

  // Handle map click for drawing
  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    if (isDrawing) {
      onMapClick?.(event)
    } else {
      setSelectedMask(null)
    }
  }

  // Get center point of polygon for info window
  const getPolygonCenter = (coordinates: { lat: number; lng: number }[]) => {
    const bounds = new google.maps.LatLngBounds()
    coordinates.forEach(coord => bounds.extend(coord))
    return bounds.getCenter()
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Get status badge color and text
  const getStatusBadge = (status: PropertyMask['status']) => {
    switch (status) {
      case 'VERIFIED':
        return { color: 'bg-green-500', text: 'Verified' }
      case 'PENDING':
        return { color: 'bg-amber-500', text: 'Pending' }
      case 'DISPUTED':
        return { color: 'bg-red-500', text: 'Disputed' }
      default:
        return { color: 'bg-gray-500', text: 'Unknown' }
    }
  }

  // Get boundary type icon and text
  const getBoundaryTypeInfo = (boundaryType: PropertyMask['boundaryType']) => {
    switch (boundaryType) {
      case 'OWNER_MARKED':
        return { icon: User, text: 'Owner Marked' }
      case 'AGENT_MARKED':
        return { icon: MapPin, text: 'Agent Marked' }
      case 'SYSTEM_GENERATED':
        return { icon: AlertTriangle, text: 'System Generated' }
      default:
        return { icon: AlertTriangle, text: 'Unknown' }
    }
  }

  return (
    <div className={cn('relative w-full h-full', className)}>
      {/* Map Type Toggle */}
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setMapType('satellite')}
            className={cn(
              'px-3 py-1 rounded text-sm font-medium transition-colors',
              mapType === 'satellite'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            Satellite
          </button>
          <button
            onClick={() => setMapType('roadmap')}
            className={cn(
              'px-3 py-1 rounded text-sm font-medium transition-colors',
              mapType === 'roadmap'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            Map
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg p-4">
        <h3 className="font-semibold text-sm mb-2">Property Status</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded opacity-50"></div>
            <span className="text-xs">Verified</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-amber-500 rounded opacity-50"></div>
            <span className="text-xs">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded opacity-50"></div>
            <span className="text-xs">Disputed</span>
          </div>
        </div>
      </div>

      {/* Drawing Mode Indicator */}
      {isDrawing && (
        <div className="absolute bottom-4 left-4 z-10 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Drawing Mode Active</span>
          </div>
          <p className="text-xs mt-1">Click on the map to draw your property boundary</p>
        </div>
      )}

      <GoogleMap
        ref={mapRef}
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={center}
        zoom={zoom}
        options={mapOptions}
        onClick={handleMapClick}
      >
        {/* User Location Marker */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={{
              url: '/images/icons/user-location.png',
              scaledSize: new google.maps.Size(24, 24),
            }}
            title="Your Location"
          />
        )}

        {/* Existing Property Masks */}
        {existingMasks.map((mask) => (
          <React.Fragment key={mask.id}>
            <Polygon
              paths={mask.coordinates}
              options={getPolygonOptions(mask)}
              onClick={() => handleMaskClick(mask)}
              onMouseOver={() => setHoveredMask(mask)}
              onMouseOut={() => setHoveredMask(null)}
            />
            
            {/* Property Center Marker */}
            <Marker
              position={getPolygonCenter(mask.coordinates)}
              icon={{
                url: '/images/icons/property-marker.png',
                scaledSize: new google.maps.Size(16, 16),
              }}
              title={mask.propertyTitle}
              onClick={() => handleMaskClick(mask)}
            />
          </React.Fragment>
        ))}

        {/* Info Window for Selected Mask */}
        {selectedMask && (
          <InfoWindow
            position={getPolygonCenter(selectedMask.coordinates)}
            onCloseClick={() => setSelectedMask(null)}
          >
            <div className="max-w-xs p-2">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-sm">{selectedMask.propertyTitle}</h3>
                <Badge 
                  variant="secondary" 
                  className={cn('text-xs', getStatusBadge(selectedMask.status).color)}
                >
                  {getStatusBadge(selectedMask.status).text}
                </Badge>
              </div>
              
              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>Owner: {selectedMask.ownerName}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  {React.createElement(getBoundaryTypeInfo(selectedMask.boundaryType).icon, {
                    className: "w-3 h-3"
                  })}
                  <span>{getBoundaryTypeInfo(selectedMask.boundaryType).text}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Marked: {formatDate(selectedMask.markedAt)}</span>
                </div>
              </div>

              {selectedMask.status === 'DISPUTED' && (
                <div className="mt-2 p-2 bg-red-50 rounded text-xs">
                  <div className="flex items-center gap-1 text-red-600">
                    <AlertTriangle className="w-3 h-3" />
                    <span className="font-medium">Disputed Boundary</span>
                  </div>
                  <p className="text-red-600 mt-1">
                    This property boundary is under dispute. Contact support for resolution.
                  </p>
                </div>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  )
}

export default PropertyMaskOverlay