import { Router, Request, Response } from "express";
import { db } from "../config/firebase";
import { analyzeTextWithLLM, getFallbackAnalysis } from "../utils/llmAnalyzer";
import {
  validateTextResponse,
  sanitizeInput,
} from "../utils/textInputValidator";
import { analyzeTextStatistics } from "../utils/textMetrics";
import {
  TextResponseSchema,
  TextFeedbackDocSchema,
} from "../schemas/textResponse.schema";

const router = Router();

interface AuthRequest extends Request {
  user?: { uid: string };
}

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

/**
 * POST /api/text-analysis/analyze
 * Analyzes a text response from a user
 * Requires: question, answer in request body
 * Returns: Text feedback with LLM analysis and metrics
 */
router.post("/analyze", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { question, answer } = req.body;

    // Validate input
    if (!question || !answer) {
      return res
        .status(400)
        .json({ error: "Missing required fields: question, answer" });
    }

    // Client-side validation check
    const validation = validateTextResponse(answer);
    if (!validation.valid) {
      return res.status(400).json({ error: "Invalid input", errors: validation.errors });
    }

    // Schema validation
    const textData = TextResponseSchema.parse({
      question,
      answer,
    });

    // Get user's personality profile
    const personalitySnap = await db
      .collection("user_personalities")
      .doc(userId)
      .get();

    if (!personalitySnap.exists) {
      return res.status(404).json({
        error: "User personality profile not found. Please complete onboarding first.",
      });
    }

    const personality = personalitySnap.data() as PersonalityProfile;

    // Sanitize the answer
    const sanitizedAnswer = sanitizeInput(answer);

    // Calculate objective metrics
    const metrics = analyzeTextStatistics(sanitizedAnswer);

    // Get LLM analysis with fallback
    let feedback;
    try {
      feedback = await analyzeTextWithLLM(
        sanitizedAnswer,
        personality,
        question
      );
    } catch (error) {
      console.warn(
        "LLM analysis failed, using fallback:",
        error instanceof Error ? error.message : error
      );
      feedback = getFallbackAnalysis(sanitizedAnswer, personality, question);
    }

    // Create feedback document
    const analysisId = `${userId}_${Date.now()}`;
    const feedbackDoc = {
      analysis: feedback.analysis,
      strengths: feedback.strengths,
      suggestions: feedback.suggestions,
      word_count: metrics.word_count,
      has_specific_examples: metrics.has_specific_examples,
      analysis_id: analysisId,
      question: textData.question,
      user_answer: sanitizedAnswer,
      created_at: new Date(),
      personality_context: feedback.personality_context,
    };

    // Validate against schema
    const validatedFeedback = TextFeedbackDocSchema.parse(feedbackDoc);

    // Save to Firestore under analyses/{userId}/text_feedback collection
    await db
      .collection("analyses")
      .doc(userId)
      .collection("text_feedback")
      .doc(analysisId)
      .set({
        ...feedbackDoc,
        created_at: new Date(),
      });

    // Return feedback to client
    res.json({
      success: true,
      feedback: {
        analysisId,
        analysis: feedback.analysis,
        strengths: feedback.strengths,
        suggestions: feedback.suggestions,
        metrics: {
          word_count: metrics.word_count,
          has_specific_examples: metrics.has_specific_examples,
        },
        personality_context: feedback.personality_context,
      },
    });
  } catch (error) {
    console.error("Error analyzing text:", error);

    if (error instanceof Error) {
      // Zod validation errors
      if (error.message.includes("validation")) {
        return res
          .status(400)
          .json({ error: "Validation failed", details: error.message });
      }
    }

    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

/**
 * GET /api/text-analysis/:analysisId
 * Retrieves a specific text feedback document
 */
router.get("/:analysisId", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { analysisId } = req.params;

    const feedbackSnap = await db
      .collection("analyses")
      .doc(userId)
      .collection("text_feedback")
      .doc(analysisId)
      .get();

    if (!feedbackSnap.exists) {
      return res.status(404).json({ error: "Feedback not found" });
    }

    res.json({
      success: true,
      feedback: {
        ...feedbackSnap.data(),
        created_at: feedbackSnap.data()?.created_at?.toDate?.() || new Date(),
      },
    });
  } catch (error) {
    console.error("Error retrieving feedback:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

/**
 * GET /api/text-analysis
 * Lists all text feedback for the user
 */
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const feedbackSnap = await db
      .collection("analyses")
      .doc(userId)
      .collection("text_feedback")
      .orderBy("created_at", "desc")
      .get();

    const feedback = feedbackSnap.docs.map((doc) => ({
      ...doc.data(),
      created_at: doc.data().created_at?.toDate?.() || new Date(),
    }));

    res.json({
      success: true,
      feedback,
    });
  } catch (error) {
    console.error("Error listing feedback:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

export default router;
