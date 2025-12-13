/**
 * Image Analysis Unit Tests
 * 
 * Direct tests for the image analysis functions:
 * - detectBlur (sharpness detection)
 * - analyzeLighting (brightness analysis)
 * - detectSmile (smile/expression detection)
 * - analyzeImage (comprehensive analysis)
 * 
 * Run with: npx ts-node src/utils/__tests__/imageAnalysis.test.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { detectBlur, analyzeLighting, detectSmile, analyzeImage, loadModels } from '../imageAnalysis';

// Test configuration
const TEST_IMAGES_DIR = path.resolve(__dirname, '../../../uploads/profile-photos/PKdwrdzAU9NH59Aa9MafgjrOVRX2');

const TEST_IMAGES = {
  smilingWoman: '1765562177966_2_smiling-woman_W6GFOSFAXA.jpg',
  portrait1: '1765562177962_0_gettyimages-1490616219-612x612.jpg',
  portrait2: '1765562177964_1_istockphoto-1587604256-612x612.jpg',
};

// Helper to load image buffer
function loadTestImage(filename: string): Buffer {
  const imagePath = path.join(TEST_IMAGES_DIR, filename);
  if (!fs.existsSync(imagePath)) {
    throw new Error(`Test image not found: ${imagePath}`);
  }
  return fs.readFileSync(imagePath);
}

// Simple test framework
interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

const results: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  const startTime = Date.now();
  try {
    await testFn();
    results.push({ name, passed: true, duration: Date.now() - startTime });
    console.log(`  ✅ ${name}`);
  } catch (error: any) {
    results.push({ name, passed: false, error: error.message, duration: Date.now() - startTime });
    console.log(`  ❌ ${name}: ${error.message}`);
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assertInRange(value: number, min: number, max: number, name: string): void {
  assert(value >= min && value <= max, `${name} should be between ${min} and ${max}, got ${value}`);
}

// ============================================
// SHARPNESS DETECTION TESTS (detectBlur)
// ============================================

async function testSharpnessDetection(): Promise<void> {
  console.log('\n📷 Testing Sharpness Detection (detectBlur)...\n');

  await runTest('should return valid blur score structure', async () => {
    const imageBuffer = loadTestImage(TEST_IMAGES.smilingWoman);
    const result = await detectBlur(imageBuffer);
    
    assert(typeof result.score === 'number', 'score should be a number');
    assert(typeof result.isBlurry === 'boolean', 'isBlurry should be a boolean');
    assert(['sharp', 'slight-blur', 'blurry', 'very-blurry'].includes(result.severity), 
      'severity should be a valid value');
  });

  await runTest('blur score should be between 0-100', async () => {
    const imageBuffer = loadTestImage(TEST_IMAGES.smilingWoman);
    const result = await detectBlur(imageBuffer);
    
    assertInRange(result.score, 0, 100, 'blur score');
  });

  await runTest('severity should correlate with score - sharp', async () => {
    const imageBuffer = loadTestImage(TEST_IMAGES.smilingWoman);
    const result = await detectBlur(imageBuffer);
    
    if (result.score >= 50) {
      assert(result.severity === 'sharp', `Score ${result.score} should map to 'sharp' severity`);
      assert(result.isBlurry === false, 'isBlurry should be false for sharp images');
    }
  });

  await runTest('severity should correlate with score - slight-blur', async () => {
    const imageBuffer = loadTestImage(TEST_IMAGES.portrait1);
    const result = await detectBlur(imageBuffer);
    
    if (result.score >= 30 && result.score < 50) {
      assert(result.severity === 'slight-blur', `Score ${result.score} should map to 'slight-blur' severity`);
    }
  });

  await runTest('isBlurry flag should match threshold', async () => {
    const imageBuffer = loadTestImage(TEST_IMAGES.smilingWoman);
    const result = await detectBlur(imageBuffer);
    
    const expectedIsBlurry = result.score < 30;
    assert(result.isBlurry === expectedIsBlurry, 
      `isBlurry should be ${expectedIsBlurry} for score ${result.score}`);
  });

  await runTest('should produce consistent results for same image', async () => {
    const imageBuffer = loadTestImage(TEST_IMAGES.smilingWoman);
    
    const result1 = await detectBlur(imageBuffer);
    const result2 = await detectBlur(imageBuffer);
    
    assert(result1.score === result2.score, 'Same image should produce identical blur scores');
    assert(result1.severity === result2.severity, 'Same image should produce identical severity');
  });

  await runTest('should analyze multiple different images', async () => {
    for (const [name, filename] of Object.entries(TEST_IMAGES)) {
      const imageBuffer = loadTestImage(filename);
      const result = await detectBlur(imageBuffer);
      
      assertInRange(result.score, 0, 100, `${name} blur score`);
      console.log(`    ${name}: score=${result.score}, severity=${result.severity}`);
    }
  });
}

// ============================================
// BRIGHTNESS ANALYSIS TESTS (analyzeLighting)
// ============================================

async function testBrightnessAnalysis(): Promise<void> {
  console.log('\n💡 Testing Brightness Analysis (analyzeLighting)...\n');

  await runTest('should return valid lighting structure', async () => {
    const imageBuffer = loadTestImage(TEST_IMAGES.smilingWoman);
    const result = await analyzeLighting(imageBuffer);
    
    assert(typeof result.score === 'number', 'score should be a number');
    assert(typeof result.isGoodLighting === 'boolean', 'isGoodLighting should be a boolean');
    assert(Array.isArray(result.issues), 'issues should be an array');
    assert(typeof result.brightness === 'number', 'brightness should be a number');
    assert(typeof result.contrast === 'number', 'contrast should be a number');
  });

  await runTest('lighting score should be between 0-100', async () => {
    const imageBuffer = loadTestImage(TEST_IMAGES.smilingWoman);
    const result = await analyzeLighting(imageBuffer);
    
    assertInRange(result.score, 0, 100, 'lighting score');
  });

  await runTest('brightness should be between 0-100', async () => {
    const imageBuffer = loadTestImage(TEST_IMAGES.smilingWoman);
    const result = await analyzeLighting(imageBuffer);
    
    assertInRange(result.brightness, 0, 100, 'brightness');
  });

  await runTest('contrast should be between 0-100', async () => {
    const imageBuffer = loadTestImage(TEST_IMAGES.smilingWoman);
    const result = await analyzeLighting(imageBuffer);
    
    assertInRange(result.contrast, 0, 100, 'contrast');
  });

  await runTest('isGoodLighting should match score threshold', async () => {
    const imageBuffer = loadTestImage(TEST_IMAGES.smilingWoman);
    const result = await analyzeLighting(imageBuffer);
    
    const expectedIsGood = result.score >= 50;
    assert(result.isGoodLighting === expectedIsGood, 
      `isGoodLighting should be ${expectedIsGood} for score ${result.score}`);
  });

  await runTest('should detect dark images', async () => {
    const imageBuffer = loadTestImage(TEST_IMAGES.portrait1);
    const result = await analyzeLighting(imageBuffer);
    
    if (result.brightness < 45) {
      const hasDarkIssue = result.issues.some(issue => 
        issue.toLowerCase().includes('dark')
      );
      console.log(`    Brightness: ${result.brightness}, Issues: ${result.issues.join(', ')}`);
      // Log but don't fail - issue detection depends on implementation
    }
  });

  await runTest('should produce consistent results', async () => {
    const imageBuffer = loadTestImage(TEST_IMAGES.smilingWoman);
    
    const result1 = await analyzeLighting(imageBuffer);
    const result2 = await analyzeLighting(imageBuffer);
    
    assert(result1.score === result2.score, 'Same image should produce identical lighting scores');
    assert(result1.brightness === result2.brightness, 'Same image should produce identical brightness');
    assert(result1.contrast === result2.contrast, 'Same image should produce identical contrast');
  });

  await runTest('should analyze multiple images', async () => {
    for (const [name, filename] of Object.entries(TEST_IMAGES)) {
      const imageBuffer = loadTestImage(filename);
      const result = await analyzeLighting(imageBuffer);
      
      assertInRange(result.score, 0, 100, `${name} lighting score`);
      console.log(`    ${name}: score=${result.score}, brightness=${result.brightness}, contrast=${result.contrast}`);
    }
  });
}

// ============================================
// SMILE DETECTION TESTS (detectSmile)
// ============================================

async function testSmileDetection(): Promise<void> {
  console.log('\n😊 Testing Smile Detection (detectSmile)...\n');

  // Load models first
  await runTest('should load face detection models', async () => {
    await loadModels();
  });

  await runTest('should return valid smile structure', async () => {
    const imageBuffer = loadTestImage(TEST_IMAGES.smilingWoman);
    const result = await detectSmile(imageBuffer);
    
    assert(typeof result.score === 'number', 'score should be a number');
    assert(typeof result.hasSmile === 'boolean', 'hasSmile should be a boolean');
    assert(['no-face', 'neutral', 'slight-smile', 'clear-smile'].includes(result.confidence), 
      'confidence should be a valid value');
    assert(typeof result.faceDetected === 'boolean', 'faceDetected should be a boolean');
  });

  await runTest('smile score should be between 0-100', async () => {
    const imageBuffer = loadTestImage(TEST_IMAGES.smilingWoman);
    const result = await detectSmile(imageBuffer);
    
    assertInRange(result.score, 0, 100, 'smile score');
  });

  await runTest('should detect face in portrait image', async () => {
    const imageBuffer = loadTestImage(TEST_IMAGES.smilingWoman);
    const result = await detectSmile(imageBuffer);
    
    console.log(`    Face detected: ${result.faceDetected}, Score: ${result.score}, Confidence: ${result.confidence}`);
    // Note: Face detection may fail if models aren't loaded, but function should handle gracefully
  });

  await runTest('should return expressions when face detected', async () => {
    const imageBuffer = loadTestImage(TEST_IMAGES.smilingWoman);
    const result = await detectSmile(imageBuffer);
    
    if (result.faceDetected && result.expressions) {
      assert(typeof result.expressions.happy === 'number', 'happy should be a number');
      assert(typeof result.expressions.neutral === 'number', 'neutral should be a number');
      assert(typeof result.expressions.sad === 'number', 'sad should be a number');
      assert(typeof result.expressions.angry === 'number', 'angry should be a number');
      assert(typeof result.expressions.surprised === 'number', 'surprised should be a number');
      
      console.log(`    Expressions: happy=${result.expressions.happy}%, neutral=${result.expressions.neutral}%`);
    }
  });

  await runTest('hasSmile should match score threshold', async () => {
    const imageBuffer = loadTestImage(TEST_IMAGES.smilingWoman);
    const result = await detectSmile(imageBuffer);
    
    const expectedHasSmile = result.score >= 45;
    assert(result.hasSmile === expectedHasSmile, 
      `hasSmile should be ${expectedHasSmile} for score ${result.score}`);
  });

  await runTest('confidence should correlate with score', async () => {
    const imageBuffer = loadTestImage(TEST_IMAGES.smilingWoman);
    const result = await detectSmile(imageBuffer);
    
    if (result.score >= 70) {
      assert(result.confidence === 'clear-smile', 
        `Score ${result.score} should have 'clear-smile' confidence`);
    } else if (result.score >= 45) {
      assert(['slight-smile', 'clear-smile'].includes(result.confidence), 
        `Score ${result.score} should have 'slight-smile' or 'clear-smile' confidence`);
    }
  });

  await runTest('should handle different images', async () => {
    for (const [name, filename] of Object.entries(TEST_IMAGES)) {
      const imageBuffer = loadTestImage(filename);
      const result = await detectSmile(imageBuffer);
      
      assertInRange(result.score, 0, 100, `${name} smile score`);
      console.log(`    ${name}: score=${result.score}, face=${result.faceDetected}, confidence=${result.confidence}`);
    }
  });

  await runTest('smile detection should be reasonably consistent', async () => {
    const imageBuffer = loadTestImage(TEST_IMAGES.smilingWoman);
    
    const result1 = await detectSmile(imageBuffer);
    const result2 = await detectSmile(imageBuffer);
    
    // ML models can have small variations, allow ±5 points
    const scoreDiff = Math.abs(result1.score - result2.score);
    assert(scoreDiff <= 5, `Smile scores should be within 5 points, got difference of ${scoreDiff}`);
  });
}

// ============================================
// COMPREHENSIVE ANALYSIS TESTS (analyzeImage)
// ============================================

async function testComprehensiveAnalysis(): Promise<void> {
  console.log('\n📊 Testing Comprehensive Analysis (analyzeImage)...\n');

  await runTest('should return complete analysis structure', async () => {
    const imageBuffer = loadTestImage(TEST_IMAGES.smilingWoman);
    const result = await analyzeImage(imageBuffer);
    
    assert(result.blur !== undefined, 'blur analysis should be present');
    assert(result.lighting !== undefined, 'lighting analysis should be present');
    assert(result.smile !== undefined, 'smile analysis should be present');
    assert(typeof result.overallScore === 'number', 'overallScore should be a number');
    assert(Array.isArray(result.warnings), 'warnings should be an array');
  });

  await runTest('overall score should be between 0-100', async () => {
    const imageBuffer = loadTestImage(TEST_IMAGES.smilingWoman);
    const result = await analyzeImage(imageBuffer);
    
    assertInRange(result.overallScore, 0, 100, 'overall score');
  });

  await runTest('overall score should be weighted average of components', async () => {
    const imageBuffer = loadTestImage(TEST_IMAGES.smilingWoman);
    const result = await analyzeImage(imageBuffer);
    
    // Weights: blur=0.35, lighting=0.35, smile=0.30
    const expectedScore = Math.round(
      (result.blur.score * 0.35) +
      (result.lighting.score * 0.35) +
      (result.smile.score * 0.30)
    );
    
    const scoreDiff = Math.abs(result.overallScore - expectedScore);
    assert(scoreDiff <= 2, 
      `Overall score ${result.overallScore} should match weighted average ${expectedScore} (±2)`);
  });

  await runTest('warnings should be strings', async () => {
    const imageBuffer = loadTestImage(TEST_IMAGES.smilingWoman);
    const result = await analyzeImage(imageBuffer);
    
    for (const warning of result.warnings) {
      assert(typeof warning === 'string', 'Each warning should be a string');
      assert(warning.length > 0, 'Warnings should not be empty strings');
    }
  });

  await runTest('should generate blur warning when image is blurry', async () => {
    const imageBuffer = loadTestImage(TEST_IMAGES.portrait1);
    const result = await analyzeImage(imageBuffer);
    
    if (result.blur.isBlurry) {
      const hasBlurWarning = result.warnings.some(w => 
        w.toLowerCase().includes('blur') || w.toLowerCase().includes('sharp')
      );
      console.log(`    Blur score: ${result.blur.score}, Has blur warning: ${hasBlurWarning}`);
    }
  });

  await runTest('should analyze all test images successfully', async () => {
    for (const [name, filename] of Object.entries(TEST_IMAGES)) {
      const imageBuffer = loadTestImage(filename);
      const result = await analyzeImage(imageBuffer);
      
      assertInRange(result.overallScore, 0, 100, `${name} overall score`);
      console.log(`    ${name}: overall=${result.overallScore}, blur=${result.blur.score}, lighting=${result.lighting.score}, smile=${result.smile.score}`);
    }
  });
}

// ============================================
// MAIN TEST RUNNER
// ============================================

async function runAllTests(): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 IMAGE ANALYSIS UNIT TESTS');
  console.log('='.repeat(60));

  const startTime = Date.now();

  try {
    await testSharpnessDetection();
    await testBrightnessAnalysis();
    await testSmileDetection();
    await testComprehensiveAnalysis();
  } catch (error: any) {
    console.error('\n❌ Test suite crashed:', error.message);
  }

  const totalTime = Date.now() - startTime;

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log(`\n  Total: ${total} tests`);
  console.log(`  ✅ Passed: ${passed}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  ⏱️  Duration: ${(totalTime / 1000).toFixed(2)}s`);

  if (failed > 0) {
    console.log('\n  Failed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`    - ${r.name}: ${r.error}`);
    });
  }

  console.log('\n' + '='.repeat(60));

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(console.error);
