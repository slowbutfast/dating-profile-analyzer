#!/bin/bash

echo "🚀 Dating Profile Analyzer - Setup Script"
echo "=========================================="
echo ""

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "⚠️  Warning: Node.js v18+ is recommended. You have v$NODE_VERSION"
fi

echo "✅ Node.js version: $(node -v)"
echo ""

# Backend setup
echo "📦 Setting up backend..."
cd backend || exit 1

if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Copying .env.example..."
    cp .env.example .env
    echo "📝 Please edit backend/.env with your Firebase credentials"
fi

if [ ! -f "serviceAccountKey.json" ]; then
    echo "⚠️  serviceAccountKey.json not found!"
    echo "📝 Please download it from Firebase Console and place it in the backend folder"
fi

if [ ! -d "models" ] || [ -z "$(ls -A models)" ]; then
    echo "⚠️  Face detection models not found. Downloading..."
    mkdir -p models
    cd models || exit 1
    
    echo "Downloading tiny_face_detector models..."
    curl -O https://raw.githubusercontent.com/vladmandic/face-api/master/model/tiny_face_detector_model-weights_manifest.json
    curl -O https://raw.githubusercontent.com/vladmandic/face-api/master/model/tiny_face_detector_model-shard1
    
    echo "Downloading face_landmark_68 models..."
    curl -O https://raw.githubusercontent.com/vladmandic/face-api/master/model/face_landmark_68_model-weights_manifest.json
    curl -O https://raw.githubusercontent.com/vladmandic/face-api/master/model/face_landmark_68_model-shard1
    
    echo "Downloading face_expression models..."
    curl -O https://raw.githubusercontent.com/vladmandic/face-api/master/model/face_expression_model-weights_manifest.json
    curl -O https://raw.githubusercontent.com/vladmandic/face-api/master/model/face_expression_model-shard1
    
    cd ..
    echo "✅ Models downloaded successfully"
else
    echo "✅ Face detection models already exist"
fi

echo "Installing backend dependencies..."
npm install
echo "✅ Backend setup complete"
echo ""

# Frontend setup
echo "📦 Setting up frontend..."
cd ../frontend || exit 1

if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Copying .env.example..."
    cp .env.example .env
    echo "📝 Please edit frontend/.env with your Firebase credentials"
fi

echo "Installing frontend dependencies..."
npm install
echo "✅ Frontend setup complete"
echo ""

echo "=========================================="
echo "✅ Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env with your Firebase Project ID and OpenAI API key"
echo "2. Place serviceAccountKey.json in the backend/ folder"
echo "3. Edit frontend/.env with your Firebase web app credentials"
echo "4. Start the backend: cd backend && npm run dev"
echo "5. Start the frontend: cd frontend && npm run dev"
echo ""
echo "Visit http://localhost:8080 to use the app!"
echo "=========================================="
