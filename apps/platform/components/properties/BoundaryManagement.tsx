'use client';
// apps/platform/components/properties/BoundaryManagement.tsx

import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, DrawingManager, Polygon, OverlayView } from '@react-google-maps/api';
import type { Polygon as PolygonInstance } from '@react-google-maps/api';
import { useQuery } from '@tanstack/react-query';
import {
    CheckCircle2,
    AlertTriangle,
    MapPin,
    Pencil,
    Trash2,
    Save,
    RotateCcw,
    Info,
    Layers,
} from 'lucide-react';
import { Button } from '@newcondo/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Badge } from '@newcondo/ui/components/badge';
import { useMarkProperty } from '@/hooks/useProperties';
import { propertyApi } from '@/lib/api/properties';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BoundaryManagementProps {
    propertyId: string;
}

interface LatLng {
    lat: number;
    lng: number;
}

type MapMode = 'view' | 'draw' | 'edit';

const LIBRARIES: ('drawing' | 'geometry')[] = ['drawing', 'geometry'];

const MAP_CONTAINER_STYLE = { width: '100%', height: '500px', borderRadius: '0.5rem' };

const DEFAULT_CENTER: LatLng = { lat: 6.5244, lng: 3.3792 }; // Lagos

// ─── Component ────────────────────────────────────────────────────────────────

export default function BoundaryManagement({ propertyId }: BoundaryManagementProps) {
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
        libraries: LIBRARIES,
    });

    const { data: property, isLoading } = useQuery({
        queryKey: ['property', propertyId],
        queryFn: () => propertyApi.getById(propertyId),
        staleTime: 5 * 60 * 1000,
    });

    const markProperty = useMarkProperty();

    const mapRef = useRef<google.maps.Map | null>(null);
    const polygonInstanceRef = useRef<google.maps.Polygon | null>(null);

    const [mode, setMode] = useState<MapMode>('view');
    const [drawnPath, setDrawnPath] = useState<LatLng[]>([]);
    const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('satellite');
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Parse existing boundary coordinates from the property
    const existingBoundary: LatLng[] | null = (() => {
        try {
            const raw = property?.boundaryCoordinates as any;
            if (!raw) return null;
            // GeoJSON Polygon: coordinates[0] is outer ring [[lng, lat], ...]
            const ring: number[][] = raw?.coordinates?.[0] ?? [];
            return ring.map(([lng, lat]) => ({ lat, lng }));
        } catch {
            return null;
        }
    })();

    // Centre the map on the property GPS or existing boundary centroid
    const mapCenter: LatLng = (() => {
        if (property?.gpsCoordinates) {
            try {
                return JSON.parse(property.gpsCoordinates) as LatLng;
            } catch { /* fall through */ }
        }
        if (existingBoundary && existingBoundary.length > 0) {
            const avgLat = existingBoundary.reduce((s, p) => s + p.lat, 0) / existingBoundary.length;
            const avgLng = existingBoundary.reduce((s, p) => s + p.lng, 0) / existingBoundary.length;
            return { lat: avgLat, lng: avgLng };
        }
        return DEFAULT_CENTER;
    })();

    const onMapLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
    }, []);

    // Store the react-google-maps Polygon wrapper instance when it mounts
    const onPolygonLoad = useCallback((polygon: google.maps.Polygon) => {
        polygonInstanceRef.current = polygon;
    }, []);

    const onPolygonUnmount = useCallback(() => {
        polygonInstanceRef.current = null;
    }, []);

    // When a polygon is completed via DrawingManager
    const onPolygonComplete = useCallback((polygon: google.maps.Polygon) => {
        const path = polygon.getPath().getArray().map((ll) => ({
            lat: ll.lat(),
            lng: ll.lng(),
        }));
        setDrawnPath(path);
        // Remove the DrawingManager's polygon — we'll render our own controlled one
        polygon.setMap(null);
        setMode('edit');
    }, []);

    const onPolygonMouseUp = useCallback(() => {
        const polygon = polygonInstanceRef.current;
        if (!polygon) return;
        const updated = polygon
            .getPath()
            .getArray()
            .map((ll) => ({ lat: ll.lat(), lng: ll.lng() }));
        setDrawnPath(updated);
    }, []);

    const handleReset = () => {
        setDrawnPath([]);
        setSaveError(null);
        setSaveSuccess(false);
        setMode('view');
    };

    const handleStartDrawing = () => {
        setDrawnPath([]);
        setSaveError(null);
        setSaveSuccess(false);
        setMode('draw');
    };

    const handleSave = async () => {
        const path = drawnPath.length > 0 ? drawnPath : existingBoundary;
        if (!path || path.length < 3) {
            setSaveError('Please draw a boundary with at least 3 points.');
            return;
        }

        setIsSaving(true);
        setSaveError(null);
        setSaveSuccess(false);

        try {
            await markProperty.mutateAsync({
                propertyId,
                data: {
                    boundaryCoordinates: path,
                    boundaryImages: [],
                    boundaryVerified: false,
                    boundaryMarkedAt: new Date(),
                },
            });
            setSaveSuccess(true);
            setDrawnPath([]);
            setMode('view');
        } catch {
            setSaveError('Failed to save boundary. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    // Active path to display: prefer newly drawn over existing
    const displayPath = drawnPath.length > 0 ? drawnPath : existingBoundary ?? [];

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Card className="animate-pulse">
                    <CardContent className="h-64" />
                </Card>
            </div>
        );
    }

    if (loadError) {
        return (
            <Card>
                <CardContent className="py-12 text-center text-red-500">
                    <AlertTriangle className="mx-auto mb-2 h-8 w-8" />
                    Failed to load Google Maps. Check your API key configuration.
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Boundary Management</h2>
                    {property && (
                        <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                            <MapPin className="h-4 w-4" />
                            {property.address}, {property.city}, {property.state}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {property?.boundaryVerified ? (
                        <Badge className="bg-green-100 text-green-800 gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Verified
                        </Badge>
                    ) : (
                        <Badge className="bg-orange-100 text-orange-800 gap-1">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Not Verified
                        </Badge>
                    )}
                </div>
            </div>

            {/* Info Banner */}
            <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                    Switch to <strong>Satellite</strong> view and use <strong>Draw Boundary</strong> to outline your
                    property on the map. The saved boundary prevents duplicate listings and verifies your
                    property's geolocation.
                </p>
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMapType((t) => (t === 'satellite' ? 'roadmap' : 'satellite'))}
                    className="gap-1.5"
                >
                    <Layers className="h-4 w-4" />
                    {mapType === 'satellite' ? 'Street View' : 'Satellite'}
                </Button>

                {mode === 'view' && (
                    <Button size="sm" onClick={handleStartDrawing} className="gap-1.5">
                        <Pencil className="h-4 w-4" />
                        {existingBoundary ? 'Redraw Boundary' : 'Draw Boundary'}
                    </Button>
                )}

                {(mode === 'draw' || mode === 'edit') && (
                    <>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleReset}
                            className="gap-1.5"
                        >
                            <RotateCcw className="h-4 w-4" />
                            Cancel
                        </Button>

                        {drawnPath.length >= 3 && (
                            <Button
                                size="sm"
                                onClick={handleSave}
                                disabled={isSaving}
                                className="gap-1.5"
                            >
                                <Save className="h-4 w-4" />
                                {isSaving ? 'Saving…' : 'Save Boundary'}
                            </Button>
                        )}
                    </>
                )}

                {mode === 'view' && existingBoundary && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setDrawnPath([]);
                            setSaveError(null);
                        }}
                        className="gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                        <Trash2 className="h-4 w-4" />
                        Clear Boundary
                    </Button>
                )}
            </div>

            {/* Status messages */}
            {saveError && (
                <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {saveError}
                </div>
            )}
            {saveSuccess && (
                <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Boundary saved successfully. It will be verified by the Newcondo team shortly.
                </div>
            )}

            {/* Map */}
            {isLoaded && (
                <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                    <GoogleMap
                        mapContainerStyle={MAP_CONTAINER_STYLE}
                        center={mapCenter}
                        zoom={19}
                        mapTypeId={mapType}
                        onLoad={onMapLoad}
                        options={{
                            mapTypeControl: false,
                            streetViewControl: false,
                            fullscreenControl: true,
                            zoomControl: true,
                        }}
                    >
                        {/* Drawing manager — only active in draw mode */}
                        {mode === 'draw' && (
                            <DrawingManager
                                onPolygonComplete={onPolygonComplete}
                                options={{
                                    drawingControl: false, // we control this via our own toolbar
                                    drawingMode: google.maps.drawing.OverlayType.POLYGON,
                                    polygonOptions: {
                                        fillColor: '#3b82f6',
                                        fillOpacity: 0.25,
                                        strokeColor: '#1d4ed8',
                                        strokeWeight: 2,
                                        editable: true,
                                        draggable: false,
                                    },
                                }}
                            />
                        )}

                        {/* Controlled polygon overlay */}
                        {displayPath.length >= 3 && (
                            <Polygon
                                paths={displayPath}
                                onLoad={onPolygonLoad}
                                onUnmount={onPolygonUnmount}
                                onMouseUp={onPolygonMouseUp}
                                options={{
                                    fillColor: drawnPath.length > 0 ? '#3b82f6' : '#10b981',
                                    fillOpacity: 0.2,
                                    strokeColor: drawnPath.length > 0 ? '#1d4ed8' : '#059669',
                                    strokeWeight: 2,
                                    editable: mode === 'edit',
                                    draggable: false,
                                }}

                            />
                        )}

                        {/* Centre pin */}
                        <OverlayView position={mapCenter} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
                            <div className="flex -translate-x-1/2 -translate-y-full flex-col items-center">
                                <div className="rounded bg-white px-2 py-0.5 text-xs font-medium shadow">
                                    {property?.title ?? 'Property'}
                                </div>
                                <MapPin className="h-6 w-6 text-red-500 drop-shadow" />
                            </div>
                        </OverlayView>
                    </GoogleMap>
                </div>
            )}

            {/* Boundary info card */}
            {existingBoundary && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Current Boundary</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-gray-600 space-y-1">
                        <p>
                            <span className="font-medium">Points:</span> {existingBoundary.length}
                        </p>
                        {property?.boundaryMarkedAt && (
                            <p>
                                <span className="font-medium">Marked on:</span>{' '}
                                {new Date(property.boundaryMarkedAt).toLocaleDateString('en-NG', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                })}
                            </p>
                        )}
                        <p>
                            <span className="font-medium">Status:</span>{' '}
                            {property?.boundaryVerified ? (
                                <span className="text-green-600">Verified</span>
                            ) : (
                                <span className="text-orange-500">Pending verification</span>
                            )}
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}