import { Router, Request, Response } from 'express';
import multer from 'multer';
import { detectBlur, analyzeLighting, detectSmile, analyzeImage, loadModels } from '../utils/imageAnalysis';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

/**
 * Test endpoint for image analysis
 * POST /api/test/analyze
 * 
 * Accepts multipart form data with an image file
 * Returns the complete analysis results
 */
router.post('/analyze', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No image file provided',
        hint: 'Send a multipart form with an "image" field containing the image file'
      });
    }

    console.log(`🧪 Test analyze endpoint called`);
    console.log(`   File: ${req.file.originalname}`);
    console.log(`   Size: ${(req.file.size / 1024).toFixed(2)} KB`);
    console.log(`   Type: ${req.file.mimetype}`);

    // Ensure models are loaded
    await loadModels();

    // Run full analysis
    const imageBuffer = req.file.buffer;
    const analysis = await analyzeImage(imageBuffer);

    res.json({
      success: true,
      filename: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      ...analysis,
    });
  } catch (error: any) {
    console.error('Test analyze error:', error);
    res.status(500).json({ 
      error: error.message || 'Analysis failed',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

/**
 * Test blur detection only
 * POST /api/test/blur
 */
router.post('/blur', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const result = await detectBlur(req.file.buffer);
    
    res.json({
      success: true,
      blur: result,
    });
  } catch (error: any) {
    console.error('Test blur error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Test lighting analysis only
 * POST /api/test/lighting
 */
router.post('/lighting', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const result = await analyzeLighting(req.file.buffer);
    
    res.json({
      success: true,
      lighting: result,
    });
  } catch (error: any) {
    console.error('Test lighting error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Test smile detection only
 * POST /api/test/smile
 */
router.post('/smile', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    await loadModels();
    const result = await detectSmile(req.file.buffer);
    
    res.json({
      success: true,
      smile: result,
    });
  } catch (error: any) {
    console.error('Test smile error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Health check endpoint
 * GET /api/test/health
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok',
    message: 'Test routes are working',
    endpoints: [
      'POST /api/test/analyze - Full image analysis',
      'POST /api/test/blur - Blur detection only',
      'POST /api/test/lighting - Lighting analysis only', 
      'POST /api/test/smile - Smile detection only',
    ]
  });
});

export default router;
