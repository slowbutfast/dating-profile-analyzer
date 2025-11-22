import { db } from '../config/firebase';
import {
  UserProfile,
  Analysis,
  Photo,
  TextResponse,
  AnalysisResult,
  ImageAnalysis,
  TextAnalysis,
  ResearchConsent,
  AnonymizedResearchData,
} from '../types/index';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Centralized database operations for the application
 * Provides type-safe CRUD operations for all collections
 */

// ============================================================================
// USER PROFILE OPERATIONS
// ============================================================================

export const db_user = {
  /**
   * Create or get user profile
   */
  async upsertProfile(userId: string, profileData: Partial<UserProfile>) {
    const docRef = db.collection('profiles').doc(userId);
    const now = new Date();

    const profile: UserProfile = {
      user_id: userId,
      email: profileData.email || '',
      full_name: profileData.full_name,
      created_at: (await docRef.get()).exists ? undefined : now,
      updated_at: now,
      ...profileData,
    };

    await docRef.set(profile, { merge: true });
    return profile;
  },

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    const doc = await db.collection('profiles').doc(userId).get();
    return doc.exists ? (doc.data() as UserProfile) : null;
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<UserProfile>) {
    const updateData: any = {
      ...updates,
      updated_at: new Date(),
    };

    await db.collection('profiles').doc(userId).update(updateData);
  },

  /**
   * Delete user profile and all associated data (DANGEROUS)
   */
  async deleteProfile(userId: string) {
    const batch = db.batch();

    // Delete profile
    batch.delete(db.collection('profiles').doc(userId));

    // Delete all analyses and related data
    const analyses = await db
      .collection('analyses')
      .where('user_id', '==', userId)
      .get();

    for (const doc of analyses.docs) {
      batch.delete(doc.ref);
      // Note: photos and text_responses will be cleaned up separately or via cascade
    }

    await batch.commit();
  },
};

// ============================================================================
// ANALYSIS OPERATIONS
// ============================================================================

export const db_analysis = {
  /**
   * Create new analysis
   */
  async create(userId: string, bio: string): Promise<{ id: string; data: Analysis }> {
    const now = new Date();
    const analysisData: Analysis = {
      user_id: userId,
      bio,
      status: 'pending',
      created_at: now,
      updated_at: now,
    };

    const docRef = await db.collection('analyses').add(analysisData);
    return { id: docRef.id, data: analysisData };
  },

  /**
   * Get analysis by ID
   */
  async get(analysisId: string): Promise<(Analysis & { id: string }) | null> {
    const doc = await db.collection('analyses').doc(analysisId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...(doc.data() as Analysis) };
  },

  /**
   * Get all analyses for a user
   */
  async getByUserId(userId: string): Promise<(Analysis & { id: string })[]> {
    const snapshot = await db
      .collection('analyses')
      .where('user_id', '==', userId)
      .orderBy('created_at', 'desc')
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Analysis),
    }));
  },

  /**
   * Update analysis status and metadata
   */
  async updateStatus(
    analysisId: string,
    status: Analysis['status'],
    errorMessage?: string
  ) {
    const updateData: any = {
      status,
      updated_at: new Date(),
    };

    if (errorMessage) {
      updateData.error_message = errorMessage;
    }

    await db.collection('analyses').doc(analysisId).update(updateData);
  },

  /**
   * Delete analysis and all associated data
   */
  async delete(analysisId: string): Promise<number> {
    const batch = db.batch();
    let deletedCount = 1;

    // Delete analysis
    batch.delete(db.collection('analyses').doc(analysisId));

    // Delete photos
    const photos = await db
      .collection('photos')
      .where('analysis_id', '==', analysisId)
      .get();
    for (const doc of photos.docs) {
      batch.delete(doc.ref);
      deletedCount++;
    }

    // Delete text responses
    const textResponses = await db
      .collection('text_responses')
      .where('analysis_id', '==', analysisId)
      .get();
    for (const doc of textResponses.docs) {
      batch.delete(doc.ref);
      deletedCount++;
    }

    // Delete analysis results
    const results = await db
      .collection('analysis_results')
      .where('analysis_id', '==', analysisId)
      .get();
    for (const doc of results.docs) {
      batch.delete(doc.ref);
      deletedCount++;
    }

    await batch.commit();
    return deletedCount;
  },
};

// ============================================================================
// PHOTO OPERATIONS
// ============================================================================

export const db_photo = {
  /**
   * Create photo record
   */
  async create(photo: Omit<Photo, 'id' | 'created_at'>) {
    const now = new Date();
    const photoData: Photo = {
      ...photo,
      created_at: now,
    };

    const docRef = await db.collection('photos').add(photoData);
    return { id: docRef.id, data: photoData };
  },

  /**
   * Get all photos for an analysis
   */
  async getByAnalysisId(analysisId: string): Promise<(Photo & { id: string })[]> {
    const snapshot = await db
      .collection('photos')
      .where('analysis_id', '==', analysisId)
      .orderBy('order_index', 'asc')
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Photo),
    }));
  },

  /**
   * Delete photo by ID
   */
  async delete(photoId: string) {
    await db.collection('photos').doc(photoId).delete();
  },
};

// ============================================================================
// TEXT RESPONSE OPERATIONS
// ============================================================================

export const db_textResponse = {
  /**
   * Create text response record
   */
  async create(textResponse: Omit<TextResponse, 'id' | 'created_at'>) {
    const now = new Date();
    const responseData: TextResponse = {
      ...textResponse,
      created_at: now,
    };

    const docRef = await db.collection('text_responses').add(responseData);
    return { id: docRef.id, data: responseData };
  },

  /**
   * Get all text responses for an analysis
   */
  async getByAnalysisId(analysisId: string): Promise<(TextResponse & { id: string })[]> {
    const snapshot = await db
      .collection('text_responses')
      .where('analysis_id', '==', analysisId)
      .orderBy('created_at', 'asc')
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as TextResponse),
    }));
  },

  /**
   * Delete text response by ID
   */
  async delete(responseId: string) {
    await db.collection('text_responses').doc(responseId).delete();
  },
};

// ============================================================================
// ANALYSIS RESULTS OPERATIONS
// ============================================================================

export const db_results = {
  /**
   * Create analysis result
   */
  async create(result: Omit<AnalysisResult, 'id' | 'created_at'>) {
    const now = new Date();
    const resultData: AnalysisResult = {
      ...result,
      created_at: now,
      status: result.status || 'pending',
    };

    const docRef = await db.collection('analysis_results').add(resultData);
    return { id: docRef.id, data: resultData };
  },

  /**
   * Get analysis result by ID
   */
  async get(resultId: string): Promise<(AnalysisResult & { id: string }) | null> {
    const doc = await db.collection('analysis_results').doc(resultId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...(doc.data() as AnalysisResult) };
  },

  /**
   * Get result by analysis ID
   */
  async getByAnalysisId(analysisId: string): Promise<(AnalysisResult & { id: string }) | null> {
    const snapshot = await db
      .collection('analysis_results')
      .where('analysis_id', '==', analysisId)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...(doc.data() as AnalysisResult) };
  },

  /**
   * Get all results for a user
   */
  async getByUserId(
    userId: string,
    limit: number = 50
  ): Promise<(AnalysisResult & { id: string })[]> {
    const snapshot = await db
      .collection('analysis_results')
      .where('user_id', '==', userId)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as AnalysisResult),
    }));
  },

  /**
   * Update analysis result (partial update)
   */
  async update(resultId: string, updates: Partial<AnalysisResult>) {
    const updateData: any = {
      ...updates,
      updated_at: new Date(),
    };

    if (updates.status === 'completed') {
      updateData.completed_at = new Date();
    }

    await db.collection('analysis_results').doc(resultId).update(updateData);
  },

  /**
   * Update result status
   */
  async updateStatus(
    resultId: string,
    status: AnalysisResult['status'],
    errorMessage?: string
  ) {
    const updateData: any = {
      status,
      updated_at: new Date(),
    };

    if (status === 'completed') {
      updateData.completed_at = new Date();
    }

    if (errorMessage) {
      updateData.error_message = errorMessage;
    }

    await db.collection('analysis_results').doc(resultId).update(updateData);
  },

  /**
   * Delete analysis result
   */
  async delete(resultId: string) {
    await db.collection('analysis_results').doc(resultId).delete();
  },
};

// ============================================================================
// IMAGE ANALYSIS OPERATIONS (Detailed breakdowns)
// ============================================================================

export const db_imageAnalysis = {
  /**
   * Create detailed image analysis record
   */
  async create(analysis: Omit<ImageAnalysis, 'id' | 'created_at'>) {
    const now = new Date();
    const analysisData: ImageAnalysis = {
      ...analysis,
      created_at: now,
    };

    const docRef = await db.collection('image_analysis').add(analysisData);
    return { id: docRef.id, data: analysisData };
  },

  /**
   * Get all image analyses for an analysis
   */
  async getByAnalysisId(analysisId: string): Promise<(ImageAnalysis & { id: string })[]> {
    const snapshot = await db
      .collection('image_analysis')
      .where('analysis_id', '==', analysisId)
      .orderBy('created_at', 'asc')
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as ImageAnalysis),
    }));
  },
};

// ============================================================================
// TEXT ANALYSIS OPERATIONS (Detailed breakdowns)
// ============================================================================

export const db_textAnalysis = {
  /**
   * Create detailed text analysis record
   */
  async create(analysis: Omit<TextAnalysis, 'id' | 'created_at'>) {
    const now = new Date();
    const analysisData: TextAnalysis = {
      ...analysis,
      created_at: now,
    };

    const docRef = await db.collection('text_analysis').add(analysisData);
    return { id: docRef.id, data: analysisData };
  },

  /**
   * Get all text analyses for an analysis
   */
  async getByAnalysisId(analysisId: string): Promise<(TextAnalysis & { id: string })[]> {
    const snapshot = await db
      .collection('text_analysis')
      .where('analysis_id', '==', analysisId)
      .orderBy('created_at', 'asc')
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as TextAnalysis),
    }));
  },
};

// ============================================================================
// RESEARCH CONSENT OPERATIONS
// ============================================================================

export const db_research = {
  /**
   * Set or update research consent
   */
  async setConsent(userId: string, optedIn: boolean) {
    const now = new Date();
    const consentData: ResearchConsent = {
      user_id: userId,
      opted_in: optedIn,
      created_at: (await db.collection('research_consent').doc(userId).get()).exists
        ? undefined
        : now,
      updated_at: now,
    };

    await db.collection('research_consent').doc(userId).set(consentData, { merge: true });
    return consentData;
  },

  /**
   * Get research consent status
   */
  async getConsent(userId: string): Promise<ResearchConsent | null> {
    const doc = await db.collection('research_consent').doc(userId).get();
    return doc.exists ? (doc.data() as ResearchConsent) : null;
  },

  /**
   * Add anonymized research data (only if user opted in)
   */
  async addAnonymizedData(userId: string, data: Omit<AnonymizedResearchData, 'id' | 'created_at'>) {
    // Check consent first
    const consent = await this.getConsent(userId);
    if (!consent?.opted_in) {
      throw new Error('User has not opted into research data collection');
    }

    const now = new Date();
    const anonData: AnonymizedResearchData = {
      ...data,
      created_at: now,
    };

    const docRef = await db.collection('anonymized_research_data').add(anonData);
    return { id: docRef.id, data: anonData };
  },

  /**
   * Get anonymized research statistics (aggregate only)
   */
  async getAggregateStats() {
    const snapshot = await db.collection('anonymized_research_data').get();
    return {
      total_records: snapshot.size,
      records: snapshot.docs.map((doc) => doc.data()),
    };
  },
};

// ============================================================================
// BATCH OPERATIONS & TRANSACTIONS
// ============================================================================

export const db_batch = {
  /**
   * Get Firestore batch writer for atomic operations
   */
  getBatch() {
    return db.batch();
  },

  /**
   * Get Firestore transaction for multi-document operations
   */
  async transaction<T>(callback: (transaction: any) => Promise<T>): Promise<T> {
    return db.runTransaction((transaction) => callback(transaction));
  },
};

export default {
  user: db_user,
  analysis: db_analysis,
  photo: db_photo,
  textResponse: db_textResponse,
  results: db_results,
  imageAnalysis: db_imageAnalysis,
  textAnalysis: db_textAnalysis,
  research: db_research,
  batch: db_batch,
};
