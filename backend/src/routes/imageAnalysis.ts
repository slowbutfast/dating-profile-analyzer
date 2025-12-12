import { Router, Request, Response } from 'express';
import { db } from '../config/firebase';
import { analyzeImage, loadModels } from '../utils/imageAnalysis';
import https from 'https';
import http from 'http';
import * as fs from 'fs';
import * as path from 'path';

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
  const startTime = Date.now();
  try {
    const { analysisId } = req.params;
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔍 Starting image analysis for analysis ID: ${analysisId}`);
    console.log(`⏰ Start time: ${new Date().toISOString()}`);
    console.log(`${'='.repeat(60)}\n`);

    // Ensure models are loaded
    console.log('📦 Step 1/4: Loading face detection models...');
    try {
      await ensureModelsLoaded();
      console.log('✅ Models loaded successfully');
    } catch (modelError: any) {
      console.warn('⚠️  Model loading failed (face detection will be disabled):', modelError.message);
      console.warn('⚠️  Analysis will continue without face detection features');
    }

    // Get all photos for this analysis
    console.log('\n📸 Step 2/4: Fetching photos from Firestore...');
    console.log(`   Collection: photos`);
    console.log(`   Query: analysis_id == ${analysisId}`);
    
    let photosSnapshot;
    try {
      photosSnapshot = await db
        .collection('photos')
        .where('analysis_id', '==', analysisId)
        .orderBy('order_index', 'asc')
        .get();
    } catch (firestoreError: any) {
      console.error('❌ Firestore query failed:', firestoreError.message);
      if (firestoreError.message.includes('index')) {
        console.error('💡 You may need to create a composite index in Firestore');
        console.error('💡 Check the error message for a link to create it automatically');
      }
      throw firestoreError;
    }

    if (photosSnapshot.empty) {
      console.log('❌ No photos found for this analysis');
      console.log('💡 Possible reasons:');
      console.log('   - Photos not uploaded to Firestore');
      console.log('   - Wrong analysis_id');
      console.log('   - Photos collection is empty');
      return res.status(404).json({ 
        error: 'No photos found for this analysis',
        analysisId,
        suggestion: 'Check if photos were uploaded successfully'
      });
    }
    
    console.log(`✅ Found ${photosSnapshot.docs.length} photos to analyze`);

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Analyze each photo
    console.log(`\n📊 Step 3/4: Analyzing ${photosSnapshot.docs.length} photos...`);
    
    for (let i = 0; i < photosSnapshot.docs.length; i++) {
      const photoDoc = photosSnapshot.docs[i];
      const photoData = photoDoc.data();
      const photoId = photoDoc.id;
      const photoUrl = photoData.photo_url;
      const photoStartTime = Date.now();

      try {
        console.log(`\n   [${i + 1}/${photosSnapshot.docs.length}] Analyzing photo ${photoId}...`);
        console.log(`   Photo URL: ${photoUrl?.substring(0, 50)}...`);
        
        // Get image buffer - read from file system or download
        let imageBuffer: Buffer;
        
        if (photoData.storage_path) {
          console.log(`   Storage path: ${photoData.storage_path}`);
          if (fs.existsSync(photoData.storage_path)) {
            console.log(`   ✅ Reading from local file system`);
            imageBuffer = fs.readFileSync(photoData.storage_path);
            console.log(`   File size: ${(imageBuffer.length / 1024).toFixed(2)} KB`);
          } else {
            console.log(`   ⚠️  File not found at storage_path, trying URL...`);
            if (photoUrl && photoUrl.startsWith('http')) {
              console.log(`   📥 Downloading from URL...`);
              imageBuffer = await downloadImage(photoUrl);
              console.log(`   Download size: ${(imageBuffer.length / 1024).toFixed(2)} KB`);
            } else {
              throw new Error('File not found at storage_path and no valid URL available');
            }
          }
        } else if (photoUrl && photoUrl.startsWith('http')) {
          console.log(`   📥 No storage_path, downloading from URL...`);
          imageBuffer = await downloadImage(photoUrl);
          console.log(`   Download size: ${(imageBuffer.length / 1024).toFixed(2)} KB`);
        } else {
          throw new Error('No valid image source found (no storage_path or valid URL)');
        }

        // Run analysis with timeout
        console.log(`   🔬 Running image analysis...`);
        const analysisPromise = analyzeImage(imageBuffer);
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Image analysis timeout after 60 seconds')), 60000)
        );
        
        const analysis = await Promise.race([analysisPromise, timeoutPromise]);

        // Update photo document with analysis results
        console.log(`   💾 Saving results to Firestore...`);
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

        const photoElapsed = Date.now() - photoStartTime;
        console.log(`   ✅ Photo analyzed successfully in ${(photoElapsed / 1000).toFixed(2)}s`);
        console.log(`   📈 Overall Score: ${analysis.overallScore}/100`);
        console.log(`   📊 Breakdown: Blur=${analysis.blur.score}, Lighting=${analysis.lighting.score}, Smile=${analysis.smile.score}`);
        if (analysis.warnings.length > 0) {
          console.log(`   ⚠️  Warnings: ${analysis.warnings.join(', ')}`);
        }

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
        
        successCount++;
      } catch (error: any) {
        errorCount++;
        const photoElapsed = Date.now() - photoStartTime;
        console.error(`   ❌ Error analyzing photo ${photoId} (after ${(photoElapsed / 1000).toFixed(2)}s):`, error.message);
        console.error(`   Stack trace:`, error.stack);
        
        results.push({
          photoId,
          photoUrl,
          error: error.message || 'Failed to analyze photo',
        });
      }
    }

    // Update analysis status to completed
    console.log(`\n💾 Step 4/4: Updating analysis status...`);
    await db.collection('analyses').doc(analysisId).update({
      status: 'completed',
      images_analyzed: true,
      images_analyzed_at: new Date(),
      updated_at: new Date(),
    });
    
    const totalElapsed = Date.now() - startTime;
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎉 Analysis ${analysisId} completed successfully!`);
    console.log(`📊 Summary:`);
    console.log(`   Total photos: ${results.length}`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log(`   ⏱️  Total time: ${(totalElapsed / 1000).toFixed(2)}s`);
    console.log(`   ⏰ End time: ${new Date().toISOString()}`);
    console.log(`${'='.repeat(60)}\n`);

    res.json({
      success: true,
      analysisId,
      totalPhotos: results.length,
      successCount,
      errorCount,
      timeElapsed: totalElapsed,
      results,
    });
  } catch (error: any) {
    const totalElapsed = Date.now() - startTime;
    console.error(`\n${'='.repeat(60)}`);
    console.error(`❌ CRITICAL ERROR in image analysis`);
    console.error(`   Analysis ID: ${req.params.analysisId}`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Time elapsed: ${(totalElapsed / 1000).toFixed(2)}s`);
    console.error(`   Stack trace:`);
    console.error(error.stack);
    console.error(`${'='.repeat(60)}\n`);
    
    // Try to update analysis status to failed
    try {
      await db.collection('analyses').doc(req.params.analysisId).update({
        status: 'failed',
        error_message: error.message,
        updated_at: new Date(),
      });
    } catch (updateError) {
      console.error('Failed to update analysis status to failed:', updateError);
    }
    
    res.status(500).json({ 
      error: error.message || 'Failed to analyze images',
      analysisId: req.params.analysisId,
      timeElapsed: totalElapsed,
    });
  }
});

/**
 * Get image analysis results for all photos in an analysis
 * GET /api/image-analysis/analysis/:analysisId
 */
router.get('/analysis/:analysisId', async (req: Request, res: Response) => {
  try {
    const { analysisId } = req.params;
    
    console.log(`📊 Fetching image analysis results for analysis: ${analysisId}`);

    // Get all photos for this analysis with their analysis data
    const photosSnapshot = await db
      .collection('photos')
      .where('analysis_id', '==', analysisId)
      .orderBy('order_index', 'asc')
      .get();

    if (photosSnapshot.empty) {
      return res.status(404).json({ 
        error: 'No photos found for this analysis',
        analysisId
      });
    }

    const photos = photosSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        photoId: doc.id,
        photoUrl: data.photo_url,
        orderIndex: data.order_index,
        analysis: data.analyzed_at ? {
          blur: {
            score: data.blur_score,
            severity: data.blur_severity
          },
          lighting: {
            score: data.lighting_score,
            brightness: data.lighting_brightness,
            contrast: data.lighting_contrast,
            issues: data.lighting_issues || []
          },
          smile: {
            score: data.smile_score,
            confidence: data.smile_confidence,
            faceDetected: data.face_detected,
            expressions: data.smile_expressions
          },
          overallScore: data.overall_quality_score,
          warnings: data.quality_warnings || [],
          analyzedAt: data.analyzed_at
        } : null
      };
    });

    console.log(`✅ Found ${photos.length} photos, ${photos.filter(p => p.analysis).length} analyzed`);

    res.json({
      success: true,
      analysisId,
      photos
    });
  } catch (error: any) {
    console.error('Error fetching image analysis results:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch image analysis results'
    });
  }
});

/**
 * Get image analysis for a specific photo
 * GET /api/image-analysis/photo/:photoId
 */
router.get('/photo/:photoId', async (req: Request, res: Response) => {
  try {
    const { photoId } = req.params;
    
    console.log(`📸 Fetching analysis for photo: ${photoId}`);

    const photoDoc = await db.collection('photos').doc(photoId).get();

    if (!photoDoc.exists) {
      return res.status(404).json({ 
        error: 'Photo not found',
        photoId
      });
    }

    const data = photoDoc.data()!;
    
    const photo = {
      photoId: photoDoc.id,
      photoUrl: data.photo_url,
      orderIndex: data.order_index,
      analysis: data.analyzed_at ? {
        blur: {
          score: data.blur_score,
          severity: data.blur_severity
        },
        lighting: {
          score: data.lighting_score,
          brightness: data.lighting_brightness,
          contrast: data.lighting_contrast,
          issues: data.lighting_issues || []
        },
        smile: {
          score: data.smile_score,
          confidence: data.smile_confidence,
          faceDetected: data.face_detected,
          expressions: data.smile_expressions
        },
        overallScore: data.overall_quality_score,
        warnings: data.quality_warnings || [],
        analyzedAt: data.analyzed_at
      } : null
    };

    console.log(`✅ Photo ${data.analyzed_at ? 'has' : 'does not have'} analysis data`);

    res.json({
      success: true,
      photo
    });
  } catch (error: any) {
    console.error('Error fetching photo analysis:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch photo analysis'
    });
  }
});

export default router;
