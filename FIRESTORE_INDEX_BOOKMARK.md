# Firestore Index Setup — Bookmark

## Current Status
Authentication and data persistence layer is complete and working. Frontend/backend are wired and authenticated users can make protected API calls.

**Blocker:** GET /api/analyses/user/:userId returns Firestore FAILED_PRECONDITION error because a composite index is required.

## What Needs to Be Done

The backend query:
```typescript
db.collection('analyses')
  .where('user_id', '==', userId)
  .orderBy('created_at', 'desc')
  .get()
```

...requires a Firestore composite index on:
- Field 1: `user_id` (ASCENDING)
- Field 2: `created_at` (DESCENDING)

## How to Create the Index

### Option 1: Via Firebase Console (Easiest)
1. When you log in to the app and trigger the error, the backend will return a response with a `createIndexUrl` field
2. Click that link (or copy-paste into browser)
3. Firebase Console will open with a pre-filled form to create the index
4. Click "Create Index" and wait 1–2 minutes for it to build

### Option 2: Via Firebase CLI (Repeatable)
1. Ensure you have Firebase CLI installed:
   ```bash
   npm install -g firebase-tools
   ```
2. Log in:
   ```bash
   firebase login
   ```
3. From project root, deploy the pre-configured index:
   ```bash
   firebase deploy --only firestore:indexes
   ```
4. Wait for the build to complete

### Option 3: Via Firebase Console Dashboard
1. Go to [Firestore Console](https://console.firebase.google.com)
2. Select project: **datingprofileanalyzer-fc531**
3. Go to **Firestore Database** → **Indexes** tab
4. Click **Create Index**
5. Collection: `analyses`
6. Fields:
   - `user_id` (ASCENDING)
   - `created_at` (DESCENDING)
7. Click **Create**

## Files Involved
- `firestore.indexes.json` — Pre-configured index definition (ready to deploy)
- `backend/src/routes/analysis.ts` — Updated to return helpful error with index creation URL

## After Index is Created
Once the index is built (1–2 min), the error will disappear and:
- Login flow will complete successfully
- Past analyses will load in the dashboard
- All GET /api/analyses/* requests will work

## Testing the Index
After creating the index, you should see:
- No FAILED_PRECONDITION error
- Network tab shows 200 status on /api/analyses/user/{userId}
- Dashboard displays past analyses (if any)
