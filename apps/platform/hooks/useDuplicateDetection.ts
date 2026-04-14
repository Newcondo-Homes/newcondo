// apps/platform/hooks/useDuplicateDetection.ts
"use client"

import { useState, useCallback, useRef, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { geolocationApi, type GeolocationCoordinates, type DuplicateDetectionRequest, type DuplicateDetectionResponse, type PropertyBoundary } from '@/lib/api/geolocation';

interface DuplicateDetectionState {
    isChecking: boolean;
    duplicates: DuplicateDetectionResponse | null;
    error: string | null;
    lastCheckedCoordinates: GeolocationCoordinates | null;
}

interface UseDuplicateDetectionOptions {
    autoCheck?: boolean;
    checkRadius?: number; // in meters
    debounceMs?: number;
    minMovementThreshold?: number; // minimum distance in meters before checking again
}

interface UseDuplicateDetectionReturn extends DuplicateDetectionState {
    checkForDuplicates: (request: DuplicateDetectionRequest) => Promise<DuplicateDetectionResponse>;
    checkAtLocation: (coordinates: GeolocationCoordinates, buildingFeatures?: string[]) => Promise<DuplicateDetectionResponse>;
    clearResults: () => void;
    refreshCheck: () => void;
}

export const useDuplicateDetection = (
    options: UseDuplicateDetectionOptions = {}
): UseDuplicateDetectionReturn => {
    const {
        autoCheck = false,
        checkRadius = 50,
        debounceMs = 500,
        minMovementThreshold = 10,
    } = options;

    const [state, setState] = useState<DuplicateDetectionState>({
        isChecking: false,
        duplicates: null,
        error: null,
        lastCheckedCoordinates: null,
    });

    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastCheckRef = useRef<{
        coordinates: GeolocationCoordinates;
        timestamp: number;
    } | null>(null);

    const updateState = useCallback((updates: Partial<DuplicateDetectionState>) => {
        setState(prev => ({ ...prev, ...updates }));
    }, []);

    // Mutation for checking duplicates
    const duplicateCheckMutation = useMutation({
        mutationFn: async (request: DuplicateDetectionRequest) => {
            return await geolocationApi.detectDuplicates(request);
        },
        onMutate: () => {
            updateState({ isChecking: true, error: null });
        },
        onSuccess: (data, variables) => {
            updateState({
                isChecking: false,
                duplicates: data,
                lastCheckedCoordinates: variables.coordinates,
                error: null,
            });
            lastCheckRef.current = {
                coordinates: variables.coordinates,
                timestamp: Date.now(),
            };
        },
        onError: (error) => {
            const errorMessage = error instanceof Error ? error.message : 'Failed to check for duplicates';
            updateState({
                isChecking: false,
                error: errorMessage,
            });
        },
    });

    const checkForDuplicates = useCallback(
        async (request: DuplicateDetectionRequest): Promise<DuplicateDetectionResponse> => {
            // Check if we need to wait due to rate limiting
            if (lastCheckRef.current) {
                const timeSinceLastCheck = Date.now() - lastCheckRef.current.timestamp;
                if (timeSinceLastCheck < debounceMs) {
                    await new Promise(resolve => setTimeout(resolve, debounceMs - timeSinceLastCheck));
                }
            }

            return duplicateCheckMutation.mutateAsync({
                ...request,
                radius: request.radius || checkRadius,
            });
        },
        [duplicateCheckMutation, checkRadius, debounceMs]
    );

    const checkAtLocation = useCallback(
        async (
            coordinates: GeolocationCoordinates,
            buildingFeatures?: string[]
        ): Promise<DuplicateDetectionResponse> => {
            // Check if location has moved significantly since last check
            if (
                lastCheckRef.current &&
                minMovementThreshold > 0
            ) {
                const distance = geolocationApi.calculateDistance(
                    coordinates,
                    lastCheckRef.current.coordinates
                );

                if (distance < minMovementThreshold) {
                    // Return cached result if available and location hasn't moved much
                    if (state.duplicates) {
                        return state.duplicates;
                    }
                }
            }

            return checkForDuplicates({
                coordinates,
                buildingFeatures,
                radius: checkRadius,
            });
        },
        [checkForDuplicates, checkRadius, minMovementThreshold, state.duplicates]
    );

    const debouncedCheck = useCallback(
        (coordinates: GeolocationCoordinates, buildingFeatures?: string[]) => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }

            debounceTimeoutRef.current = setTimeout(() => {
                checkAtLocation(coordinates, buildingFeatures).catch((error) => {
                    console.error('Debounced duplicate check failed:', error);
                });
            }, debounceMs);
        },
        [checkAtLocation, debounceMs]
    );

    const clearResults = useCallback(() => {
        updateState({
            duplicates: null,
            error: null,
            lastCheckedCoordinates: null,
        });
        lastCheckRef.current = null;
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
    }, [updateState]);

    const refreshCheck = useCallback(() => {
        if (state.lastCheckedCoordinates) {
            checkAtLocation(state.lastCheckedCoordinates).catch((error) => {
                console.error('Refresh check failed:', error);
            });
        }
    }, [checkAtLocation, state.lastCheckedCoordinates]);

    return {
        ...state,
        checkForDuplicates,
        checkAtLocation,
        clearResults,
        refreshCheck,
    };
};

// Hook for managing duplicate conflict resolution
export const useDuplicateConflictResolution = () => {
    const [conflictData, setConflictData] = useState<{
        conflicts: Array<{
            id: string;
            originalProperty: any;
            conflictingProperty: any;
            reason: string;
            status: 'pending' | 'resolved' | 'disputed';
        }>;
        selectedConflict: string | null;
    }>({
        conflicts: [],
        selectedConflict: null,
    });

    const reportConflictMutation = useMutation({
        mutationFn: async (conflictData: {
            originalBoundaryId: string;
            conflictingBoundaryId: string;
            reason: string;
            description?: string;
            evidence?: string[];
        }) => {
            return await geolocationApi.reportBoundaryConflict(conflictData);
        },
    });

    const reportConflict = useCallback(
        async (conflictData: {
            originalBoundaryId: string;
            conflictingBoundaryId: string;
            reason: string;
            description?: string;
            evidence?: string[];
        }) => {
            return reportConflictMutation.mutateAsync(conflictData);
        },
        [reportConflictMutation]
    );

    const selectConflict = useCallback((conflictId: string) => {
        setConflictData(prev => ({
            ...prev,
            selectedConflict: conflictId,
        }));
    }, []);

    const clearSelection = useCallback(() => {
        setConflictData(prev => ({
            ...prev,
            selectedConflict: null,
        }));
    }, []);

    return {
        conflicts: conflictData.conflicts,
        selectedConflict: conflictData.selectedConflict,
        isReporting: reportConflictMutation.isPending,
        reportError: reportConflictMutation.error,
        reportConflict,
        selectConflict,
        clearSelection,
    };
};

// Hook for real-time duplicate detection during property creation
export const useRealtimeDuplicateDetection = (
    coordinates: GeolocationCoordinates | null,
    options: {
        enabled?: boolean;
        debounceMs?: number;
        buildingFeatures?: string[];
    } = {}
) => {
    const { enabled = true, debounceMs = 1000, buildingFeatures } = options;
    const [result, setResult] = useState<{
        isChecking: boolean;
        duplicates: DuplicateDetectionResponse | null;
        error: string | null;
    }>({
        isChecking: false,
        duplicates: null,
        error: null,
    });


    const timeoutRef = useRef<NodeJS.Timeout | null>(null);


    const checkDuplicates = useCallback(async () => {
        if (!coordinates || !enabled) return;


        setResult(prev => ({ ...prev, isChecking: true, error: null }));
        try {
            const response = await geolocationApi.detectDuplicates({
                coordinates,
                buildingFeatures,
            });
            setResult({ isChecking: false, duplicates: response, error: null });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to check for duplicates';
            setResult({ isChecking: false, duplicates: null, error: errorMessage });
        }
    }, [coordinates, enabled, buildingFeatures]);


    useEffect(() => {
        if (!enabled || !coordinates) return;


        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }


        timeoutRef.current = setTimeout(() => {
            checkDuplicates();
        }, debounceMs);


        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [coordinates, debounceMs, enabled, checkDuplicates]);


    const clearResults = useCallback(() => {
        setResult({ isChecking: false, duplicates: null, error: null });
    }, []);


    return {
        ...result,
        clearResults,
        refresh: checkDuplicates,
    };
};