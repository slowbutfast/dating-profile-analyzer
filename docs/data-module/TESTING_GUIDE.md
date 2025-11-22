# Testing & Visual Review Guide

## Quick Start: Running the Full Stack

### 1. Start the Backend Server

```bash
cd backend
npm run dev
```

Expected output:
```
🚀 Backend server running on http://localhost:3001
📊 API endpoints available at http://localhost:3001/api
```

### 2. Start the Frontend Dev Server

```bash
cd frontend
npm run dev
```

Expected output:
```
  VITE v... ready in ... ms

  ➜  Local:   http://localhost:5173/
  ➜  press h + enter to show help
```

### 3. Open in Browser

Navigate to `http://localhost:5173/` in your browser.

---

## Testing Checklist

### ✅ Phase 1: Authentication Flow

#### 1. Sign Up (Create New Account)
1. Click "Sign Up" or navigate to `/auth`
2. Enter email: `test@example.com`
3. Enter password: `TestPassword123!`
4. Enter full name: `Test User`
5. Click "Sign Up" button

**What to verify:**
- ✅ No errors appear
- ✅ Redirected to dashboard/home page
- ✅ User display name appears in nav bar
- ✅ Browser DevTools → Application → Cookies shows Firebase session
- ✅ Firebase Console → Authentication shows new user

**Backend logs should show:**
```
No errors (middleware is just extracting token, not logging)
```

#### 2. Sign In (Return User)
1. Sign out (if logged in)
2. Navigate to `/auth`
3. Enter email: `test@example.com`
4. Enter password: `TestPassword123!`
5. Click "Sign In" button

**What to verify:**
- ✅ Successful login
- ✅ User appears in nav bar
- ✅ Session persists on page reload

#### 3. Sign Out
1. Click user menu or "Sign Out" button
2. Verify redirected to home/login page
3. Try accessing protected pages directly (e.g., `/dashboard`)

**What to verify:**
- ✅ Signed out successfully
- ✅ Protected routes redirect to auth page
- ✅ No lingering session data

---

### ✅ Phase 2: API Authentication

#### 1. Check Network Requests

With the browser DevTools open:

1. Open the Network tab
2. Sign in to the app
3. Trigger an API call (e.g., click "Upload Profile" or navigate to analyses page)
4. Look for API requests to `localhost:3001/api/...`

**What to verify:**
- ✅ Request headers include `Authorization: Bearer eyJ...` (long JWT token)
- ✅ Response status is 200 or 201 (not 401 Unauthorized)
- ✅ Response JSON shows expected data

**Example Network Request:**
```
Request URL: http://localhost:3001/api/analyses/user/abcd1234
Request Method: GET
Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQ1Njc4OTAifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vZmlyZWJhc2UvZmlyZWJhc2UtcHJvamVjdC1pZCIsImF1ZCI6ImZpcmViYXNlLXByb2plY3QtaWQiLCJhdXRoX3RpbWUiOjEzMjA3MjM2MzQsInVzZXJfaWQiOiJhYmNkMTIzNCIsInN1YiI6ImFiY2QxMjM0IiwiaWF0IjoxMzIwNzIzNjM0LCJleHAiOjEzMjA3MjcyMzR9.signature...
```

Response example:
```json
{
  "analyses": [
    {
      "id": "analysis-123",
      "user_id": "abcd1234",
      "bio": "Test bio",
      "status": "pending",
      "created_at": "2025-11-22T10:00:00Z"
    }
  ]
}
```

#### 2. Test Missing Auth Token

Using `curl` or Postman:

```bash
# This should fail with 401
curl http://localhost:3001/api/analyses/user/testuser

# This should succeed (with valid token)
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" http://localhost:3001/api/analyses/user/testuser
```

Expected response without token:
```json
{
  "error": "Missing or invalid Authorization header",
  "code": "MISSING_TOKEN"
}
```

---

### ✅ Phase 3: Database Persistence

#### 1. Verify User Profile Creation

After signing up:

1. Open Firebase Console → Firestore
2. Navigate to **Collections** → **profiles**
3. Find the document with ID matching your Firebase UID

**Expected structure:**
```json
{
  "user_id": "firebase-uid-here",
  "email": "test@example.com",
  "full_name": "Test User",
  "created_at": "Timestamp: Nov 22, 2025, 10:00:00 AM",
  "updated_at": "Timestamp: Nov 22, 2025, 10:00:00 AM"
}
```

#### 2. Verify Analysis Upload Creates Database Records

1. Upload a profile (if your UI has upload functionality)
2. Check Firestore Collections for:

**analyses collection:**
```json
{
  "user_id": "your-uid",
  "bio": "Your bio text",
  "status": "pending",
  "created_at": "Timestamp...",
  "updated_at": "Timestamp..."
}
```

**photos collection:**
```json
{
  "analysis_id": "link-to-analyses-doc",
  "photo_url": "https://storage.googleapis.com/...",
  "storage_path": "profile-photos/...",
  "order_index": 0,
  "created_at": "Timestamp..."
}
```

**text_responses collection:**
```json
{
  "analysis_id": "link-to-analyses-doc",
  "question": "Prompt question",
  "answer": "User's response",
  "created_at": "Timestamp..."
}
```

#### 3. Verify Cascade Delete

1. Delete an analysis through the UI (if delete button exists)
2. Check Firestore: the analysis document should be gone
3. Check that associated photos and text_responses are also deleted

**What to verify:**
- ✅ Analysis document deleted
- ✅ Photos linked to that analysis are deleted
- ✅ Text responses linked to that analysis are deleted
- ✅ No orphaned documents remain

---

### ✅ Phase 4: Security Rules Testing

#### 1. Test User Isolation (in Firestore Console)

1. Go to Firestore → Rules
2. Click "Rules playground" or "Simulator"
3. Test read access to another user's profile

**Simulate a request:**
- **Request Type:** get
- **Path:** `/profiles/other-user-id`
- **User UID:** `your-uid` (different from other-user-id)
- **Custom claims:** (leave empty)

**Expected result:**
```
❌ DENIED: Allow rule does not exist
Reason: request.auth.uid (your-uid) != userId (other-user-id)
```

#### 2. Test Ownership Verification

**Simulate attempting to read own profile:**
- **Request Type:** get
- **Path:** `/profiles/your-uid`
- **User UID:** `your-uid`

**Expected result:**
```
✅ ALLOWED
Reason: request.auth.uid == userId
```

---

## Browser DevTools Inspection

### Application Tab

1. Open DevTools → Application tab
2. Go to **Cookies** or **Local Storage**
3. Look for Firebase-related data:

```
Name: session
Value: eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQ1Njc4OTAifQ...
(This is your ID token)
```

### Console Tab

1. Open DevTools → Console
2. Try executing:

```javascript
// Get current user
firebase.auth().currentUser

// Output should show:
// User
// {
//   uid: "firebase-uid",
//   email: "test@example.com",
//   displayName: "Test User",
//   ...
// }

// Get current token
await firebase.auth().currentUser?.getIdToken()

// Output should show a long JWT token string
```

### Network Tab

1. Open DevTools → Network
2. Sign in or trigger an API call
3. Click on API request (e.g., `GET /api/analyses/user/...`)
4. Go to **Headers** tab:

```
General:
  Request URL: http://localhost:3001/api/analyses/user/abcd1234
  Request Method: GET
  Status Code: 200

Request Headers:
  Authorization: Bearer eyJ...
  Content-Type: application/json

Response Headers:
  Content-Type: application/json
  Access-Control-Allow-Origin: http://localhost:5173
```

---

## Command Line Testing

### Test Auth Middleware with cURL

```bash
# 1. Get a test user token (Firebase CLI)
firebase auth:list-users

# 2. Generate a custom token (for testing only)
# Using Firebase Admin SDK in a test script

# 3. Test protected endpoint without token (should fail)
curl http://localhost:3001/api/analyses/user/test-user-id

# Response:
# {
#   "error": "Missing or invalid Authorization header",
#   "code": "MISSING_TOKEN"
# }
```

### Test Database Module Directly (Node REPL)

```bash
# In backend directory
node

# Then in REPL:
const db = require('./src/db/index.ts');

// Create a test profile
await db.user.upsertProfile('test-uid-123', {
  email: 'test@example.com',
  full_name: 'Test User'
});

// Retrieve it
const profile = await db.user.getProfile('test-uid-123');
console.log(profile);

// Output:
// {
//   user_id: 'test-uid-123',
//   email: 'test@example.com',
//   full_name: 'Test User',
//   created_at: Timestamp,
//   updated_at: Timestamp
// }
```

---

## Debugging Tips

### Issue: 401 Unauthorized on API Calls

**Check:**
1. Is token being sent? Open DevTools Network tab → Headers
2. Is token valid? Check `firebase.auth().currentUser?.getIdToken()`
3. Is backend middleware reading token correctly?

**Backend debug:**
```typescript
// Add console.log in src/middleware/auth.ts
console.log('Authorization header:', authHeader);
console.log('Token (first 50 chars):', token.substring(0, 50));
console.log('Decoded token:', decodedToken);
```

### Issue: Firestore Permission Denied

**Check:**
1. Are security rules deployed? `firebase deploy --only firestore:rules`
2. Is user authenticated? `firebase.auth().currentUser` should exist
3. Are you accessing correct collection path?
4. Are document IDs correct?

**Test in Firestore Rules Simulator:**
- Set User UID to your actual Firebase UID
- Test specific paths you're having trouble with

### Issue: Database Operations Not Working

**Check:**
1. Is Firestore initialized? Check `src/config/firebase.ts`
2. Are credentials in `.env` correct?
3. Are you using correct collection names?
4. Check backend console for error messages

**Enable debug logging:**
```typescript
// In src/config/firebase.ts
admin.firestore.setLogFunction(console.log);
```

---

## Performance Testing

### Network Request Speed

1. Open DevTools → Network tab → Filter to XHR/Fetch
2. Make an API call
3. Check **Time** column:
   - Auth verification: ~50-100ms
   - Firestore query: ~100-200ms
   - Total: ~200-300ms for basic read

**Optimization opportunities:**
- Cache user profile locally
- Implement request deduplication
- Batch multiple reads together

### Database Query Performance

1. Open Firestore Console
2. Go to Stats or specific collection
3. Check "Latency" graphs for read/write times

**Expected latencies:**
- Simple reads: 50-150ms
- Writes with index: 100-300ms
- Complex queries: 200-500ms

---

## Checklist Summary

- [ ] Backend server starts without errors
- [ ] Frontend connects to backend successfully
- [ ] User can sign up and see created profile in Firestore
- [ ] User can sign in and token is included in API requests
- [ ] API requests return 200 (not 401) with valid token
- [ ] API requests return 401 without token
- [ ] User can only see their own data (not other users')
- [ ] Firestore security rules prevent unauthorized access
- [ ] Analysis uploads create records in database
- [ ] Deleting analysis cascades to photos/responses
- [ ] DevTools shows token in Authorization header
- [ ] No errors in browser console
- [ ] No errors in backend terminal

---

## Next Steps After Verification

Once all checks pass:

1. **Update routes** to use `db` module functions
2. **Implement results endpoints** for CV/LLM metrics
3. **Add UI components** for displaying results
4. **Deploy Firestore rules** to production
5. **Set up monitoring** for production errors

All the infrastructure is ready—just need to connect it!
