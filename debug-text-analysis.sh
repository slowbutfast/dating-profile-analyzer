#!/bin/bash
# Quick debugging script for text analysis issues

echo "🔍 TEXT ANALYSIS DEBUGGING SUITE"
echo "=================================="
echo ""

# Check 1: textAnalysis route registered
echo "✓ Check 1: textAnalysis route registered in server.ts"
grep -n "textAnalysisRoutes" backend/src/server.ts 2>/dev/null
if [ $? -eq 0 ]; then
  echo "  ✅ Found textAnalysisRoutes import/registration"
else
  echo "  ❌ textAnalysisRoutes NOT registered - add to server.ts"
fi
echo ""

# Check 2: GEMINI_API_KEY
echo "✓ Check 2: GEMINI_API_KEY environment variable"
if [ -z "$GEMINI_API_KEY" ]; then
  echo "  ❌ GEMINI_API_KEY not set"
  echo "  Add to .env: GEMINI_API_KEY=your_key_here"
else
  echo "  ✅ GEMINI_API_KEY is set (value: ${GEMINI_API_KEY:0:20}...)"
fi
echo ""

# Check 3: Backend dependencies
echo "✓ Check 3: Required backend dependencies"
if grep -q "@google/generative-ai" backend/package.json; then
  echo "  ✅ @google/generative-ai installed"
else
  echo "  ❌ @google/generative-ai NOT installed - run: npm install"
fi
echo ""

# Check 4: Test files
echo "✓ Check 4: Test files exist"
test_files=(
  "backend/tests/textAnalysis.test.ts"
  "backend/tests/mockLLM.test.ts"
  "frontend/tests/ResultsPageDisplay.test.ts"
  "tests/E2E-TextAnalysis.test.ts"
)

for file in "${test_files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file exists"
  else
    echo "  ❌ $file NOT found"
  fi
done
echo ""

# Check 5: Run unit tests
echo "✓ Check 5: Running unit tests"
echo "  Running: npx ts-node backend/tests/textAnalysis.test.ts"
cd backend && npx ts-node tests/textAnalysis.test.ts 2>&1 | grep -E "(PASSED|FAILED|passed|failed)" && cd ..
echo ""

echo "=================================="
echo "💡 NEXT STEPS:"
echo "1. If all checks passed: npm run dev (backend)"
echo "2. In another terminal: npm run dev (frontend)"
echo "3. Go to http://localhost:5173/upload"
echo "4. Upload with 10+ character text responses"
echo "5. Check Results page for bio and text feedback"
echo "6. Open DevTools Network tab to see API calls"
echo "=================================="
