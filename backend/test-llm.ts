import { GoogleGenerativeAI } from "@google/generative-ai";
import { analyzeTextWithLLM, getFallbackAnalysis } from "./src/utils/llmAnalyzer";
import { analyzeTextStatistics } from "./src/utils/textMetrics";
import { validateTextResponse, sanitizeInput } from "./src/utils/textInputValidator";
import * as dotenv from "dotenv";

dotenv.config();

interface PersonalityProfile {
  age_range: string;
  gender: string;
  dating_goal: string;
  personality_type: string;
  conversation_style: string;
  humor_style: string;
  dating_experience: string;
  interests: string;
  ideal_match: string;
}

// Test data
const testPersonality: PersonalityProfile = {
  age_range: "25-29",
  gender: "Female",
  dating_goal: "Long-term relationship",
  personality_type: "Adventurous and spontaneous",
  conversation_style: "Deep and meaningful",
  humor_style: "Witty and clever",
  dating_experience: "Somewhat experienced",
  interests: "hiking, photography, cooking, travel",
  ideal_match: "Someone who loves nature and is intellectually curious",
};

const testResponses = [
  {
    question: "What are your main interests?",
    answer:
      "I'm really into hiking—especially technical trails in the mountains. Last summer I did the Cascades and got stuck in unexpected snow, which was terrifying but also exhilarating. I also love photography, particularly landscape shots at sunrise. I've been teaching myself to cook more seriously over the past year, and I'm obsessed with trying new recipes on weekends. Travel is huge for me too—I'm planning a trip to Iceland next year to chase the Northern Lights.",
  },
  {
    question: "What are you looking for in a partner?",
    answer:
      "I want someone who's genuinely curious about the world and not afraid to ask deep questions. They should be able to make me laugh but also handle serious conversations. Independence is key—I need someone with their own passions. Chemistry is important, but I think genuine connection comes from shared values. I'm looking for something real, not just surface-level attraction.",
  },
  {
    question: "Tell us about yourself in a few sentences.",
    answer: "I like stuff and enjoy having fun",
  },
];

async function testLLMAnalysis() {
  console.log("🧪 Testing LLM Text Analysis\n");
  console.log("=" + "=".repeat(79));

  // Check API key
  if (!process.env.GEMINI_API_KEY) {
    console.error(
      "❌ GEMINI_API_KEY not found in .env file. Please add your API key."
    );
    console.log(
      "\nTo get a Gemini API key:\n1. Go to https://aistudio.google.com/app/apikey\n2. Click 'Create API Key'\n3. Add it to your .env file as GEMINI_API_KEY=your_key\n"
    );
    process.exit(1);
  }

  console.log("✅ Gemini API key found\n");

  // Test each response
  for (let i = 0; i < testResponses.length; i++) {
    const { question, answer } = testResponses[i];

    console.log(`\n📋 Test ${i + 1}: "${question}"`);
    console.log("-".repeat(80));
    console.log(`User Answer: "${answer}"\n`);

    // 1. Validate input
    const validation = validateTextResponse(answer);
    if (!validation.valid) {
      console.log("❌ Validation failed:");
      validation.errors.forEach((err) => console.log(`   - ${err}`));
      continue;
    }
    console.log("✅ Input validation passed");

    // 2. Sanitize
    const sanitized = sanitizeInput(answer);
    console.log(`✅ Input sanitized (${sanitized.length} chars)`);

    // 3. Calculate metrics
    const metrics = analyzeTextStatistics(sanitized);
    console.log(`✅ Metrics calculated:`);
    console.log(
      `   - Word count: ${metrics.word_count} | Sentences: ${metrics.sentence_count}`
    );
    console.log(`   - Has specific examples: ${metrics.has_specific_examples}`);

    // 4. Call LLM with fallback
    console.log(`\n🤖 Calling Gemini API...`);
    let feedback;

    try {
      feedback = await analyzeTextWithLLM(sanitized, testPersonality, question);
      console.log("✅ LLM analysis successful");
    } catch (error) {
      console.warn(
        `⚠️  LLM failed, using fallback:`,
        error instanceof Error ? error.message : error
      );
      feedback = getFallbackAnalysis(sanitized, testPersonality, question);
      console.log("✅ Fallback analysis generated");
    }

    // 5. Display results
    console.log(`\n📊 Analysis Results:`);
    console.log(`\n🎯 Main Feedback:`);
    console.log(`   "${feedback.analysis}"`);

    console.log(`\n💪 Strengths:`);
    feedback.strengths.forEach((strength, idx) => {
      console.log(`   ${idx + 1}. ${strength}`);
    });

    console.log(`\n💡 Suggestions:`);
    feedback.suggestions.forEach((suggestion, idx) => {
      console.log(`   ${idx + 1}. ${suggestion}`);
    });

    console.log(`\n🔗 Personality Context:`);
    console.log(`   "${feedback.personality_context}"`);

    console.log("\n" + "=".repeat(80));
  }

  console.log("\n✅ All tests completed!\n");
}

// Run tests
testLLMAnalysis().catch((error) => {
  console.error("❌ Test failed:", error);
  process.exit(1);
});
