import { describe, it, expect, beforeAll } from 'vitest';
import { analyzeTextWithLLM } from '../src/utils/llmAnalyzer';
import dotenv from 'dotenv';

// Load env vars
dotenv.config();

/**
 * Integration test with REAL Gemini API
 * This test actually calls the real Google Generative AI API
 * to identify any issues with the real LLM integration.
 * 
 * Run with: npm test -- llmIntegration --run
 */

describe('LLM Real API Integration', () => {
  beforeAll(() => {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('\n=== LLM Integration Test ===');
    console.log(`API Key loaded: ${apiKey ? 'YES ✓' : 'NO ✗'}`);
    console.log(`API Key value: ${apiKey ? apiKey.substring(0, 10) + '...' : 'MISSING'}`);
    
    if (!apiKey) {
      console.warn('\n⚠️  WARNING: GEMINI_API_KEY is not set in .env');
      console.warn('This test requires a valid API key to run.');
      console.warn('Without it, the LLM will return empty responses.');
    }
  });

  it('should call real Gemini API and return valid response', async () => {
    const question = 'What are you most passionate about?';
    const answer = 'I love photography and travel. I enjoy capturing meaningful moments.';
    
    console.log('\n--- Test: Real API Call ---');
    console.log(`Question: ${question}`);
    console.log(`Answer: ${answer}`);
    console.log('Calling real Gemini API...');
    
    try {
      const startTime = Date.now();
      const result = await analyzeTextWithLLM(question, answer);
      const duration = Date.now() - startTime;
      
      console.log(`\n✅ API Response received in ${duration}ms`);
      console.log(`Response structure:`, {
        analysis: result.analysis ? '✓ Present' : '✗ Missing',
        strengths: `${result.strengths.length} items`,
        suggestions: `${result.suggestions.length} items`,
        personality_context: result.personality_context ? '✓ Present' : '✗ Missing',
      });
      
      if (result.analysis) {
        console.log(`\nAnalysis preview: ${result.analysis.substring(0, 100)}...`);
      }
      
      // Validate structure
      expect(result.analysis).toBeTruthy();
      expect(result.analysis.length).toBeGreaterThan(0);
      expect(result.strengths).toHaveLength(3);
      expect(result.suggestions).toHaveLength(3);
      expect(result.personality_context).toBeTruthy();
      
      console.log('\n✅ All validations passed');
    } catch (error: any) {
      console.error('\n❌ API Call Failed');
      console.error(`Error: ${error.message}`);
      
      if (error.message.includes('GEMINI_API_KEY')) {
        console.error('❌ PROBLEM: GEMINI_API_KEY is missing or invalid');
        console.error('Solution: Add valid GEMINI_API_KEY to .env');
      } else if (error.message.includes('429')) {
        console.error('❌ PROBLEM: Rate limit exceeded');
        console.error('Solution: Wait a moment and try again');
      } else if (error.message.includes('401')) {
        console.error('❌ PROBLEM: Unauthorized - API key is invalid');
        console.error('Solution: Check that GEMINI_API_KEY in .env is correct');
      } else if (error.message.includes('Empty')) {
        console.error('❌ PROBLEM: Empty response from API');
        console.error('This happens when API key is invalid');
      }
      
      throw error;
    }
  }, 60000); // 60 second timeout for API call

  it('should handle multiple questions correctly', async () => {
    const testCases = [
      {
        question: 'What are you looking for in a partner?',
        answer: 'Someone authentic, kind, and who shares my values.',
      },
      {
        question: "What's your ideal weekend?",
        answer: 'Hiking in nature followed by a cozy dinner with conversation.',
      },
    ];
    
    console.log('\n--- Test: Multiple Questions ---');
    
    for (const testCase of testCases) {
      try {
        console.log(`\nAnalyzing: "${testCase.question}"`);
        const result = await analyzeTextWithLLM(testCase.question, testCase.answer);
        
        expect(result.analysis).toBeTruthy();
        expect(result.strengths.length).toBe(3);
        expect(result.suggestions.length).toBe(3);
        
        console.log('✅ Success');
      } catch (error: any) {
        console.error(`❌ Failed: ${error.message}`);
        throw error;
      }
    }
  }, 120000); // 2 minute timeout for multiple calls
});
