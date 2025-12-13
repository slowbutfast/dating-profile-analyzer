# LLM Text Analysis Debugging Tests

## Overview
Three comprehensive test suites have been created to help debug why the LLM isn't processing text/returning analysis:

1. **llmDebug.spec.ts** - Tests individual components of the analysis pipeline
2. **llmApiDebug.spec.ts** - Tests the HTTP endpoint and data flow
3. **llmDataFlowTrace.spec.ts** - Traces data through the entire end-to-end pipeline

## Running the Tests

```bash
cd backend

# Run all debug tests
npm test -- llmDebug

# Run specific test suite
npm test -- llmApiDebug

# Run data flow trace
npm test -- llmDataFlowTrace

# Run all tests with verbose output
npm test -- llmDebug --reporter=verbose
```

## Test Suites Explained

### 1. llmDebug.spec.ts - Component Testing

Tests each stage of the text analysis pipeline:

- **Input Validation** - Verifies text accepts 10-2000 characters
- **Sanitization** - Checks HTML/XSS removal works
- **Statistics** - Validates word count and example detection
- **Fallback Analysis** - Ensures fallback works when LLM fails
- **Response Structure** - Verifies all required fields present
- **Full Pipeline** - Tests complete flow from input to output
- **Edge Cases** - Handles null, unicode, special characters
- **API Key Status** - Checks if GEMINI_API_KEY is configured

**Run**: `npm test -- llmDebug.spec.ts`

**What it checks**:
```
✅ Input validation (10-2000 chars)
✅ HTML sanitization
✅ Word count calculation
✅ Specific examples detection
✅ Fallback analysis generation
✅ Response has all required fields
✅ API key is configured
```

### 2. llmApiDebug.spec.ts - Endpoint Testing

Tests the HTTP endpoint `/api/text-analysis/analyze`:

- **Request Validation** - Checks all required fields present
- **Response Structure** - Validates JSON format
- **Data Flow Checkpoints** - 7 checkpoints to trace data
- **Common Failure Points** - Tests for known issues
- **Debugging Queries** - Provides exact log locations

**Run**: `npm test -- llmApiDebug.spec.ts`

**Data Flow Checkpoints**:
```
1. Request received at backend
2. Personality data merged
3. LLM called with inputs
4. LLM response received
5. Response formatted
6. Data stored in Firestore
7. Frontend receives and renders
```

### 3. llmDataFlowTrace.spec.ts - End-to-End Tracing

Complete trace through all 9 stages:

- **STAGE 1**: Request received at backend
- **STAGE 2**: Fetch personality profile
- **STAGE 3**: Validation & sanitization
- **STAGE 4**: Call LLM (most likely failure point)
- **STAGE 5**: LLM response validation
- **STAGE 6**: Store in Firestore
- **STAGE 7**: Send API response
- **STAGE 8**: Frontend receives data
- **STAGE 9**: Frontend renders

**Run**: `npm test -- llmDataFlowTrace.spec.ts`

**Output includes debugging checklist**:
```
[ ] GEMINI_API_KEY is set
[ ] Backend logs show "Request received"
[ ] Backend logs show "Calling LLM"
[ ] Backend logs show "Response received"
[ ] Frontend network shows 200 response
[ ] Frontend console shows feedback
[ ] Page renders analysis text
```

## Quick Debugging Steps

### Step 1: Run the Tests
```bash
npm test -- llmDataFlowTrace
```

Look at the console output for the debugging guide.

### Step 2: Check GEMINI_API_KEY
```bash
# Check if env var is set
echo $GEMINI_API_KEY

# If empty, add to .env:
GEMINI_API_KEY=your_actual_key_here
```

### Step 3: Add Console Logs
Based on test output, add these console.log statements:

**In backend/src/routes/textAnalysis.ts (line ~60)**:
```typescript
console.log('[TEXT-ANALYSIS] Request received:', { analysisId, question, answerLength: answer.length });
```

**Before LLM call**:
```typescript
console.log('[TEXT-ANALYSIS] Using personality:', { dating_goal, conversation_style });
```

**In backend/src/utils/llmAnalyzer.ts**:
```typescript
console.log('[LLM] Calling with:', { question, responseLength: textResponse.length });
// ... after LLM returns:
console.log('[LLM] Response received:', { hasAnalysis: !!response.analysis, strengthsCount: response.strengths?.length });
```

**Before Firestore write**:
```typescript
console.log('[FIRESTORE] Writing feedback:', { responseId, analysisLength: feedback.analysis.length });
```

**Before API response**:
```typescript
console.log('[API] Sending response:', { analysisLength: feedback.analysis.length, status: 200 });
```

### Step 4: Monitor Backend Logs
```bash
cd backend
npm run dev

# Look for these messages in order:
# [TEXT-ANALYSIS] Request received
# [TEXT-ANALYSIS] Using personality
# [LLM] Calling with
# [LLM] Response received
# [FIRESTORE] Writing feedback
# [API] Sending response
```

### Step 5: Check Frontend Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Trigger text analysis
4. Find POST request to `/api/text-analysis/analyze`
5. Check Response tab for feedback object
6. If response is empty/missing, backend issue
7. If response present but page blank, frontend issue

### Step 6: Verify Firestore Data
```bash
# In Firebase Console:
# Path: analyses/{userId}/text_feedback/{responseId}
# Check if:
#   - analysis field has text
#   - strengths array is populated
#   - suggestions array is populated
#   - metrics object exists
#   - personality_context exists
```

## Most Likely Failure Points

| Issue | Symptom | Solution |
|-------|---------|----------|
| GEMINI_API_KEY missing | Empty/fallback analysis | Set key in .env |
| LLM call fails silently | Request hangs | Check Gemini API limits |
| Firestore write fails | Data not persisted | Check Firebase permissions |
| API response not sent | Frontend request timeout | Verify res.json() called |
| Frontend not storing | API 200 but blank page | Check setTextFeedback() |
| ResultsContent not rendering | Data in state but hidden | Check conditional rendering |

## Test Output Examples

### Successful Run
```
✓ llmDebug.spec.ts (45 tests)
  ✓ Step 1: Input Validation (5)
  ✓ Step 2: Input Sanitization (3)
  ✓ Step 3: Text Statistics Analysis (4)
  ✓ Step 4: Fallback Analysis (4)
  ✓ Step 5: LLM Analysis Response Structure (2)
  ✓ Step 6: Full Pipeline Integration (2)
  ✓ Step 7: Error Cases & Edge Cases (3)
  ✓ Debugging: LLM API Call Status (2)
```

### With Issues
```
Console output will show:
⚠️  WARNING: GEMINI_API_KEY is not set. Requests will fail.

And:

📍 CHECKPOINT 1: Add this to textAnalysis.ts line ~60:
  console.log('[TEXT-ANALYSIS] Request received:', { analysisId, question, answerLength: answer.length });
```

## Files Modified/Created

1. **backend/tests/llmDebug.spec.ts** (NEW)
   - Component-level tests for analysis pipeline
   - 40+ test cases

2. **backend/tests/llmApiDebug.spec.ts** (NEW)
   - HTTP endpoint and data flow tests
   - 30+ test cases with debugging guides

3. **backend/tests/llmDataFlowTrace.spec.ts** (NEW)
   - End-to-end stage-by-stage trace
   - 25+ test cases with checkpoints
   - Includes debugging checklist and failure points

## Next Steps After Running Tests

1. **Run tests**: `npm test -- llmDataFlowTrace`
2. **Review console output** for debugging guide
3. **Check GEMINI_API_KEY** is set
4. **Add console logs** at checkpoints shown in test output
5. **Monitor backend logs** while triggering analysis
6. **Check network tab** for API response
7. **Verify Firestore** has the data
8. **Check frontend state** in DevTools

## Integration with Mock Data

These tests complement the mock data visualization at:
- `/test/results-visualization/mock` - Shows how data should look when LLM works

With these tests, you can:
1. Verify each component works independently
2. Trace where data gets lost in the pipeline
3. Confirm LLM is actually being called
4. Ensure Firestore persistence works
5. Validate API response format

## Troubleshooting Commands

```bash
# Check if tests pass
npm test -- llmDebug --run

# Run with verbose output
npm test -- llmDebug --reporter=verbose

# Run specific test
npm test -- llmDebug.spec.ts -t "Input Validation"

# Watch mode for development
npm test -- llmDebug --watch

# Generate coverage
npm test -- llmDebug --coverage
```

These tests will help you find exactly where in the pipeline the LLM analysis is getting lost!
