import { test, expect, APIRequestContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Playwright E2E Test Suite for Image Analysis API
 * 
 * Tests the image analysis endpoints:
 * - POST /api/test/analyze - Full analysis
 * - POST /api/test/blur - Sharpness detection
 * - POST /api/test/lighting - Brightness analysis
 * - POST /api/test/smile - Smile detection
 * 
 * Prerequisites:
 * - Backend server must be running on localhost:3001
 * - Test images must exist in uploads/profile-photos/
 */

const API_BASE_URL = 'http://localhost:3001/api/test';

// Test image directory
const TEST_IMAGES_DIR = path.resolve(__dirname, '../uploads/profile-photos/PKdwrdzAU9NH59Aa9MafgjrOVRX2');

// Test images
const TEST_IMAGES = {
  smilingWoman: '1765581283833_2_smiling-woman_W6GFOSFAXA.jpg',
  portrait1: '1765581283828_0_gettyimages-1490616219-612x612.jpg',
  portrait2: '1765581283831_1_istockphoto-1587604256-612x612.jpg',
};

// Helper to get image path
function getImagePath(filename: string): string {
  return path.join(TEST_IMAGES_DIR, filename);
}

// Helper to upload image and get response
async function uploadImage(request: APIRequestContext, endpoint: string, imagePath: string) {
  const imageBuffer = fs.readFileSync(imagePath);
  const filename = path.basename(imagePath);
  
  return request.post(`${API_BASE_URL}${endpoint}`, {
    multipart: {
      image: {
        name: filename,
        mimeType: 'image/jpeg',
        buffer: imageBuffer,
      },
    },
  });
}

// ============================================
// HEALTH CHECK TESTS
// ============================================

test.describe('API Health Check', () => {
  test('health endpoint should respond', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/health`);
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.endpoints).toBeDefined();
    expect(Array.isArray(data.endpoints)).toBeTruthy();
  });

  test('test images should exist', async () => {
    for (const [name, filename] of Object.entries(TEST_IMAGES)) {
      const imagePath = getImagePath(filename);
      const exists = fs.existsSync(imagePath);
      expect(exists, `Test image ${name} (${filename}) should exist`).toBeTruthy();
    }
  });
});

// ============================================
// SHARPNESS DETECTION TESTS (detectBlur)
// ============================================

test.describe('Sharpness Detection (POST /api/test/blur)', () => {
  
  test('should return valid blur analysis structure', async ({ request }) => {
    const imagePath = getImagePath(TEST_IMAGES.smilingWoman);
    const response = await uploadImage(request, '/blur', imagePath);
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.success).toBeTruthy();
    expect(data.blur).toBeDefined();
    expect(data.blur.score).toBeDefined();
    expect(data.blur.isBlurry).toBeDefined();
    expect(data.blur.severity).toBeDefined();
  });

  test('blur score should be between 0-100', async ({ request }) => {
    const imagePath = getImagePath(TEST_IMAGES.smilingWoman);
    const response = await uploadImage(request, '/blur', imagePath);
    const data = await response.json();
    
    expect(data.blur.score).toBeGreaterThanOrEqual(0);
    expect(data.blur.score).toBeLessThanOrEqual(100);
  });

  test('severity should be valid value', async ({ request }) => {
    const imagePath = getImagePath(TEST_IMAGES.smilingWoman);
    const response = await uploadImage(request, '/blur', imagePath);
    const data = await response.json();
    
    expect(['sharp', 'slight-blur', 'blurry', 'very-blurry']).toContain(data.blur.severity);
  });

  test('isBlurry should be boolean', async ({ request }) => {
    const imagePath = getImagePath(TEST_IMAGES.smilingWoman);
    const response = await uploadImage(request, '/blur', imagePath);
    const data = await response.json();
    
    expect(typeof data.blur.isBlurry).toBe('boolean');
  });

  test('severity should correlate with score', async ({ request }) => {
    const imagePath = getImagePath(TEST_IMAGES.smilingWoman);
    const response = await uploadImage(request, '/blur', imagePath);
    const data = await response.json();
    
    const { score, severity, isBlurry } = data.blur;
    
    if (score >= 50) {
      expect(severity).toBe('sharp');
      expect(isBlurry).toBe(false);
    } else if (score >= 30) {
      expect(severity).toBe('slight-blur');
      expect(isBlurry).toBe(false);
    } else if (score >= 15) {
      expect(severity).toBe('blurry');
      expect(isBlurry).toBe(true);
    } else {
      expect(severity).toBe('very-blurry');
      expect(isBlurry).toBe(true);
    }
  });

  test('should produce consistent results for same image', async ({ request }) => {
    const imagePath = getImagePath(TEST_IMAGES.smilingWoman);
    
    const response1 = await uploadImage(request, '/blur', imagePath);
    const response2 = await uploadImage(request, '/blur', imagePath);
    
    const data1 = await response1.json();
    const data2 = await response2.json();
    
    expect(data1.blur.score).toBe(data2.blur.score);
    expect(data1.blur.severity).toBe(data2.blur.severity);
  });

  test('should analyze multiple different images', async ({ request }) => {
    for (const [name, filename] of Object.entries(TEST_IMAGES)) {
      const imagePath = getImagePath(filename);
      const response = await uploadImage(request, '/blur', imagePath);
      
      expect(response.ok(), `${name} should return successful response`).toBeTruthy();
      
      const data = await response.json();
      expect(data.blur.score).toBeGreaterThanOrEqual(0);
      expect(data.blur.score).toBeLessThanOrEqual(100);
    }
  });

  test('should return error for missing image', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/blur`);
    
    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });
});

// ============================================
// BRIGHTNESS ANALYSIS TESTS (analyzeLighting)
// ============================================

test.describe('Brightness Analysis (POST /api/test/lighting)', () => {
  
  test('should return valid lighting analysis structure', async ({ request }) => {
    const imagePath = getImagePath(TEST_IMAGES.smilingWoman);
    const response = await uploadImage(request, '/lighting', imagePath);
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.success).toBeTruthy();
    expect(data.lighting).toBeDefined();
    expect(data.lighting.score).toBeDefined();
    expect(data.lighting.isGoodLighting).toBeDefined();
    expect(data.lighting.issues).toBeDefined();
    expect(data.lighting.brightness).toBeDefined();
    expect(data.lighting.contrast).toBeDefined();
  });

  test('lighting score should be between 0-100', async ({ request }) => {
    const imagePath = getImagePath(TEST_IMAGES.smilingWoman);
    const response = await uploadImage(request, '/lighting', imagePath);
    const data = await response.json();
    
    expect(data.lighting.score).toBeGreaterThanOrEqual(0);
    expect(data.lighting.score).toBeLessThanOrEqual(100);
  });

  test('brightness should be between 0-100', async ({ request }) => {
    const imagePath = getImagePath(TEST_IMAGES.smilingWoman);
    const response = await uploadImage(request, '/lighting', imagePath);
    const data = await response.json();
    
    expect(data.lighting.brightness).toBeGreaterThanOrEqual(0);
    expect(data.lighting.brightness).toBeLessThanOrEqual(100);
  });

  test('contrast should be between 0-100', async ({ request }) => {
    const imagePath = getImagePath(TEST_IMAGES.smilingWoman);
    const response = await uploadImage(request, '/lighting', imagePath);
    const data = await response.json();
    
    expect(data.lighting.contrast).toBeGreaterThanOrEqual(0);
    expect(data.lighting.contrast).toBeLessThanOrEqual(100);
  });

  test('issues should be an array', async ({ request }) => {
    const imagePath = getImagePath(TEST_IMAGES.smilingWoman);
    const response = await uploadImage(request, '/lighting', imagePath);
    const data = await response.json();
    
    expect(Array.isArray(data.lighting.issues)).toBeTruthy();
  });

  test('isGoodLighting should match score threshold', async ({ request }) => {
    const imagePath = getImagePath(TEST_IMAGES.smilingWoman);
    const response = await uploadImage(request, '/lighting', imagePath);
    const data = await response.json();
    
    const expectedIsGood = data.lighting.score >= 50;
    expect(data.lighting.isGoodLighting).toBe(expectedIsGood);
  });

  test('should produce consistent results for same image', async ({ request }) => {
    const imagePath = getImagePath(TEST_IMAGES.smilingWoman);
    
    const response1 = await uploadImage(request, '/lighting', imagePath);
    const response2 = await uploadImage(request, '/lighting', imagePath);
    
    const data1 = await response1.json();
    const data2 = await response2.json();
    
    expect(data1.lighting.score).toBe(data2.lighting.score);
    expect(data1.lighting.brightness).toBe(data2.lighting.brightness);
    expect(data1.lighting.contrast).toBe(data2.lighting.contrast);
  });

  test('should analyze multiple different images', async ({ request }) => {
    for (const [name, filename] of Object.entries(TEST_IMAGES)) {
      const imagePath = getImagePath(filename);
      const response = await uploadImage(request, '/lighting', imagePath);
      
      expect(response.ok(), `${name} should return successful response`).toBeTruthy();
      
      const data = await response.json();
      expect(data.lighting.score).toBeGreaterThanOrEqual(0);
      expect(data.lighting.score).toBeLessThanOrEqual(100);
    }
  });
});

// ============================================
// SMILE DETECTION TESTS (detectSmile)
// ============================================

test.describe('Smile Detection (POST /api/test/smile)', () => {
  
  test('should return valid smile analysis structure', async ({ request }) => {
    const imagePath = getImagePath(TEST_IMAGES.smilingWoman);
    const response = await uploadImage(request, '/smile', imagePath);
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.success).toBeTruthy();
    expect(data.smile).toBeDefined();
    expect(data.smile.score).toBeDefined();
    expect(data.smile.hasSmile).toBeDefined();
    expect(data.smile.confidence).toBeDefined();
    expect(data.smile.faceDetected).toBeDefined();
  });

  test('smile score should be between 0-100', async ({ request }) => {
    const imagePath = getImagePath(TEST_IMAGES.smilingWoman);
    const response = await uploadImage(request, '/smile', imagePath);
    const data = await response.json();
    
    expect(data.smile.score).toBeGreaterThanOrEqual(0);
    expect(data.smile.score).toBeLessThanOrEqual(100);
  });

  test('confidence should be valid value', async ({ request }) => {
    const imagePath = getImagePath(TEST_IMAGES.smilingWoman);
    const response = await uploadImage(request, '/smile', imagePath);
    const data = await response.json();
    
    expect(['no-face', 'neutral', 'slight-smile', 'clear-smile']).toContain(data.smile.confidence);
  });

  test('hasSmile and faceDetected should be booleans', async ({ request }) => {
    const imagePath = getImagePath(TEST_IMAGES.smilingWoman);
    const response = await uploadImage(request, '/smile', imagePath);
    const data = await response.json();
    
    expect(typeof data.smile.hasSmile).toBe('boolean');
    expect(typeof data.smile.faceDetected).toBe('boolean');
  });

  test('should return expressions when face detected', async ({ request }) => {
    const imagePath = getImagePath(TEST_IMAGES.smilingWoman);
    const response = await uploadImage(request, '/smile', imagePath);
    const data = await response.json();
    
    if (data.smile.faceDetected && data.smile.expressions) {
      expect(data.smile.expressions.happy).toBeDefined();
      expect(data.smile.expressions.neutral).toBeDefined();
      expect(data.smile.expressions.sad).toBeDefined();
      expect(data.smile.expressions.angry).toBeDefined();
      expect(data.smile.expressions.surprised).toBeDefined();
      
      // Expression values should be 0-100
      expect(data.smile.expressions.happy).toBeGreaterThanOrEqual(0);
      expect(data.smile.expressions.happy).toBeLessThanOrEqual(100);
    }
  });

  test('hasSmile should match score threshold', async ({ request }) => {
    const imagePath = getImagePath(TEST_IMAGES.smilingWoman);
    const response = await uploadImage(request, '/smile', imagePath);
    const data = await response.json();
    
    const expectedHasSmile = data.smile.score >= 45;
    expect(data.smile.hasSmile).toBe(expectedHasSmile);
  });

  test('confidence should correlate with score', async ({ request }) => {
    const imagePath = getImagePath(TEST_IMAGES.smilingWoman);
    const response = await uploadImage(request, '/smile', imagePath);
    const data = await response.json();
    
    if (data.smile.score >= 70) {
      expect(data.smile.confidence).toBe('clear-smile');
    } else if (data.smile.score >= 45) {
      expect(['slight-smile', 'clear-smile']).toContain(data.smile.confidence);
    }
  });

  test('smile detection should be reasonably consistent', async ({ request }) => {
    const imagePath = getImagePath(TEST_IMAGES.smilingWoman);
    
    const response1 = await uploadImage(request, '/smile', imagePath);
    const response2 = await uploadImage(request, '/smile', imagePath);
    
    const data1 = await response1.json();
    const data2 = await response2.json();
    
    // ML models can have small variations, allow ±5 points
    const scoreDiff = Math.abs(data1.smile.score - data2.smile.score);
    expect(scoreDiff).toBeLessThanOrEqual(5);
  });

  test('should analyze multiple different images', async ({ request }) => {
    for (const [name, filename] of Object.entries(TEST_IMAGES)) {
      const imagePath = getImagePath(filename);
      const response = await uploadImage(request, '/smile', imagePath);
      
      expect(response.ok(), `${name} should return successful response`).toBeTruthy();
      
      const data = await response.json();
      expect(data.smile.score).toBeGreaterThanOrEqual(0);
      expect(data.smile.score).toBeLessThanOrEqual(100);
    }
  });
});

// ============================================
// COMPREHENSIVE ANALYSIS TESTS (analyzeImage)
// ============================================

test.describe('Full Analysis (POST /api/test/analyze)', () => {
  
  test('should return complete analysis structure', async ({ request }) => {
    const imagePath = getImagePath(TEST_IMAGES.smilingWoman);
    const response = await uploadImage(request, '/analyze', imagePath);
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.success).toBeTruthy();
    expect(data.blur).toBeDefined();
    expect(data.lighting).toBeDefined();
    expect(data.smile).toBeDefined();
    expect(data.overallScore).toBeDefined();
    expect(data.warnings).toBeDefined();
  });

  test('overall score should be between 0-100', async ({ request }) => {
    const imagePath = getImagePath(TEST_IMAGES.smilingWoman);
    const response = await uploadImage(request, '/analyze', imagePath);
    const data = await response.json();
    
    expect(data.overallScore).toBeGreaterThanOrEqual(0);
    expect(data.overallScore).toBeLessThanOrEqual(100);
  });

  test('overall score should be weighted average of components', async ({ request }) => {
    const imagePath = getImagePath(TEST_IMAGES.smilingWoman);
    const response = await uploadImage(request, '/analyze', imagePath);
    const data = await response.json();
    
    // Weights: blur=0.35, lighting=0.35, smile=0.30
    const expectedScore = Math.round(
      (data.blur.score * 0.35) +
      (data.lighting.score * 0.35) +
      (data.smile.score * 0.30)
    );
    
    // Allow for rounding differences
    expect(Math.abs(data.overallScore - expectedScore)).toBeLessThanOrEqual(2);
  });

  test('warnings should be an array of strings', async ({ request }) => {
    const imagePath = getImagePath(TEST_IMAGES.smilingWoman);
    const response = await uploadImage(request, '/analyze', imagePath);
    const data = await response.json();
    
    expect(Array.isArray(data.warnings)).toBeTruthy();
    for (const warning of data.warnings) {
      expect(typeof warning).toBe('string');
    }
  });

  test('should return file metadata', async ({ request }) => {
    const imagePath = getImagePath(TEST_IMAGES.smilingWoman);
    const response = await uploadImage(request, '/analyze', imagePath);
    const data = await response.json();
    
    expect(data.filename).toBeDefined();
    expect(data.fileSize).toBeDefined();
    expect(data.mimeType).toBeDefined();
  });

  test('should analyze all test images successfully', async ({ request }) => {
    for (const [name, filename] of Object.entries(TEST_IMAGES)) {
      const imagePath = getImagePath(filename);
      const response = await uploadImage(request, '/analyze', imagePath);
      
      expect(response.ok(), `${name} should return successful response`).toBeTruthy();
      
      const data = await response.json();
      expect(data.overallScore).toBeGreaterThanOrEqual(0);
      expect(data.overallScore).toBeLessThanOrEqual(100);
      
      console.log(`${name}: overall=${data.overallScore}, blur=${data.blur.score}, lighting=${data.lighting.score}, smile=${data.smile.score}`);
    }
  });
});

// ============================================
// ERROR HANDLING TESTS
// ============================================

test.describe('Error Handling', () => {
  
  test('should return 400 for missing image on /blur', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/blur`);
    expect(response.status()).toBe(400);
  });

  test('should return 400 for missing image on /lighting', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/lighting`);
    expect(response.status()).toBe(400);
  });

  test('should return 400 for missing image on /smile', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/smile`);
    expect(response.status()).toBe(400);
  });

  test('should return 400 for missing image on /analyze', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/analyze`);
    expect(response.status()).toBe(400);
  });

  test('should handle invalid image data gracefully', async ({ request }) => {
    const invalidBuffer = Buffer.from('not a valid image data');
    
    const response = await request.post(`${API_BASE_URL}/analyze`, {
      multipart: {
        image: {
          name: 'invalid.jpg',
          mimeType: 'image/jpeg',
          buffer: invalidBuffer,
        },
      },
    });
    
    // Should return error but not crash
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});
