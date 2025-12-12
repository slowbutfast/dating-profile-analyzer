import sharp from 'sharp';
import { Jimp } from 'jimp';
import * as canvas from 'canvas';
import path from 'path';
import fs from 'fs';

// Conditionally import face-api to avoid Node 24 issues
let faceapi: any = null;
let faceApiError: Error | null = null;

try {
  faceapi = require('@vladmandic/face-api');
  const { Canvas, Image, ImageData } = canvas;
  // @ts-ignore
  faceapi.env.monkeyPatch({ Canvas, Image, ImageData });
} catch (error: any) {
  console.warn('⚠️ Face-api could not be loaded:', error.message);
  console.warn('⚠️ Face detection will be disabled');
  faceApiError = error;
}

let modelsLoaded = false;

/**
 * Load face-api.js models
 */
export async function loadModels(): Promise<void> {
  if (modelsLoaded) return;
  
  if (!faceapi) {
    console.warn('⚠️ Face-api is disabled, skipping model loading');
    modelsLoaded = true;
    return;
  }

  try {
    const modelPath = path.join(__dirname, '../../models');
    
    // Ensure models directory exists
    if (!fs.existsSync(modelPath)) {
      throw new Error(`Models directory not found at ${modelPath}. Please run the model download script.`);
    }

    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromDisk(modelPath),
      faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath),
      faceapi.nets.faceExpressionNet.loadFromDisk(modelPath),
    ]);

    modelsLoaded = true;
    console.log('✅ Face detection models loaded successfully');
  } catch (error) {
    console.error('❌ Error loading face-api models:', error);
    throw error;
  }
}

/**
 * Calculate blur score using Laplacian variance method
 * Returns a score from 0-100 where:
 * - 0-30: Very blurry (poor quality)
 * - 30-50: Slightly blurry (acceptable)
 * - 50-100: Sharp (good quality)
 */
export async function detectBlur(imageBuffer: Buffer): Promise<{
  score: number;
  isBlurry: boolean;
  severity: 'sharp' | 'slight-blur' | 'blurry' | 'very-blurry';
}> {
  try {
    // Convert image to grayscale
    const image = await sharp(imageBuffer)
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { data, info } = image;
    const { width, height } = info;

    // Apply Laplacian operator
    let sum = 0;
    let count = 0;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        
        // Laplacian kernel approximation
        const center = data[idx] * 4;
        const top = data[(y - 1) * width + x];
        const bottom = data[(y + 1) * width + x];
        const left = data[y * width + (x - 1)];
        const right = data[y * width + (x + 1)];
        
        const laplacian = Math.abs(center - top - bottom - left - right);
        sum += laplacian * laplacian;
        count++;
      }
    }

    // Calculate variance
    const variance = sum / count;
    
    // Normalize to 0-100 scale (empirically determined thresholds)
    // Variance typically ranges from 0 to ~1000+ for sharp images
    const normalizedScore = Math.min(100, (variance / 10));
    
    let severity: 'sharp' | 'slight-blur' | 'blurry' | 'very-blurry';
    if (normalizedScore >= 50) severity = 'sharp';
    else if (normalizedScore >= 30) severity = 'slight-blur';
    else if (normalizedScore >= 15) severity = 'blurry';
    else severity = 'very-blurry';

    return {
      score: Math.round(normalizedScore),
      isBlurry: normalizedScore < 30,
      severity,
    };
  } catch (error) {
    console.error('Error in blur detection:', error);
    throw error;
  }
}

/**
 * Analyze lighting quality using histogram analysis
 * Returns a score from 0-100 where:
 * - 0-30: Poor lighting (too dark, overexposed, or uneven)
 * - 30-70: Acceptable lighting
 * - 70-100: Good lighting
 */
export async function analyzeLighting(imageBuffer: Buffer): Promise<{
  score: number;
  isGoodLighting: boolean;
  issues: string[];
  brightness: number;
  contrast: number;
}> {
  try {
    const image = await Jimp.read(imageBuffer);
    const width = image.width;
    const height = image.height;
    
    let totalBrightness = 0;
    let brightnessValues: number[] = [];
    
    // Sample pixels for performance (every 4th pixel)
    const sampleRate = 4;
    let sampleCount = 0;

    for (let y = 0; y < height; y += sampleRate) {
      for (let x = 0; x < width; x += sampleRate) {
        const pixel = image.getPixelColor(x, y);
        const r = (pixel >> 24) & 0xff;
        const g = (pixel >> 16) & 0xff;
        const b = (pixel >> 8) & 0xff;
        // Calculate perceived brightness (ITU-R BT.709)
        const brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        totalBrightness += brightness;
        brightnessValues.push(brightness);
        sampleCount++;
      }
    }

    const avgBrightness = totalBrightness / sampleCount;
    
    // Calculate standard deviation (contrast indicator)
    const variance = brightnessValues.reduce((sum, val) => 
      sum + Math.pow(val - avgBrightness, 2), 0) / sampleCount;
    const stdDev = Math.sqrt(variance);
    
    // Normalize brightness to 0-100
    const normalizedBrightness = (avgBrightness / 255) * 100;
    
    // Normalize contrast to 0-100 (typical std dev range is 0-70)
    const normalizedContrast = Math.min(100, (stdDev / 70) * 100);

    const issues: string[] = [];
    let score = 100;

    // Check for darkness (brightness < 40%)
    if (normalizedBrightness < 40) {
      issues.push('Image is too dark');
      score -= (40 - normalizedBrightness);
    }
    
    // Check for overexposure (brightness > 85%)
    if (normalizedBrightness > 85) {
      issues.push('Image is overexposed');
      score -= (normalizedBrightness - 85) * 2;
    }
    
    // Check for low contrast
    if (normalizedContrast < 25) {
      issues.push('Low contrast - image appears flat');
      score -= (25 - normalizedContrast);
    }
    
    // Check for very high contrast (harsh lighting)
    if (normalizedContrast > 80) {
      issues.push('Very high contrast - may indicate harsh lighting');
      score -= (normalizedContrast - 80) / 2;
    }

    score = Math.max(0, Math.min(100, score));

    return {
      score: Math.round(score),
      isGoodLighting: score >= 50,
      issues,
      brightness: Math.round(normalizedBrightness),
      contrast: Math.round(normalizedContrast),
    };
  } catch (error) {
    console.error('Error in lighting analysis:', error);
    throw error;
  }
}

/**
 * Detect smile and facial expressions
 * Falls back to safe defaults if face detection fails
 */
export async function detectSmile(imageBuffer: Buffer): Promise<{
  score: number;
  hasSmile: boolean;
  confidence: 'no-face' | 'neutral' | 'slight-smile' | 'clear-smile';
  faceDetected: boolean;
  expressions?: {
    happy: number;
    neutral: number;
    sad: number;
    angry: number;
    surprised: number;
  };
}> {
  try {
    // Check if face-api is available
    if (!faceapi) {
      console.warn('⚠️ Face detection disabled, returning default smile score');
      return {
        score: 50,
        hasSmile: false,
        confidence: 'no-face',
        faceDetected: false,
      };
    }

    // Ensure models are loaded
    await loadModels();

    // Convert buffer to canvas image
    const img = await canvas.loadImage(imageBuffer);
    
    // Detect faces with expressions
    const detections = await faceapi
      .detectAllFaces(img as any, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions();

    if (!detections || detections.length === 0) {
      console.log('No face detected in image');
      return {
        score: 0,
        hasSmile: false,
        confidence: 'no-face',
        faceDetected: false,
      };
    }

    // Use the first (most prominent) face
    const detection = detections[0];
    const expressions = detection.expressions;

    // Calculate smile score based on happiness expression
    const happyScore = expressions.happy * 100;
    
    // Combine expressions for a more nuanced smile score
    // Happy contributes positively, neutral is baseline, sad/angry reduce score
    let smileScore = happyScore;
    smileScore -= expressions.sad * 20;
    smileScore -= expressions.angry * 20;
    smileScore += expressions.surprised * 10; // Slight positive
    
    smileScore = Math.max(0, Math.min(100, smileScore));

    let confidence: 'no-face' | 'neutral' | 'slight-smile' | 'clear-smile';
    if (smileScore >= 60) confidence = 'clear-smile';
    else if (smileScore >= 30) confidence = 'slight-smile';
    else confidence = 'neutral';

    console.log(`Smile detection completed: score=${smileScore}, confidence=${confidence}`);
    
    return {
      score: Math.round(smileScore),
      hasSmile: smileScore >= 30,
      confidence,
      faceDetected: true,
      expressions: {
        happy: Math.round(expressions.happy * 100),
        neutral: Math.round(expressions.neutral * 100),
        sad: Math.round(expressions.sad * 100),
        angry: Math.round(expressions.angry * 100),
        surprised: Math.round(expressions.surprised * 100),
      },
    };
  } catch (error) {
    console.error('⚠️  Error in smile detection, using fallback:', error);
    // Return safe default instead of throwing - don't let smile detection block the entire analysis
    return {
      score: 50,
      hasSmile: false,
      confidence: 'neutral',
      faceDetected: false,
      expressions: {
        happy: 0,
        neutral: 100,
        sad: 0,
        angry: 0,
        surprised: 0,
      },
    };
  }
}

/**
 * Comprehensive image analysis combining all detection methods
 */
export async function analyzeImage(imageBuffer: Buffer): Promise<{
  blur: Awaited<ReturnType<typeof detectBlur>>;
  lighting: Awaited<ReturnType<typeof analyzeLighting>>;
  smile: Awaited<ReturnType<typeof detectSmile>>;
  overallScore: number;
  warnings: string[];
}> {
  try {
    console.log('Starting image analysis...');
    
    // Run blur and lighting first (these are fast and reliable)
    const [blur, lighting] = await Promise.all([
      detectBlur(imageBuffer),
      analyzeLighting(imageBuffer),
    ]);
    
    console.log(`Blur score: ${blur.score}, Lighting score: ${lighting.score}`);
    
    // Run smile detection separately with its own error handling
    let smile: Awaited<ReturnType<typeof detectSmile>>;
    try {
      smile = await detectSmile(imageBuffer);
      console.log(`Smile score: ${smile.score}`);
    } catch (smileError) {
      console.error('Smile detection failed, using fallback:', smileError);
      smile = {
        score: 50,
        hasSmile: false,
        confidence: 'neutral',
        faceDetected: false,
        expressions: {
          happy: 0,
          neutral: 100,
          sad: 0,
          angry: 0,
          surprised: 0,
        },
      };
    }

    // Calculate overall quality score (weighted average)
    const overallScore = Math.round(
      (blur.score * 0.35) + // Blur is very important (35%)
      (lighting.score * 0.35) + // Lighting is very important (35%)
      (smile.score * 0.30) // Smile presence is important but not critical (30%)
    );

    console.log(`Overall score: ${overallScore}`);

    // Compile warnings
    const warnings: string[] = [];
    
    if (blur.isBlurry) {
      warnings.push(`Image is ${blur.severity}: Consider using a sharper photo`);
    }
    
    if (!lighting.isGoodLighting) {
      warnings.push(...lighting.issues);
    }
    
    if (!smile.faceDetected) {
      warnings.push('No face detected in image');
    } else if (!smile.hasSmile) {
      warnings.push('Consider using a photo with a smile - profiles with smiling photos tend to perform better');
    }

    console.log('Image analysis completed successfully');

    return {
      blur,
      lighting,
      smile,
      overallScore,
      warnings,
    };
  } catch (error) {
    console.error('❌ Error in comprehensive image analysis:', error);
    throw error;
  }
}

/**
 * Validate image format and basic properties
 * Rejects improperly formatted images immediately
 */
export async function validateImageFormat(imageBuffer: Buffer): Promise<{
  valid: boolean;
  error?: string;
  metadata?: {
    format: string;
    width: number;
    height: number;
    size: number;
  };
}> {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    
    // Check if format is supported
    const supportedFormats = ['jpeg', 'jpg', 'png', 'webp'];
    if (!metadata.format || !supportedFormats.includes(metadata.format.toLowerCase())) {
      return {
        valid: false,
        error: `Unsupported image format: ${metadata.format}. Please use JPEG, PNG, or WebP.`,
      };
    }

    // Check minimum dimensions (at least 200x200)
    if (!metadata.width || !metadata.height || metadata.width < 200 || metadata.height < 200) {
      return {
        valid: false,
        error: 'Image too small. Minimum dimensions are 200x200 pixels.',
      };
    }

    // Check maximum dimensions (max 4000x4000)
    if (metadata.width > 4000 || metadata.height > 4000) {
      return {
        valid: false,
        error: 'Image too large. Maximum dimensions are 4000x4000 pixels.',
      };
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (imageBuffer.length > maxSize) {
      return {
        valid: false,
        error: 'Image file size exceeds 10MB limit.',
      };
    }

    return {
      valid: true,
      metadata: {
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        size: imageBuffer.length,
      },
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid or corrupted image file.',
    };
  }
}
