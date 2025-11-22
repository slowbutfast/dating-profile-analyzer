# Authentication & Analysis Result Persistence Integration Plan

## Overview
This document outlines the integration strategy for user authentication (User Story 5) and analysis result persistence/saving (User Stories 1, 2, 3, 4, 6) based on the project specifications and current codebase.

## Current State Analysis

### ✅ Already Implemented
1. **Frontend Authentication Context** (`frontend/src/contexts/AuthContext.tsx`)
   - Firebase Auth integration (email/password signup and signin)
   - User profile document creation in Firestore (`profiles` collection)
   - Auth state management with `useAuth()` hook
   - Profile data includes: `user_id`, `email`, `full_name`, `created_at`, `updated_at`

2. **Backend Firebase Admin Setup** (`backend/src/config/firebase.ts`)
   - Firebase Admin SDK initialized
   - Firestore database, Storage, and Auth configured
   - Exports: `db`, `storage`, `auth`

3. **Backend Routes**
   - `POST /api/upload` - Handles profile bundle uploads (images + text)
   - `GET /api/analyses/user/:userId` - Retrieves all analyses for a user
   - `GET /api/analyses/:id` - Retrieves specific analysis with photos and text responses
   - `DELETE /api/analyses/:id` - Deletes an analysis

4. **Data Persistence Structure**
   - **Firestore Collections:**
     - `profiles` - User profile data
     - `analyses` - Analysis metadata (user_id, bio, status, timestamps)
     - `photos` - Photo records linked to analyses
     - `text_responses` - Text response records linked to analyses

### ⚠️ Gaps to Address

1. **Authentication Middleware (Backend)**
   - No auth middleware to validate Firebase ID tokens on protected routes
   - Routes don't verify user ownership of data (authorization)
   - No ID token verification before processing requests

2. **Analysis Results Storage**
   - No `analysis_results` collection defined
   - No storage of CV metrics (lighting, clarity, eye contact, etc.)
   - No storage of LLM metrics (warmth, humor, clarity, etc.)
   - No storage of advice/suggestions from models
   - No status tracking (pending → processing → completed → error)

3. **Frontend Integration**
   - No API client configured to send auth tokens
   - No service functions to save/retrieve analysis results
   - No UI for displaying saved analysis history
   - No result caching or session management

4. **Data Privacy & Metadata Handling**
   - No EXIF stripping from uploaded images
   - No metadata cleaning for text inputs
   - No optional research data consent handling
   - No data deletion verification

5. **Error Handling & Validation**
   - Limited input validation on backend
   - No file size/type validation responses
   - No graceful error handling for corrupted files
   - No rate limiting per user

## Implementation Plan

### Phase 1: Backend Authentication Middleware (Prerequisite)

**File:** `backend/src/middleware/auth.ts` (NEW)

```typescript
Purpose: Verify Firebase ID tokens and attach user info to requests
- Extract token from Authorization header
- Verify token with Firebase Admin SDK
- Attach decoded token (uid, email) to req.user
- Return 401 if token invalid/missing
- Handle token expiration

Usage: Apply to all protected routes as middleware
```

**Modified:** `backend/src/server.ts`
- Import and register auth middleware for protected routes
- Apply middleware to `/api/analyses/*` and `/api/upload`

---

### Phase 2: Analysis Results Data Structure

**Firestore Collection:** `analysis_results`

```
analysis_results/{resultId}
├── analysis_id: string (FK to analyses)
├── user_id: string (denormalized for security rules)
├── cv_metrics: object
│   ├── lighting: { score: 1-10, feedback: string }
│   ├── clarity: { score: 1-10, feedback: string }
│   ├── eye_contact: { score: 1-10, feedback: string }
│   ├── facial_visibility: { score: 1-10, feedback: string }
│   ├── group_photo_count: number
│   └── overall_score: number
├── llm_metrics: object
│   ├── warmth: { score: 1-10, feedback: string }
│   ├── humor: { score: 1-10, feedback: string }
│   ├── clarity: { score: 1-10, feedback: string }
│   ├── originality: { score: 1-10, feedback: string }
│   └── overall_score: number
├── improvement_suggestions: [string] (minimum 3)
├── combined_feedback: string (consolidated advice)
├── status: "pending" | "processing" | "completed" | "error"
├── error_message: string | null
├── created_at: timestamp
├── completed_at: timestamp | null
└── metadata: { processing_time_ms: number, api_version: string }
```

**Firestore Collection:** `image_analysis` (detailed)
```
image_analysis/{imageAnalysisId}
├── analysis_id: string
├── photo_id: string
├── cv_metrics: {...} (copy from analysis_results for reference)
├── raw_response: object (store raw API response for debugging)
└── created_at: timestamp
```

**Firestore Collection:** `text_analysis` (detailed)
```
text_analysis/{textAnalysisId}
├── analysis_id: string
├── text_response_id: string
├── llm_metrics: {...} (per-response breakdown)
├── raw_response: object (store raw API response for debugging)
└── created_at: timestamp
```

---

### Phase 3: Backend Analysis Results Endpoints

**New Routes:** `backend/src/routes/results.ts`

```typescript
1. POST /api/results
   Purpose: Save analysis results after processing
   Input: { analysis_id, cv_metrics, llm_metrics, improvement_suggestions, combined_feedback }
   Output: { success: true, result_id }
   Auth: Required (middleware verifies token + ownership)

2. GET /api/results/:analysisId
   Purpose: Retrieve detailed results for an analysis
   Input: :analysisId
   Output: { analysis_results, status, timestamps }
   Auth: Required (verify user owns this analysis)

3. GET /api/results/user/:userId
   Purpose: List all analysis results for a user
   Input: :userId, optional filters (date range, status)
   Output: [{ id, status, created_at, cv_score, llm_score }]
   Auth: Required (user can only see their own)

4. PATCH /api/results/:analysisId/status
   Purpose: Update analysis status (pending → processing → completed)
   Input: { status, error_message? }
   Output: { success: true }
   Auth: Required (backend service use)

5. DELETE /api/results/:analysisId
   Purpose: Delete results and cascade delete related data
   Input: :analysisId
   Output: { success: true, deleted_count }
   Auth: Required (user can only delete own)
```

---

### Phase 4: Frontend API Client

**File:** `frontend/src/lib/api.ts` (EXTEND)

Add functions:
```typescript
1. saveAnalysisResults(analysisId, cvMetrics, llmMetrics, suggestions)
   - POST /api/results with auth token
   - Returns result_id

2. getAnalysisResults(analysisId)
   - GET /api/results/:analysisId with auth token
   - Returns full result object

3. getUserAnalysisHistory(userId)
   - GET /api/results/user/:userId with auth token
   - Returns array of past analyses

4. deleteAnalysisResult(analysisId)
   - DELETE /api/results/:analysisId with auth token
   - Returns success status

5. getAuthToken()
   - Extract and return current Firebase ID token
   - Used in request headers: Authorization: Bearer {token}
```

**File:** `frontend/src/lib/auth-api.ts` (NEW)

```typescript
Purpose: Helper to attach auth tokens to API requests
- useAuth() hook to get current token
- Interceptor for all API calls to inject Authorization header
- Handle token refresh on 401 responses
- Error handling for auth failures
```

---

### Phase 5: Frontend Results Display

**Components to Create/Modify:**

1. `frontend/src/pages/Results.tsx` (EXTEND)
   - Display consolidated feedback report (addresses User Story 4)
   - Show CV metrics with visual feedback (gauges, progress bars)
   - Show LLM metrics with narrative feedback
   - Display 3+ improvement suggestions
   - Add download/save button
   - Show loading state while results are being processed
   - Error state if analysis failed

2. `frontend/src/pages/Dashboard.tsx` (EXTEND)
   - List previous analyses (User Story 4 requirement)
   - Timestamps, status, scores
   - Links to view full reports
   - Delete button (User Story 6)
   - Confirmation dialog for deletions

3. `frontend/src/components/AnalysisProgress.tsx` (NEW)
   - Real-time status tracking
   - Show which step is running (image analysis vs. text analysis)
   - Estimated time remaining
   - Cancel button for long-running processes

4. `frontend/src/components/MetricsDisplay.tsx` (NEW)
   - Reusable component for displaying scores
   - Metric cards with score + feedback
   - Visual indicators (color coding, icons)
   - Accessible ARIA labels for screen readers

---

### Phase 6: Data Privacy & Security

**Backend Updates:**

1. **Metadata Stripping** (`backend/src/middleware/metadata-strip.ts`)
   - Strip EXIF data from images before storage
   - Sanitize text inputs (remove PII patterns if possible)
   - Log what was stripped for debugging

2. **Firestore Security Rules** (`firestore.rules`)
   ```
   match /profiles/{document=**} {
     allow read, write: if request.auth.uid == resource.data.user_id
   }
   match /analyses/{document=**} {
     allow read, delete: if request.auth.uid == resource.data.user_id
     allow create: if request.auth != null
   }
   match /analysis_results/{document=**} {
     allow read, delete: if request.auth.uid == resource.data.user_id
     allow create: if request.auth != null
   }
   match /photos/{document=**} {
     allow read: if request.auth.uid == 
       get(/databases/$(database)/documents/analyses/$(resource.data.analysis_id)).data.user_id
   }
   ```

3. **Rate Limiting** (`backend/src/middleware/rate-limit.ts`)
   - Max 5 analyses per day per user
   - Max 10 requests per minute
   - Track in Redis or in-memory store

4. **Optional Research Data** (`backend/src/routes/research.ts`)
   - New collection: `research_consent` { user_id, opted_in, timestamp }
   - Store anonymized metrics separately if opted in
   - Default: false (opt-in only)

---

### Phase 7: Error Handling & Validation

**Backend Updates:**

1. **Input Validation** (`backend/src/middleware/validation.ts`)
   - File size limits (max 10MB per image, 10 images total)
   - File type validation (jpg, png only)
   - Text length limits (max 500 chars per response)
   - Required fields validation

2. **Error Responses**
   - Consistent error format: `{ error: string, code: string, details?: object }`
   - Clear messages for file upload failures
   - Detailed logs for API failures (but don't expose to client)

3. **Graceful Degradation**
   - If CV API fails, return error status in result
   - If LLM API fails, return error status in result
   - Never leave analysis in indefinite "pending" state
   - Implement timeout handlers

---

## Implementation Sequence

### Week 1 (Priority: Auth Middleware)
1. Create `backend/src/middleware/auth.ts` with Firebase token verification
2. Add middleware to protected routes in `server.ts`
3. Test with Postman/curl using real Firebase tokens
4. Update frontend `api.ts` to include auth token in all requests

### Week 2 (Priority: Results Structure)
1. Design Firestore collections (`analysis_results`, `image_analysis`, `text_analysis`)
2. Create `backend/src/routes/results.ts` with all CRUD endpoints
3. Write comprehensive tests for results endpoints
4. Update frontend `api.ts` with result management functions

### Week 3 (Priority: Frontend Integration)
1. Extend `Results.tsx` to display analysis results
2. Extend `Dashboard.tsx` to show history
3. Add `MetricsDisplay.tsx` component with accessible design
4. Implement delete functionality with confirmation

### Week 4 (Priority: Privacy & Polish)
1. Implement metadata stripping middleware
2. Create Firestore security rules
3. Add rate limiting middleware
4. Add comprehensive error handling
5. User testing and refinement

---

## Testing Strategy

### Unit Tests (Per Module)
- Auth middleware: token validation, expiration, missing tokens
- Results routes: CRUD operations, authorization checks
- API client functions: request formatting, error handling

### Integration Tests
- Full upload → analysis → results save flow
- User can only access own data
- Deletion cascades properly
- Status updates trigger frontend re-renders

### E2E Tests
- Sign up → upload profile → receive results → view history → delete
- Session persistence across page reloads
- Error states (failed analysis, network errors)

---

## Database Query Performance

### Indexes to Create
1. `analyses`: user_id + created_at (for listing user's analyses)
2. `analysis_results`: user_id + created_at (for results history)
3. `photos`: analysis_id (for result display)
4. `text_responses`: analysis_id (for result display)

---

## Acceptance Criteria Mapping

### User Story 5 (Authentication)
- ✅ Users can sign up with email + password
- ✅ Users can log in/out securely
- ✅ Backend verifies tokens on protected routes
- ✅ Passwords hashed by Firebase
- ✅ User data persists across sessions
- ⚠️ Need: Rate limiting on auth attempts

### User Story 1 (Upload)
- ✅ Upload 3-10 images
- ✅ Upload text responses
- ✅ File validation with clear errors
- ✅ Data stored under authenticated account
- ⚠️ Need: Better file validation messages

### User Story 2 & 3 (Analysis)
- ✅ CV metrics saved (lighting, clarity, eye contact, etc.)
- ✅ LLM metrics saved (warmth, humor, clarity, etc.)
- ⚠️ Need: Graceful error handling for corrupt files/API failures

### User Story 4 (Consolidated Report)
- ⚠️ Need: Results display component
- ⚠️ Need: Improvement suggestions storage and display
- ⚠️ Need: Download/export functionality

### User Story 6 (Delete Data)
- ⚠️ Need: Cascade delete logic
- ⚠️ Need: Confirmation UI

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Token expiration during analysis | Refresh token before API calls; handle 401s gracefully |
| Concurrent edits/deletes | Use transactions; validate ownership before each operation |
| Large file uploads | Implement chunked uploads; set size limits in middleware |
| Slow analysis processing | Show progress indicator; implement timeout with error state |
| Database costs | Index queries; archive old results; implement retention policy |
| Privacy concerns | Strip metadata; clear security rules; transparent consent forms |

---

## Summary

This integration plan provides a complete roadmap for implementing User Story 5 (Authentication) and the persistence layer for Stories 1-4 and 6. The plan leverages existing Firebase setup and extends current backend/frontend code with:

1. **Authentication middleware** to verify user identity
2. **Results data structure** to store CV and LLM metrics
3. **Backend endpoints** for results CRUD operations
4. **Frontend API client** with auth token injection
5. **UI components** for displaying and managing results
6. **Security measures** for data privacy and access control

The phased approach allows for concurrent development while maintaining clear dependencies.
