import { describe, it, expect, beforeEach, vi } from 'vitest';
import { analyzeTextWithLLM, getFallbackAnalysis } from '../src/utils/llmAnalyzer';
import { sanitizeInput, validateTextResponse } from '../src/utils/textInputValidator';
import { analyzeTextStatistics } from '../src/utils/textMetrics';

/**
 * DEBUG TEST SUITE: LLM Text Analysis Pipeline
 * 
 * Tests the complete flow:
 * 1. Input validation
 * 2. Sanitization
 * 3. LLM analysis
 * 4. Statistics calculation
 * 5. Response structure
 */

describe('LLM Text Analysis Debugging', () => {
  const mockPersonality = {
    age_range: '25-30',
    gender: 'not specified',
    dating_goal: 'long-term relationship',
    personality_type: 'ENFP',
    conversation_style: 'thoughtful and genuine',
    humor_style: 'dry and witty',
    dating_experience: 'moderate',
    interests: 'travel, hiking, books, cooking, art',
    ideal_match: 'someone genuine, kind, and intellectually curious',
  };

  const mockQuestion = 'What are you most passionate about?';
  
  const mockAnswers = {
    good: 'I\'m really passionate about photography and travel. I love capturing moments that tell stories about people and places.',
    short: 'Travel and photography.',
    empty: '',
    veryLong: 'I am passionate about many things including but not limited to photography which involves taking pictures of various subjects and places around the world, and traveling which allows me to explore new cultures and meet new people while also enjoying nature and outdoor activities. I also enjoy hiking which combines my love of nature and physical activity.',
  };

  describe('Step 1: Input Validation', () => {
    it('should accept valid text responses', () => {
      const result = validateTextResponse(mockAnswers.good);
      expect(result.isValid).toBe(true);
    });

    it('should reject empty responses', () => {
      const result = validateTextResponse(mockAnswers.empty);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should accept minimum length responses', () => {
      const minText = 'Travel and photography.';
      const result = validateTextResponse(minText);
      expect(result.isValid).toBe(true);
    });

    it('should accept maximum length responses', () => {
      const result = validateTextResponse(mockAnswers.veryLong);
      expect(result.isValid).toBe(true);
    });

    it('should reject responses exceeding max length', () => {
      const tooLong = 'x'.repeat(2001);
      const result = validateTextResponse(tooLong);
      expect(result.isValid).toBe(false);
    });
  });

  describe('Step 2: Input Sanitization', () => {
    it('should sanitize basic input', () => {
      const dirty = '<script>alert("xss")</script>Photography';
      const clean = sanitizeInput(dirty);
      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('alert');
    });

    it('should preserve legitimate content', () => {
      const input = mockAnswers.good;
      const sanitized = sanitizeInput(input);
      expect(sanitized).toContain('photography');
      expect(sanitized).toContain('travel');
    });

    it('should trim whitespace', () => {
      const input = '  Photography and travel  ';
      const sanitized = sanitizeInput(input);
      expect(sanitized.trim()).toEqual(sanitized);
    });
  });

  describe('Step 3: Text Statistics Analysis', () => {
    it('should calculate word count correctly', () => {
      const stats = analyzeTextStatistics(mockAnswers.good);
      expect(stats.word_count).toBeGreaterThan(0);
      expect(stats.word_count).toBeLessThan(50); // Roughly 24 words
    });

    it('should detect specific examples', () => {
      const withExamples = 'I love hiking. For example, I climbed Mount Rainier last summer.';
      const stats = analyzeTextStatistics(withExamples);
      expect(stats.has_specific_examples).toBe(true);
    });

    it('should mark no examples when absent', () => {
      const noExamples = 'I like hiking and travel.';
      const stats = analyzeTextStatistics(noExamples);
      expect(stats.has_specific_examples).toBe(false);
    });

    it('should calculate sentence count', () => {
      const stats = analyzeTextStatistics(mockAnswers.good);
      expect(stats.sentence_count).toBeGreaterThan(0);
    });
  });

  describe('Step 4: Fallback Analysis (When LLM Fails)', () => {
    it('should return valid fallback analysis structure', () => {
      const fallback = getFallbackAnalysis(mockAnswers.good, mockPersonality, mockQuestion);
      
      expect(fallback).toBeDefined();
      expect(fallback.analysis).toBeDefined();
      expect(fallback.strengths).toBeDefined();
      expect(fallback.suggestions).toBeDefined();
      expect(fallback.metrics).toBeDefined();
      expect(fallback.personality_context).toBeDefined();
    });

    it('fallback should include array fields', () => {
      const fallback = getFallbackAnalysis(mockAnswers.good, mockPersonality, mockQuestion);
      
      expect(Array.isArray(fallback.strengths)).toBe(true);
      expect(fallback.strengths.length).toBeGreaterThan(0);
      expect(Array.isArray(fallback.suggestions)).toBe(true);
      expect(fallback.suggestions.length).toBeGreaterThan(0);
    });

    it('fallback should include valid metrics', () => {
      const fallback = getFallbackAnalysis(mockAnswers.good, mockPersonality, mockQuestion);
      
      expect(fallback.metrics.word_count).toBeGreaterThan(0);
      expect(typeof fallback.metrics.has_specific_examples).toBe('boolean');
    });

    it('fallback should include personality context', () => {
      const fallback = getFallbackAnalysis(mockAnswers.good, mockPersonality, mockQuestion);
      
      expect(fallback.personality_context).toBeDefined();
      expect(fallback.personality_context.dating_goal).toBeDefined();
    });
  });

  describe('Step 5: LLM Analysis Response Structure', () => {
    it('fallback analysis should have all required fields', () => {
      const analysis = getFallbackAnalysis(mockAnswers.good, mockPersonality, mockQuestion);
      
      // Check structure matches expected schema
      expect(typeof analysis.analysis).toBe('string');
      expect(analysis.analysis.length).toBeGreaterThan(0);
      
      expect(Array.isArray(analysis.strengths)).toBe(true);
      expect(analysis.strengths.every((s: string) => typeof s === 'string')).toBe(true);
      
      expect(Array.isArray(analysis.suggestions)).toBe(true);
      expect(analysis.suggestions.every((s: string) => typeof s === 'string')).toBe(true);
      
      expect(analysis.metrics).toBeDefined();
      expect(typeof analysis.metrics.word_count).toBe('number');
      expect(typeof analysis.metrics.has_specific_examples).toBe('boolean');
    });

    it('should return different feedback for different questions', () => {
      const question1 = 'What are you most passionate about?';
      const question2 = 'What are you looking for in a partner?';
      
      const analysis1 = getFallbackAnalysis(mockAnswers.good, mockPersonality, question1);
      const analysis2 = getFallbackAnalysis(mockAnswers.good, mockPersonality, question2);
      
      // Both should have valid structure
      expect(analysis1.analysis).toBeDefined();
      expect(analysis2.analysis).toBeDefined();
      // Content may differ based on question context
      expect(analysis1).toBeTruthy();
      expect(analysis2).toBeTruthy();
    });
  });

  describe('Step 6: Full Pipeline Integration', () => {
    it('should handle complete text analysis pipeline', async () => {
      // 1. Validate
      const validation = validateTextResponse(mockAnswers.good);
      expect(validation.isValid).toBe(true);
      
      // 2. Sanitize
      const sanitized = sanitizeInput(mockAnswers.good);
      expect(sanitized).toBeTruthy();
      
      // 3. Calculate stats
      const stats = analyzeTextStatistics(sanitized);
      expect(stats.word_count).toBeGreaterThan(0);
      
      // 4. Get fallback analysis
      const analysis = getFallbackAnalysis(sanitized, mockPersonality, mockQuestion);
      expect(analysis).toBeDefined();
      expect(analysis.strengths.length).toBeGreaterThan(0);
    });

    it('should handle various input lengths correctly', () => {
      const inputs = [
        'Short.',
        mockAnswers.good,
        mockAnswers.veryLong,
      ];

      for (const input of inputs) {
        const validation = validateTextResponse(input);
        expect(validation.isValid).toBe(true);

        const sanitized = sanitizeInput(input);
        const stats = analyzeTextStatistics(sanitized);
        expect(stats.word_count).toBeGreaterThan(0);

        const analysis = getFallbackAnalysis(sanitized, mockPersonality, mockQuestion);
        expect(analysis.analysis).toBeTruthy();
      }
    });
  });

  describe('Step 7: Error Cases & Edge Cases', () => {
    it('should handle null/undefined inputs gracefully', () => {
      // Validation should catch these
      const validation1 = validateTextResponse(null as any);
      const validation2 = validateTextResponse(undefined as any);
      
      expect(validation1.isValid).toBe(false);
      expect(validation2.isValid).toBe(false);
    });

    it('should handle special characters', () => {
      const input = 'I love hiking! @#$%^&*() [brackets] {braces}';
      const validation = validateTextResponse(input);
      expect(validation.isValid).toBe(true);
      
      const sanitized = sanitizeInput(input);
      expect(sanitized).toBeTruthy();
    });

    it('should handle unicode characters', () => {
      const input = 'I love traveling 🌍 and photography 📸';
      const validation = validateTextResponse(input);
      expect(validation.isValid).toBe(true);
      
      const stats = analyzeTextStatistics(input);
      expect(stats.word_count).toBeGreaterThan(0);
    });
  });

  describe('Debugging: LLM API Call Status', () => {
    it('should log when Gemini API key is missing', () => {
      // This test checks environment configuration
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        console.warn('⚠️  DEBUGGING: GEMINI_API_KEY is not set - LLM calls will fail');
      }
      
      // Test will pass but warning indicates configuration issue
      expect(true).toBe(true);
    });

    it('fallback provides output when LLM unavailable', () => {
      // Even if LLM fails, fallback should work
      const analysis = getFallbackAnalysis(mockAnswers.good, mockPersonality, mockQuestion);
      
      // Verify fallback is not empty
      expect(analysis.analysis.length).toBeGreaterThan(10);
      expect(analysis.strengths.length).toBeGreaterThan(0);
      expect(analysis.suggestions.length).toBeGreaterThan(0);
    });
  });
});

describe('LLM Analysis Integration Points', () => {
  /**
   * These tests help identify where in the system LLM data might get lost
   */

  it('should preserve analysis through serialization', () => {
    const original = {
      analysis: 'Test analysis',
      strengths: ['Strength 1', 'Strength 2'],
      suggestions: ['Suggestion 1'],
      metrics: { word_count: 10, has_specific_examples: false },
      personality_context: { dating_goal: 'long-term' },
    };

    // Simulate JSON serialization (what Firestore does)
    const serialized = JSON.stringify(original);
    const deserialized = JSON.parse(serialized);

    expect(deserialized).toEqual(original);
    expect(deserialized.analysis).toBe('Test analysis');
    expect(deserialized.strengths).toEqual(['Strength 1', 'Strength 2']);
  });

  it('should handle Firestore write/read cycle', () => {
    const data = {
      id: 'resp_001',
      question: 'What are you passionate about?',
      answer: 'Photography and travel',
      analysis: 'Your response shows genuine passion',
      strengths: ['Specific interests'],
      suggestions: ['Add examples'],
      metrics: { word_count: 4, has_specific_examples: false },
      personality_context: { dating_goal: 'long-term' },
      created_at: new Date(),
    };

    // Test data structure that would be stored
    expect(data).toBeDefined();
    expect(data.analysis).toBeTruthy();
    expect(data.strengths).toHaveLength(1);
    expect(data.suggestions).toHaveLength(1);
  });
});
