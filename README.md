# Dating Profile Analyzer

## Overview

Dating Profile Analyzer is a web application that uses AI to provide actionable feedback and insights on your dating profile. Users can upload their dating profile photos and text responses, and receive data-driven suggestions to improve their chances of making meaningful connections.

## Prerequisites

Before you begin, make sure you have the following installed:
- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- A **Firebase project** with Firestore enabled

## Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use an existing one
3. Enable **Firestore Database**:
   - Go to Firestore Database
   - Click "Create Database"
   - Start in test mode (you can configure security rules later)
4. Enable **Authentication**:
   - Go to Authentication
   - Click "Get Started"
   - Enable Email/Password authentication
5. Get your Firebase credentials:
   - Go to Project Settings (gear icon)
   - Scroll to "Your apps" section
   - Click the web icon `</>` to create a web app
   - Copy the `firebaseConfig` object
6. Create a service account for the backend:
   - Go to Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file as `serviceAccountKey.json` in the `backend` folder

## Installation

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd final_project
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` folder:

```env
PORT=3001
FRONTEND_URL=http://localhost:8080
FIREBASE_PROJECT_ID=your-project-id
OPENAI_API_KEY=your-openai-api-key-here
```

Place your `serviceAccountKey.json` file in the `backend` folder.

### 3. Download Face Detection Models

The backend uses TensorFlow face-api models. Download them:

```bash
# From the backend directory
mkdir -p models
cd models

# Download the required model files
curl -O https://raw.githubusercontent.com/vladmandic/face-api/master/model/tiny_face_detector_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/vladmandic/face-api/master/model/tiny_face_detector_model-shard1
curl -O https://raw.githubusercontent.com/vladmandic/face-api/master/model/face_landmark_68_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/vladmandic/face-api/master/model/face_landmark_68_model-shard1
curl -O https://raw.githubusercontent.com/vladmandic/face-api/master/model/face_expression_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/vladmandic/face-api/master/model/face_expression_model-shard1

cd ..
```

### 4. Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend` folder:

```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

Get these values from your Firebase project settings (the `firebaseConfig` object from step 5 of Firebase Setup).

### 5. Create Required Firestore Indexes

When you first run the app, Firestore will show errors about missing indexes. Click the links in the error messages to automatically create the required indexes, or manually create them:

**Composite indexes needed:**
- Collection: `photos`, Fields: `analysis_id` (Ascending), `order_index` (Ascending)
- Collection: `text_responses`, Fields: `analysis_id` (Ascending), `created_at` (Ascending)
- Collection: `analyses`, Fields: `user_id` (Ascending), `created_at` (Descending)

## Running the Application

### Start the Backend

```bash
cd backend
npm run dev
```

The backend will start on `http://localhost:3001`

### Start the Frontend

In a new terminal:

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:8080`

## Common Issues & Solutions

### "Supabase is disabled" Error

This has been fixed! The unused Supabase integration has been removed. If you still see this, make sure you have:
1. Run `npm install` in the frontend folder
2. Deleted `node_modules` and reinstalled if needed

### Missing Face Detection Models

If you see errors about missing models:
```bash
cd backend/models
# Re-download the models using the curl commands from step 3 above
```

### Firebase Authentication Errors

Make sure:
- Email/Password authentication is enabled in Firebase Console
- Your `.env` files have the correct Firebase credentials
- `serviceAccountKey.json` is in the backend folder

### Port Already in Use

If port 3001 or 8080 is already in use:

```bash
# Kill processes on port 3001
lsof -ti:3001 | xargs kill -9

# Kill processes on port 8080
lsof -ti:8080 | xargs kill -9
```

### Firestore Index Errors

When you see "requires an index" errors:
1. Look for the Firebase Console link in the error message
2. Click it to create the index automatically
3. Wait a few minutes for the index to build

## Features

- **Image Analysis**: Automatic detection of blur, lighting quality, and facial expressions
- **Profile Upload**: Upload multiple photos and text responses
- **Real-time Analysis**: Get instant feedback on your profile quality
- **Firebase Authentication**: Secure user accounts
- **Comprehensive Feedback**: Detailed scores and improvement suggestions

## Tech Stack

- **Frontend**: React, TypeScript, Vite, TailwindCSS, shadcn/ui
- **Backend**: Node.js, Express, TypeScript
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication
- **Image Analysis**: Sharp, Jimp, TensorFlow.js, face-api.js
- **AI**: OpenAI API (optional, for text analysis)

## Project Structure

```
final_project/
├── backend/
│   ├── src/
│   │   ├── config/       # Firebase configuration
│   │   ├── middleware/   # Authentication middleware
│   │   ├── routes/       # API endpoints
│   │   ├── utils/        # Image analysis utilities
│   │   └── server.ts     # Express server
│   ├── models/           # Face detection models
│   ├── uploads/          # Uploaded photos (local storage)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── contexts/     # React contexts (Auth)
│   │   ├── pages/        # Page components
│   │   ├── lib/          # Utilities and API client
│   │   └── integrations/ # Firebase integration
│   └── package.json
└── README.md
```

## License

MIT

