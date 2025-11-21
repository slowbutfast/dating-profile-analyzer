import { Router, Request, Response } from 'express';
import { db } from '../config/firebase';
import multer from 'multer';
import { storage } from '../config/firebase';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Upload profile for analysis
router.post('/', upload.array('photos', 10), async (req: Request, res: Response) => {
  try {
    const { userId, bio, textResponses } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!userId || !bio || !files || files.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Parse textResponses if it's a string
    const parsedTextResponses = typeof textResponses === 'string' 
      ? JSON.parse(textResponses) 
      : textResponses;

    // Create analysis document
    const analysisRef = await db.collection('analyses').add({
      user_id: userId,
      bio: bio.trim(),
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date(),
    });

    const analysisId = analysisRef.id;

    // Upload photos to Firebase Storage and create photo documents
    const photoPromises = files.map(async (file, index) => {
      const filename = `${Date.now()}_${index}_${file.originalname}`;
      const bucket = storage.bucket();
      const fileRef = bucket.file(`profile-photos/${userId}/${filename}`);

      // Upload file
      await fileRef.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
        },
      });

      // Make file publicly accessible
      await fileRef.makePublic();

      // Get public URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileRef.name}`;

      // Create photo document in Firestore
      await db.collection('photos').add({
        analysis_id: analysisId,
        photo_url: publicUrl,
        storage_path: fileRef.name,
        order_index: index,
        created_at: new Date(),
      });
    });

    // Create text_response documents
    const textResponsePromises = parsedTextResponses?.map(async (response: any) => {
      await db.collection('text_responses').add({
        analysis_id: analysisId,
        question: response.question,
        answer: response.answer,
        created_at: new Date(),
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
