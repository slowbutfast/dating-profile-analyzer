// Image Analysis Types

export interface BlurAnalysis {
  score: number;
  isBlurry: boolean;
  severity: 'sharp' | 'slight-blur' | 'blurry' | 'very-blurry';
}

export interface LightingAnalysis {
  score: number;
  isGoodLighting: boolean;
  brightness: number;
  contrast: number;
  issues: string[];
}

export interface SmileAnalysis {
  score: number;
  hasSmile: boolean;
  confidence: 'no-face' | 'neutral' | 'slight-smile' | 'clear-smile';
  faceDetected: boolean;
  expressions?: {
    happy: number;
    neutral: number;
    sad: number;
    angry: number;
    surprised: number;
  };
}

export interface ImageAnalysis {
  blur: BlurAnalysis;
  lighting: LightingAnalysis;
  smile: SmileAnalysis;
  overallScore: number;
  warnings: string[];
  analyzedAt?: string;
}

export interface PhotoWithAnalysis {
  photoId: string;
  photoUrl: string;
  orderIndex: number;
  analysis: ImageAnalysis | null;
}

export interface ImageAnalysisResult {
  photoId: string;
  photoUrl: string;
  analysis?: ImageAnalysis;
  error?: string;
}

export interface AnalysisResponse {
  success: boolean;
  analysisId: string;
  totalPhotos: number;
  results: ImageAnalysisResult[];
}

export interface PhotoAnalysisResponse {
  analysisId: string;
  totalPhotos: number;
  photos: PhotoWithAnalysis[];
}
