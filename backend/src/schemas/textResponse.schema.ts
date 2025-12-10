import { z } from "zod";

/**
 * Zod schema for validating text responses
 * Used for server-side validation
 */
export const TextResponseSchema = z.object({
  question: z
    .string()
    .min(5, "Question must be at least 5 characters")
    .max(200, "Question cannot exceed 200 characters"),
  answer: z
    .string()
    .min(10, "Answer must be at least 10 characters")
    .max(2000, "Answer cannot exceed 2000 characters")
    .refine(
      (a) => !a.match(/```|eval|<script|<iframe/i),
      "Answer contains disallowed content"
    ),
});

export type TextResponse = z.infer<typeof TextResponseSchema>;

/**
 * Schema for the text feedback response from LLM
 */
export const TextFeedbackSchema = z.object({
  analysis: z.string().min(1),
  strengths: z.array(z.string()).length(3),
  suggestions: z.array(z.string()).length(3),
  personality_context: z.string().min(1),
});

export type TextFeedbackFromLLM = z.infer<typeof TextFeedbackSchema>;

/**
 * Complete text feedback document for Firestore
 */
export const TextFeedbackDocSchema = z.object({
  // LLM-generated analysis
  analysis: z.string(),
  strengths: z.array(z.string()),
  suggestions: z.array(z.string()),

  // Objective metrics
  word_count: z.number().int().positive(),
  has_specific_examples: z.boolean(),

  // Metadata
  analysis_id: z.string(),
  question: z.string(),
  user_answer: z.string(),
  created_at: z.date(),
  personality_context: z.string(),
});

export type TextFeedbackDoc = z.infer<typeof TextFeedbackDocSchema>;
