// apps/platform/components/marking/AgentLocationMap.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { GoogleMap, useJsApiLoader, Marker, Circle, InfoWindow } from '@react-google-maps/api'
import { Card } from '@/components/ui/card'
import { AlertCircle, MapPin, Navigation } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface JobLocation {
  id: string
  title: string
  lat: number
  lng: number
  distance: number // in km
  timeToReach: number // in minutes
  priority: 'HIGH' | 'NORMAL' | 'LOW'
}

interface AgentLocationMapProps {
  agentLat: number
  agentLng: number
  availableJobs: JobLocation[]
  onJobSelect?: (jobId: string) => void
  maxProximity?: number // in km, default 15
  zoom?: number
}

const containerStyle = {
  width: '100%',
  height: '400px',
}

export default function AgentLocationMap({
  agentLat,
  agentLng,
  availableJobs,
  onJobSelect,
  maxProximity = 15,
  zoom = 13,
}: AgentLocationMapProps) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  })

  const [selectedJob, setSelectedJob] = useState<JobLocation | null>(null)
  const [filteredJobs, setFilteredJobs] = useState<JobLocation[]>([])
  const [mapCenter, setMapCenter] = useState({ lat: agentLat, lng: agentLng })

  useEffect(() => {
    // Filter jobs within max proximity
    const filtered = availableJobs.filter(job => job.distance <= maxProximity)
    setFilteredJobs(filtered)
  }, [availableJobs, maxProximity])

  if (!isLoaded) {
    return (
      <Card className="p-4 bg-slate-50">
        <div className="flex items-center justify-center h-96">
          <p className="text-slate-600">Loading map...</p>
        </div>
      </Card>
    )
  }

  const getMarkerColor = (distance: number): string => {
    if (distance < 3) return '#10b981' // Green - very close
    if (distance < 8) return '#f59e0b' // Amber - moderate
    return '#ef4444' // Red - far
  }

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'HIGH':
        return '#dc2626'
      case 'NORMAL':
        return '#f59e0b'
      case 'LOW':
        return '#6b7280'
      default:
        return '#3b82f6'
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-slate-900">Nearby Marking Jobs</h3>
          <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
            {filteredJobs.length} jobs available
          </span>
        </div>

        {filteredJobs.length === 0 && availableJobs.length > 0 && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No jobs within {maxProximity}km. Closest job is{' '}
              {Math.min(...availableJobs.map(j => j.distance)).toFixed(1)}km away.
            </AlertDescription>
          </Alert>
        )}

        <GoogleMap
          mapContainerStyle={containerStyle}
          center={mapCenter}
          zoom={zoom}
          options={{
            restriction: {
              latLngBounds: {
                north: agentLat + 0.2,
                south: agentLat - 0.2,
                east: agentLng + 0.2,
                west: agentLng - 0.2,
              },
            },
            styles: [
              {
                featureType: 'water',
                elementType: 'geometry',
                stylers: [{ color: '#e9e9e9' }],
              },
            ],
          }}
        >
          {/* Agent Location */}
          <Marker
            position={{ lat: agentLat, lng: agentLng }}
            title="Your Location"
            icon={{
              path: 'M0,0c-3.313,0 -6,2.686 -6,6c0,6 6,12 6,12s6,-6 6,-12c0,-3.314 -2.687,-6 -6,-6l0,0zm0,8c-1.105,0 -2,-0.896 -2,-2c0,-1.105 0.895,-2 2,-2s2,0.895 2,2c0,-1.105 -0.895,-2 -2,-2l0,0z',
              fillColor: '#3b82f6',
              fillOpacity: 1,
              scale: 1.5,
              strokeColor: '#1e40af',
              strokeWeight: 2,
            }}
          />

          {/* Agent Service Area */}
          <Circle
            center={{ lat: agentLat, lng: agentLng }}
            radius={maxProximity * 1000} // Convert km to meters
            options={{
              fillColor: '#3b82f6',
              fillOpacity: 0.1,
              strokeColor: '#3b82f6',
              strokeOpacity: 0.3,
              strokeWeight: 2,
            }}
          />

          {/* Job Markers */}
          {filteredJobs.map(job => (
            <Marker
              key={job.id}
              position={{ lat: job.lat, lng: job.lng }}
              title={job.title}
              onClick={() => setSelectedJob(job)}
              icon={{
                path: 'M0,-8c-4.418,0 -8,3.582 -8,8c0,8 8,16 8,16s8,-8 8,-16c0,-4.418 -3.582,-8 -8,-8z',
                fillColor: getMarkerColor(job.distance),
                fillOpacity: 1,
                scale: 1.2,
                strokeColor: '#ffffff',
                strokeWeight: 2,
              }}
            />
          ))}

          {/* Selected Job Info */}
          {selectedJob && (
            <InfoWindow
              position={{ lat: selectedJob.lat, lng: selectedJob.lng }}
              onCloseClick={() => setSelectedJob(null)}
            >
              <div className="p-2 max-w-xs">
                <p className="font-semibold text-sm text-slate-900">{selectedJob.title}</p>
                <div className="text-xs text-slate-600 mt-1 space-y-1">
                  <p>
                    <span className="font-medium">Distance:</span> {selectedJob.distance.toFixed(1)}km
                  </p>
                  <p>
                    <span className="font-medium">Est. Time:</span> {selectedJob.timeToReach} mins
                  </p>
                  <p>
                    <span className="font-medium">Priority:</span>{' '}
                    <span
                      className="px-1 py-0.5 rounded text-white text-xs"
                      style={{ backgroundColor: getPriorityColor(selectedJob.priority) }}
                    >
                      {selectedJob.priority}
                    </span>
                  </p>
                </div>
                {onJobSelect && (
                  <button
                    onClick={() => {
                      onJobSelect(selectedJob.id)
                      setSelectedJob(null)
                    }}
                    className="mt-2 w-full text-xs bg-blue-600 text-white py-1 rounded hover:bg-blue-700 transition-colors"
                  >
                    View Details
                  </button>
                )}
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </Card>

      {/* Jobs Summary */}
      {filteredJobs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-xs text-green-600 font-medium">VERY CLOSE</p>
            <p className="text-lg font-bold text-green-700">
              {filteredJobs.filter(j => j.distance < 3).length}
            </p>
            <p className="text-xs text-green-600">&lt;3km away</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-600 font-medium">MODERATE</p>
            <p className="text-lg font-bold text-amber-700">
              {filteredJobs.filter(j => j.distance >= 3 && j.distance < 8).length}
            </p>
            <p className="text-xs text-amber-600">3-8km away</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-xs text-red-600 font-medium">FAR</p>
            <p className="text-lg font-bold text-red-700">
              {filteredJobs.filter(j => j.distance >= 8).length}
            </p>
            <p className="text-xs text-red-600">&gt;8km away</p>
          </div>
        </div>
      )}
    </div>
  )
}