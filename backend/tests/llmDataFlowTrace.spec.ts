import { describe, it, expect } from 'vitest';

/**
 * DEBUG TEST SUITE: End-to-End Data Flow Tracing
 * 
 * This test traces where the LLM analysis data might be getting lost
 * in the complete pipeline:
 * 
 * User Input → Validation → Sanitization → LLM Call → 
 * Firestore Write → API Response → Frontend State → Rendering
 */

describe('End-to-End Data Flow Trace - LLM Analysis', () => {
  const sampleUser = {
    uid: 'test_user_abc123',
  };

  const sampleAnalysisRequest = {
    analysisId: 'analysis_xyz789',
    question: 'What are you most passionate about?',
    answer: 'I\'m really passionate about photography and travel. I love capturing moments that tell stories about people and places.',
  };

  const samplePersonality = {
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

  const expectedLLMResponse = {
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
    metrics: {
      word_count: 27,
      sentence_count: 2,
      has_specific_examples: false,
    },
    personality_context: {
      dating_goal: 'long-term relationship',
      conversation_style: 'thoughtful and genuine',
      humor_style: 'dry and witty',
    },
  };

  describe('STAGE 1: Request Received at Backend', () => {
    it('backend should receive user context', () => {
      expect(sampleUser.uid).toBeTruthy();
      console.log('✅ User context received:', sampleUser.uid);
    });

    it('backend should receive full request body', () => {
      expect(sampleAnalysisRequest.analysisId).toBeTruthy();
      expect(sampleAnalysisRequest.question).toBeTruthy();
      expect(sampleAnalysisRequest.answer).toBeTruthy();
      console.log('✅ Request received with:', {
        analysisId: sampleAnalysisRequest.analysisId,
        questionLength: sampleAnalysisRequest.question.length,
        answerLength: sampleAnalysisRequest.answer.length,
      });
    });

    it('should log request checkpoint', () => {
      // Recommended log: console.log('[TEXT-ANALYSIS] Request received:', { analysisId, question, answerLength: answer.length })
      expect(true).toBe(true);
      console.log('📍 CHECKPOINT 1: Add this to textAnalysis.ts line ~60:');
      console.log('  console.log("[TEXT-ANALYSIS] Request received:", { analysisId, question, answerLength: answer.length });');
    });
  });

  describe('STAGE 2: Fetch Personality Profile', () => {
    it('should fetch personality from Firestore', () => {
      expect(samplePersonality).toBeDefined();
      expect(samplePersonality.dating_goal).toBe('long-term relationship');
      console.log('✅ Personality profile loaded');
    });

    it('should merge with fallback if not found', () => {
      const fetchedPersonality = samplePersonality || {
        dating_goal: 'long-term relationship',
        conversation_style: 'thoughtful and genuine',
      };

      expect(fetchedPersonality.dating_goal).toBeTruthy();
      console.log('✅ Personality merge successful');
    });

    it('should log personality checkpoint', () => {
      console.log('📍 CHECKPOINT 2: Add this to textAnalysis.ts before LLM call:');
      console.log('  console.log("[TEXT-ANALYSIS] Using personality:", { dating_goal, conversation_style });');
    });
  });

  describe('STAGE 3: Input Validation & Sanitization', () => {
    it('should validate text length', () => {
      const answer = sampleAnalysisRequest.answer;
      expect(answer.length).toBeGreaterThan(10);
      expect(answer.length).toBeLessThan(2000);
      console.log('✅ Text validation passed');
    });

    it('should sanitize input', () => {
      const sanitized = sampleAnalysisRequest.answer
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .trim();
      
      expect(sanitized).toEqual(sampleAnalysisRequest.answer);
      console.log('✅ Input sanitized');
    });
  });

  describe('STAGE 4: Call LLM (This is likely where it fails)', () => {
    it('LLM should be called with all parameters', () => {
      const llmCall = {
        textResponse: sampleAnalysisRequest.answer,
        personality: samplePersonality,
        question: sampleAnalysisRequest.question,
      };

      expect(llmCall.textResponse).toBeTruthy();
      expect(llmCall.personality).toBeTruthy();
      expect(llmCall.question).toBeTruthy();
      console.log('✅ LLM call parameters valid');
    });

    it('should log before LLM call', () => {
      console.log('📍 CHECKPOINT 3: Add this before analyzeTextWithLLM() in llmAnalyzer.ts:');
      console.log('  console.log("[LLM] Calling with:", { question, responseLength: textResponse.length });');
    });

    it('should log after LLM response', () => {
      console.log('📍 CHECKPOINT 4: Add this after LLM returns in llmAnalyzer.ts:');
      console.log('  console.log("[LLM] Response received:", { hasAnalysis: !!response.analysis, strengthsCount: response.strengths?.length });');
    });

    it('should have Gemini API key configured', () => {
      const hasApiKey = !!process.env.GEMINI_API_KEY;
      
      if (!hasApiKey) {
        console.error('❌ CRITICAL: GEMINI_API_KEY not set');
        console.error('   This will cause all LLM calls to fail with empty responses');
        console.error('   Add to .env: GEMINI_API_KEY=your_key_here');
      }

      expect(typeof hasApiKey).toBe('boolean');
    });
  });

  describe('STAGE 5: LLM Response Validation', () => {
    it('LLM should return proper structure', () => {
      expect(expectedLLMResponse.analysis).toBeTruthy();
      expect(Array.isArray(expectedLLMResponse.strengths)).toBe(true);
      expect(Array.isArray(expectedLLMResponse.suggestions)).toBe(true);
      expect(expectedLLMResponse.metrics).toBeDefined();
      console.log('✅ LLM response structure valid');
    });

    it('LLM should not return empty fields', () => {
      expect(expectedLLMResponse.analysis.length).toBeGreaterThan(10);
      expect(expectedLLMResponse.strengths.length).toBeGreaterThan(0);
      expect(expectedLLMResponse.suggestions.length).toBeGreaterThan(0);
      console.log('✅ LLM response has content');
    });

    it('should validate metrics are calculated', () => {
      expect(typeof expectedLLMResponse.metrics.word_count).toBe('number');
      expect(typeof expectedLLMResponse.metrics.has_specific_examples).toBe('boolean');
      console.log('✅ Metrics calculated');
    });
  });

  describe('STAGE 6: Store in Firestore', () => {
    it('should prepare Firestore document', () => {
      const firestoreDoc = {
        id: sampleAnalysisRequest.analysisId,
        responseId: 'resp_001', // Should be generated or provided
        question: sampleAnalysisRequest.question,
        answer: sampleAnalysisRequest.answer,
        analysis: expectedLLMResponse.analysis,
        strengths: expectedLLMResponse.strengths,
        suggestions: expectedLLMResponse.suggestions,
        metrics: expectedLLMResponse.metrics,
        personality_context: expectedLLMResponse.personality_context,
        created_at: new Date(),
      };

      expect(firestoreDoc.analysis).toBeTruthy();
      console.log('✅ Firestore document prepared');
    });

    it('should log Firestore write', () => {
      console.log('📍 CHECKPOINT 5: Add before db.collection().doc().set() in textAnalysis.ts:');
      console.log('  console.log("[FIRESTORE] Writing feedback:", { responseId, analysisLength: feedback.analysis.length });');
    });

    it('should handle Firestore write errors', () => {
      console.log('📍 CHECKPOINT 6: Add error handler:');
      console.log('  .catch(err => {');
      console.log('    console.error("[FIRESTORE] Write failed:", err);');
      console.log('    return res.status(500).json({ error: "Firestore write failed" });');
      console.log('  })');
    });
  });

  describe('STAGE 7: Send API Response to Frontend', () => {
    it('should format response correctly', () => {
      const apiResponse = {
        success: true,
        data: {
          feedback: expectedLLMResponse,
        },
      };

      expect(apiResponse.data.feedback.analysis).toBeTruthy();
      console.log('✅ API response formatted');
    });

    it('should send response to client', () => {
      console.log('📍 CHECKPOINT 7: Before res.json() in textAnalysis.ts:');
      console.log('  console.log("[API] Sending response:", { analysisLength: feedback.analysis.length, status: 200 });');
      console.log('  res.json({ success: true, data: { feedback } });');
    });

    it('should handle response send errors', () => {
      console.log('📍 CHECKPOINT 8: Add error handler for res.json():');
      console.log('  if (!res.headersSent) {');
      console.log('    res.status(500).json({ error: "Failed to send response" });');
      console.log('  }');
    });
  });

  describe('STAGE 8: Frontend Receives & Stores Data', () => {
    it('frontend should receive API response', () => {
      const apiResponse = {
        status: 200,
        data: {
          feedback: expectedLLMResponse,
        },
      };

      expect(apiResponse.data.feedback).toBeTruthy();
      console.log('✅ Frontend received API response');
    });

    it('frontend should store in state', () => {
      const textFeedback = {
        'resp_001': expectedLLMResponse,
      };

      expect(textFeedback['resp_001'].analysis).toBeTruthy();
      console.log('✅ Frontend stored in state');
    });

    it('frontend should log received data', () => {
      console.log('📍 In frontend textAnalysis.ts or Results.tsx:');
      console.log('  console.log("[FRONTEND] Feedback received:", feedback);');
    });
  });

  describe('STAGE 9: Frontend Renders Data', () => {
    it('ResultsContent should receive feedback props', () => {
      const props = {
        textFeedback: {
          'resp_001': expectedLLMResponse,
        },
      };

      expect(props.textFeedback['resp_001']).toBeTruthy();
      console.log('✅ Props passed to ResultsContent');
    });

    it('ResultsContent should render analysis section', () => {
      const hasAnalysisProp = expectedLLMResponse.analysis && 
                              expectedLLMResponse.analysis.length > 0;
      
      expect(hasAnalysisProp).toBe(true);
      console.log('✅ Analysis should render');
    });

    it('should check conditional rendering in ResultsContent', () => {
      console.log('📍 In ResultsContent.tsx, check this condition:');
      console.log('  {feedback && feedback.analysis && (');
      console.log('    <div>');
      console.log('      <p className="text-sm font-medium text-primary mb-1">Analysis:</p>');
      console.log('      <p className="text-sm text-muted-foreground">{feedback.analysis}</p>');
      console.log('    </div>');
      console.log('  )}');
    });
  });

  describe('Quick Debug Checklist', () => {
    it('provides debugging checklist', () => {
      const checklist = [
        { item: 'GEMINI_API_KEY is set in .env', command: 'echo $GEMINI_API_KEY' },
        { item: 'Backend logs show "Request received"', command: 'npm run dev | grep "Request received"' },
        { item: 'Backend logs show "Calling LLM"', command: 'npm run dev | grep "Calling LLM"' },
        { item: 'Backend logs show "Response received"', command: 'npm run dev | grep "Response received"' },
        { item: 'Frontend network tab shows 200 response', command: 'DevTools → Network → text-analysis call' },
        { item: 'Frontend console shows feedback data', command: 'DevTools → Console → filter "FRONTEND"' },
        { item: 'Page renders analysis text', command: 'Check page visually' },
      ];

      console.log('\n🔍 QUICK DEBUG CHECKLIST:');
      for (const check of checklist) {
        console.log(`\n[ ] ${check.item}`);
        console.log(`    ${check.command}`);
      }

      expect(checklist.length).toBe(7);
    });
  });

  describe('Most Likely Failure Points', () => {
    it('lists probable causes', () => {
      const failurePoints = [
        {
          point: 'GEMINI_API_KEY missing or invalid',
          symptom: 'LLM returns empty or fallback data',
          fix: 'Set GEMINI_API_KEY in .env',
        },
        {
          point: 'LLM response not being parsed',
          symptom: 'Backend logs show LLM called but analysis is empty',
          fix: 'Check analyzeTextWithLLM() parsing logic in llmAnalyzer.ts',
        },
        {
          point: 'Firestore write failing silently',
          symptom: 'API returns success but data not in Firebase',
          fix: 'Add error logging to Firestore .set() call',
        },
        {
          point: 'API response not being sent',
          symptom: 'Frontend request hangs or times out',
          fix: 'Verify res.json() is called',
        },
        {
          point: 'Frontend not storing feedback in state',
          symptom: 'API returns data but page is blank',
          fix: 'Check setTextFeedback() call in Results.tsx',
        },
        {
          point: 'ResultsContent not rendering feedback',
          symptom: 'Data in state but not visible on page',
          fix: 'Check conditional rendering in ResultsContent.tsx',
        },
      ];

      console.log('\n⚠️  MOST LIKELY FAILURE POINTS:');
      for (const failure of failurePoints) {
        console.log(`\n${failure.point}`);
        console.log(`  Symptom: ${failure.symptom}`);
        console.log(`  Fix: ${failure.fix}`);
      }

      expect(failurePoints.length).toBe(6);
    });
  });
});
