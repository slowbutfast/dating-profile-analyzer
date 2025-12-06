import sharp from 'sharp';
import { Jimp } from 'jimp';
// import * as canvas from 'canvas'; // TensorFlow disabled
// import '@tensorflow/tfjs-backend-cpu'; // TensorFlow disabled
// import '@tensorflow/tfjs'; // TensorFlow disabled
// import * as faceapi from '@vladmandic/face-api'; // TensorFlow disabled
import path from 'path';
import fs from 'fs';

// Setup canvas for face-api (disabled)
// const { Canvas, Image, ImageData } = canvas;
// @ts-ignore
// faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

let modelsLoaded = false;

/**
 * Load face-api.js models (DISABLED - TensorFlow unavailable on Node 24)
 */
export async function loadModels(): Promise<void> {
  if (modelsLoaded) return;
  console.warn('⚠️  Face detection models disabled (TensorFlow unavailable on Node 24.x)');
  modelsLoaded = true;
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
 * Detect smile and facial expressions (DISABLED - TensorFlow unavailable on Node 24)
 * Returns placeholder data until a compatible ML solution is available
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
    console.warn('⚠️  Smile detection disabled (TensorFlow unavailable on Node 24.x)');
    
    // Return safe default values
    return {
      score: 50,
      hasSmile: true,
      confidence: 'neutral',
      faceDetected: false,
      expressions: {
        happy: 0,
        neutral: 0,
        sad: 0,
        angry: 0,
        surprised: 0,
      },
    };
  } catch (error) {
    console.error('Error in smile detection:', error);
    return {
      score: 50,
      hasSmile: false,
      confidence: 'neutral',
      faceDetected: false,
      expressions: {
        happy: 0,
        neutral: 0,
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
    // Run all analyses in parallel for better performance
    const [blur, lighting, smile] = await Promise.all([
      detectBlur(imageBuffer),
      analyzeLighting(imageBuffer),
      detectSmile(imageBuffer),
    ]);

    // Calculate overall quality score (weighted average)
    const overallScore = Math.round(
      (blur.score * 0.35) + // Blur is very important (35%)
      (lighting.score * 0.35) + // Lighting is very important (35%)
      (smile.score * 0.30) // Smile presence is important but not critical (30%)
    );

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

    return {
      blur,
      lighting,
      smile,
      overallScore,
      warnings,
    };
  } catch (error) {
    console.error('Error in comprehensive image analysis:', error);
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
