import { Router, Request, Response } from 'express';
import { db, storage } from '../config/firebase';
import { analyzeImage, loadModels } from '../utils/imageAnalysis';
import https from 'https';
import http from 'http';

const router = Router();

// Load models on startup
let modelsLoading: Promise<void> | null = null;

function ensureModelsLoaded(): Promise<void> {
  if (!modelsLoading) {
    modelsLoading = loadModels();
  }
  return modelsLoading;
}

/**
 * Download image from URL
 */
async function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      const chunks: Buffer[] = [];
      
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Analyze images for a specific analysis
 * POST /api/image-analysis/:analysisId
 */
router.post('/:analysisId', async (req: Request, res: Response) => {
  try {
    const { analysisId } = req.params;

    // Ensure models are loaded
    await ensureModelsLoaded();

    // Get all photos for this analysis
    const photosSnapshot = await db
      .collection('photos')
      .where('analysis_id', '==', analysisId)
      .orderBy('order_index', 'asc')
      .get();

    if (photosSnapshot.empty) {
      return res.status(404).json({ error: 'No photos found for this analysis' });
    }

    const results = [];

    // Analyze each photo
    for (const photoDoc of photosSnapshot.docs) {
      const photoData = photoDoc.data();
      const photoId = photoDoc.id;
      const photoUrl = photoData.photo_url;

      try {
        // Download the image
        console.log(`Analyzing photo ${photoId}...`);
        const imageBuffer = await downloadImage(photoUrl);

        // Run analysis
        const analysis = await analyzeImage(imageBuffer);

        // Update photo document with analysis results
        await db.collection('photos').doc(photoId).update({
          blur_score: analysis.blur.score,
          blur_severity: analysis.blur.severity,
          lighting_score: analysis.lighting.score,
          lighting_brightness: analysis.lighting.brightness,
          lighting_contrast: analysis.lighting.contrast,
          lighting_issues: analysis.lighting.issues,
          smile_score: analysis.smile.score,
          smile_confidence: analysis.smile.confidence,
          face_detected: analysis.smile.faceDetected,
          smile_expressions: analysis.smile.expressions || null,
          overall_quality_score: analysis.overallScore,
          quality_warnings: analysis.warnings,
          analyzed_at: new Date(),
        });

        results.push({
          photoId,
          photoUrl,
          analysis: {
            blur: analysis.blur,
            lighting: analysis.lighting,
            smile: analysis.smile,
            overallScore: analysis.overallScore,
            warnings: analysis.warnings,
          },
        });

        console.log(`✅ Analyzed photo ${photoId}: Score ${analysis.overallScore}`);
      } catch (error: any) {
        console.error(`Error analyzing photo ${photoId}:`, error);
        results.push({
          photoId,
          photoUrl,
          error: error.message || 'Failed to analyze photo',
        });
      }
    }

    // Update analysis status
    await db.collection('analyses').doc(analysisId).update({
      images_analyzed: true,
      images_analyzed_at: new Date(),
      updated_at: new Date(),
    });

    res.json({
      success: true,
      analysisId,
      totalPhotos: results.length,
      results,
    });
  } catch (error: any) {
    console.error('Image analysis error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze images' });
  }
});

/**
 * Get image analysis results for a specific photo
 * GET /api/image-analysis/photo/:photoId
 */
router.get('/photo/:photoId', async (req: Request, res: Response) => {
  try {
    const { photoId } = req.params;

    const photoDoc = await db.collection('photos').doc(photoId).get();

    if (!photoDoc.exists) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const photoData = photoDoc.data();

    // Check if analysis exists
    if (!photoData?.blur_score) {
      return res.status(404).json({ 
        error: 'Photo has not been analyzed yet',
        photoId,
      });
    }

    res.json({
      photoId,
      photoUrl: photoData.photo_url,
      analysis: {
        blur: {
          score: photoData.blur_score,
          severity: photoData.blur_severity,
        },
        lighting: {
          score: photoData.lighting_score,
          brightness: photoData.lighting_brightness,
          contrast: photoData.lighting_contrast,
          issues: photoData.lighting_issues || [],
        },
        smile: {
          score: photoData.smile_score,
          confidence: photoData.smile_confidence,
          faceDetected: photoData.face_detected,
          expressions: photoData.smile_expressions,
        },
        overallScore: photoData.overall_quality_score,
        warnings: photoData.quality_warnings || [],
      },
      analyzedAt: photoData.analyzed_at,
    });
  } catch (error: any) {
    console.error('Error fetching photo analysis:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch photo analysis' });
  }
});

/**
 * Get all image analysis results for an analysis
 * GET /api/image-analysis/analysis/:analysisId
 */
router.get('/analysis/:analysisId', async (req: Request, res: Response) => {
  try {
    const { analysisId } = req.params;

    const photosSnapshot = await db
      .collection('photos')
      .where('analysis_id', '==', analysisId)
      .orderBy('order_index', 'asc')
      .get();

    if (photosSnapshot.empty) {
      return res.status(404).json({ error: 'No photos found for this analysis' });
    }

    const photos = photosSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        photoId: doc.id,
        photoUrl: data.photo_url,
        orderIndex: data.order_index,
        analysis: data.blur_score ? {
          blur: {
            score: data.blur_score,
            severity: data.blur_severity,
          },
          lighting: {
            score: data.lighting_score,
            brightness: data.lighting_brightness,
            contrast: data.lighting_contrast,
            issues: data.lighting_issues || [],
          },
          smile: {
            score: data.smile_score,
            confidence: data.smile_confidence,
            faceDetected: data.face_detected,
            expressions: data.smile_expressions,
          },
          overallScore: data.overall_quality_score,
          warnings: data.quality_warnings || [],
          analyzedAt: data.analyzed_at,
        } : null,
      };
    });

    res.json({
      analysisId,
      totalPhotos: photos.length,
      photos,
    });
  } catch (error: any) {
    console.error('Error fetching analysis photos:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch analysis photos' });
  }
});

export default router;
