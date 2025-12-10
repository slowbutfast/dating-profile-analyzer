# Text Analysis LLM Testing

This test script validates the Gemini API integration for text analysis.

## Setup

1. **Get your Gemini API key:**
   - Go to https://aistudio.google.com/app/apikey
   - Click "Create API Key" in Google AI Studio
   - Copy your API key

2. **Add it to `.env`:**
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

3. **Run the test:**
   ```bash
   npm run test:llm
   ```

## What the test does

The test script:
1. ✅ Validates input handling (length, forbidden patterns)
2. ✅ Tests input sanitization
3. ✅ Calculates text metrics (word count, sentence count, specific examples detection)
4. ✅ Calls Gemini API with personality context
5. ✅ Falls back to smart defaults if API fails
6. ✅ Displays formatted results showing analysis, strengths, and suggestions

## Test cases

The script tests three different text responses:
1. **Long, detailed response** - Tests handling of rich content with specific examples
2. **Reflective response** - Tests handling of thoughtful, personal writing
3. **Short, generic response** - Tests fallback and handling of minimal input

## Expected output

For each response, you'll see:
- Input validation status
- Metrics (word count, sentences, examples)
- LLM analysis (main feedback)
- 3 strengths
- 3 suggestions
- Personality context explaining how the analysis was tailored

## Troubleshooting

If the API call fails:
- Check your API key is correct
- Check you have internet connection
- Gemini API might have rate limits - wait a moment and retry
- The fallback analysis will still provide useful feedback

## Next steps

Once this test passes, you can:
1. Integrate the endpoint into the frontend
2. Call `POST /api/text-analysis/analyze` with `{ question, answer }`
3. Display results in Dashboard and Results pages
