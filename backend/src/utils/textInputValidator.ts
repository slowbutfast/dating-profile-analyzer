/**
 * Client-side validation for text responses
 * @param text The text to validate
 * @returns Object with validation result and any errors
 */
export function validateTextResponse(text: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (text.length < 10) {
    errors.push("Response must be at least 10 characters");
  }
  if (text.length > 2000) {
    errors.push("Response cannot exceed 2000 characters");
  }

  // Forbidden patterns (prompt injection attempts, malicious code)
  const forbidden = [/```[\s\S]*```/, /<script|<iframe/i, /eval\(|Function\(/i];
  if (forbidden.some((p) => p.test(text))) {
    errors.push("Response contains disallowed content");
  }

  // Excessive special characters (spam/gibberish detection)
  const specialChars = (text.match(/[^a-zA-Z0-9\s.,!?'"()-]/g) || []).length;
  if (specialChars / text.length > 0.2) {
    errors.push("Response contains too many special characters");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Backend sanitization - removes characters that could break LLM prompts
 * @param input The input to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>{}[\]|\\]/g, "") // Remove prompt-breaking chars
    .replace(/\0/g, "") // Remove null bytes
    .trim()
    .slice(0, 2000); // Enforce max length
}
