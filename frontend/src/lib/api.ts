import { auth } from '@/integrations/firebase/config';

// API client for backend communication
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Get Firebase ID token from current user
 */
async function getAuthToken(): Promise<string | null> {
  try {
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
    return null;
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
}

/**
 * Helper to add auth token to request headers
 */
function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  return headers;
}

/**
 * Helper for authenticated fetch requests
 */
async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAuthToken();

  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

export const api = {
  // Upload profile
  upload: async (userId: string, photos: File[], bio: string, textResponses: any[]) => {
    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('bio', bio);
    formData.append('textResponses', JSON.stringify(textResponses));

    photos.forEach((photo) => {
      formData.append('photos', photo);
    });

    const token = await getAuthToken();
    const headers: Record<string, string> = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
        headers,
      });

      if (!response.ok) {
        let errorMessage = 'Upload failed';
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch {
          errorMessage = `Server returned ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error: any) {
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        throw new Error(`Cannot connect to backend server at ${API_BASE_URL}. Please ensure the backend server is running.`);
      }
      throw error;
    }
  },

  // Get all analyses for a user
  getUserAnalyses: async (userId: string) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/analyses/user/${userId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch analyses');
    }

    return response.json();
  },

  // Get specific analysis with photos and text responses
  getAnalysis: async (analysisId: string) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/analyses/${analysisId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch analysis');
    }

    return response.json();
  },

  // Delete an analysis
  deleteAnalysis: async (analysisId: string) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/analyses/${analysisId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete analysis');
    }

    return response.json();
  },

  // Update analysis name
  updateAnalysisName: async (analysisId: string, name: string) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/analyses/${analysisId}/name`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update analysis name');
    }

    return response.json();
  },

  // Health check (public, no auth needed)
  healthCheck: async () => {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.json();
  },

  // Image Analysis APIs
  
  // Trigger image analysis for an analysis
  analyzeImages: async (analysisId: string) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/image-analysis/${analysisId}`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to analyze images');
    }

    return response.json();
  },

  // Get image analysis results for all photos in an analysis
  getImageAnalysisResults: async (analysisId: string) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/image-analysis/analysis/${analysisId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch image analysis results');
    }

    return response.json();
  },

  // Get image analysis for a specific photo
  getPhotoAnalysis: async (photoId: string) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/image-analysis/photo/${photoId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch photo analysis');
    }

    return response.json();
  },

  // Text Analysis APIs

  // Analyze a text response with personality-aware LLM feedback
  analyzeTextResponse: async (analysisId: string, question: string, answer: string) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/text-analysis/analyze`, {
      method: 'POST',
      body: JSON.stringify({
        analysis_id: analysisId,
        question,
        answer,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to analyze text response');
    }

    return response.json();
  },

  // Get text feedback for a specific response
  getTextFeedback: async (feedbackId: string) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/text-analysis/${feedbackId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch text feedback');
    }

    return response.json();
  },

  // Get all text feedback for a user's analysis
  getUserTextFeedback: async (analysisId: string) => {
    const response = await authenticatedFetch(`${API_BASE_URL}/text-analysis?analysis_id=${analysisId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch text feedback');
    }

    return response.json();
  },
};
