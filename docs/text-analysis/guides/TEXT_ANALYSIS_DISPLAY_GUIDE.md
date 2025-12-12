# Text Analysis Display Guide

## What Should Appear on Results Page

### Current State
You're seeing:
- ✅ Bio section (when bio is provided)
- ✅ Text Analysis card appears
- ❓ "no analysis available" message (means LLM feedback isn't loading)

### Expected State (After Fix)
You should see:

```
┌─────────────────────────────────────────────────┐
│  RESULTS PAGE                                    │
├─────────────────────────────────────────────────┤
│                                                  │
│  📊 ANALYSIS HEADER                             │
│  ├─ Date: December 12, 2024                    │
│  ├─ Image Quality Score: 8.5/10                │
│  └─ Face Detected: ✓                           │
│                                                  │
│  📸 IMAGE ANALYSIS                              │
│  ├─ [Photo Grid with quality badges]           │
│  ├─ Blur Score, Lighting Quality, etc.         │
│  └─ [Click to expand]                          │
│                                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                  │
│  👤 BIO SECTION (if provided)                   │
│  ├─ "I'm a photographer and traveler           │
│  │  passionate about capturing stories. I     │
│  │  love hiking, reading, and meeting people  │
│  │  with genuine interests."                  │
│                                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                  │
│  💬 TEXT ANALYSIS CARD                          │
│                                                  │
│  [Response 1]                                   │
│  Q: "What are you most passionate about?"      │
│  A: "I'm really passionate about photography   │
│     and travel. I love capturing moments that  │
│     tell stories about people and places. It   │
│     helps me connect with the world..."        │
│                                                  │
│  📊 LLM ANALYSIS                                │
│  "Your response beautifully combines personal  │
│   passion with meaningful storytelling. This   │
│   authentic enthusiasm is exactly what makes   │
│   profiles compelling to potential matches     │
│   who value depth and intentionality."         │
│                                                  │
│  ⭐ STRENGTHS                                   │
│  • You show vulnerability by sharing what      │
│    truly matters to you - photography and      │
│    travel. This helps people understand your   │
│    values and lifestyle.                       │
│  • Your focus on 'capturing stories' suggests  │
│    emotional intelligence...                   │
│  • You mention both hobbies and their deeper   │
│    purpose, not just listing interests...      │
│                                                  │
│  💡 SUGGESTIONS                                 │
│  • Add a specific example: 'My favorite photo  │
│    is from a trip to [location] where I...'   │
│  • Connect to your ideal match: 'I'd love to   │
│    travel with someone who appreciates the     │
│    journey as much as the destination'         │
│  • Mention how this passion shapes your dating │
│    life: 'I'm looking for someone who gets     │
│    excited about adventures...'                │
│                                                  │
│  🧠 PERSONALITY CONTEXT                        │
│  "As an INFP who values authenticity and       │
│   meaningful connections, your emphasis on     │
│   emotional storytelling through photography   │
│   reflects your need for depth. Suggesting     │
│   concrete examples honors both your detail-   │
│   orientation and your desire for emotional    │
│   resonance."                                  │
│                                                  │
│  📈 METRICS                                     │
│  • Word Count: 25 words                        │
│  • Specific Examples: Yes ✓                    │
│                                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                  │
│  [Response 2 with same structure...]           │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## Component Structure in Results.tsx

```tsx
<Results>
  {/* Header */}
  <AnalysisHeader>
    <Title>{analysis.id}</Title>
    <CreatedDate>{formatDate(analysis.created_at)}</CreatedDate>
    <Badges>
      Quality Score: {analysis.image_quality_score}
      Face Detected: {analysis.face_detected}
    </Badges>
  </AnalysisHeader>

  {/* Image Analysis Section */}
  <Card>
    <PhotosGrid photos={photos} />
    <ImageAnalysisResults results={imageAnalysisResults} />
  </Card>

  {/* Bio + Text Analysis */}
  {(analysis?.bio || textResponses.length > 0) && (
    <Card>
      {/* BIO SECTION */}
      {analysis?.bio && (
        <>
          <Paragraph>{analysis.bio}</Paragraph>
          <Separator />
        </>
      )}

      {/* TEXT RESPONSES SECTION */}
      {textResponses.length > 0 && (
        textResponses.map(response => (
          <div key={response.id}>
            <h4>Question: {response.question}</h4>
            <p>Your Answer: {response.answer}</p>

            {/* LLM FEEDBACK */}
            {textFeedback[response.id] ? (
              <div className="feedback-section">
                <h5>📊 Analysis</h5>
                <p>{textFeedback[response.id].analysis}</p>

                <h5>⭐ Strengths</h5>
                <ul>
                  {textFeedback[response.id].strengths.map(s => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>

                <h5>💡 Suggestions</h5>
                <ul>
                  {textFeedback[response.id].suggestions.map(s => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>

                <h5>🧠 Why This Feedback</h5>
                <p>{textFeedback[response.id].personality_context}</p>

                <div className="metrics">
                  <p>Word Count: {textFeedback[response.id].metrics.word_count}</p>
                  <p>Specific Examples: {textFeedback[response.id].metrics.has_specific_examples ? '✓' : '✗'}</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No analysis available.</p>
            )}
          </div>
        ))
      )}
    </Card>
  )}
</Results>
```

---

## Data Flow to Results Page

### 1. Load Analysis
```
GET /api/analysis/{analysisId}
Response: {
  id: string
  user_id: string
  bio: string (optional)
  created_at: Date
  image_quality_score: number
  face_detected: boolean
  photos: [...PhotoDocument[]]
  textResponses: [...{
    id: string
    question: string
    answer: string
    created_at: Date
  }]
}
```

### 2. For Each Text Response, Load LLM Feedback
```
POST /api/text-analysis/analyze
Request: { question, answer }

Response: {
  success: true
  feedback: {
    analysisId: string
    analysis: string
    strengths: string[] (3 items)
    suggestions: string[] (3 items)
    personality_context: string
    metrics: {
      word_count: number
      has_specific_examples: boolean
    }
  }
}
```

### 3. Store in State
```typescript
const [analysis, setAnalysis] = useState<AnalysisDocument | null>(null)
const [textResponses, setTextResponses] = useState<TextResponse[]>([])
const [textFeedback, setTextFeedback] = useState<{
  [responseId: string]: TextFeedback
}>({})
```

### 4. Render
- If `analysis.bio` exists → render bio
- For each `textResponse` → render with feedback from `textFeedback[response.id]`
- If no feedback → show "No analysis available"

---

## Debugging Checklist

### ✅ Data is Loading
- [ ] Open DevTools → Network tab
- [ ] Go to Results page
- [ ] See `GET /api/analysis/{id}` request
- [ ] Response includes `bio` and `textResponses`

### ✅ Bio is Rendering
- [ ] Bio appears after title
- [ ] Shows full bio text
- [ ] Bio is separated from text responses by line

### ✅ Text Responses are Rendering
- [ ] Questions display
- [ ] Answers display
- [ ] Can see all responses

### ✅ LLM Feedback is Fetching
- [ ] See `POST /api/text-analysis/analyze` requests
- [ ] One request per text response
- [ ] Response status is 200
- [ ] Response body contains `feedback` object

### ✅ LLM Feedback is Displaying
- [ ] "No analysis available" disappears
- [ ] Analysis paragraph appears
- [ ] Strengths list appears (3 items)
- [ ] Suggestions list appears (3 items)
- [ ] Personality context appears
- [ ] Metrics appear

### ❌ If "No analysis available" persists
Check:
1. Network tab → See POST request?
   - If NO → analyzeText() not being called
   - If YES → Check response body
2. Response body has `feedback` key?
   - If NO → API error, check response error message
   - If YES → Check textFeedback state
3. React DevTools → textFeedback state
   - Should have entries like `{ response1Id: { analysis: "...", ... } }`
   - If empty → analyzeText() not updating state

---

## Example API Response

```json
{
  "success": true,
  "feedback": {
    "analysisId": "user123_1702420800000",
    "analysis": "Your response beautifully combines personal passion with meaningful storytelling. This authentic enthusiasm is exactly what makes profiles compelling.",
    "strengths": [
      "You show vulnerability by sharing what truly matters to you.",
      "Your focus on storytelling suggests emotional intelligence.",
      "You mention purpose, not just listing interests."
    ],
    "suggestions": [
      "Add a specific example like 'My favorite photo is from...'",
      "Connect to your ideal match: 'I'd love to travel with someone...'",
      "Mention how this shapes your dating: 'I'm looking for...'"
    ],
    "personality_context": "Your value-driven approach shows maturity and intentionality.",
    "metrics": {
      "word_count": 25,
      "has_specific_examples": true
    }
  }
}
```

---

## Common Rendering Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| Bio not showing | `analysis.bio` is null or undefined | User must provide bio on upload |
| Bio shows but text responses don't | No textResponses in analysis | User must answer text questions |
| Text responses show but no feedback | LLM call didn't happen | Answer must be 10+ characters |
| Feedback shows "no analysis available" | `textFeedback[response.id]` undefined | API call failed - check Network tab |
| Feedback shows but sections missing | Missing fields in API response | Check API returns all 4 fields |

---

## Performance Tips

- Bio section renders inline (no async call needed)
- Text responses load synchronously from analysis
- LLM feedback fetches asynchronously in parallel
- Use React DevTools Profiler to check render times
- Memoize feedback components if re-renders slow

---

## Styling Notes

Current implementation uses:
- `Card` component for container
- `Separator` component between bio and responses
- `ul/li` for lists (strengths and suggestions)
- `text-muted-foreground` class for "no analysis" message
- Component styling through Tailwind classes

See `frontend/src/components/` for component definitions.
