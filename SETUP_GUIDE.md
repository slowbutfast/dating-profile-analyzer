# Setup Guide for Team Members

This guide will help you set up the Dating Profile Analyzer project on your local machine.

## Quick Start (Automated)

Run the setup script to automatically install dependencies and download models:

```bash
./setup.sh
```

Then follow the manual configuration steps below for Firebase credentials.

## Manual Setup (Step by Step)

### 1. Prerequisites

Install these first:
- **Node.js v18+**: https://nodejs.org/
- **Git**: https://git-scm.com/
- **A text editor**: VS Code recommended

### 2. Clone the Repository

```bash
git clone <repository-url>
cd final_project
```

### 3. Backend Configuration

#### Install Dependencies

```bash
cd backend
npm install
```

#### Configure Environment Variables

Create a `.env` file in the `backend` folder:

```env
PORT=3001
FRONTEND_URL=http://localhost:8080
FIREBASE_PROJECT_ID=your-project-id
OPENAI_API_KEY=your-openai-api-key
```

**Where to get these values:**
- `FIREBASE_PROJECT_ID`: From Firebase Console > Project Settings
- `OPENAI_API_KEY`: From https://platform.openai.com/api-keys (optional for now)

#### Add Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** (gear icon) > **Service Accounts**
4. Click **"Generate New Private Key"**
5. Save the downloaded JSON file as `serviceAccountKey.json` in the `backend` folder

**IMPORTANT**: Never commit this file to git! It's already in `.gitignore`.

#### Download Face Detection Models

```bash
cd backend
mkdir -p models
cd models

# Download all required model files
curl -O https://raw.githubusercontent.com/vladmandic/face-api/master/model/tiny_face_detector_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/vladmandic/face-api/master/model/tiny_face_detector_model-shard1
curl -O https://raw.githubusercontent.com/vladmandic/face-api/master/model/face_landmark_68_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/vladmandic/face-api/master/model/face_landmark_68_model-shard1
curl -O https://raw.githubusercontent.com/vladmandic/face-api/master/model/face_expression_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/vladmandic/face-api/master/model/face_expression_model-shard1

cd ../..
```

### 4. Frontend Configuration

#### Install Dependencies

```bash
cd frontend
npm install
```

#### Configure Environment Variables

Create a `.env` file in the `frontend` folder:

```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

**Where to get these values:**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** (gear icon)
4. Scroll to "Your apps" section
5. Click the web icon `</>` (or select existing web app)
6. Copy values from the `firebaseConfig` object

Example:
```javascript
const firebaseConfig = {
  apiKey: "AIza...",              // → VITE_FIREBASE_API_KEY
  authDomain: "project.firebaseapp.com",  // → VITE_FIREBASE_AUTH_DOMAIN
  projectId: "project-id",        // → VITE_FIREBASE_PROJECT_ID
  storageBucket: "project.appspot.com",  // → VITE_FIREBASE_STORAGE_BUCKET
  messagingSenderId: "123456",    // → VITE_FIREBASE_MESSAGING_SENDER_ID
  appId: "1:123:web:abc"          // → VITE_FIREBASE_APP_ID
};
```

### 5. Firebase Console Setup

#### Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click **"Get Started"**
3. Enable **"Email/Password"** sign-in method

#### Enable Firestore

1. Go to **Firestore Database**
2. Click **"Create Database"**
3. Start in **test mode** (we'll add security rules later)
4. Choose a location close to your users

#### Create Firestore Indexes

The app will show error messages with links when indexes are needed. Click those links or manually create these indexes:

1. Go to **Firestore Database** > **Indexes** > **Composite**
2. Create these indexes:

**Index 1: Photos**
- Collection ID: `photos`
- Fields: `analysis_id` (Ascending), `order_index` (Ascending)

**Index 2: Text Responses**
- Collection ID: `text_responses`
- Fields: `analysis_id` (Ascending), `created_at` (Ascending)

**Index 3: Analyses**
- Collection ID: `analyses`
- Fields: `user_id` (Ascending), `created_at` (Descending)

Wait a few minutes for indexes to build (they'll show "Building" status).

### 6. Running the Application

#### Start Backend (Terminal 1)

```bash
cd backend
npm run dev
```

You should see:
```
✅ Firebase Admin SDK initialized successfully
🚀 Backend server running on http://localhost:3001
```

#### Start Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

You should see:
```
VITE v5.4.21  ready in XXX ms
➜  Local:   http://localhost:8080/
```

#### Access the App

Open your browser and go to: **http://localhost:8080**

## Troubleshooting

### "Cannot find module '@supabase/supabase-js'"

**Solution**: The Supabase integration has been removed. If you cloned an old version:
```bash
cd frontend
rm -rf node_modules
npm install
```

### "Firebase: Error (auth/invalid-api-key)"

**Solution**: Check your `frontend/.env` file. Make sure all Firebase credentials are correct.

### "The specified bucket does not exist"

**Solution**: This is just a warning, it won't affect the app. We use local file storage, not Firebase Storage.

### "Models directory not found"

**Solution**: Download the face detection models:
```bash
cd backend/models
# Run the curl commands from step 3
```

### Port Already in Use

If you see "port 3001 already in use":

**Mac/Linux:**
```bash
lsof -ti:3001 | xargs kill -9
```

**Windows:**
```bash
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Firestore Index Errors

When you see errors like "The query requires an index":
1. Look for the link in the error message (it looks like: https://console.firebase.google.com/project/...)
2. Click it - it will open Firebase Console
3. Click "Create Index"
4. Wait 2-5 minutes for it to build
5. Refresh your app

### "Class GNotificationCenterDelegate" Warning

This is harmless! It's a compatibility warning between image processing libraries. You can ignore it.

## Testing the App

1. **Create an account**: Click "Sign Up" and create a test account
2. **Upload photos**: Go to Upload page, select 1-6 photos
3. **Add bio**: Write a short bio (optional)
4. **Submit**: Click "Upload Profile"
5. **View results**: You'll be redirected to the results page
6. **Wait for analysis**: The page will automatically update when analysis completes (30-60 seconds)

## Getting Help

If you run into issues:

1. Check the terminal output for error messages
2. Check browser console (F12) for frontend errors
3. Make sure both backend and frontend are running
4. Verify all environment variables are set correctly
5. Check that Firebase indexes are created and enabled

## Project Structure

```
final_project/
├── backend/
│   ├── models/                # Face detection ML models
│   ├── src/
│   │   ├── config/           # Firebase config
│   │   ├── routes/           # API endpoints
│   │   ├── utils/            # Image analysis
│   │   └── server.ts
│   ├── uploads/              # Local photo storage
│   ├── .env                  # Backend config (create this)
│   ├── serviceAccountKey.json # Firebase admin key (create this)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── lib/              # API client
│   │   └── integrations/     # Firebase client
│   ├── .env                  # Frontend config (create this)
│   └── package.json
├── setup.sh                   # Automated setup script
└── README.md
```

## What Each Part Does

- **Backend**: Express server that handles image analysis, file uploads, and Firestore operations
- **Frontend**: React app with user interface
- **Firebase Auth**: User authentication and account management
- **Firestore**: Database for storing analyses, photos, and user data
- **Face-API Models**: TensorFlow models for detecting faces and expressions
- **Image Analysis**: Sharp and Jimp for blur and lighting detection

Good luck! 🚀
