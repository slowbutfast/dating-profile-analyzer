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
  personality_type: string;      // "Outgoing" | "Reserved" | "Adventurous" | "Calm" | "Creative"
  conversation_style: string;    // "Deep" | "Light" | "Intellectual" | "Funny" | "Balanced"
  dating_goal: string;           // "Long-term" | "Short-term" | "Friends" | "Not sure"
  humor_style: string;           // "Witty" | "Sarcastic" | "Silly" | "Dry" | "Not humorous"
  // Other fields from onboarding (age, gender, interests, etc.)
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

**NOTE:** Text feedback structure and LLM rubrics are deferred for later implementation. Full spec coming soon.

---

## 2. Objective Metrics (Rule-Based, No LLM)

**NOTE:** Objective metrics implementation is deferred pending finalization of feedback rubrics. Details coming soon.

---

## 3. LLM Evaluation (Rubrics - Deferred)

**NOTE:** LLM evaluation rubrics are under review and deferred for later implementation. We're reconsidering the rubric approach to ensure it provides useful, fair feedback.

Placeholder for final rubric definitions coming soon.

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

## 5. Light Personality Integration

**NOTE:** Personality integration features are deferred pending finalization of text feedback system. Details coming soon.

---

## 6. Complete Analysis Flow

**NOTE:** Analysis flow and display components are deferred pending finalization of rubrics. Coming soon.

---

## 7. Implementation Tasks (Prioritized)

**NOTE:** All implementation is deferred pending finalization of text feedback rubrics and system design. Task list and phases coming soon.

**Current Status:** In design review phase. Next steps TBD.

