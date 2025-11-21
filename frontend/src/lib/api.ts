// API client for backend communication
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  },

  // Get all analyses for a user
  getUserAnalyses: async (userId: string) => {
    const response = await fetch(`${API_BASE_URL}/analyses/user/${userId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch analyses');
    }

    return response.json();
  },

  // Get specific analysis with photos and text responses
  getAnalysis: async (analysisId: string) => {
    const response = await fetch(`${API_BASE_URL}/analyses/${analysisId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch analysis');
    }

    return response.json();
  },

  // Delete an analysis
  deleteAnalysis: async (analysisId: string) => {
    const response = await fetch(`${API_BASE_URL}/analyses/${analysisId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete analysis');
    }

    return response.json();
  },

  // Health check
  healthCheck: async () => {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.json();
  },
};
