// apps/platform/lib/api/markingCompletion.ts
import { client } from './client';
import type {
  CompleteMarkingJobRequest,
  MarkingCompletionResponse,
  UploadCompletionImagesRequest,
  CompletionImagesResponse,
  SubmitBoundaryDataRequest,
  BoundaryDataResponse
} from '@/types/marking';

/**
 * Mark a job as in progress (agent starts working)
 * @param jobId - The marking job ID
 */
export async function startMarkingJob(jobId: string): Promise<MarkingCompletionResponse> {
  return client.post(`/marking-completion/${jobId}/start`);
}

/**
 * Upload completion images for a marking job
 * @param jobId - The marking job ID
 * @param data - Images and metadata
 */
export async function uploadCompletionImages(
  jobId: string,
  data: UploadCompletionImagesRequest
): Promise<CompletionImagesResponse> {
  const formData = new FormData();
  
  data.images.forEach((image, index) => {
    formData.append('images', image.file);
    formData.append(`imageDescriptions[${index}]`, image.description || '');
    formData.append(`imageTypes[${index}]`, image.type); // "BOUNDARY", "ROOM", "EXTERIOR", etc.
  });

  if (data.notes) {
    formData.append('notes', data.notes);
  }

  return client.post(`/marking-completion/${jobId}/images`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * Submit boundary data (polygon coordinates)
 * @param jobId - The marking job ID
 * @param data - Boundary coordinates and metadata
 */
export async function submitBoundaryData(
  jobId: string,
  data: SubmitBoundaryDataRequest
): Promise<BoundaryDataResponse> {
  return client.post(`/marking-completion/${jobId}/boundary`, data);
}

/**
 * Complete a marking job (final submission)
 * @param jobId - The marking job ID
 * @param data - Completion data including notes, images, and boundary
 */
export async function completeMarkingJob(
  jobId: string,
  data: CompleteMarkingJobRequest
): Promise<MarkingCompletionResponse> {
  return client.post(`/marking-completion/${jobId}/complete`, data);
}

/**
 * Get completion progress for a marking job
 * @param jobId - The marking job ID
 */
export async function getCompletionProgress(jobId: string): Promise<{
  imagesUploaded: number;
  requiredImages: number;
  boundarySubmitted: boolean;
  notesProvided: boolean;
  canComplete: boolean;
  missingSteps: string[];
}> {
  return client.get(`/marking-completion/${jobId}/progress`);
}

/**
 * Delete a completion image
 * @param jobId - The marking job ID
 * @param imageId - The image ID to delete
 */
export async function deleteCompletionImage(
  jobId: string,
  imageId: string
): Promise<{
  success: boolean;
  message: string;
}> {
  return client.delete(`/marking-completion/${jobId}/images/${imageId}`);
}

/**
 * Update completion notes
 * @param jobId - The marking job ID
 * @param notes - Updated notes
 */
export async function updateCompletionNotes(
  jobId: string,
  notes: string
): Promise<{
  success: boolean;
  notes: string;
}> {
  return client.put(`/marking-completion/${jobId}/notes`, { notes });
}

/**
 * Get completion data for a job
 * @param jobId - The marking job ID
 */
export async function getCompletionData(jobId: string): Promise<{
  images: Array<{
    id: string;
    url: string;
    type: string;
    description?: string;
    uploadedAt: string;
  }>;
  boundaryData?: any;
  notes?: string;
  completedAt?: string;
  status: string;
}> {
  return client.get(`/marking-completion/${jobId}/data`);
}

/**
 * Save completion as draft (partial completion)
 * @param jobId - The marking job ID
 * @param data - Partial completion data
 */
export async function saveDraft(
  jobId: string,
  data: Partial<CompleteMarkingJobRequest>
): Promise<{
  success: boolean;
  message: string;
  savedAt: string;
}> {
  return client.post(`/marking-completion/${jobId}/draft`, data);
}

/**
 * Get agent's completion statistics
 */
export async function getAgentCompletionStats(): Promise<{
  totalCompleted: number;
  averageCompletionTime: number; // in hours
  onTimeCompletionRate: number; // percentage
  averageRating: number;
  totalEarnings: number;
}> {
  return client.get('/marking-completion/stats');
}