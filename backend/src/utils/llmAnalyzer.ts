import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
import { sanitizeInput } from "./textInputValidator";
import { TextFeedbackSchema, TextFeedbackFromLLM } from "../schemas/textResponse.schema";

// Load environment variables
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

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Log for debugging (remove in production)
if (!process.env.GEMINI_API_KEY) {
  console.warn("⚠️  WARNING: GEMINI_API_KEY is not set. Requests will fail.");
} else {
  console.log("✅ Gemini API key loaded successfully");
}

/**
 * Builds the prompt for LLM analysis
 * Takes user's text response and personality profile, generates personalized feedback
 */
function buildAnalysisPrompt(
  textResponse: string,
  personality: PersonalityProfile,
  question: string
): string {
  const sanitized = sanitizeInput(textResponse);

  return `You are a dating profile coach providing personalized, encouraging feedback on a profile response.

QUESTION THE USER WAS ANSWERING:
"${question}"

USER'S RESPONSE:
"${sanitized}"

USER'S PERSONALITY PROFILE:
- Dating Goal: ${personality.dating_goal}
- Personality Type: ${personality.personality_type}
- Conversation Style: ${personality.conversation_style}
- Humor Style: ${personality.humor_style}
- Interests: ${personality.interests}
- Ideal Match: ${personality.ideal_match}

Your task: Provide constructive, encouraging feedback that:
1. Acknowledges their personality style and dating goals
2. Highlights what works well about their response
3. Suggests 2-3 concrete improvements tailored to their dating goal and personality
4. Explains why the suggestions matter for their specific dating goals

Be warm, supportive, and specific. If they mention their interests or personality traits, acknowledge those positively.

Respond with ONLY valid JSON (no markdown, no extra text):
{
  "analysis": "<1-2 sentences of main feedback that acknowledges their personality style and what they did well>",
  "strengths": [
    "<specific thing they did well with details>",
    "<another strength with example>",
    "<third strength>"
  ],
  "suggestions": [
    "<actionable suggestion 1 with example of what to add or change>",
    "<actionable suggestion 2 with example>",
    "<actionable suggestion 3 with example>"
  ],
  "personality_context": "<briefly explain which personality traits or goals influenced this feedback>"
}`;
}

/**
 * Analyzes user text response using Gemini LLM
 * Returns personalized feedback influenced by their personality profile
 */
export async function analyzeTextWithLLM(
  textResponse: string,
  personality: PersonalityProfile,
  question: string
): Promise<TextFeedbackFromLLM> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = buildAnalysisPrompt(textResponse, personality, question);

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Extract JSON from response (in case there's extra formatting)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in LLM response");
    }

    const parsedResponse = JSON.parse(jsonMatch[0]);

    // Ensure suggestions and strengths are strings (Gemini sometimes returns objects)
    const sanitizeArray = (arr: any[]): string[] => {
      return (arr || [])
        .slice(0, 3) // Ensure max 3 items
        .map((item: any) => {
          if (typeof item === "string") return item;
          if (typeof item === "object" && item !== null) {
            // Handle objects like { title: "...", content: "..." } or { text: "..." }
            return (
              item.content ||
              item.text ||
              item.title ||
              JSON.stringify(item)
            ).toString();
          }
          return String(item);
        });
    };

    const sanitizedResponse = {
      analysis: String(parsedResponse.analysis || ""),
      strengths: sanitizeArray(parsedResponse.strengths),
      suggestions: sanitizeArray(parsedResponse.suggestions),
      personality_context: String(parsedResponse.personality_context || ""),
    };

    // Ensure we have exactly 3 of each
    while (sanitizedResponse.strengths.length < 3) {
      sanitizedResponse.strengths.push("Strong response to the question asked");
    }
    while (sanitizedResponse.suggestions.length < 3) {
      sanitizedResponse.suggestions.push("Consider adding more personal details");
    }

    // Validate against schema
    const validatedFeedback = TextFeedbackSchema.parse(sanitizedResponse);

    return validatedFeedback;
  } catch (error) {
    console.error("Error analyzing text with LLM:", error);
    throw error;
  }
}

/**
 * Fallback analysis in case LLM fails
 * Returns basic but useful feedback without external API calls
 */
export function getFallbackAnalysis(
  textResponse: string,
  personality: PersonalityProfile,
  question: string
): TextFeedbackFromLLM {
  const wordCount = textResponse.split(/\s+/).length;
  const hasExamples = /\b(like|such as|for example|when|because)\b/i.test(
    textResponse
  );

  let analysis = "Good effort! ";
  let suggestions = [];

  // Base analysis on length
  if (wordCount < 30) {
    analysis +=
      "Your response is brief. Consider adding more details about yourself to help matches understand you better.";
    suggestions.push(
      "Add more specific examples or stories to show who you are (aim for 50+ words)",
      "Share why these interests or qualities matter to you",
      "Give potential matches a sense of your personality through concrete details"
    );
  } else if (wordCount > 150) {
    analysis +=
      "You've shared a lot of detail! Make sure it's easy for people to get the key points about you.";
    suggestions.push(
      "Consider trimming down to the most important details about yourself",
      "Make sure your main personality traits come through clearly",
      "Focus on what makes you unique rather than listing everything"
    );
  } else {
    analysis +=
      "Your response shows who you are. Let's make it even stronger.";
    suggestions.push(
      "Add a specific example or story to bring your answer to life",
      `For someone who is ${personality.conversation_style.toLowerCase()}, try showing that through your response`,
      "Make sure someone looking for " +
        personality.dating_goal.toLowerCase() +
        " would feel a connection"
    );
  }

  const strengths = [
    `Your ${personality.personality_type.toLowerCase()} personality comes through`,
    "You answered the question directly",
    hasExamples
      ? "You included specific examples"
      : "You shared genuine feelings and interests",
  ];

  const context = `Tailored feedback based on your ${personality.conversation_style.toLowerCase()} conversation style and ${personality.dating_goal.toLowerCase()} dating goal.`;

  return {
    analysis,
    strengths,
    suggestions: suggestions.slice(0, 3),
    personality_context: context,
  };
}
