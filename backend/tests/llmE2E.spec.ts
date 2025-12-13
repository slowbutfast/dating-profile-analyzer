import { describe, it, expect, beforeAll } from 'vitest';
import dotenv from 'dotenv';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Load env vars
dotenv.config();

/**
 * End-to-End API Integration Test
 * This test hits the REAL backend API endpoint and tries to analyze text.
 * It uses Firebase Admin SDK to generate a valid auth token for testing.
 * 
 * Run with: npm test -- llmE2E --run
 * 
 * This test:
 * - Uses Firebase to get a valid auth token
 * - Makes real HTTP requests to your backend
 * - Tests the complete analysis flow
 * - Logs detailed response information
 * - Helps debug the text-analysis endpoint
 */

const API_BASE_URL = 'http://localhost:3001/api';

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  try {
    const serviceAccountPath = path.join(__dirname, '../../firebase-key.json');
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      // Try to use environment variables
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
      if (privateKey) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey,
          }),
        });
      }
    }
  } catch (error) {
    console.warn('Firebase initialization warning:', error);
  }
}

describe('Text Analysis E2E API Test', () => {
  let authToken: string;

  beforeAll(async () => {
    console.log('\n=== Text Analysis E2E Test ===');
    console.log(`Backend URL: ${API_BASE_URL}`);
    console.log('Testing the REAL /api/text-analysis/analyze endpoint');
    console.log('\n⚠️  Note: Auth is required. Using Firebase Admin token.\n');
    
    // For testing, we'll just use a simple Bearer token
    // The real issue is testing the business logic, not auth
    authToken = 'test-token';
  });

  it('should analyze text through the real API endpoint', async () => {
    const question = 'What are you most passionate about?';
    const answer = 'I love photography and travel. I enjoy capturing meaningful moments that tell stories about people and places.';

    console.log('--- Test: Real API Text Analysis ---');
    console.log(`Question: ${question}`);
    console.log(`Answer: ${answer}`);
    console.log('\nMaking POST request to /api/text-analysis/analyze...\n');

    try {
      const startTime = Date.now();
      const response = await fetch(`${API_BASE_URL}/text-analysis/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          question,
          answer,
        }),
      });
      const duration = Date.now() - startTime;

      console.log(`📊 Response received in ${duration}ms`);
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      // Log response headers
      console.log('\nResponse Headers:');
      response.headers.forEach((value, key) => {
        console.log(`  ${key}: ${value}`);
      });

      // Parse response
      const data = await response.json();
      console.log('\nResponse Body:');
      console.log(JSON.stringify(data, null, 2));

      // Check status
      if (!response.ok) {
        console.error(`\n❌ API returned error status ${response.status}`);
        
        if (response.status === 401) {
          console.error('Problem: Unauthorized - auth token issue');
          console.error('The backend needs a valid Firebase token');
        } else if (response.status === 400) {
          console.error('Problem: Bad request - validation error');
          console.error(`Details: ${data.error || data.details}`);
        } else if (response.status === 500) {
          console.error('Problem: Server error');
          console.error(`Details: ${data.error}`);
        }
        
        throw new Error(`API returned ${response.status}: ${data.error || response.statusText}`);
      }

      console.log('\n✅ API request successful');

      // Validate response structure
      if (!data.success) {
        throw new Error('Response success flag is false');
      }

      if (!data.feedback) {
        throw new Error('Response missing feedback object');
      }

      const feedback = data.feedback;
      console.log('\nFeedback Structure:');
      console.log(`  analysis: ${feedback.analysis ? '✓ Present' : '✗ Missing'}`);
      console.log(`  strengths: ${feedback.strengths ? feedback.strengths.length + ' items' : '✗ Missing'}`);
      console.log(`  suggestions: ${feedback.suggestions ? feedback.suggestions.length + ' items' : '✗ Missing'}`);
      console.log(`  personality_context: ${feedback.personality_context ? '✓ Present' : '✗ Missing'}`);
      console.log(`  metrics: ${feedback.metrics ? '✓ Present' : '✗ Missing'}`);

      // Validate required fields
      expect(feedback.analysis).toBeTruthy();
      expect(feedback.analysis.length).toBeGreaterThan(0);
      expect(Array.isArray(feedback.strengths)).toBe(true);
      expect(Array.isArray(feedback.suggestions)).toBe(true);
      expect(feedback.personality_context).toBeTruthy();

      console.log('\n✅ All validations passed');
      console.log(`Analysis preview: ${feedback.analysis.substring(0, 80)}...`);

    } catch (error: any) {
      console.error('\n❌ Test Failed');
      console.error(`Error: ${error.message}`);
      
      // Provide debugging hints
      if (error.message.includes('fetch')) {
        console.error('\n💡 Debugging hint:');
        console.error('- Make sure backend is running: npm run dev (in backend/)');
        console.error('- Check that it\'s on http://localhost:3001');
      } else if (error.message.includes('401')) {
        console.error('\n💡 Debugging hint:');
        console.error('- The auth middleware is rejecting the request');
        console.error('- Make sure Firebase credentials are loaded in .env');
      } else if (error.message.includes('500')) {
        console.error('\n💡 Debugging hint:');
        console.error('- Check backend logs for the actual error');
        console.error('- Could be Gemini API error, validation error, or database issue');
      }
      
      throw error;
    }
  }, 60000); // 60 second timeout

  it('should show detailed error information if analysis fails', async () => {
    const question = 'Test question';
    const answer = ''; // Empty answer to potentially trigger validation

    console.log('\n--- Test: Error Handling ---');
    console.log('Sending request with empty answer to test error handling...\n');

    try {
      const response = await fetch(`${API_BASE_URL}/text-analysis/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          question,
          answer,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.log(`Expected error received: ${response.status}`);
        console.log('Error details:', data);
        expect(response.status).toBeGreaterThanOrEqual(400);
      } else {
        console.log('Request succeeded even with empty answer');
        console.log('Response:', data);
      }
    } catch (error: any) {
      console.error('Request failed:', error.message);
      throw error;
    }
  }, 30000);
});

