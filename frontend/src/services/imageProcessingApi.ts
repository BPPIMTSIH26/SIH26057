const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface QualityAssessment {
  overallScore: number;
  category: 'excellent' | 'good' | 'moderate' | 'poor';
  speckleNoise: 'low' | 'medium' | 'high';
  dataDropoutPercentage: number;
  imageCoveragePercentage: number;
  motionDistortion: 'low' | 'medium' | 'high' | 'unavailable';
  shadowVisibility: 'poor' | 'fair' | 'good' | 'unavailable';
  missingRegionPercentage: number;
  contrastScore: number;
  signalQuality: number;
  warnings: string[];
}

export interface MaskStatistics {
  usablePercentage: number;
  uncertainPercentage: number;
  ignoredPercentage: number;
  missingPercentage: number;
  shadowPercentage: number;
}

export interface RegionCandidate {
  id: string;
  label: 'likely_object' | 'likely_shadow' | 'natural_seabed_feature' | 'uncertain';
  objectConfidence: number;
  shadowConfidence: number;
  uncertainty: number;
  boundingBox: { x: number; y: number; width: number; height: number };
  features: any;
  explanation: string;
}

export interface ImageProcessingJobResponse {
  jobId: string;
  status: 'queued' | 'processing' | 'assessed' | 'completed' | 'failed';
  progress: number;
  stage: string;
  originalImageUrl?: string;
  processedImageUrl?: string;
  qualityMaskUrl?: string;
  inferenceMaskUrl?: string;
  shadowOverlayUrl?: string;
  qualityAssessment?: QualityAssessment;
  maskStatistics?: MaskStatistics;
  regionAnalysis?: RegionCandidate[];
  metadata?: any;
  processingDurationMs?: number;
  warnings?: string[];
}

const getAuthHeaders = (): Record<string, string> => {
  const token = sessionStorage.getItem('sagar_token') || localStorage.getItem('sagar_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const getErrorMessage = async (res: Response, fallback: string): Promise<string> => {
  try {
    const data = await res.json();
    if (typeof data.detail === 'string') return data.detail;
    if (data.detail?.message) return data.detail.message;
    if (data.message) return data.message;
  } catch {
    // fallback
  }
  return fallback;
};

export const imageProcessingApi = {
  createJob: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE_URL}/v1/image-processing/jobs`, {
      method: 'POST',
      body: formData,
      headers: {
        ...getAuthHeaders()
      }
    });
    if (!res.ok) {
      const msg = await getErrorMessage(res, 'Failed to create job');
      throw new Error(msg);
    }
    return res.json();
  },
  
  getJobStatus: async (jobId: string): Promise<ImageProcessingJobResponse> => {
    const res = await fetch(`${API_BASE_URL}/v1/image-processing/jobs/${jobId}`, {
      headers: {
        ...getAuthHeaders()
      }
    });
    if (!res.ok) {
      const msg = await getErrorMessage(res, 'Failed to fetch status');
      throw new Error(msg);
    }
    return res.json();
  },
  
  getJobResult: async (jobId: string): Promise<ImageProcessingJobResponse> => {
    const res = await fetch(`${API_BASE_URL}/v1/image-processing/jobs/${jobId}/result`, {
      headers: {
        ...getAuthHeaders()
      }
    });
    if (!res.ok) {
      const msg = await getErrorMessage(res, 'Failed to fetch result');
      throw new Error(msg);
    }
    return res.json();
  },
  
  getJobHistory: async (): Promise<ImageProcessingJobResponse[]> => {
    const res = await fetch(`${API_BASE_URL}/v1/image-processing/jobs/history`, {
      headers: {
        ...getAuthHeaders()
      }
    });
    if (!res.ok) {
      const msg = await getErrorMessage(res, 'Failed to fetch job history');
      throw new Error(msg);
    }
    return res.json();
  },

  analyzeJob: async (jobId: string): Promise<ImageProcessingJobResponse> => {
    const res = await fetch(`${API_BASE_URL}/v1/image-processing/jobs/${jobId}/analyze`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders()
      }
    });
    if (!res.ok) {
      const msg = await getErrorMessage(res, 'Failed to analyze job');
      throw new Error(msg);
    }
    return res.json();
  },

  deleteJob: async (jobId: string): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/v1/image-processing/jobs/${jobId}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders()
      }
    });
    if (!res.ok) {
      const msg = await getErrorMessage(res, 'Failed to delete job');
      throw new Error(msg);
    }
  },

  publishJob: async (jobId: string, location?: { latitude: number, longitude: number }): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/v1/image-processing/jobs/${jobId}/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: location ? JSON.stringify(location) : undefined
    });
    if (!res.ok) {
      const msg = await getErrorMessage(res, 'Failed to publish job anomalies');
      throw new Error(msg);
    }
    return res.json();
  }
};


