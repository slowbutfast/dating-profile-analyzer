/**
 * Script to download face-api.js models
 * Run this script once to download the required models for face detection
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const MODEL_BASE_URL = 'https://raw.githubusercontent.com/vladmandic/face-api/master/model/';
const MODELS_DIR = path.join(__dirname, '../models');

const MODELS_TO_DOWNLOAD = [
  // Tiny face detector (lightweight, fast)
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model.bin',
  
  // Face landmarks (68 points)
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model.bin',
  
  // Face expression recognition
  'face_expression_model-weights_manifest.json',
  'face_expression_model.bin',
];

// Ensure models directory exists
if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
  console.log(`📁 Created models directory: ${MODELS_DIR}`);
}

/**
 * Download a file from URL
 */
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      } else if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirect
        downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      } else {
        fs.unlink(dest, () => {}); // Delete the file
        reject(new Error(`Failed to download: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      fs.unlink(dest, () => {}); // Delete the file
      reject(err);
    });
  });
}

/**
 * Download all models
 */
async function downloadModels() {
  console.log('🚀 Starting face-api.js model download...\n');
  
  for (const model of MODELS_TO_DOWNLOAD) {
    const url = MODEL_BASE_URL + model;
    const dest = path.join(MODELS_DIR, model);
    
    // Skip if already exists
    if (fs.existsSync(dest)) {
      console.log(`✓ ${model} (already exists)`);
      continue;
    }
    
    try {
      console.log(`⬇️  Downloading ${model}...`);
      await downloadFile(url, dest);
      console.log(`✅ ${model}`);
    } catch (error) {
      console.error(`❌ Failed to download ${model}:`, error.message);
      process.exit(1);
    }
  }
  
  console.log('\n🎉 All models downloaded successfully!');
  console.log(`📂 Models location: ${MODELS_DIR}`);
}

downloadModels().catch((error) => {
  console.error('❌ Error downloading models:', error);
  process.exit(1);
});
