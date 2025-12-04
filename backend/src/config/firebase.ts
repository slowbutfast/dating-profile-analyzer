import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

/**
 * Initialize Firebase Admin SDK
 * 
 * Credentials should be provided via environment variables:
 * - FIREBASE_PROJECT_ID
 * - FIREBASE_CLIENT_EMAIL
 * - FIREBASE_PRIVATE_KEY
 * 
 * Or via a service account JSON file pointed to by GOOGLE_APPLICATION_CREDENTIALS
 */

// Validate required environment variables
const validateCredentials = () => {
  const required = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('\n❌ Missing Firebase credentials:\n');
    console.error(`Required environment variables: ${required.join(', ')}\n`);
    console.error('To fix this:\n');
    console.error('1. Go to Firebase Console → Project Settings');
    console.error('2. Click "Service Accounts" tab');
    console.error('3. Click "Generate New Private Key"');
    console.error('4. Copy the JSON and set these environment variables:');
    console.error('   - FIREBASE_PROJECT_ID (from "project_id")');
    console.error('   - FIREBASE_CLIENT_EMAIL (from "client_email")');
    console.error('   - FIREBASE_PRIVATE_KEY (from "private_key" - with escaped newlines)\n');
    console.error('Or set GOOGLE_APPLICATION_CREDENTIALS to point to the JSON file.\n');
    
    throw new Error(
      `Missing Firebase credentials. Required: ${missing.join(', ')}`
    );
  }
};

validateCredentials();

// Build service account object
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

// Initialize Firebase Admin SDK
try {
  // Allow override of storage bucket URL, defaulting to firebasestorage.app format
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || 
    `${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`;
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    storageBucket: storageBucket,
  });
  
  console.log('✅ Firebase Admin SDK initialized successfully');
  console.log(`📦 Storage bucket: ${storageBucket}`);
} catch (error: any) {
  console.error('❌ Failed to initialize Firebase Admin SDK:');
  console.error(error.message);
  process.exit(1);
}

export const db = admin.firestore();
export const storage = admin.storage();
export const auth = admin.auth();

export default admin;
