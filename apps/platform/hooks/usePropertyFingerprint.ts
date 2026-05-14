// apps/platform/hooks/usePropertyFingerprint.ts
'use client'

import { useState, useCallback} from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Types for property fingerprinting
interface PropertyBoundary {
    coordinates: Array<{ lat: number; lng: number }>;
    center: { lat: number; lng: number };
    area: number; // in square meters
    perimeter: number; // in meters
    boundingBox: {
        north: number;
        south: number;
        east: number;
        west: number;
    };
}

interface PropertyFingerprint {
    id: string;
    propertyId: string;
    buildingFingerprint: string; // Unique identifier hash
    gpsCoordinates: { lat: number; lng: number };
    boundaryCoordinates: PropertyBoundary;
    buildingFeatures: {
        structureType: string;
        approximateArea: number;
        roofType?: string;
        storeys?: number;
        uniqueFeatures: string[];
    };
    visualMarkers: {
        streetViewImageHash?: string;
        satelliteImageHash?: string;
        nearbyLandmarks: string[];
    };
    verificationLevel: 'PENDING' | 'AGENT_VERIFIED' | 'OWNER_VERIFIED' | 'DISPUTED';
    accuracy: number; // GPS accuracy in meters
    createdAt: Date;
    updatedAt: Date;
}

interface DuplicateProperty {
    id: string;
    fingerprint: PropertyFingerprint;
    similarity: number; // 0-100%
    matchingFactors: Array<'LOCATION' | 'BOUNDARY' | 'FEATURES' | 'VISUAL'>;
    distance: number; // distance in meters from the queried location
    status: 'ACTIVE' | 'RENTED' | 'UNAVAILABLE' | 'DISPUTED';
    listedBy: {
        id: string;
        name: string;
        type: 'OWNER' | 'AGENT';
    };
}

interface FingerprintAnalysis {
    isUnique: boolean;
    confidence: number; // 0-100%
    duplicates: DuplicateProperty[];
    suggestions: string[];
    warnings: string[];
}

interface CreateFingerprintRequest {
    propertyId?: string;
    gpsCoordinates: { lat: number; lng: number };
    boundaryCoordinates: PropertyBoundary;
    buildingFeatures: {
        structureType: string;
        approximateArea: number;
        roofType?: string;
        storeys?: number;
        uniqueFeatures: string[];
    };
    accuracy: number;
}

interface BoundaryValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
    correctedBoundary?: PropertyBoundary;
}

// Mock API functions
const mockApi = {
    createPropertyFingerprint: async (data: CreateFingerprintRequest): Promise<PropertyFingerprint> => {
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Generate a unique building fingerprint hash
        const fingerprintHash = btoa(
            `${data.gpsCoordinates.lat},${data.gpsCoordinates.lng},${data.buildingFeatures.structureType},${data.boundaryCoordinates.area}`
        ).slice(0, 16);

        return {
            id: `fp_${Date.now()}`,
            propertyId: data.propertyId || `prop_${Date.now()}`,
            buildingFingerprint: fingerprintHash,
            gpsCoordinates: data.gpsCoordinates,
            boundaryCoordinates: data.boundaryCoordinates,
            buildingFeatures: data.buildingFeatures,
            visualMarkers: {
                nearbyLandmarks: ['Main Street', 'Bus Stop', 'Local Shop'],
            },
            verificationLevel: 'PENDING',
            accuracy: data.accuracy,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    },

    analyzeDuplicates: async (coordinates: { lat: number; lng: number }, boundary: PropertyBoundary): Promise<FingerprintAnalysis> => {
        await new Promise(resolve => setTimeout(resolve, 1200));

        // Mock duplicate detection logic
        const mockDuplicates: DuplicateProperty[] = [
            {
                id: 'dup_1',
                fingerprint: {
                    id: 'fp_existing',
                    propertyId: 'prop_existing',
                    buildingFingerprint: 'hash_existing',
                    gpsCoordinates: { lat: coordinates.lat + 0.0001, lng: coordinates.lng + 0.0001 },
                    boundaryCoordinates: boundary,
                    buildingFeatures: {
                        structureType: 'APARTMENT',
                        approximateArea: 150,
                        uniqueFeatures: ['Parking', 'Generator'],
                    },
                    visualMarkers: { nearbyLandmarks: ['Main Street'] },
                    verificationLevel: 'OWNER_VERIFIED',
                    accuracy: 5,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                similarity: 95,
                matchingFactors: ['LOCATION', 'BOUNDARY', 'FEATURES'],
                distance: 12.5,
                status: 'ACTIVE',
                listedBy: {
                    id: 'user_123',
                    name: 'John Doe',
                    type: 'OWNER',
                },
            },
        ];

        const hasHighSimilarity = mockDuplicates.some(dup => dup.similarity > 90);

        return {
            isUnique: !hasHighSimilarity,
            confidence: hasHighSimilarity ? 35 : 95,
            duplicates: mockDuplicates,
            suggestions: hasHighSimilarity
                ? ['Check if this is the same property as the one listed by John Doe', 'Verify your property boundaries']
                : ['Property appears unique', 'Continue with listing'],
            warnings: hasHighSimilarity
                ? ['High similarity detected with existing property', 'Duplicate listings are not allowed']
                : [],
        };
    },

    validateBoundary: async (boundary: PropertyBoundary): Promise<BoundaryValidationResult> => {
        await new Promise(resolve => setTimeout(resolve, 800));

        const errors: string[] = [];
        const warnings: string[] = [];
        const suggestions: string[] = [];

        // Validate area (not too large or small)
        if (boundary.area > 10000) { // 1 hectare
            errors.push('Property area too large. Maximum allowed is 1 hectare.');
        }
        if (boundary.area < 10) {
            errors.push('Property area too small. Minimum allowed is 10 square meters.');
        }

        // Validate shape (not too irregular)
        const aspectRatio = boundary.boundingBox.north - boundary.boundingBox.south;
        if (aspectRatio > 5) {
            warnings.push('Property shape appears very elongated. Please verify boundaries.');
        }

        // Check for reasonable perimeter-to-area ratio
        const efficiency = (4 * Math.PI * boundary.area) / (boundary.perimeter * boundary.perimeter);
        if (efficiency < 0.3) {
            suggestions.push('Consider simplifying boundary shape for better accuracy.');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            suggestions,
        };
    },

    searchNearbyFingerprints: async (
        center: { lat: number; lng: number },
        radius: number = 100
    ): Promise<PropertyFingerprint[]> => {
        await new Promise(resolve => setTimeout(resolve, 600));

        return [
            {
                id: 'fp_nearby_1',
                propertyId: 'prop_nearby_1',
                buildingFingerprint: 'hash_nearby_1',
                gpsCoordinates: { lat: center.lat + 0.0005, lng: center.lng + 0.0005 },
                boundaryCoordinates: {
                    coordinates: [
                        { lat: center.lat + 0.0004, lng: center.lng + 0.0004 },
                        { lat: center.lat + 0.0006, lng: center.lng + 0.0004 },
                        { lat: center.lat + 0.0006, lng: center.lng + 0.0006 },
                        { lat: center.lat + 0.0004, lng: center.lng + 0.0006 },
                    ],
                    center: { lat: center.lat + 0.0005, lng: center.lng + 0.0005 },
                    area: 200,
                    perimeter: 60,
                    boundingBox: {
                        north: center.lat + 0.0006,
                        south: center.lat + 0.0004,
                        east: center.lng + 0.0006,
                        west: center.lng + 0.0004,
                    },
                },
                buildingFeatures: {
                    structureType: 'HOUSE',
                    approximateArea: 180,
                    storeys: 2,
                    uniqueFeatures: ['Garden', 'Garage'],
                },
                visualMarkers: {
                    nearbyLandmarks: ['School', 'Park'],
                },
                verificationLevel: 'AGENT_VERIFIED',
                accuracy: 3,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];
    },

    updateFingerprint: async (id: string, updates: Partial<PropertyFingerprint>): Promise<PropertyFingerprint> => {
        await new Promise(resolve => setTimeout(resolve, 800));

        // Mock update response
        return {
            id,
            propertyId: 'prop_123',
            buildingFingerprint: 'updated_hash',
            gpsCoordinates: { lat: 6.5244, lng: 3.3792 },
            boundaryCoordinates: {
                coordinates: [],
                center: { lat: 6.5244, lng: 3.3792 },
                area: 150,
                perimeter: 50,
                boundingBox: { north: 6.525, south: 6.524, east: 3.380, west: 3.378 },
            },
            buildingFeatures: {
                structureType: 'APARTMENT',
                approximateArea: 150,
                uniqueFeatures: [],
            },
            visualMarkers: {
                nearbyLandmarks: [],
            },
            verificationLevel: 'OWNER_VERIFIED',
            accuracy: 5,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...updates,
        };
    },
};

export const usePropertyFingerprint = () => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<FingerprintAnalysis | null>(null);
    const queryClient = useQueryClient();

    // Create fingerprint mutation
    const createFingerprintMutation = useMutation({
        mutationFn: mockApi.createPropertyFingerprint,
        onSuccess: (data) => {
            toast.success('Property fingerprint created successfully');
            queryClient.invalidateQueries({ queryKey: ['propertyFingerprints'] });
        },
        onError: (error) => {
            toast.error('Failed to create property fingerprint');
            console.error('Create fingerprint error:', error);
        },
    });

    // Update fingerprint mutation
    const updateFingerprintMutation = useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<PropertyFingerprint> }) =>
            mockApi.updateFingerprint(id, updates),
        onSuccess: () => {
            toast.success('Property fingerprint updated successfully');
            queryClient.invalidateQueries({ queryKey: ['propertyFingerprints'] });
        },
        onError: (error) => {
            toast.error('Failed to update property fingerprint');
            console.error('Update fingerprint error:', error);
        },
    });

    // Query for nearby fingerprints
    const useNearbyFingerprints = (center: { lat: number; lng: number } | null, radius = 100) => {
        return useQuery({
            queryKey: ['nearbyFingerprints', center, radius],
            queryFn: () => mockApi.searchNearbyFingerprints(center!, radius),
            enabled: !!center,
            refetchOnWindowFocus: false,
        });
    };

    // Analyze for duplicates
    const analyzeDuplicates = useCallback(async (
        coordinates: { lat: number; lng: number },
        boundary: PropertyBoundary
    ) => {
        setIsAnalyzing(true);
        try {
            const result = await mockApi.analyzeDuplicates(coordinates, boundary);
            setAnalysisResult(result);
            return result;
        } catch (error) {
            toast.error('Failed to analyze for duplicates');
            console.error('Duplicate analysis error:', error);
            throw error;
        } finally {
            setIsAnalyzing(false);
        }
    }, []);

    // Validate boundary
    const validateBoundary = useCallback(async (boundary: PropertyBoundary) => {
        try {
            const result = await mockApi.validateBoundary(boundary);
            if (!result.isValid) {
                result.errors.forEach(error => toast.error(error));
            }
            if (result.warnings.length > 0) {
                result.warnings.forEach(warning => toast.warning(warning));
            }
            return result;
        } catch (error) {
            toast.error('Failed to validate boundary');
            console.error('Boundary validation error:', error);
            throw error;
        }
    }, []);

    // Utility functions
    const generateBoundaryFromPoints = useCallback((points: Array<{ lat: number; lng: number }>): PropertyBoundary => {
        if (points.length < 3) {
            throw new Error('At least 3 points are required to create a boundary');
        }

        // Calculate center
        const center = {
            lat: points.reduce((sum, p) => sum + p.lat, 0) / points.length,
            lng: points.reduce((sum, p) => sum + p.lng, 0) / points.length,
        };

        // Calculate bounding box
        const lats = points.map(p => p.lat);
        const lngs = points.map(p => p.lng);
        const boundingBox = {
            north: Math.max(...lats),
            south: Math.min(...lats),
            east: Math.max(...lngs),
            west: Math.min(...lngs),
        };

        // Calculate area using shoelace formula
        let area = 0;
        for (let i = 0; i < points.length; i++) {
            const j = (i + 1) % points.length;
            area += points[i].lat * points[j].lng;
            area -= points[j].lat * points[i].lng;
        }
        area = Math.abs(area) / 2;

        // Convert to square meters (approximate)
        const areaInMeters = area * 111000 * 111000 * Math.cos((center.lat * Math.PI) / 180);

        // Calculate perimeter
        let perimeter = 0;
        for (let i = 0; i < points.length; i++) {
            const j = (i + 1) % points.length;
            const dist = calculateDistance(points[i], points[j]);
            perimeter += dist;
        }

        return {
            coordinates: points,
            center,
            area: areaInMeters,
            perimeter,
            boundingBox,
        };
    }, []);

    const calculateDistance = useCallback((point1: { lat: number; lng: number }, point2: { lat: number; lng: number }) => {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = (point1.lat * Math.PI) / 180;
        const φ2 = (point2.lat * Math.PI) / 180;
        const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
        const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;


        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));


        return R * c; // distance in meters
    }, []);


    return {
        createFingerprint: createFingerprintMutation.mutateAsync,
        updateFingerprint: updateFingerprintMutation.mutateAsync,
        useNearbyFingerprints,
        analyzeDuplicates,
        validateBoundary,
        generateBoundaryFromPoints,
        calculateDistance,
        isAnalyzing,
        analysisResult,
    };
};