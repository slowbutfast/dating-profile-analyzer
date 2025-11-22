/**
 * Shared type definitions for the application
 */

/**
 * User profile document in Firestore
 */
export interface UserProfile {
  user_id: string;
  email: string;
  full_name?: string;
  created_at: any; // Firebase Timestamp
  updated_at: any; // Firebase Timestamp
}

/**
 * Analysis document metadata
 */
export interface Analysis {
  id?: string;
  user_id: string;
  bio: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error_message?: string;
  created_at: any; // Firebase Timestamp
  updated_at: any; // Firebase Timestamp
}

/**
 * Photo document linked to an analysis
 */
export interface Photo {
  id?: string;
  analysis_id: string;
  photo_url: string;
  storage_path: string;
  order_index: number;
  created_at: any; // Firebase Timestamp
}

/**
 * Text response document linked to an analysis
 */
export interface TextResponse {
  id?: string;
  analysis_id: string;
  question: string;
  answer: string;
  created_at: any; // Firebase Timestamp
}

/**
 * Computer Vision metric (individual score)
 */
export interface CVMetric {
  score: number; // 1-10
  feedback: string;
  details?: Record<string, any>;
}

/**
 * Computer Vision metrics for an analysis
 */
export interface CVMetrics {
  lighting: CVMetric;
  clarity: CVMetric;
  eye_contact: CVMetric;
  facial_visibility: CVMetric;
  group_photo_count?: number;
  overall_score: number;
}

/**
 * LLM metric (individual score)
 */
export interface LLMMetric {
  score: number; // 1-10
  feedback: string;
  details?: Record<string, any>;
}

/**
 * LLM metrics for an analysis
 */
export interface LLMMetrics {
  warmth: LLMMetric;
  humor: LLMMetric;
  clarity: LLMMetric;
  originality: LLMMetric;
  overall_score: number;
  grammar_issues?: string[];
  cliche_detection?: string[];
}

/**
 * Analysis results document storing CV and LLM analysis
 */
export interface AnalysisResult {
  id?: string;
  analysis_id: string;
  user_id: string;
  cv_metrics?: CVMetrics;
  llm_metrics?: LLMMetrics;
  improvement_suggestions: string[];
  combined_feedback: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error_message?: string;
  created_at: any; // Firebase Timestamp
  completed_at?: any; // Firebase Timestamp
  metadata?: {
    processing_time_ms?: number;
    api_version?: string;
    cv_api?: string;
    llm_api?: string;
  };
}

/**
 * Image analysis detailed breakdown
 */
export interface ImageAnalysis {
  id?: string;
  analysis_id: string;
  photo_id: string;
  cv_metrics: CVMetrics;
  raw_response?: Record<string, any>;
  created_at: any; // Firebase Timestamp
}

/**
 * Text analysis detailed breakdown
 */
export interface TextAnalysis {
  id?: string;
  analysis_id: string;
  text_response_id: string;
  llm_metrics: LLMMetrics;
  raw_response?: Record<string, any>;
  created_at: any; // Firebase Timestamp
}

/**
 * Research contribution consent record
 */
export interface ResearchConsent {
  id?: string;
  user_id: string;
  opted_in: boolean;
  created_at: any; // Firebase Timestamp
  updated_at: any; // Firebase Timestamp
}

/**
 * Anonymized research data
 */
export interface AnonymizedResearchData {
  id?: string;
  analysis_id: string; // Purposefully NOT storing user_id for anonymity
  cv_metrics?: CVMetrics;
  llm_metrics?: LLMMetrics;
  created_at: any; // Firebase Timestamp
}

/**
 * API Request/Response types
 */

export interface UploadProfileRequest {
  userId: string;
  bio: string;
  textResponses: Array<{
    question: string;
    answer: string;
  }>;
  files?: Express.Multer.File[];
}

export interface AnalysisResultsRequest {
  analysis_id: string;
  cv_metrics?: CVMetrics;
  llm_metrics?: LLMMetrics;
  improvement_suggestions: string[];
  combined_feedback: string;
}

export interface AnalysisResultsResponse {
  success: boolean;
  result_id?: string;
  error?: string;
  code?: string;
}

export interface DeleteAnalysisRequest {
  analysis_id: string;
  user_id: string;
}

export interface DeleteAnalysisResponse {
  success: boolean;
  deleted_count: number;
  error?: string;
  code?: string;
}
