export interface TextStatistics {
  word_count: number;
  sentence_count: number;
  has_specific_examples: boolean;
}

/**
 * Analyzes text and returns basic statistics
 * @param text The text to analyze
 * @returns Object with word count, sentence count, and whether specific examples are present
 */
export function analyzeTextStatistics(text: string): TextStatistics {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const sentences = text
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > 0);

  // Check for specific examples (concrete details, stories, specifics)
  const hasExamples =
    /\b(like|such as|for example|specifically|when|last|recently|i've|i'm|because|since)\b/i.test(
      text
    );

  return {
    word_count: words.length,
    sentence_count: sentences.length,
    has_specific_examples: hasExamples,
  };
}
