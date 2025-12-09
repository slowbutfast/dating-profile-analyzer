# Text Analysis & Feedback System Design

## Project Scope & Decisions (MVP)

### Scope Decisions
- **LLM Integration:** Balanced (objective metrics as foundation + LLM for subjective evaluation with rubrics)
- **Personality Integration:** Light (fetch profile, use for contextualization/recommendations only - don't weight metrics)
- **Security Level:** Baseline (client-side length validation, backend sanitization, Zod schema - NOT paranoid)
- **Timeline/Focus:** Get LLM integration working with analysis-specific advice displayed in Dashboard

### What We're Building (MVP)
1. **Objective metrics** (word count, clichés, specific examples - no LLM)
2. **LLM evaluation** with 2 rubrics: Clarity + Originality (most deterministic)
3. **Basic input validation** (length, dangerous patterns, Zod schema)
4. **Personality-contextualized recommendations** (light integration)
5. **Analysis advice displayed in Dashboard** (quick insights, not full results page breakdown)
6. **Feedback stored in Firestore** for results page viewing

### What We're NOT Building (Phase 2+)
- ❌ Warmth & Humor rubrics (too subjective for MVP)
- ❌ Advanced anomaly detection (entropy, script mixing)
- ❌ Audit logging/full security paranoia
- ❌ Conversation potential scoring
- ❌ Baseline testing framework
- ❌ Cost tracking/budget limits
- ❌ Rate limiting (basic validation only)

---

## 1. Data Structures

### 1.1 User Personality Profile (Input)

Collected during onboarding, stored in Firestore `user_personalities`:

```typescript
interface PersonalityProfile {
  userId: string;
  age_range: string;             // "18-24" | "25-29" | "30-34" | "35-39" | "40-44" | "45+"
  gender: string;                // "Male" | "Female" | "Non-binary" | "Prefer not to say"
  dating_goal: string;           // "Long-term relationship" | "Short-term dating" | "New friends" | "Not sure yet"
  personality_type: string;      // "Outgoing and social" | "Reserved and thoughtful" | "Adventurous and spontaneous" | "Calm and steady" | "Creative and expressive"
  conversation_style: string;    // "Deep and meaningful" | "Light and playful" | "Intellectual and curious" | "Funny and entertaining" | "Balanced mix"
  humor_style: string;           // "Witty and clever" | "Sarcastic" | "Silly and goofy" | "Dry humor" | "Not very humorous"
  dating_experience: string;     // "Very experienced" | "Somewhat experienced" | "New to dating apps" | "First time"
  interests: string;             // Comma-separated interests
  ideal_match: string;           // Description of ideal match
}
```

### 1.2 Text Response (Input)

```typescript
interface TextResponse {
  question: string;              // "What are your main interests?"
  answer: string;                // User's response (max 2000 chars, sanitized)
}
```

### 1.3 Text Feedback (Output)

```typescript
interface TextFeedback {
  // LLM-generated analysis (influenced by personality)
  analysis: string;              // Main feedback/analysis from LLM
  strengths: string[];           // 2-3 things they did well
  suggestions: string[];         // 2-3 actionable suggestions
  
  // Simple objective metrics
  word_count: number;
  has_specific_examples: boolean;
  
  // Metadata
  analysis_id: string;
  created_at: Date;
  personality_context: string;   // Which personality traits influenced this analysis
}
```

---

## 2. Objective Metrics (Simple & Fast)

```typescript
interface TextStatistics {
  word_count: number;
  sentence_count: number;
  has_specific_examples: boolean;
}

function analyzeTextStatistics(text: string): TextStatistics {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Check for specific examples (concrete details, stories, specifics)
  const hasExamples = /\b(like|such as|for example|specifically|when|last|recently|i've|i'm|because|since)\b/i.test(text);
  
  return {
    word_count: words.length,
    sentence_count: sentences.length,
    has_specific_examples: hasExamples,
  };
}
```

---

## 3. LLM Analysis (Personality-Influenced)

The LLM receives the text response + personality profile and generates personalized feedback.

### 3.1 LLM Prompt

```typescript
const buildAnalysisPrompt = (
  textResponse: string,
  personality: PersonalityProfile,
  question: string
): string => `
You are a dating profile coach providing personalized feedback on a profile response.

QUESTION: "${question}"

USER'S RESPONSE:
"${textResponse}"

USER'S PERSONALITY PROFILE:
- Dating Goal: ${personality.dating_goal}
- Personality Type: ${personality.personality_type}
- Conversation Style: ${personality.conversation_style}
- Humor Style: ${personality.humor_style}
- Interests: ${personality.interests}
- Ideal Match: ${personality.ideal_match}

Your task: Provide constructive, encouraging feedback that:
1. Acknowledges their personality style
2. Highlights what works well about their response
3. Suggests 2-3 concrete improvements tailored to their dating goal and personality
4. Explains why the suggestions matter for their dating goal

Format your response as JSON:
{
  "analysis": "<1-2 sentence main feedback acknowledging their personality>",
  "strengths": [
    "<strength 1>",
    "<strength 2>",
    "<strength 3>"
  ],
  "suggestions": [
    "<suggestion 1 with specific example>",
    "<suggestion 2 with specific example>",
    "<suggestion 3 with specific example>"
  ],
  "personality_context": "<briefly explain which personality traits influenced this feedback>"
}
`;
```

### 3.2 Key Differences From Previous Approach

- **No rigid rubrics:** LLM evaluates holistically, not against fixed scoring criteria
- **Personality-aware:** Feedback adapts to their dating goal and communication style
- **Encouraging tone:** Focuses on what works and how to improve, not judgment
- **Actionable suggestions:** Each suggestion includes a concrete example
- **Flexible:** Different people get different kinds of feedback based on their personality

---

## 4. Input Validation (Baseline Security)

### 4.1 Client-Side Validation

```typescript
function validateTextResponse(text: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (text.length < 10) {
    errors.push("Response must be at least 10 characters");
  }
  if (text.length > 2000) {
    errors.push("Response cannot exceed 2000 characters");
  }

  // Forbidden patterns
  const forbidden = [/```[\s\S]*```/, /<script|<iframe/i, /eval\(|Function\(/i];
  if (forbidden.some(p => p.test(text))) {
    errors.push("Response contains disallowed content");
  }

  // Excessive special characters
  const specialChars = (text.match(/[^a-zA-Z0-9\s.,!?'"()-]/g) || []).length;
  if (specialChars / text.length > 0.2) {
    errors.push("Response contains too many special characters");
  }

  return { valid: errors.length === 0, errors };
}
```

### 4.2 Backend Sanitization

```typescript
function sanitizeInput(input: string): string {
  return input
    .replace(/[<>{}[\]|\\]/g, '')        // Remove prompt-breaking chars
    .replace(/\0/g, '')                  // Remove null bytes
    .trim()
    .slice(0, 2000);
}
```

### 4.3 Zod Schema Validation

```typescript
import { z } from 'zod';

const TextResponseSchema = z.object({
  question: z.string().min(5).max(200),
  answer: z
    .string()
    .min(10)
    .max(2000)
    .refine(
      (a) => !a.match(/```|eval|<script/i),
      "Answer contains disallowed content"
    ),
});

export type TextResponse = z.infer<typeof TextResponseSchema>;
```

---

---

## 5. Complete Analysis Flow

```
1. USER SUBMITS TEXT RESPONSE
   └─ Client validates (length, forbidden patterns)

2. BACKEND RECEIVES
   ├─ Sanitize input
   ├─ Zod schema validation
   └─ Check for dangerous patterns

3. CALCULATE OBJECTIVE METRICS
   ├─ Word count, sentence count
   └─ Detect if response has specific examples

4. FETCH PERSONALITY PROFILE
   └─ Query Firestore user_personalities collection

5. LLM ANALYSIS (PERSONALITY-INFLUENCED)
   ├─ Build prompt with text response + personality profile
   ├─ Call Claude/GPT (temperature=0.7, max_tokens=500, timeout=30s)
   ├─ Validate JSON response
   └─ Parse analysis, strengths, suggestions

6. SAVE TO FIRESTORE
   └─ Save TextFeedback with analysis + metrics

7. DISPLAY IN DASHBOARD
   └─ Show main analysis insight on dashboard card
```

---

## 6. What Gets Displayed Where

### 6.1 Dashboard (Quick Insight)

Show on analysis card:
- Main analysis statement (the "analysis" field from LLM)
- Quick stats (word count, has specific examples)
- Link to view full feedback

### 6.2 Results Page (Full Feedback)

Show complete feedback:
- Full analysis statement
- Strengths (bulleted list)
- Suggestions (bulleted list with examples)
- Objective metrics (word count, examples)
- Which personality traits influenced the feedback

