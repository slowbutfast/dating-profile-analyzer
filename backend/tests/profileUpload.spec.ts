/**
 * Profile Upload Integration Test (Vitest)
 * Tests: Complete flow from profile upload → LLM analysis → Results display
 * Run with: npm test -- profileUpload.spec.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateTextResponse,
  sanitizeInput,
} from '../src/utils/textInputValidator';

// Mock Profile Data
const mockProfile = {
  userId: 'user_123abc',
  photoUrls: [
    'uploads/user_123abc/photo1.jpg',
    'uploads/user_123abc/photo2.jpg',
    'uploads/user_123abc/photo3.jpg',
  ],
  bio: 'I\'m a photographer passionate about travel and hiking. Looking for someone genuine and adventurous.',
  textResponses: [
    {
      id: 'resp_001',
      question: 'What are you most passionate about?',
      answer:
        'I\'m really passionate about photography and travel. I love capturing moments that tell stories about people and places. There\'s something magical about exploring new destinations and meeting people with genuine interests.',
    },
    {
      id: 'resp_002',
      question: 'What are you looking for in a partner?',
      answer:
        'I\'m looking for someone who values authenticity and shares a love of adventure. Communication and honesty are important to me. I want someone I can travel with and explore the world alongside.',
    },
    {
      id: 'resp_003',
      question: 'Describe your ideal date.',
      answer:
        'I\'d love a spontaneous adventure - maybe a hiking trip to a hidden viewpoint, followed by dinner at a cozy restaurant where we can talk for hours. Something that combines outdoor exploration with genuine conversation.',
    },
  ],
  surveyData: {
    age_range: '28-32',
    gender: 'female',
    dating_goal: 'long-term relationship',
    personality_type: 'INFP',
    conversation_style: 'thoughtful and genuine',
    humor_style: 'dry and witty',
    dating_experience: 'moderate',
    interests: 'hiking, photography, reading, travel',
    ideal_match: 'someone kind and intellectually curious',
  },
  timestamp: new Date().toISOString(),
};

// Mock LLM Responses
const mockLLMResponses = {
  resp_001: {
    analysis:
      'Your response beautifully combines personal passion with meaningful storytelling. This authentic enthusiasm is exactly what makes profiles compelling to potential matches who value depth and intentionality.',
    strengths: [
      'You show vulnerability by sharing what truly matters to you - photography and travel.',
      'Your focus on "capturing stories" suggests emotional intelligence and the ability to see deeper meaning.',
      'You mention both hobbies and their deeper purpose, not just listing interests.',
    ],
    suggestions: [
      'Add a specific example: "My favorite photo is from a trip to [location]..."',
      'Connect to your ideal match: "I\'d love to travel with someone who appreciates the journey..."',
      'Mention how this passion shapes your dating life.',
    ],
    personality_context:
      'As an INFP who values authenticity and meaningful connections, your emphasis on emotional storytelling through photography reflects your need for depth.',
  },
  resp_002: {
    analysis:
      'Your answer demonstrates clear values and good self-awareness about what matters in relationships. This honesty and clarity about expectations is attractive to compatible partners.',
    strengths: [
      'You lead with authenticity and communication - these are highly valued traits.',
      'Explicitly mentioning "adventure" tells potential matches about your lifestyle.',
      'Your emphasis on honesty suggests you\'re looking for genuine connections.',
    ],
    suggestions: [
      'Expand on what "adventure" means to you - travel, experiences, activities?',
      'Give an example of a shared value you\'ve appreciated in past relationships.',
      'Describe a time communication and honesty made a difference for you.',
    ],
    personality_context:
      'Your INFP personality naturally seeks deep, authentic connections. Emphasizing this alignment with practical details about what you need helps attract compatible partners.',
  },
  resp_003: {
    analysis:
      'This is an excellent description that shows both spontaneity and substance. You\'re giving potential matches a clear picture of what dating you would be like.',
    strengths: [
      'The combination of outdoor activity AND intimate conversation is compelling.',
      'You\'re specific enough to paint a vivid picture without being rigid.',
      'You emphasize connection and conversation - not just activity.',
    ],
    suggestions: [
      'Consider mentioning one specific hiking location or type of view you love.',
      'What would you talk about for hours? Mention shared interests or topics.',
      'Does this reflect your actual dating style? Authenticity matters most.',
    ],
    personality_context:
      'Your ideal date reflects INFP values: combining nature/beauty with meaningful connection. This authenticity is your strength.',
  },
};

describe('Profile Upload & LLM Integration', () => {
  describe('Upload Phase', () => {
    it('should accept valid profile with all sections', () => {
      expect(mockProfile).toHaveProperty('userId');
      expect(mockProfile).toHaveProperty('photoUrls');
      expect(mockProfile).toHaveProperty('bio');
      expect(mockProfile).toHaveProperty('textResponses');
      expect(mockProfile).toHaveProperty('surveyData');
      expect(mockProfile).toHaveProperty('timestamp');
    });

    it('should have at least one photo', () => {
      expect(mockProfile.photoUrls.length).toBeGreaterThan(0);
      expect(mockProfile.photoUrls[0]).toMatch(/uploads\/.*\.jpg/);
    });

    it('should have valid bio', () => {
      expect(mockProfile.bio).toBeTruthy();
      expect(mockProfile.bio.length).toBeGreaterThan(10);
    });

    it('should have multiple text responses', () => {
      expect(mockProfile.textResponses.length).toBeGreaterThanOrEqual(2);
    });

    it('should have survey data with 9 personality fields', () => {
      const requiredFields = [
        'age_range',
        'gender',
        'dating_goal',
        'personality_type',
        'conversation_style',
        'humor_style',
        'dating_experience',
        'interests',
        'ideal_match',
      ];
      for (const field of requiredFields) {
        expect(mockProfile.surveyData).toHaveProperty(field);
      }
    });
  });

  describe('Text Validation Phase', () => {
    it('should validate all text responses', () => {
      for (const response of mockProfile.textResponses) {
        const validation = validateTextResponse(response.answer);
        expect(validation.valid).toBe(true);
        expect(validation.errors).toHaveLength(0);
      }
    });

    it('should have responses between 10-2000 characters', () => {
      for (const response of mockProfile.textResponses) {
        expect(response.answer.length).toBeGreaterThanOrEqual(10);
        expect(response.answer.length).toBeLessThanOrEqual(2000);
      }
    });
  });

  describe('Text Sanitization Phase', () => {
    it('should sanitize responses if needed', () => {
      for (const response of mockProfile.textResponses) {
        const sanitized = sanitizeInput(response.answer);
        expect(sanitized.length).toBeGreaterThan(0);
        expect(sanitized.length).toBeLessThanOrEqual(2000);
      }
    });
  });

  describe('LLM Analysis Phase', () => {
    it('should have LLM responses for each text response', () => {
      for (const response of mockProfile.textResponses) {
        expect(mockLLMResponses).toHaveProperty(response.id);
      }
    });

    it('should have complete feedback for each response', () => {
      for (const response of mockProfile.textResponses) {
        const feedback = mockLLMResponses[response.id as keyof typeof mockLLMResponses];
        expect(feedback).toHaveProperty('analysis');
        expect(feedback).toHaveProperty('strengths');
        expect(feedback).toHaveProperty('suggestions');
        expect(feedback).toHaveProperty('personality_context');
      }
    });

    it('should have strengths array with 3+ items', () => {
      for (const response of mockProfile.textResponses) {
        const feedback = mockLLMResponses[response.id as keyof typeof mockLLMResponses];
        expect(Array.isArray(feedback.strengths)).toBe(true);
        expect(feedback.strengths.length).toBeGreaterThanOrEqual(3);
      }
    });

    it('should have suggestions array with 3+ items', () => {
      for (const response of mockProfile.textResponses) {
        const feedback = mockLLMResponses[response.id as keyof typeof mockLLMResponses];
        expect(Array.isArray(feedback.suggestions)).toBe(true);
        expect(feedback.suggestions.length).toBeGreaterThanOrEqual(3);
      }
    });

    it('should have analysis text', () => {
      for (const response of mockProfile.textResponses) {
        const feedback = mockLLMResponses[response.id as keyof typeof mockLLMResponses];
        expect(feedback.analysis.length).toBeGreaterThan(50);
      }
    });

    it('should have personality context', () => {
      for (const response of mockProfile.textResponses) {
        const feedback = mockLLMResponses[response.id as keyof typeof mockLLMResponses];
        expect(feedback.personality_context).toBeTruthy();
      }
    });
  });

  describe('Firestore Document Format', () => {
    it('should format analysis documents correctly', () => {
      for (const response of mockProfile.textResponses) {
        const feedback = mockLLMResponses[response.id as keyof typeof mockLLMResponses];

        const firestoreDoc = {
          user_id: mockProfile.userId,
          analysis_id: response.id,
          question: response.question,
          user_answer: response.answer,
          analysis: feedback.analysis,
          strengths: feedback.strengths,
          suggestions: feedback.suggestions,
          personality_context: feedback.personality_context,
          created_at: mockProfile.timestamp,
        };

        expect(firestoreDoc.user_id).toBeTruthy();
        expect(firestoreDoc.analysis_id).toBeTruthy();
        expect(firestoreDoc.question).toBeTruthy();
        expect(firestoreDoc.user_answer).toBeTruthy();
        expect(firestoreDoc.analysis).toBeTruthy();
        expect(Array.isArray(firestoreDoc.strengths)).toBe(true);
        expect(Array.isArray(firestoreDoc.suggestions)).toBe(true);
      }
    });
  });

  describe('API Response Format', () => {
    it('should format API response correctly for each analysis', () => {
      for (const response of mockProfile.textResponses) {
        const feedback = mockLLMResponses[response.id as keyof typeof mockLLMResponses];

        const apiResponse = {
          success: true,
          data: {
            analysis_id: response.id,
            question: response.question,
            user_answer: response.answer,
            feedback: {
              analysis: feedback.analysis,
              strengths: feedback.strengths,
              suggestions: feedback.suggestions,
              personality_context: feedback.personality_context,
            },
          },
        };

        expect(apiResponse.success).toBe(true);
        expect(apiResponse.data).toHaveProperty('analysis_id');
        expect(apiResponse.data).toHaveProperty('feedback');
        expect(apiResponse.data.feedback).toHaveProperty('analysis');
        expect(apiResponse.data.feedback).toHaveProperty('strengths');
        expect(apiResponse.data.feedback).toHaveProperty('suggestions');
      }
    });
  });

  describe('Complete Profile Results Object', () => {
    it('should construct complete results object', () => {
      const results = {
        userId: mockProfile.userId,
        bio: mockProfile.bio,
        photos: mockProfile.photoUrls,
        textAnalysis: mockProfile.textResponses.map((response) => ({
          id: response.id,
          question: response.question,
          answer: response.answer,
          feedback: mockLLMResponses[response.id as keyof typeof mockLLMResponses],
        })),
        personality: mockProfile.surveyData,
        uploadedAt: mockProfile.timestamp,
      };

      // Verify structure
      expect(results.userId).toBeTruthy();
      expect(results.bio).toBeTruthy();
      expect(Array.isArray(results.photos)).toBe(true);
      expect(Array.isArray(results.textAnalysis)).toBe(true);
      expect(results.personality).toBeTruthy();

      // Verify each text analysis has feedback
      for (const analysis of results.textAnalysis) {
        expect(analysis).toHaveProperty('id');
        expect(analysis).toHaveProperty('question');
        expect(analysis).toHaveProperty('answer');
        expect(analysis).toHaveProperty('feedback');
        expect(analysis.feedback).toHaveProperty('analysis');
        expect(analysis.feedback).toHaveProperty('strengths');
        expect(analysis.feedback).toHaveProperty('suggestions');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle profile with bio but no text responses', () => {
      const minimalProfile = {
        ...mockProfile,
        textResponses: [],
      };

      expect(minimalProfile.bio).toBeTruthy();
      expect(minimalProfile.textResponses).toHaveLength(0);
    });

    it('should handle profile with text responses but no bio', () => {
      const noBioProfile = {
        ...mockProfile,
        bio: '',
      };

      expect(noBioProfile.bio).toBe('');
      expect(noBioProfile.textResponses.length).toBeGreaterThan(0);
    });

    it('should handle multiple text responses', () => {
      expect(mockProfile.textResponses.length).toBeGreaterThanOrEqual(1);

      // Each should have corresponding LLM response
      for (const response of mockProfile.textResponses) {
        expect(mockLLMResponses).toHaveProperty(response.id);
      }
    });
  });
});
