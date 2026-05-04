// apps/platform/hooks/useMarkingService.ts
'use client'

import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Types for marking service
interface PropertyMarkingJob {
    id: string;
    propertyId: string;
    requestedBy: string;
    assignedAgentId?: string;
    contactPersonName: string;
    contactPersonPhone: string;
    accessInstructions?: string;
    preferredTime?: Date;
    urgencyLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    markingFee: number;
    paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'HELD' | 'RELEASED';
    status: 'QUEUED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
    assignedAt?: Date;
    completedAt?: Date;
    timeSlotExpiry?: Date;
    completionNotes?: string;
    completionImages?: string[];
    boundaryData?: any;
    queuePosition?: number;
    maxCompletionTime?: Date;
    createdAt: Date;
    updatedAt: Date;
}

interface CreateMarkingJobRequest {
    propertyId: string;
    contactPersonName: string;
    contactPersonPhone: string;
    accessInstructions?: string;
    preferredTime?: Date;
    urgencyLevel?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    markingOption: 'SELF_ASSIGN' | 'AGENT_ASSIGN'; // User assigns someone they know or use Newcondo agent
    assigneeDetails?: {
        name?: string;
        phone?: string;
        relationship?: string;
    };
}

interface MarkingJobPayment {
    jobId: string;
    amount: number;
    paymentMethod: string;
}

interface CompleteMarkingJobRequest {
    jobId: string;
    boundaryData: {
        coordinates: Array<{ lat: number; lng: number }>;
        center: { lat: number; lng: number };
        area: number;
        accuracy: number;
    };
    completionNotes?: string;
    completionImages: string[];
}

// Mock API functions - these will be replaced with actual API calls
const mockApi = {
    createMarkingJob: async (data: CreateMarkingJobRequest): Promise<PropertyMarkingJob> => {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        const mockJob: PropertyMarkingJob = {
            id: `job_${Date.now()}`,
            propertyId: data.propertyId,
            requestedBy: 'current_user_id', // This would come from auth context
            contactPersonName: data.contactPersonName,
            contactPersonPhone: data.contactPersonPhone,
            accessInstructions: data.accessInstructions,
            preferredTime: data.preferredTime,
            urgencyLevel: data.urgencyLevel || 'NORMAL',
            markingFee: data.urgencyLevel === 'URGENT' ? 15000 : data.urgencyLevel === 'HIGH' ? 12000 : 10000,
            paymentStatus: 'PENDING',
            status: 'QUEUED',
            queuePosition: Math.floor(Math.random() * 10) + 1,
            maxCompletionTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        return mockJob;
    },

    getMarkingJob: async (jobId: string): Promise<PropertyMarkingJob> => {
        await new Promise(resolve => setTimeout(resolve, 500));

        // Mock job data
        return {
            id: jobId,
            propertyId: 'prop_123',
            requestedBy: 'current_user_id',
            contactPersonName: 'John Doe',
            contactPersonPhone: '+234812345678',
            accessInstructions: 'Ring the doorbell twice',
            urgencyLevel: 'NORMAL',
            markingFee: 10000,
            paymentStatus: 'PENDING',
            status: 'QUEUED',
            queuePosition: 3,
            maxCompletionTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    },

    getUserMarkingJobs: async (): Promise<PropertyMarkingJob[]> => {
        await new Promise(resolve => setTimeout(resolve, 500));

        // Mock user's marking jobs
        return [
            {
                id: 'job_1',
                propertyId: 'prop_123',
                requestedBy: 'current_user_id',
                contactPersonName: 'John Doe',
                contactPersonPhone: '+234812345678',
                urgencyLevel: 'NORMAL',
                markingFee: 10000,
                paymentStatus: 'SUCCESS',
                status: 'COMPLETED',
                completedAt: new Date(),
                completionNotes: 'Property boundary marked successfully',
                completionImages: ['image1.jpg', 'image2.jpg'],
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        ];
    },

    payForMarkingJob: async (data: MarkingJobPayment): Promise<{ paymentUrl: string; reference: string }> => {
        await new Promise(resolve => setTimeout(resolve, 1000));

        return {
            paymentUrl: `https://checkout.flutterwave.com/v3/hosted/pay/${data.jobId}`,
            reference: `ref_${Date.now()}`,
        };
    },

    completeMarkingJob: async (data: CompleteMarkingJobRequest): Promise<PropertyMarkingJob> => {
        await new Promise(resolve => setTimeout(resolve, 1000));

        return {
            id: data.jobId,
            propertyId: 'prop_123',
            requestedBy: 'current_user_id',
            contactPersonName: 'John Doe',
            contactPersonPhone: '+234812345678',
            urgencyLevel: 'NORMAL',
            markingFee: 10000,
            paymentStatus: 'SUCCESS',
            status: 'COMPLETED',
            completedAt: new Date(),
            completionNotes: data.completionNotes,
            completionImages: data.completionImages,
            boundaryData: data.boundaryData,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    },

    getAvailableAgents: async (area: string) => {
        await new Promise(resolve => setTimeout(resolve, 500));

        return [
            { id: 'agent_1', name: 'Agent Smith', rating: 4.8, completedJobs: 45, distance: 2.3 },
            { id: 'agent_2', name: 'Agent Johnson', rating: 4.6, completedJobs: 38, distance: 3.1 },
        ];
    },

    calculateMarkingFee: async (urgencyLevel: string, area: string) => {
        await new Promise(resolve => setTimeout(resolve, 300));

        const baseFee = 10000;
        const urgencyMultiplier = urgencyLevel === 'URGENT' ? 1.5 : urgencyLevel === 'HIGH' ? 1.2 : 1;

        return {
            baseFee,
            urgencyFee: baseFee * (urgencyMultiplier - 1),
            totalFee: baseFee * urgencyMultiplier,
        };
    },
};

export const useMarkingService = () => {
    const [isCreatingJob, setIsCreatingJob] = useState(false);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const queryClient = useQueryClient();

    // Create marking job mutation
    const createMarkingJobMutation = useMutation({
        mutationFn: mockApi.createMarkingJob,
        onMutate: () => {
            setIsCreatingJob(true);
        },
        onSuccess: (data) => {
            toast.success('Marking job created successfully!');
            queryClient.invalidateQueries({ queryKey: ['markingJobs'] });
            setIsCreatingJob(false);
        },
        onError: (error) => {
            toast.error('Failed to create marking job');
            console.error('Create marking job error:', error);
            setIsCreatingJob(false);
        },
    });

    // Pay for marking job mutation
    const payForJobMutation = useMutation({
        mutationFn: mockApi.payForMarkingJob,
        onMutate: () => {
            setIsProcessingPayment(true);
        },
        onSuccess: (data) => {
            // Redirect to payment URL
            window.open(data.paymentUrl, '_blank');
            setIsProcessingPayment(false);
        },
        onError: (error) => {
            toast.error('Failed to process payment');
            console.error('Payment error:', error);
            setIsProcessingPayment(false);
        },
    });

    // Complete marking job mutation
    const completeJobMutation = useMutation({
        mutationFn: mockApi.completeMarkingJob,
        onSuccess: (data) => {
            toast.success('Marking job completed successfully!');
            queryClient.invalidateQueries({ queryKey: ['markingJobs'] });
            queryClient.invalidateQueries({ queryKey: ['markingJob', data.id] });
        },
        onError: (error) => {
            toast.error('Failed to complete marking job');
            console.error('Complete job error:', error);
        },
    });

    // Query hooks
    const useMarkingJob = (jobId: string) => {
        return useQuery({
            queryKey: ['markingJob', jobId],
            queryFn: () => mockApi.getMarkingJob(jobId),
            enabled: !!jobId,
        });
    };

    const useUserMarkingJobs = () => {
        return useQuery({
            queryKey: ['markingJobs'],
            queryFn: mockApi.getUserMarkingJobs,
        });
    };

    const useAvailableAgents = (area: string) => {
        return useQuery({
            queryKey: ['availableAgents', area],
            queryFn: () => mockApi.getAvailableAgents(area),
            enabled: !!area,
        });
    };

    const useMarkingFeeCalculation = (urgencyLevel: string, area: string) => {
        return useQuery({
            queryKey: ['markingFee', urgencyLevel, area],
            queryFn: () => mockApi.calculateMarkingFee(urgencyLevel, area),
            enabled: !!urgencyLevel && !!area,
        });
    };

    // Utility functions
    const createMarkingJob = useCallback((data: CreateMarkingJobRequest) => {
        return createMarkingJobMutation.mutate(data);
    }, [createMarkingJobMutation]);

    const payForMarkingJob = useCallback((data: MarkingJobPayment) => {
        return payForJobMutation.mutate(data);
    }, [payForJobMutation]);

    const completeMarkingJob = useCallback((data: CompleteMarkingJobRequest) => {
        return completeJobMutation.mutate(data);
    }, [completeJobMutation]);

    const getJobStatusColor = useCallback((status: PropertyMarkingJob['status']) => {
        const colors = {
            QUEUED: 'bg-yellow-100 text-yellow-800',
            ASSIGNED: 'bg-blue-100 text-blue-800',
            IN_PROGRESS: 'bg-purple-100 text-purple-800',
            COMPLETED: 'bg-green-100 text-green-800',
            CANCELLED: 'bg-red-100 text-red-800',
            EXPIRED: 'bg-gray-100 text-gray-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    }, []);

    const getPaymentStatusColor = useCallback((status: PropertyMarkingJob['paymentStatus']) => {
        const colors = {
            PENDING: 'bg-yellow-100 text-yellow-800',
            SUCCESS: 'bg-green-100 text-green-800',
            FAILED: 'bg-red-100 text-red-800',
            CANCELLED: 'bg-gray-100 text-gray-800',
            REFUNDED: 'bg-orange-100 text-orange-800',
            HELD: 'bg-blue-100 text-blue-800',
            RELEASED: 'bg-green-100 text-green-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    }, []);

    const canCompleteJob = useCallback((job: PropertyMarkingJob) => {
        return job.status === 'IN_PROGRESS' && job.paymentStatus === 'SUCCESS';
    }, []);

    const isJobExpired = useCallback((job: PropertyMarkingJob) => {
        return job.maxCompletionTime ? new Date() > new Date(job.maxCompletionTime) : false;
    }, []);

    return {
        // Mutations
        createMarkingJob,
        payForMarkingJob,
        completeMarkingJob,

        // Query hooks
        useMarkingJob,
        useUserMarkingJobs,
        useAvailableAgents,
        useMarkingFeeCalculation,

        // Loading states
        isCreatingJob: isCreatingJob || createMarkingJobMutation.isPending,
        isProcessingPayment: isProcessingPayment || payForJobMutation.isPending,
        isCompletingJob: completeJobMutation.isPending,

        // Utility functions
        getJobStatusColor,
        getPaymentStatusColor,
        canCompleteJob,
        isJobExpired,

        // Mutation objects for additional control
        createJobMutation: createMarkingJobMutation,
        payJobMutation: payForJobMutation,
        completeJobMutation: completeJobMutation,
    };
};