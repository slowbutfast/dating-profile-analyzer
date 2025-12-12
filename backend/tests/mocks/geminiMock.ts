import { vi } from 'vitest';

/**
 * Mock setup for Google Generative AI (Gemini API)
 * 
 * This allows tests to run without GEMINI_API_KEY environment variable
 * by mocking all Gemini API calls.
 */

export const mockGeminiResponse = {
  analysis: 'Your response beautifully combines personal passion with meaningful storytelling. This authentic enthusiasm is exactly what makes profiles compelling.',
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
};

/**
 * Setup for mocking GoogleGenerativeAI
 * Call this in beforeEach or beforeAll in your test file
 */
export function mockGeminiAPI() {
  // Mock the generateContent response
  const mockGenerateContent = vi.fn(async () => ({
    response: {
      text: () => JSON.stringify(mockGeminiResponse),
    },
  }));

  // Mock the model getter
  const mockGetGenerativeModel = vi.fn(() => ({
    generateContent: mockGenerateContent,
  }));

  // Mock GoogleGenerativeAI constructor
  const MockGoogleGenerativeAI = vi.fn(() => ({
    getGenerativeModel: mockGetGenerativeModel,
  }));

  // Replace the module
  vi.doMock('@google/generative-ai', () => ({
    GoogleGenerativeAI: MockGoogleGenerativeAI,
  }));

  return {
    MockGoogleGenerativeAI,
    mockGetGenerativeModel,
    mockGenerateContent,
  };
}

/**
 * Alternative: Mock at module level for all tests
 * 
 * Add this to vitest.config.ts under defineConfig:
 * 
 * vi.mock('@google/generative-ai', () => {
 *   const mockGenerateContent = vi.fn(async () => ({
 *     response: {
 *       text: () => JSON.stringify({
 *         analysis: 'Mock analysis text',
 *         strengths: ['Strength 1'],
 *         suggestions: ['Suggestion 1'],
 *       }),
 *     },
 *   }));
 * 
 *   return {
 *     GoogleGenerativeAI: vi.fn(() => ({
 *       getGenerativeModel: vi.fn(() => ({
 *         generateContent: mockGenerateContent,
 *       })),
 *     })),
 *   };
 * });
 */
