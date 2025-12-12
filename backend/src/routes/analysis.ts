import { Router, Request, Response } from 'express';
import { db } from '../config/firebase';

const router = Router();

// Get all analyses for a user
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const snapshot = await db
      .collection('analyses')
      .where('user_id', '==', userId)
      .orderBy('created_at', 'desc')
      .get();

    const analyses = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convert Firestore timestamps to ISO strings for JSON serialization
        created_at: data?.created_at?.toDate?.() || data?.created_at || null,
        updated_at: data?.updated_at?.toDate?.() || data?.updated_at || null,
      };
    });

    res.json({ analyses });
  } catch (error: any) {
    console.error('Error fetching analyses:', error);

    // Detect Firestore "requires an index" error and return a helpful payload
    const msg = error?.message || String(error);
    if (msg && /requires an index/i.test(msg)) {
      const urlMatch = msg.match(/https?:\/\/[^\s)]+/);
      const indexUrl = urlMatch ? urlMatch[0] : null;

      return res.status(412).json({
        error: 'Query requires a Firestore index',
        details: msg,
        createIndexUrl: indexUrl,
      });
    }

    res.status(500).json({ error: msg || 'Failed to fetch analyses' });
  }
});

// Get a specific analysis with photos and text responses
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get analysis document
    const analysisDoc = await db.collection('analyses').doc(id).get();
    
    if (!analysisDoc.exists) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    const analysisData = analysisDoc.data();
    const analysis = { 
      id: analysisDoc.id, 
      ...analysisData,
      // Convert Firestore timestamps to ISO strings for JSON serialization
      created_at: analysisData?.created_at?.toDate?.() || analysisData?.created_at || null,
      updated_at: analysisData?.updated_at?.toDate?.() || analysisData?.updated_at || null,
    };

    // Get photos
    const photosSnapshot = await db
      .collection('photos')
      .where('analysis_id', '==', id)
      .orderBy('order_index', 'asc')
      .get();

    const photos = photosSnapshot.docs.map(doc => {
      const photoData = doc.data();
      return {
        id: doc.id,
        ...photoData,
        created_at: photoData?.created_at?.toDate?.() || photoData?.created_at || null,
      };
    });

    // Get text responses
    const textResponsesSnapshot = await db
      .collection('text_responses')
      .where('analysis_id', '==', id)
      .orderBy('created_at', 'asc')
      .get();

    const textResponses = textResponsesSnapshot.docs.map(doc => {
      const textData = doc.data();
      return {
        id: doc.id,
        ...textData,
        created_at: textData?.created_at?.toDate?.() || textData?.created_at || null,
      };
    });

    res.json({
      analysis,
      photos,
      textResponses,
    });
  } catch (error: any) {
    console.error('Error fetching analysis:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch analysis' });
  }
});

// Delete an analysis
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Delete analysis document
    await db.collection('analyses').doc(id).delete();

    // Delete associated photos
    const photosSnapshot = await db
      .collection('photos')
      .where('analysis_id', '==', id)
      .get();

    const photoDeletePromises = photosSnapshot.docs.map(doc => doc.ref.delete());

    // Delete associated text responses
    const textResponsesSnapshot = await db
      .collection('text_responses')
      .where('analysis_id', '==', id)
      .get();

    const textResponseDeletePromises = textResponsesSnapshot.docs.map(doc => doc.ref.delete());

    await Promise.all([...photoDeletePromises, ...textResponseDeletePromises]);

    res.json({ success: true, message: 'Analysis deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting analysis:', error);
    res.status(500).json({ error: error.message || 'Failed to delete analysis' });
  }
});

// Trigger comprehensive analysis (both text and image)
router.post('/:id/analyze', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if analysis exists
    const analysisDoc = await db.collection('analyses').doc(id).get();
    
    if (!analysisDoc.exists) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    // Update status to processing
    await db.collection('analyses').doc(id).update({
      status: 'processing',
      processing_started_at: new Date(),
      updated_at: new Date(),
    });

    // Note: You can trigger your OpenAI text analysis here
    // For now, we'll just trigger the image analysis

    res.json({
      success: true,
      message: 'Analysis started',
      analysisId: id,
      note: 'Image analysis will be processed. Use POST /api/image-analysis/:analysisId to run image quality checks.',
    });

  } catch (error: any) {
    console.error('Error starting analysis:', error);
    res.status(500).json({ error: error.message || 'Failed to start analysis' });
  }
});

export default router;
