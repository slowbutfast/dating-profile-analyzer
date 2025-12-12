import { Router, Request, Response } from 'express';
import { db } from '../config/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import multer from 'multer';
import { validateImageFormat } from '../utils/imageValidator';
import * as fs from 'fs';
import * as path from 'path';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads/profile-photos');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Upload profile for analysis
router.post('/', upload.array('photos', 10), async (req: Request, res: Response) => {
  try {
    const { userId, bio, textResponses } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!userId || !files || files.length === 0) {
      return res.status(400).json({ error: 'Missing required fields: userId and photos are required' });
    }
    
    if (files.length < 3) {
      return res.status(400).json({ error: 'At least 3 photos are required' });
    }
    
    if (files.length > 6) {
      return res.status(400).json({ error: 'Maximum 6 photos allowed' });
    }

    // Validate all images before processing
    const validationResults = await Promise.all(
      files.map(async (file, index) => ({
        index,
        filename: file.originalname,
        validation: await validateImageFormat(file.buffer),
      }))
    );

    // Check for invalid images
    const invalidImages = validationResults.filter(r => !r.validation.valid);
    if (invalidImages.length > 0) {
      return res.status(400).json({
        error: 'Invalid image format detected',
        invalidImages: invalidImages.map(img => ({
          filename: img.filename,
          index: img.index,
          reason: img.validation.error,
        })),
      });
    }

    // Parse textResponses if it's a string
    const parsedTextResponses = typeof textResponses === 'string' 
      ? JSON.parse(textResponses) 
      : textResponses;

    // Create analysis document
    const analysisRef = await db.collection('analyses').add({
      user_id: userId,
      bio: bio ? bio.trim() : '',
      status: 'pending',
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    });

    const analysisId = analysisRef.id;

    // Save photos locally and create photo documents
    const photoPromises = files.map(async (file, index) => {
      const filename = `${Date.now()}_${index}_${file.originalname}`;
      const userDir = path.join(uploadsDir, userId);
      
      // Create user directory if it doesn't exist
      if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
      }

      const filePath = path.join(userDir, filename);
      
      // Save file to local filesystem
      fs.writeFileSync(filePath, file.buffer);

      // Create a local URL that the backend can serve
      // This will be accessible at http://localhost:3001/uploads/profile-photos/userId/filename
      const localUrl = `/uploads/profile-photos/${userId}/${filename}`;

      // Create photo document in Firestore with local path (no base64 to avoid size limits)
      const photoDoc = await db.collection('photos').add({
        analysis_id: analysisId,
        photo_url: localUrl,
        storage_path: filePath,
        order_index: index,
        created_at: FieldValue.serverTimestamp(),
      });

      return photoDoc.id;
    });

    // Create text_response documents
    const textResponsePromises = parsedTextResponses?.map(async (response: any) => {
      await db.collection('text_responses').add({
        analysis_id: analysisId,
        question: response.question,
        answer: response.answer,
        created_at: FieldValue.serverTimestamp(),
      });
    }) || [];

    // Wait for all uploads to complete
    await Promise.all([...photoPromises, ...textResponsePromises]);

    res.status(201).json({
      success: true,
      analysisId,
      message: 'Profile uploaded successfully',
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload profile' });
  }
});

export default router;
