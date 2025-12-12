import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/firebase';

const router = Router();

/**
 * Create a mock profile with LLM analysis
 * POST /mock-profile/create
 * 
 * Creates a complete analysis with:
 * - Profile bio and text responses
 * - LLM feedback for text
 * - Returns the analysis ID for viewing
 */
router.post('/create', async (req: Request, res: Response) => {
  try {
    const analysisId = uuidv4();
    const userId = `mock_user_${Date.now()}`;

    // Create analysis record
    const analysisData = {
      user_id: userId,
      bio: "I'm a photographer passionate about travel and hiking. Looking for someone genuine and adventurous.",
      status: 'completed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Add analysis to Firestore
    await db.collection('analyses').doc(analysisId).set(analysisData);

    // Create text responses
    const textResponses = [
      {
        analysis_id: analysisId,
        question: 'What are you most passionate about?',
        answer: 'I\'m really passionate about photography and travel. I love capturing moments that tell stories about people and places. There\'s something magical about connecting with someone through shared experiences.',
      },
      {
        analysis_id: analysisId,
        question: 'What are you looking for in a partner?',
        answer: 'I\'m looking for someone who values authenticity and shares a love of adventure. Communication and honesty are incredibly important to me. Someone who can laugh at themselves and isn\'t afraid to be vulnerable.',
      },
      {
        analysis_id: analysisId,
        question: 'What\'s your ideal weekend?',
        answer: 'Ideally, a mix of outdoor activities and quality time. Maybe hiking in the morning, then a cozy coffee shop or restaurant to talk and connect. I love both adventures and quiet moments with the right person.',
      },
    ];

    // Add text responses and collect their IDs
    const responseIds: string[] = [];
    for (const response of textResponses) {
      const responseId = uuidv4();
      responseIds.push(responseId);
      await db.collection('text_responses').doc(responseId).set({
        ...response,
        created_at: new Date().toISOString(),
      });
    }

    // Create photos with image analysis data
    const photoIds: string[] = [];
    const photoData = [
      { order_index: 0, storage_path: 'mock/photo1.jpg' },
      { order_index: 1, storage_path: 'mock/photo2.jpg' },
      { order_index: 2, storage_path: 'mock/photo3.jpg' },
    ];

    for (const photo of photoData) {
      const photoId = uuidv4();
      photoIds.push(photoId);
      await db.collection('photos').doc(photoId).set({
        analysis_id: analysisId,
        photo_url: `/api/uploads/mock/${photo.storage_path}`,
        storage_path: photo.storage_path,
        order_index: photo.order_index,
        created_at: new Date().toISOString(),
      });
    }

    // Create image analysis data for photos
    const imageAnalysisData = [
      {
        photo_id: photoIds[0],
        lighting: 85,
        sharpness: 90,
        face_visibility: 95,
        eye_contact: 88,
        notes: 'Excellent lighting and clear facial features. Strong eye contact with natural smile.',
      },
      {
        photo_id: photoIds[1],
        lighting: 78,
        sharpness: 92,
        face_visibility: 90,
        eye_contact: 82,
        notes: 'Good composition with outdoor setting. Clear and well-lit portrait.',
      },
      {
        photo_id: photoIds[2],
        lighting: 82,
        sharpness: 88,
        face_visibility: 87,
        eye_contact: 85,
        notes: 'Natural lighting creates warm tone. Good depth of field with pleasant background.',
      },
    ];

    for (const analysis of imageAnalysisData) {
      const analysisId = uuidv4();
      await db.collection('image_analysis').doc(analysisId).set({
        ...analysis,
        created_at: new Date().toISOString(),
      });
    }

    // Create text feedback records with LLM analysis
    const feedbackData = [
      {
        response_id: responseIds[0],
        analysis: 'Your response beautifully combines personal passion with meaningful storytelling. This authentic enthusiasm is exactly what makes profiles compelling. The mention of "capturing stories" shows emotional depth and suggests you value meaningful connections.',
        strengths: ['You show genuine passion and vulnerability', 'Connecting moments to storytelling reveals emotional intelligence', 'You explain the deeper "why" behind your interests'],
        suggestions: ['Add a specific memorable travel moment', 'Describe how this passion connects to your ideal partner', 'Give an example of a photo that changed your perspective'],
        personality_context: 'Your thoughtful, introspective nature suggests you value authentic connections and meaningful experiences over superficial interactions.',
      },
      {
        response_id: responseIds[1],
        analysis: 'Your answer demonstrates clear values and self-awareness about what matters in relationships. The emphasis on authenticity and communication signals emotional maturity and readiness for genuine connection. This clarity is attractive to compatible partners.',
        strengths: ['You lead with values like authenticity and communication', 'Vulnerability about needing honesty is attractive', 'You mention both adventure and emotional compatibility'],
        suggestions: ['Share what "adventure" looks like to you specifically', 'Describe a time authenticity made a relationship stronger', 'Mention one quirk or imperfection about yourself'],
        personality_context: 'You balance adventure-seeking with emotional depth, suggesting you want both excitement and genuine connection in a relationship.',
      },
      {
        response_id: responseIds[2],
        analysis: 'Your answer reveals someone who values balance and quality time. The willingness to enjoy both active adventures and quiet moments shows emotional intelligence and flexibility. This adaptability is highly desirable in a partner.',
        strengths: ['You appreciate both adventure and quiet intimacy', 'Mentioning conversation quality shows emotional focus', 'The ideal weekend reflects genuine relationship values'],
        suggestions: ['Share a favorite hiking location with details', 'Describe what "connecting" means to you personally', 'Mention a favorite conversation topic or hobby to discuss'],
        personality_context: 'You seek meaningful connections through both shared activities and deep conversations, indicating a balanced approach to building relationships.',
      },
    ];

    // Add feedback for each text response
    const feedbackMap: Record<string, any> = {};
    for (const feedback of feedbackData) {
      const feedbackId = uuidv4();
      await db.collection('text_feedback').doc(feedbackId).set({
        ...feedback,
        created_at: new Date().toISOString(),
      });
      // Store feedback by response_id for easy lookup
      feedbackMap[feedback.response_id] = {
        analysis: feedback.analysis,
        strengths: feedback.strengths,
        suggestions: feedback.suggestions,
        personality_context: feedback.personality_context,
      };
    }

    res.json({
      success: true,
      analysisId,
      textFeedback: feedbackMap,
      message: `Mock profile created successfully. View it at /profile-analysis/${analysisId}`,
    });
  } catch (error) {
    console.error('Error creating mock profile:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create mock profile',
    });
  }
});

export default router;
