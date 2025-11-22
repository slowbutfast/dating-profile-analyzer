# Data Persistence & Authentication Architecture

## Overview

This document describes the authentication and data persistence implementation for the Dating Profile Analyzer. The system uses Firebase Authentication and Firestore for secure, scalable data management.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ AuthContext (Firebase Auth)                             │   │
│  │ - signup/signin/logout                                  │   │
│  │ - token extraction via getIdToken()                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ API Client (src/lib/api.ts)                             │   │
│  │ - authenticatedFetch() injects Bearer token             │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    HTTP with JWT
                           │
┌──────────────────────────┴──────────────────────────────────────┐
│                    Backend (Express)                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Auth Middleware (src/middleware/auth.ts)                │   │
│  │ - verifyAuth: validates Firebase ID token               │   │
│  │ - verifyOwnership: checks user resource ownership       │   │
│  │ - optionalAuth: optional authentication                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Routes (protected with verifyAuth)                      │   │
│  │ - /api/analyses - analysis CRUD                         │   │
│  │ - /api/upload - profile upload                          │   │
│  │ - /api/results - analysis results (TODO)                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Database Layer (src/db/index.ts)                        │   │
│  │ - db_user, db_analysis, db_results, etc.               │   │
│  │ - Type-safe CRUD operations                             │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    Firestore SDK
                           │
┌──────────────────────────┴──────────────────────────────────────┐
│                   Firestore Database                             │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Collections:                                           │    │
│  │ - profiles (user metadata)                            │    │
│  │ - analyses (upload metadata)                          │    │
│  │ - photos (image records)                              │    │
│  │ - text_responses (text records)                       │    │
│  │ - analysis_results (CV + LLM results)                │    │
│  │ - image_analysis (detailed CV breakdown)             │    │
│  │ - text_analysis (detailed LLM breakdown)             │    │
│  │ - research_consent (opt-in tracking)                 │    │
│  │ - anonymized_research_data (research archive)        │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
│  Security Rules (firestore.rules):                              │
│  - User isolation: read/write own data only                     │
│  - Resource ownership: verify user_id matches                   │
│  - Immutable research data: write-once archive                  │
└───────────────────────────────────────────────────────────────┘
```

## Authentication Flow

### User Registration & Login

```typescript
// Frontend - AuthContext.tsx
const { user, signUp, signIn } = useAuth();

// Sign up
await signUp(email, password, fullName);
// → Firebase Auth creates user
// → ensureProfile() creates /profiles/{uid} in Firestore

// Sign in
await signIn(email, password);
// → Firebase Auth authenticates user
// → onAuthStateChanged fires

// Get token for API calls
const token = await user?.getIdToken();
```

### Protected API Requests

```typescript
// Frontend - api.ts
const response = await authenticatedFetch('/api/analyses/user/:userId', {
  method: 'GET'
});

// Helper injects token:
// Authorization: Bearer {idToken}
```

### Backend Verification

```typescript
// Backend - middleware/auth.ts
app.use('/api/analyses', verifyAuth, analysisRoutes);

// verifyAuth middleware:
// 1. Extract token from Authorization header
// 2. Call admin.auth().verifyIdToken(token)
// 3. Attach decoded token to req.user
// 4. Call next() or reject with 401
```

## Data Persistence Structure

### Collections Schema

#### `profiles`
Stores user account metadata.
```typescript
profiles/{userId}
  ├── user_id: string (same as document ID)
  ├── email: string
  ├── full_name: string | null
  ├── created_at: Timestamp
  └── updated_at: Timestamp
```

#### `analyses`
Stores profile upload metadata and status.
```typescript
analyses/{analysisId}
  ├── user_id: string (user who uploaded)
  ├── bio: string
  ├── status: "pending" | "processing" | "completed" | "error"
  ├── error_message: string | null
  ├── created_at: Timestamp
  └── updated_at: Timestamp
```

#### `photos`
Individual photo records linked to an analysis.
```typescript
photos/{photoId}
  ├── analysis_id: string (FK to analyses)
  ├── photo_url: string
  ├── storage_path: string (in Firebase Storage)
  ├── order_index: number (0-based)
  └── created_at: Timestamp
```

#### `text_responses`
Individual text responses linked to an analysis.
```typescript
text_responses/{responseId}
  ├── analysis_id: string (FK to analyses)
  ├── question: string (prompt)
  ├── answer: string (user's response)
  └── created_at: Timestamp
```

#### `analysis_results` (Future)
Aggregated CV and LLM analysis results.
```typescript
analysis_results/{resultId}
  ├── analysis_id: string
  ├── user_id: string (denormalized for security rules)
  ├── cv_metrics: CVMetrics object
  ├── llm_metrics: LLMMetrics object
  ├── improvement_suggestions: string[]
  ├── combined_feedback: string
  ├── status: "pending" | "processing" | "completed" | "error"
  ├── error_message: string | null
  ├── created_at: Timestamp
  ├── completed_at: Timestamp | null
  └── metadata: { processing_time_ms?, api_version?, ... }
```

#### `image_analysis` (Future)
Detailed per-image CV analysis breakdowns.
```typescript
image_analysis/{imageAnalysisId}
  ├── analysis_id: string
  ├── photo_id: string
  ├── cv_metrics: CVMetrics object (copy)
  ├── raw_response: object (API response)
  └── created_at: Timestamp
```

#### `text_analysis` (Future)
Detailed per-response LLM analysis breakdowns.
```typescript
text_analysis/{textAnalysisId}
  ├── analysis_id: string
  ├── text_response_id: string
  ├── llm_metrics: LLMMetrics object (copy)
  ├── raw_response: object (API response)
  └── created_at: Timestamp
```

#### `research_consent`
User opt-in status for research data collection.
```typescript
research_consent/{userId}
  ├── user_id: string
  ├── opted_in: boolean
  ├── created_at: Timestamp
  └── updated_at: Timestamp
```

#### `anonymized_research_data`
Write-only archive of anonymized metrics for research (immutable).
```typescript
anonymized_research_data/{dataId}
  ├── analysis_id: string (NO user_id for anonymity)
  ├── cv_metrics: CVMetrics object | null
  ├── llm_metrics: LLMMetrics object | null
  └── created_at: Timestamp
```

## Database Module API

### User Operations

```typescript
import db from '@/db';

// Create/update user profile
await db.user.upsertProfile(userId, {
  email: 'user@example.com',
  full_name: 'John Doe'
});

// Get user profile
const profile = await db.user.getProfile(userId);

// Update profile
await db.user.updateProfile(userId, { full_name: 'Jane Doe' });

// Delete user (cascades all data)
await db.user.deleteProfile(userId);
```

### Analysis Operations

```typescript
// Create analysis
const { id, data } = await db.analysis.create(userId, bio);

// Get analysis
const analysis = await db.analysis.get(analysisId);

// List user's analyses
const analyses = await db.analysis.getByUserId(userId);

// Update status
await db.analysis.updateStatus(analysisId, 'completed');
await db.analysis.updateStatus(analysisId, 'error', 'API failed');

// Delete analysis (cascades photos and text responses)
const deletedCount = await db.analysis.delete(analysisId);
```

### Photo Operations

```typescript
// Create photo record
const { id, data } = await db.photo.create({
  analysis_id: analysisId,
  photo_url: 'https://...',
  storage_path: 'profile-photos/...',
  order_index: 0
});

// Get all photos for analysis
const photos = await db.photo.getByAnalysisId(analysisId);

// Delete photo
await db.photo.delete(photoId);
```

### Text Response Operations

```typescript
// Create text response
const { id, data } = await db.textResponse.create({
  analysis_id: analysisId,
  question: 'What are you looking for?',
  answer: 'Someone kind and funny...'
});

// Get all responses for analysis
const responses = await db.textResponse.getByAnalysisId(analysisId);

// Delete response
await db.textResponse.delete(responseId);
```

### Analysis Results Operations (Future)

```typescript
// Create result
const { id, data } = await db.results.create({
  analysis_id: analysisId,
  user_id: userId,
  cv_metrics: { ... },
  llm_metrics: { ... },
  improvement_suggestions: [...],
  combined_feedback: '...'
});

// Get result
const result = await db.results.get(resultId);

// Get result by analysis
const result = await db.results.getByAnalysisId(analysisId);

// List user's results
const results = await db.results.getByUserId(userId);

// Update result
await db.results.update(resultId, { status: 'completed' });

// Delete result
await db.results.delete(resultId);
```

### Research Operations

```typescript
// Set research consent
await db.research.setConsent(userId, true); // opt-in

// Get consent status
const consent = await db.research.getConsent(userId);

// Add anonymized research data
await db.research.addAnonymizedData(userId, {
  analysis_id: analysisId,
  cv_metrics: { ... },
  llm_metrics: { ... }
});

// Get aggregate statistics
const stats = await db.research.getAggregateStats();
```

## Security Rules

### Key Principles

1. **User Isolation**: Each user can only access their own data
2. **Resource Ownership**: Operations require user_id field matching auth.uid
3. **Hierarchical Access**: Photos/responses are accessible only through owning analysis
4. **Research Anonymity**: Research data contains no user_id
5. **Immutable Archives**: Research data cannot be modified

### Rule Examples

```typescript
// User can only read/write their own profile
match /profiles/{userId} {
  allow read, write: if request.auth.uid == userId;
}

// User can only read photos from their analyses
match /photos/{photoId} {
  allow read: if request.auth.uid == 
    get(/databases/$(database)/documents/analyses/$(resource.data.analysis_id)).data.user_id;
}

// Research data is write-once (immutable)
match /anonymized_research_data/{dataId} {
  allow create: if request.auth != null;
  allow read, update, delete: if false;
}
```

## Environment Setup

### Backend (.env)

```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY=your-private-key
PORT=3001
FRONTEND_URL=http://localhost:8080
NODE_ENV=development
```

### Frontend (.env.local)

```bash
VITE_APP_FIREBASE_API_KEY=your-api-key
VITE_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_APP_FIREBASE_PROJECT_ID=your-project-id
VITE_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_APP_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_APP_FIREBASE_APP_ID=your-app-id
VITE_API_URL=http://localhost:3001/api
```

## Deployment

### Firestore Rules

```bash
# Deploy security rules to Firestore
firebase deploy --only firestore:rules

# Validate rules
firebase firestore:indexes
```

### Backend

```bash
# Build TypeScript
npm run build

# Start server
npm run start

# Or deploy to hosting service (Heroku, Railway, etc.)
```

## Testing

### Test Authentication

```bash
# Get a test ID token
firebase auth:import test-users.json --hash-algo=scrypt

# Use token in API requests
curl -H "Authorization: Bearer {token}" http://localhost:3001/api/analyses/user/{userId}
```

### Test Database Operations

```typescript
import db from '@/db';

// Create test user
const profile = await db.user.upsertProfile('test-user-id', {
  email: 'test@example.com',
  full_name: 'Test User'
});

// Create test analysis
const { id: analysisId } = await db.analysis.create('test-user-id', 'Test bio');

// Add photos
await db.photo.create({
  analysis_id: analysisId,
  photo_url: 'https://example.com/photo.jpg',
  storage_path: 'test/photo.jpg',
  order_index: 0
});

// Verify cascade delete
await db.analysis.delete(analysisId);
```

## Performance Considerations

### Firestore Indexes

Automatically created for:
- `analyses`: user_id + created_at (for listing user's analyses)
- `analysis_results`: user_id + created_at (for results history)
- `photos`: analysis_id + order_index
- `text_responses`: analysis_id + created_at

### Query Optimization

1. **Batch operations**: Use `db.batch()` for multi-document writes
2. **Transactions**: Use `db.transaction()` for consistency
3. **Pagination**: Implement cursor-based pagination for large result sets
4. **Caching**: Frontend should cache user's analysis list

### Cost Estimation

- Per user profile: ~1 read + 1 write per signup = 2 operations
- Per analysis: ~1 write + N photo reads = N+1 operations
- Per result: ~1 write + research opt-in check = 2 operations
- Monthly: ~100K analyses × 5 operations = 500K operations (~$2 at standard pricing)

## Troubleshooting

### 401 Unauthorized Errors

**Problem**: API returns 401 on protected routes.

**Solutions**:
- Check token is being sent: `Authorization: Bearer {token}`
- Verify token hasn't expired: `auth.currentUser?.getIdToken(true)` (force refresh)
- Check Firebase config is correct
- Verify user is authenticated before making API call

### 403 Forbidden Errors

**Problem**: User can't access a resource.

**Solutions**:
- Verify user_id matches authenticated user (req.user.uid)
- Check Firestore security rules are deployed
- Verify document hierarchy is correct (photos linked to analysis)
- Check browser DevTools for rule rejection logs

### Permission Denied on Firestore

**Problem**: "Permission denied" errors in browser console.

**Solutions**:
- Ensure Firestore rules are deployed: `firebase deploy --only firestore:rules`
- Check rules for correct user_id/uid matching
- Verify user is authenticated
- Test rules in Firestore Rules Simulator

## Future Enhancements

1. **Rate Limiting**: Add request rate limiting per user per hour
2. **Data Expiration**: Implement TTL for old analyses
3. **Backup**: Set up automated Firestore backups
4. **Audit Logging**: Track all data access for compliance
5. **Encryption**: Add field-level encryption for sensitive data
6. **Offline Support**: Implement Firestore offline persistence on frontend
