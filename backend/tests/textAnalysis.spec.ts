/**
 * Text Analysis Test Suite (Vitest)
 * Tests: validation, sanitization, data structures
 * Run with: npm test -- backend/tests/textAnalysis.test.ts
 */

import { describe, it, expect } from 'vitest';
import {
  validateTextResponse,
  sanitizeInput,
} from '../src/utils/textInputValidator';

// Test data
const mockPersonality = {
  age_range: '25-30',
  gender: 'female',
  dating_goal: 'long-term relationship',
  personality_type: 'INFP',
  conversation_style: 'thoughtful and genuine',
  humor_style: 'dry and witty',
  dating_experience: 'moderate',
  interests: 'reading, hiking, photography',
  ideal_match: 'someone kind and intellectually curious',
};

const mockValidAnswer =
  'I\'m really passionate about photography and travel. I love capturing moments that tell stories.';
const mockShortAnswer = 'Too short'; // 9 characters - less than 10 minimum
const mockLongAnswer = 'a'.repeat(2001); // Exceeds 2000 characters
const mockAnswerWithCode = 'I like `code` and ```javascript\nalert(\'test\')```';
const mockAnswerWithSpecialChars = 'I\'m excited!!! @@@ $$$  &&& about life!!!';

describe('Text Validation', () => {
  it('should accept valid answers (10-2000 chars)', () => {
    const result = validateTextResponse(mockValidAnswer);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject answers shorter than 10 characters', () => {
    const result = validateTextResponse(mockShortAnswer);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'Response must be at least 10 characters'
    );
  });

  it('should reject answers longer than 2000 characters', () => {
    const result = validateTextResponse(mockLongAnswer);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Response cannot exceed 2000 characters');
  });

  it('should reject answers with code blocks', () => {
    const result = validateTextResponse(mockAnswerWithCode);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Response contains disallowed content');
  });

  it('should reject answers with excessive special characters', () => {
    const result = validateTextResponse(mockAnswerWithSpecialChars);
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) => e.includes('special character'))
    ).toBe(true);
  });
});

describe('Text Sanitization', () => {
  it('should remove dangerous characters', () => {
    const dangerous = 'Hello {world} <script>alert("xss")</script> | test';
    const sanitized = sanitizeInput(dangerous);
    expect(sanitized).not.toContain('{');
    expect(sanitized).not.toContain('}');
    expect(sanitized).not.toContain('<');
    expect(sanitized).not.toContain('>');
    expect(sanitized).not.toContain('|');
  });

  it('should remove null bytes', () => {
    const withNullByte = 'Hello\x00World';
    const sanitized = sanitizeInput(withNullByte);
    expect(sanitized).not.toContain('\x00');
  });

  it('should trim whitespace', () => {
    const padded = '   Hello World   ';
    const sanitized = sanitizeInput(padded);
    expect(sanitized).toEqual('Hello World');
  });

  it('should enforce maximum length', () => {
    const long = 'a'.repeat(2500);
    const sanitized = sanitizeInput(long);
    expect(sanitized.length).toBeLessThanOrEqual(2000);
  });
});

describe('Data Structures', () => {
  it('should have valid personality profile with all required fields', () => {
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
      expect(mockPersonality).toHaveProperty(field);
      expect(mockPersonality[field as keyof typeof mockPersonality]).toBeTruthy();
    }
  });

  it('should have personality profile with 9 fields', () => {
    const fieldCount = Object.keys(mockPersonality).length;
    expect(fieldCount).toBe(9);
  });
});
