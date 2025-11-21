import { Timestamp } from 'firebase/firestore';

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Analysis {
  id: string;
  user_id: string;
  bio: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Photo {
  id: string;
  analysis_id: string;
  photo_url: string;
  storage_path: string;
  order_index: number;
  analysis_result?: {
    lighting: number;
    sharpness: number;
    face_visibility: number;
    eye_contact: number;
    notes: string;
  };
  created_at: Timestamp;
}

export interface TextResponse {
  id: string;
  analysis_id: string;
  question: string;
  answer: string;
  analysis_result?: {
    warmth: number;
    humor: number;
    clarity: number;
    originality: number;
    conversation_potential: number;
    strengths: string;
    improvements: string;
  };
  created_at: Timestamp;
}
