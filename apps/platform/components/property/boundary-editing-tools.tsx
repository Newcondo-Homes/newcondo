'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Button } from '@newcondo/ui'
import { 
  Edit3, 
  Square, 
  Move, 
  RotateCw, 
  Trash2, 
  Save, 
  Undo, 
  Redo, 
  ZoomIn, 
  ZoomOut,
  MousePointer,
  Hand,
  RefreshCw,
  AlertTriangle,
  Check,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@newcondo/ui'

interface BoundaryPoint {
  lat: number
  lng: number
  id: string
}

interface BoundaryEditingToolsProps {
  isDrawing: boolean
  currentBoundary: BoundaryPoint[]
  onDrawingToggle: (isDrawing: boolean) => void
  onBoundaryUpdate: (boundary: BoundaryPoint[]) => void
  onSave: () => void
  onCancel: () => void
  onUndo: () => void
  onRedo: () => void
  onClear: () => void
  canUndo: boolean
  canRedo: boolean
  canSave: boolean
  isValid: boolean
  validationErrors: string[]
  mapRef?: google.maps.Map | null
  className?: string
}

type EditingMode = 'select' | 'draw' | 'move' | 'edit'

const BoundaryEditingTools: React.FC<BoundaryEditingToolsProps> = ({
  isDrawing,
  currentBoundary,
  onDrawingToggle,
  onBoundaryUpdate,
  onSave,
  onCancel,
  onUndo,
  onRedo,
  onClear,
  canUndo,
  canRedo,
  canSave,
  isValid,
  validationErrors,
  mapRef,
  className,
}) => {
  const [editingMode, setEditingMode] = useState<EditingMode>('select')
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null)
  const [showValidation, setShowValidation] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Calculate boundary area (approximate)
  const calculateArea = useCallback(() => {
    if (currentBoundary.length < 3) return 0
    
    // Simple polygon area calculation using shoelace formula
    let area = 0
    for (let i = 0; i < currentBoundary.length; i++) {
      const j = (i + 1) % currentBoundary.length
      area += currentBoundary[i].lat * currentBoundary[j].lng
      area -= currentBoundary[j].lat * currentBoundary[i].lng
    }
    return Math.abs(area) / 2
  }, [currentBoundary])

  // Handle mode changes
  const handleModeChange = (mode: EditingMode) => {
    setEditingMode(mode)
    if (mode === 'draw') {
      onDrawingToggle(true)
      setIsEditing(true)
    } else {
      onDrawingToggle(false)
      if (mode === 'select') {
        setIsEditing(false)
      }
    }
  }

  // Handle point selection
  const handlePointClick = (pointId: string) => {
    if (editingMode === 'edit') {
      setSelectedPoint(pointId)
    }
  }

  // Handle point deletion
  const handleDeletePoint = (pointId: string) => {
    const updatedBoundary = currentBoundary.filter(point => point.id !== pointId)
    onBoundaryUpdate(updatedBoundary)
    setSelectedPoint(null)
  }

  // Handle boundary validation
  const handleValidate = () => {
    setShowValidation(true)
    setTimeout(() => setShowValidation(false), 3000)
  }

  // Zoom controls
  const handleZoomIn = () => {
    if (mapRef) {
      const currentZoom = mapRef.getZoom() || 18
      mapRef.setZoom(Math.min(currentZoom + 1, 22))
    }
  }

  const handleZoomOut = () => {
    if (mapRef) {
      const currentZoom = mapRef.getZoom() || 18
      mapRef.setZoom(Math.max(currentZoom - 1, 15))
    }
  }

  // Center map on boundary
  const handleCenterOnBoundary = () => {
    if (mapRef && currentBoundary.length > 0) {
      const bounds = new google.maps.LatLngBounds()
      currentBoundary.forEach(point => bounds.extend(point))
      mapRef.fitBounds(bounds)
    }
  }

  // Handle save with validation
  const handleSave = () => {
    if (isValid) {
      onSave()
      setIsEditing(false)
      setEditingMode('select')
    } else {
      handleValidate()
    }
  }

  // Handle cancel
  const handleCancel = () => {
    onCancel()
    setIsEditing(false)
    setEditingMode('select')
    setSelectedPoint(null)
  }

  // Get tool button styling
  const getToolButtonStyle = (mode: EditingMode, isActive: boolean) => {
    return cn(
      'p-2 rounded-lg transition-colors',
      isActive
        ? 'bg-blue-500 text-white shadow-md'
        : 'bg-white text-gray-700 hover:bg-gray-100 shadow-sm'
    )
  }

  const boundaryArea = calculateArea()
  const boundaryPerimeter = currentBoundary.length

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Tool Panel */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Boundary Tools</h3>
          <Badge variant={isValid ? 'default' : 'destructive'}>
            {isValid ? 'Valid' : 'Invalid'}
          </Badge>
        </div>

        {/* Editing Mode Selector */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <Button
            size="sm"
            variant={editingMode === 'select' ? 'default' : 'outline'}
            onClick={() => handleModeChange('select')}
            className="flex items-center gap-2"
          >
            <MousePointer className="w-4 h-4" />
            Select
          </Button>
          
          <Button
            size="sm"
            variant={editingMode === 'draw' ? 'default' : 'outline'}
            onClick={() => handleModeChange('draw')}
            className="flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            Draw
          </Button>
          
          <Button
            size="sm"
            variant={editingMode === 'move' ? 'default' : 'outline'}
            onClick={() => handleModeChange('move')}
            className="flex items-center gap-2"
            disabled={currentBoundary.length === 0}
          >
            <Move className="w-4 h-4" />
            Move
          </Button>
          
          <Button
            size="sm"
            variant={editingMode === 'edit' ? 'default' : 'outline'}
            onClick={() => handleModeChange('edit')}
            className="flex items-center gap-2"
            disabled={currentBoundary.length === 0}
          >
            <Square className="w-4 h-4" />
            Edit
          </Button>
        </div>

        {/* Drawing Instructions */}
        {editingMode === 'draw' && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700">
              <Edit3 className="w-4 h-4" />
              <span className="font-medium">Drawing Mode</span>
            </div>
            <p className="text-sm text-blue-600 mt-1">
              Click on the map to add boundary points. Create a closed shape by connecting back to the first point.
            </p>
          </div>
        )}

        {/* Editing Instructions */}
        {editingMode === 'edit' && (
          <div className="mb-4 p-3 bg-amber-50 rounded-lg">
            <div className="flex items-center gap-2 text-amber-700">
              <Square className="w-4 h-4" />
              <span className="font-medium">Edit Mode</span>
            </div>
            <p className="text-sm text-amber-600 mt-1">
              Click on boundary points to select and modify them. Use the controls below to adjust.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            size="sm"
            variant="outline"
            onClick={onUndo}
            disabled={!canUndo}
            className="flex items-center gap-2"
          >
            <Undo className="w-4 h-4" />
            Undo
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={onRedo}
            disabled={!canRedo}
            className="flex items-center gap-2"
          >
            <Redo className="w-4 h-4" />
            Redo
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={onClear}
            disabled={currentBoundary.length === 0}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleCenterOnBoundary}
            disabled={currentBoundary.length === 0}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Center
          </Button>
        </div>

        {/* Zoom Controls */}
        <div className="flex gap-2 mb-4">
          <Button
            size="sm"
            variant="outline"
            onClick={handleZoomIn}
            className="flex items-center gap-2"
          >
            <ZoomIn className="w-4 h-4" />
            Zoom In
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleZoomOut}
            className="flex items-center gap-2"
          >
            <ZoomOut className="w-4 h-4" />
            Zoom Out
          </Button>
        </div>

        {/* Save/Cancel Actions */}
        {isEditing && (
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={!canSave}
              className="flex items-center gap-2 flex-1"
            >
              <Save className="w-4 h-4" />
              Save Boundary
            </Button>
            
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Boundary Info Panel */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <h4 className="font-semibold mb-3">Boundary Information</h4>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Points:</span>
            <span className="font-medium">{currentBoundary.length}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Area:</span>
            <span className="font-medium">
              {boundaryArea > 0 ? `${boundaryArea.toFixed(2)} units²` : 'N/A'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <div className="flex items-center gap-1">
              {isValid ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-500" />
              )}
              <span className={cn(
                'font-medium',
                isValid ? 'text-green-600' : 'text-red-600'
              )}>
                {isValid ? 'Valid' : 'Invalid'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Errors */}
      {(!isValid || showValidation) && validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700 mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-medium">Validation Errors</span>
          </div>
          <ul className="text-sm text-red-600 space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Selected Point Info */}
      {selectedPoint && editingMode === 'edit' && (
        <div className="bg-white rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">Selected Point</h4>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDeletePoint(selectedPoint)}
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>
          
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Point ID:</span>
              <span className="font-mono">{selectedPoint}</span>
            </div>
            
            {(() => {
              const point = currentBoundary.find(p => p.id === selectedPoint)
              if (point) {
                return (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Latitude:</span>
                      <span className="font-mono">{point.lat.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Longitude:</span>
                      <span className="font-mono">{point.lng.toFixed(6)}</span>
                    </div>
                  </>
                )
              }
              return null
            })()}
          </div>
        </div>
      )}
    </div>
  )
}

export default BoundaryEditingTools