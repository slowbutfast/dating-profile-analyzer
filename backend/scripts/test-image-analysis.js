/**
 * Test script for image analysis utilities
 * This script tests blur detection, lighting analysis, and smile detection
 * 
 * Usage: node scripts/test-image-analysis.js <path-to-test-image>
 */

const fs = require('fs');
const path = require('path');

// Import the compiled JS modules
const { 
  analyzeImage, 
  detectBlur, 
  analyzeLighting, 
  detectSmile, 
  validateImageFormat,
  loadModels 
} = require('../dist/utils/imageAnalysis');

async function testImageAnalysis(imagePath) {
  console.log('🧪 Testing Image Analysis\n');
  console.log(`📸 Image: ${imagePath}\n`);

  try {
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      console.error(`❌ Error: File not found at ${imagePath}`);
      process.exit(1);
    }

    // Read image
    const imageBuffer = fs.readFileSync(imagePath);
    console.log(`✅ Image loaded (${imageBuffer.length} bytes)\n`);

    // Test 1: Validate format
    console.log('📋 Test 1: Image Format Validation');
    console.log('─'.repeat(50));
    const validation = await validateImageFormat(imageBuffer);
    console.log('Valid:', validation.valid);
    if (validation.valid) {
      console.log('Format:', validation.metadata.format);
      console.log('Dimensions:', `${validation.metadata.width}x${validation.metadata.height}`);
      console.log('Size:', `${(validation.metadata.size / 1024).toFixed(2)} KB`);
    } else {
      console.log('Error:', validation.error);
      process.exit(1);
    }
    console.log('\n');

    // Load face detection models
    console.log('🔧 Loading face detection models...');
    await loadModels();
    console.log('✅ Models loaded\n');

    // Test 2: Blur detection
    console.log('🔍 Test 2: Blur Detection');
    console.log('─'.repeat(50));
    const blurResult = await detectBlur(imageBuffer);
    console.log('Blur Score:', blurResult.score, '/ 100');
    console.log('Is Blurry:', blurResult.isBlurry);
    console.log('Severity:', blurResult.severity);
    console.log('\n');

    // Test 3: Lighting analysis
    console.log('💡 Test 3: Lighting Analysis');
    console.log('─'.repeat(50));
    const lightingResult = await analyzeLighting(imageBuffer);
    console.log('Lighting Score:', lightingResult.score, '/ 100');
    console.log('Good Lighting:', lightingResult.isGoodLighting);
    console.log('Brightness:', lightingResult.brightness, '/ 100');
    console.log('Contrast:', lightingResult.contrast, '/ 100');
    if (lightingResult.issues.length > 0) {
      console.log('Issues:');
      lightingResult.issues.forEach(issue => console.log(`  - ${issue}`));
    } else {
      console.log('Issues: None');
    }
    console.log('\n');

    // Test 4: Smile detection
    console.log('😊 Test 4: Smile Detection');
    console.log('─'.repeat(50));
    const smileResult = await detectSmile(imageBuffer);
    console.log('Smile Score:', smileResult.score, '/ 100');
    console.log('Has Smile:', smileResult.hasSmile);
    console.log('Confidence:', smileResult.confidence);
    console.log('Face Detected:', smileResult.faceDetected);
    if (smileResult.expressions) {
      console.log('Expressions:');
      Object.entries(smileResult.expressions).forEach(([emotion, score]) => {
        console.log(`  ${emotion}: ${score}%`);
      });
    }
    console.log('\n');

    // Test 5: Comprehensive analysis
    console.log('🎯 Test 5: Comprehensive Analysis');
    console.log('─'.repeat(50));
    const fullAnalysis = await analyzeImage(imageBuffer);
    console.log('Overall Quality Score:', fullAnalysis.overallScore, '/ 100');
    console.log('\nWarnings:');
    if (fullAnalysis.warnings.length > 0) {
      fullAnalysis.warnings.forEach(warning => console.log(`  ⚠️  ${warning}`));
    } else {
      console.log('  ✅ No warnings - this is a high-quality image!');
    }
    console.log('\n');

    // Summary
    console.log('📊 Summary');
    console.log('─'.repeat(50));
    console.log(`Blur:     ${blurResult.score}/100 (${blurResult.severity})`);
    console.log(`Lighting: ${lightingResult.score}/100 (${lightingResult.isGoodLighting ? 'Good' : 'Poor'})`);
    console.log(`Smile:    ${smileResult.score}/100 (${smileResult.confidence})`);
    console.log(`Overall:  ${fullAnalysis.overallScore}/100`);
    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('\n❌ Error during testing:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: node scripts/test-image-analysis.js <path-to-image>');
  console.log('\nExample:');
  console.log('  node scripts/test-image-analysis.js ./test-images/portrait.jpg');
  process.exit(1);
}

const imagePath = path.resolve(args[0]);
testImageAnalysis(imagePath);
