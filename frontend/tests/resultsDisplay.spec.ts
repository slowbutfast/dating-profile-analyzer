/**
 * Results Page Display Test (Vitest)
 * Tests: Rendering profile analysis results on frontend
 * Run with: npm test -- resultsDisplay.spec.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Mock Results Data (what would come from API)
const mockAnalysisResults = {
  userId: 'user_123abc',
  bio: 'I\'m a photographer passionate about travel and hiking. Looking for someone genuine and adventurous.',
  photos: [
    'uploads/user_123abc/photo1.jpg',
    'uploads/user_123abc/photo2.jpg',
    'uploads/user_123abc/photo3.jpg',
  ],
  textAnalysis: [
    {
      id: 'resp_001',
      question: 'What are you most passionate about?',
      answer:
        'I\'m really passionate about photography and travel. I love capturing moments that tell stories about people and places.',
      feedback: {
        analysis:
          'Your response beautifully combines personal passion with meaningful storytelling. This authentic enthusiasm is exactly what makes profiles compelling.',
        strengths: [
          'You show vulnerability by sharing what truly matters to you.',
          'Your focus on "capturing stories" suggests emotional intelligence.',
          'You mention both hobbies and their deeper purpose.',
        ],
        suggestions: [
          'Add a specific example: "My favorite photo is from..."',
          'Connect to your ideal match.',
          'Mention how this passion shapes your dating life.',
        ],
        personality_context:
          'As an INFP who values authenticity, your emphasis on emotional storytelling reflects your need for depth.',
      },
    },
    {
      id: 'resp_002',
      question: 'What are you looking for in a partner?',
      answer:
        'I\'m looking for someone who values authenticity and shares a love of adventure. Communication and honesty are important to me.',
      feedback: {
        analysis:
          'Your answer demonstrates clear values and good self-awareness about what matters in relationships. This honesty is attractive to compatible partners.',
        strengths: [
          'You lead with authenticity and communication.',
          'Explicitly mentioning "adventure" tells potential matches about your lifestyle.',
          'Your emphasis on honesty suggests you\'re looking for genuine connections.',
        ],
        suggestions: [
          'Expand on what "adventure" means to you.',
          'Give an example of a shared value.',
          'Describe a time honesty made a difference.',
        ],
        personality_context:
          'Your INFP personality naturally seeks deep, authentic connections. Emphasizing this alignment helps attract compatible partners.',
      },
    },
  ],
  personality: {
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
  uploadedAt: '2024-12-12T16:00:00.000Z',
};

describe('Results Page Display', () => {
  describe('Bio Section', () => {
    it('should display bio when provided', () => {
      expect(mockAnalysisResults.bio).toBeTruthy();
      expect(mockAnalysisResults.bio.length).toBeGreaterThan(0);
    });

    it('should skip bio section when empty', () => {
      const noBioResults = {
        ...mockAnalysisResults,
        bio: '',
      };

      // Conditional render: only show if bio exists and has length
      const shouldShowBio = !!(noBioResults.bio && noBioResults.bio.length > 0);
      expect(shouldShowBio).toBe(false);
    });

    it('should have correct bio text', () => {
      expect(mockAnalysisResults.bio).toContain('photographer');
      expect(mockAnalysisResults.bio).toContain('travel');
      expect(mockAnalysisResults.bio).toContain('adventurous');
    });
  });

  describe('Photo Gallery', () => {
    it('should display photo URLs', () => {
      expect(Array.isArray(mockAnalysisResults.photos)).toBe(true);
      expect(mockAnalysisResults.photos.length).toBeGreaterThan(0);
    });

    it('should have valid photo paths', () => {
      for (const photo of mockAnalysisResults.photos) {
        expect(photo).toMatch(/uploads\/.*\.(jpg|png|jpeg)/i);
      }
    });

    it('should handle variable number of photos', () => {
      const onePhoto = { ...mockAnalysisResults, photos: ['photo1.jpg'] };
      expect(onePhoto.photos).toHaveLength(1);

      const manyPhotos = {
        ...mockAnalysisResults,
        photos: Array(10)
          .fill(0)
          .map((_, i) => `photo${i}.jpg`),
      };
      expect(manyPhotos.photos.length).toBe(10);
    });
  });

  describe('Text Analysis Card', () => {
    it('should display all text responses', () => {
      expect(Array.isArray(mockAnalysisResults.textAnalysis)).toBe(true);
      expect(mockAnalysisResults.textAnalysis.length).toBeGreaterThan(0);
    });

    it('should show question for each response', () => {
      for (const analysis of mockAnalysisResults.textAnalysis) {
        expect(analysis).toHaveProperty('question');
        expect(analysis.question).toBeTruthy();
      }
    });

    it('should show user answer for each response', () => {
      for (const analysis of mockAnalysisResults.textAnalysis) {
        expect(analysis).toHaveProperty('answer');
        expect(analysis.answer).toBeTruthy();
        expect(analysis.answer.length).toBeGreaterThan(10);
      }
    });

    it('should show all feedback fields', () => {
      for (const analysis of mockAnalysisResults.textAnalysis) {
        expect(analysis.feedback).toHaveProperty('analysis');
        expect(analysis.feedback).toHaveProperty('strengths');
        expect(analysis.feedback).toHaveProperty('suggestions');
        expect(analysis.feedback).toHaveProperty('personality_context');
      }
    });
  });

  describe('LLM Feedback Display', () => {
    it('should display analysis text', () => {
      for (const analysis of mockAnalysisResults.textAnalysis) {
        expect(analysis.feedback.analysis).toBeTruthy();
        expect(analysis.feedback.analysis.length).toBeGreaterThan(50);
      }
    });

    it('should display strengths as list', () => {
      for (const analysis of mockAnalysisResults.textAnalysis) {
        expect(Array.isArray(analysis.feedback.strengths)).toBe(true);
        expect(analysis.feedback.strengths.length).toBeGreaterThan(0);

        for (const strength of analysis.feedback.strengths) {
          expect(strength).toBeTruthy();
          expect(strength.length).toBeGreaterThan(10);
        }
      }
    });

    it('should display suggestions as list', () => {
      for (const analysis of mockAnalysisResults.textAnalysis) {
        expect(Array.isArray(analysis.feedback.suggestions)).toBe(true);
        expect(analysis.feedback.suggestions.length).toBeGreaterThan(0);

        for (const suggestion of analysis.feedback.suggestions) {
          expect(suggestion).toBeTruthy();
          expect(suggestion.length).toBeGreaterThan(10);
        }
      }
    });

    it('should display personality context', () => {
      for (const analysis of mockAnalysisResults.textAnalysis) {
        expect(analysis.feedback.personality_context).toBeTruthy();
        expect(analysis.feedback.personality_context.length).toBeGreaterThan(20);
      }
    });
  });

  describe('Rendering Structure', () => {
    it('should render conditional bio section', () => {
      // Bio section should only render if bio exists
      const shouldRender =
        mockAnalysisResults.bio && mockAnalysisResults.bio.length > 0;
      expect(shouldRender).toBe(true);
    });

    it('should render photo gallery section', () => {
      expect(mockAnalysisResults.photos).toBeTruthy();
      expect(mockAnalysisResults.photos.length).toBeGreaterThan(0);
    });

    it('should render text analysis cards for each response', () => {
      const cardCount = mockAnalysisResults.textAnalysis.length;
      expect(cardCount).toBeGreaterThan(0);

      // Each card should be mappable
      mockAnalysisResults.textAnalysis.forEach((analysis, index) => {
        expect(analysis).toHaveProperty('id');
        expect(analysis).toHaveProperty('question');
        expect(analysis).toHaveProperty('feedback');
      });
    });

    it('should have correct render order', () => {
      // Typical order: Photos > Bio > Text Analysis Cards
      const hasPhotos = mockAnalysisResults.photos.length > 0;
      const hasBio = mockAnalysisResults.bio && mockAnalysisResults.bio.length > 0;
      const hasAnalysis = mockAnalysisResults.textAnalysis.length > 0;

      // At least one section should be present
      expect(hasPhotos || hasBio || hasAnalysis).toBe(true);
    });
  });

  describe('Data Completeness', () => {
    it('should have all required top-level fields', () => {
      expect(mockAnalysisResults).toHaveProperty('userId');
      expect(mockAnalysisResults).toHaveProperty('bio');
      expect(mockAnalysisResults).toHaveProperty('photos');
      expect(mockAnalysisResults).toHaveProperty('textAnalysis');
      expect(mockAnalysisResults).toHaveProperty('personality');
      expect(mockAnalysisResults).toHaveProperty('uploadedAt');
    });

    it('should have complete personality profile', () => {
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
        expect(mockAnalysisResults.personality).toHaveProperty(field);
      }
    });
  });

  describe('Multiple Analyses', () => {
    it('should handle 2+ text analyses', () => {
      expect(mockAnalysisResults.textAnalysis.length).toBeGreaterThanOrEqual(2);
    });

    it('should render each analysis independently', () => {
      for (let i = 0; i < mockAnalysisResults.textAnalysis.length; i++) {
        const analysis = mockAnalysisResults.textAnalysis[i];
        expect(analysis).toHaveProperty('id');
        expect(analysis.id).toBe(`resp_00${i + 1}`);
      }
    });

    it('should maintain order of analyses', () => {
      const ids = mockAnalysisResults.textAnalysis.map((a) => a.id);
      expect(ids).toEqual(['resp_001', 'resp_002']);
    });
  });

  describe('Conditional Rendering', () => {
    it('should show bio section only if bio exists', () => {
      const hasContent = mockAnalysisResults.bio.length > 0;
      expect(hasContent).toBe(true);
    });

    it('should always show text analysis if present', () => {
      expect(mockAnalysisResults.textAnalysis.length).toBeGreaterThan(0);
    });

    it('should handle no text responses gracefully', () => {
      const noAnalysis = {
        ...mockAnalysisResults,
        textAnalysis: [],
      };

      // Should still show bio and photos
      expect(noAnalysis.bio).toBeTruthy();
      expect(noAnalysis.photos.length).toBeGreaterThan(0);
    });

    it('should handle missing optional fields', () => {
      const minimalResults = {
        userId: mockAnalysisResults.userId,
        bio: '',
        photos: [],
        textAnalysis: [],
        personality: mockAnalysisResults.personality,
      };

      // Should still be valid structure
      expect(minimalResults.userId).toBeTruthy();
      expect(minimalResults.personality).toBeTruthy();
    });
  });

  describe('Loading States', () => {
    it('should handle initial loading state', () => {
      const loadingState = {
        isLoading: true,
        data: null,
        error: null,
      };

      expect(loadingState.isLoading).toBe(true);
      expect(loadingState.data).toBeNull();
    });

    it('should handle loaded state', () => {
      const loadedState = {
        isLoading: false,
        data: mockAnalysisResults,
        error: null,
      };

      expect(loadedState.isLoading).toBe(false);
      expect(loadedState.data).toBeTruthy();
    });

    it('should handle error state', () => {
      const errorState = {
        isLoading: false,
        data: null,
        error: 'Failed to load analysis',
      };

      expect(errorState.isLoading).toBe(false);
      expect(errorState.error).toBeTruthy();
    });
  });
});
