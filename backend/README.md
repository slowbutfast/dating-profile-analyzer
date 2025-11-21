# Dating Profile Analyzer - Backend Server

Express.js backend server using Firebase Admin SDK for database operations.

## Architecture

This backend provides a traditional REST API that:
- Uses Firebase Admin SDK (with service account credentials)
- Handles all Firestore database operations
- Manages file uploads to Firebase Storage
- Provides API endpoints for the frontend

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment variables:**
   The `.env` file contains your Firebase Admin SDK credentials.

3. **Start the server:**
   ```bash
   npm run dev
   ```

   The server will run on `http://localhost:3001`

## API Endpoints

### Upload
- **POST** `/api/upload`
  - Upload profile photos and text responses
  - Body: FormData with photos, userId, bio, textResponses
  - Returns: `{ success, analysisId, message }`

### Analyses
- **GET** `/api/analyses/user/:userId`
  - Get all analyses for a user
  - Returns: `{ analyses: [...] }`

- **GET** `/api/analyses/:id`
  - Get specific analysis with photos and text responses
  - Returns: `{ analysis, photos, textResponses }`

- **DELETE** `/api/analyses/:id`
  - Delete an analysis and associated data
  - Returns: `{ success, message }`

### Health Check
- **GET** `/api/health`
  - Check if server is running
  - Returns: `{ status: 'ok', message }`

## Database Structure

### Firestore Collections:
- **analyses** - Analysis records
  - `user_id`, `bio`, `status`, `created_at`, `updated_at`

- **photos** - Photo metadata and analysis results
  - `analysis_id`, `photo_url`, `storage_path`, `order_index`, `analysis_result`, `created_at`

- **text_responses** - Text response data
  - `analysis_id`, `question`, `answer`, `analysis_result`, `created_at`

- **profiles** - User profile information
  - `user_id`, `email`, `full_name`, `created_at`, `updated_at`

## Development

- **Development mode:** `npm run dev` (auto-restart on changes)
- **Build:** `npm run build`
- **Production:** `npm start`

## Firebase Admin SDK

The backend uses Firebase Admin SDK which:
- Has elevated privileges (bypasses security rules)
- Uses service account credentials from `.env`
- Can perform privileged operations
- Should NEVER be exposed to the frontend
