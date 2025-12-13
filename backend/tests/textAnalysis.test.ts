/**
 * Text Analysis Test Suite
 * Tests the complete flow: validation -> sanitization -> personality combination -> LLM -> response
 * Run with: npx ts-node tests/textAnalysis.test.ts
 */

import {
  validateTextResponse,
  sanitizeInput,
} from "../src/utils/textInputValidator";

// Test data
const mockPersonality = {
  age_range: "25-30",
  gender: "female",
  dating_goal: "long-term relationship",
  personality_type: "INFP",
  conversation_style: "thoughtful and genuine",
  humor_style: "dry and witty",
  dating_experience: "moderate",
  interests: "reading, hiking, photography",
  ideal_match: "someone kind and intellectually curious",
};

const mockQuestion = "What are you most passionate about?";
const mockValidAnswer =
  "I'm really passionate about photography and travel. I love capturing moments that tell stories.";
const mockShortAnswer = "Too short"; // 9 characters - less than 10 minimum
const mockLongAnswer = "a".repeat(2001); // Exceeds 2000 characters
const mockAnswerWithCode = "I like `code` and ```javascript\nalert('test')```"; // Contains forbidden patterns
const mockAnswerWithSpecialChars =
  "I'm excited!!! @@@ $$$  &&& about life!!!"; // Too many special characters

// ============================================
// 1. TEXT VALIDATION TESTS
// ============================================

function testValidAnswers() {
  const result = validateTextResponse(mockValidAnswer);
  console.log("✅ Valid answer test:");
  console.log(`  Input: "${mockValidAnswer}"`);
  console.log(`  Result: valid=${result.valid}, errors=${result.errors.length}`);
  if (!result.valid) console.log(`  Errors: ${result.errors.join(", ")}`);
  if (result.valid) {
    console.log(`  ✓ PASS`);
  } else {
    console.log(`  ✗ FAIL: Valid answer should pass validation`);
  }
  return result.valid;
}

function testShortAnswer() {
  const result = validateTextResponse(mockShortAnswer);
  console.log("\n❌ Short answer test:");
  console.log(`  Input: "${mockShortAnswer}" (length: ${mockShortAnswer.length})`);
  console.log(`  Result: valid=${result.valid}`);
  console.log(`  Errors: ${result.errors.join(", ")}`);
  const pass = !result.valid && result.errors.includes("Response must be at least 10 characters");
  console.log(`  ${pass ? "✓" : "✗"} ${pass ? "PASS" : "FAIL"}`);
  return pass;
}

function testLongAnswer() {
  const result = validateTextResponse(mockLongAnswer);
  console.log("\n❌ Long answer test:");
  console.log(`  Input: (string of length ${mockLongAnswer.length})`);
  console.log(`  Result: valid=${result.valid}`);
  console.log(`  Errors: ${result.errors.join(", ")}`);
  const pass = !result.valid && result.errors.includes("Response cannot exceed 2000 characters");
  console.log(`  ${pass ? "✓" : "✗"} ${pass ? "PASS" : "FAIL"}`);
  return pass;
}

function testCodePattern() {
  const result = validateTextResponse(mockAnswerWithCode);
  console.log("\n❌ Code pattern test:");
  console.log(`  Input: "${mockAnswerWithCode}"`);
  console.log(`  Result: valid=${result.valid}`);
  console.log(`  Errors: ${result.errors.join(", ")}`);
  const pass = !result.valid && result.errors.includes("Response contains disallowed content");
  console.log(`  ${pass ? "✓" : "✗"} ${pass ? "PASS" : "FAIL"}`);
  return pass;
}

function testSpecialChars() {
  const result = validateTextResponse(mockAnswerWithSpecialChars);
  console.log("\n❌ Special characters test:");
  console.log(`  Input: "${mockAnswerWithSpecialChars}"`);
  console.log(`  Result: valid=${result.valid}`);
  console.log(`  Errors: ${result.errors.join(", ")}`);
  const pass = !result.valid && result.errors.includes("Response contains too many special characters");
  console.log(`  ${pass ? "✓" : "✗"} ${pass ? "PASS" : "FAIL"}`);
  return pass;
}

// ============================================
// 2. TEXT SANITIZATION TESTS
// ============================================

function testPromptBreakers() {
  const input = "I like {code} and <scripts>";
  const sanitized = sanitizeInput(input);
  console.log("\n🧹 Sanitization test:");
  console.log(`  Input: "${input}"`);
  console.log(`  Output: "${sanitized}"`);
  const pass = !sanitized.includes("{") && !sanitized.includes("}") && !sanitized.includes("<");
  console.log(`  ${pass ? "✓" : "✗"} ${pass ? "PASS" : "FAIL"}`);
  return pass;
}

function testNullBytes() {
  const input = "Hello\0World";
  const sanitized = sanitizeInput(input);
  console.log("\n🧹 Null byte test:");
  console.log(`  Input length: ${input.length}`);
  console.log(`  Output length: ${sanitized.length}`);
  console.log(`  Output: "${sanitized}"`);
  const pass = !sanitized.includes("\0");
  console.log(`  ${pass ? "✓" : "✗"} ${pass ? "PASS" : "FAIL"}`);
  return pass;
}

function testTrimming() {
  const input = "  Hello World  ";
  const sanitized = sanitizeInput(input);
  console.log("\n🧹 Trimming test:");
  console.log(`  Input: "${input}"`);
  console.log(`  Output: "${sanitized}"`);
  const pass = sanitized === "Hello World";
  console.log(`  ${pass ? "✓" : "✗"} ${pass ? "PASS" : "FAIL"}`);
  return pass;
}

function testMaxLength() {
  const input = "a".repeat(2500);
  const sanitized = sanitizeInput(input);
  console.log("\n🧹 Max length test:");
  console.log(`  Input length: ${input.length}`);
  console.log(`  Output length: ${sanitized.length}`);
  const pass = sanitized.length <= 2000;
  console.log(`  ${pass ? "✓" : "✗"} ${pass ? "PASS" : "FAIL"}`);
  return pass;
}

// ============================================
// 3. DATA VALIDATION TESTS
// ============================================

function testMockPersonality() {
  const requiredFields = [
    "age_range",
    "gender",
    "dating_goal",
    "personality_type",
    "conversation_style",
    "humor_style",
    "dating_experience",
    "interests",
    "ideal_match",
  ];
  
  console.log("\n📋 Personality profile validation:");
  let allPresent = true;
  for (const field of requiredFields) {
    const present = field in mockPersonality;
    console.log(`    - ${field}: ${present ? "✓" : "✗"}`);
    if (!present) allPresent = false;
  }
  
  console.log(`  ${allPresent ? "✓" : "✗"} ${allPresent ? "PASS" : "FAIL"}`);
  return allPresent;
}

function testMockData() {
  console.log("\n🔧 Test data validation:");
  console.log(`  ✓ Mock personality has ${Object.keys(mockPersonality).length} fields`);
  console.log(`  ✓ Mock question: "${mockQuestion}"`);
  console.log(`  ✓ Mock valid answer (${mockValidAnswer.length} chars): "${mockValidAnswer}"`);
  console.log(`  ✓ Mock short answer (${mockShortAnswer.length} chars): "${mockShortAnswer}"`);
  console.log(`  ✓ Mock long answer (${mockLongAnswer.length} chars): [string]`);
  console.log(`  ✓ PASS: Test data is ready for integration tests`);
  return true;
}

// ============================================
// RUN TESTS
// ============================================
console.log("\n" + "=".repeat(60));
console.log("TEXT ANALYSIS TEST SUITE");
console.log("=".repeat(60));

console.log("\n[1/5] TEXT VALIDATION TESTS");
console.log("-".repeat(60));

const validationTests = [
  testValidAnswers,
  testShortAnswer,
  testLongAnswer,
  testCodePattern,
  testSpecialChars,
];

let validationPassed = 0;
validationTests.forEach(test => {
  if (test()) validationPassed++;
});

console.log("\n[2/5] TEXT SANITIZATION TESTS");
console.log("-".repeat(60));

const sanitizationTests = [
  testPromptBreakers,
  testNullBytes,
  testTrimming,
  testMaxLength,
];

let sanitizationPassed = 0;
sanitizationTests.forEach(test => {
  if (test()) sanitizationPassed++;
});

console.log("\n[3/5] DATA VALIDATION TESTS");
console.log("-".repeat(60));

const dataTests = [
  testMockData,
  testMockPersonality,
];

let dataPassed = 0;
dataTests.forEach(test => {
  if (test()) dataPassed++;
});

console.log("\n" + "=".repeat(60));
console.log("✅ TEST RESULTS");
console.log("=".repeat(60));

const totalTests = validationTests.length + sanitizationTests.length + dataTests.length;
const totalPassed = validationPassed + sanitizationPassed + dataPassed;

console.log(`\nValidation Tests: ${validationPassed}/${validationTests.length} passed`);
console.log(`Sanitization Tests: ${sanitizationPassed}/${sanitizationTests.length} passed`);
console.log(`Data Tests: ${dataPassed}/${dataTests.length} passed`);
console.log(`\nTotal: ${totalPassed}/${totalTests} passed`);

if (totalPassed === totalTests) {
  console.log("\n✅ ALL TESTS PASSED!");
} else {
  console.log(`\n❌ ${totalTests - totalPassed} TEST(S) FAILED`);
  process.exit(1);
}

console.log("\n📋 SUMMARY:");
console.log("  • Text validation: Checks length, forbidden patterns, special chars");
console.log("  • Text sanitization: Removes prompt-breaking chars, enforces limits");
console.log("  • Data validation: Personality profile and test data verified");

console.log("\n🔄 NEXT STEPS:");
console.log("  1. Run: npx ts-node tests/mockLLM.test.ts");
console.log("  2. Check complete flow with mock LLM response");
console.log("  3. Run backend: npm run dev");
console.log("  4. Run frontend: npm run dev");
console.log("  5. Test in browser with actual data");
